import logging
from services.contact_service import ContactService
from utils.file_parser import parse_file

logger = logging.getLogger(__name__)

class ImportHandler:
    def __init__(self, db):
        self.db = db

    async def process_contact_import(self, payload: dict):
        job_id = payload["job_id"]
        tenant_id = payload["tenant_id"]
        project_id = payload.get("project_id")
        file_key = payload["file_key"]
        email_col = payload.get("email_col", "email")
        first_name_col = payload.get("first_name_col")
        last_name_col = payload.get("last_name_col")
        custom_mappings = payload.get("custom_mappings", {})

        def get_val(row_dict, col_name):
            if not col_name: return ""
            if col_name in row_dict: return row_dict[col_name]
            target = str(col_name).lower().strip()
            for k, v in row_dict.items():
                if str(k).lower().strip() == target:
                    return v
            return ""

        logger.info(f"[{job_id}] Starting Robust Contact Import pipeline")

        try:
            self.db.client.table("import_jobs").update({"status": "processing"}).eq("id", job_id).execute()

            logger.info(f"[{job_id}] Downloading file from Supabase Storage: {file_key}")
            try:
                file_bytes = self.db.client.storage.from_("imports").download(file_key)
            except Exception as dl_err:
                raise Exception(f"Failed to download file from storage: {dl_err}")

            logger.info(f"[{job_id}] Parsing file for processing...")
            df = parse_file(file_bytes, file_key)
            
            df = df.replace({float('nan'): None})
            raw_rows = df.to_dict(orient="records")
            total_rows_actual = len(raw_rows)
            logger.info(f"[{job_id}] Parsed {total_rows_actual} valid data rows")

            chunk_size = 500
            chunk = []
            rejections_buffer = []
            
            processed_rows = 0
            failed_rows = 0
            imported_rows = 0
            new_count = 0
            updated_count = 0
            skipped_duplicates = 0
            errors_for_ui = []
            
            for row_index, row in enumerate(raw_rows, start=1):
                raw_email = get_val(row, email_col)
                normalized_email = str(raw_email).strip().lower() if raw_email else ""

                if not normalized_email:
                    failed_rows += 1
                    msg = "Missing or blank email address."
                    errors_for_ui.append({"email": "—", "reason": msg, "row": row_index})
                    rejections_buffer.append({"job_id": job_id, "row_data": row, "error_reason": msg})
                    
                    if len(rejections_buffer) >= chunk_size:
                        self.db.client.table("import_rejected_rows").insert(rejections_buffer).execute()
                        rejections_buffer = []
                    continue
                
                custom_data = {}
                if custom_mappings:
                    for custom_key, csv_col_name in custom_mappings.items():
                        val = get_val(row, csv_col_name)
                        if str(val).strip():
                            custom_data[custom_key] = str(val).strip()

                contact = {
                    "email": normalized_email,
                    "email_domain": ContactService.extract_email_domain(normalized_email),
                    "first_name": str(get_val(row, first_name_col)).strip() if first_name_col else "",
                    "last_name": str(get_val(row, last_name_col)).strip() if last_name_col else "",
                    "custom_fields": custom_data,
                    "tenant_id": tenant_id
                }
                
                processed_rows += 1
                chunk.append((row_index, contact, row))
                
                if len(chunk) >= chunk_size:
                    imported, current_failed, current_errors, current_stats = await self._submit_chunk(tenant_id, chunk, job_id)
                    imported_rows += imported
                    failed_rows += current_failed
                    new_count += current_stats.get("new", 0)
                    updated_count += current_stats.get("updated", 0)
                    skipped_duplicates += current_stats.get("skipped_duplicates", 0)
                    errors_for_ui.extend(current_errors)
                    chunk = []
                    
                    self.db.client.table("import_jobs").update({
                        "processed_rows": imported_rows,
                        "failed_rows": failed_rows,
                    }).eq("id", job_id).execute()

            if chunk:
                imported, current_failed, current_errors, current_stats = await self._submit_chunk(tenant_id, chunk, job_id)
                imported_rows += imported
                failed_rows += current_failed
                new_count += current_stats.get("new", 0)
                updated_count += current_stats.get("updated", 0)
                skipped_duplicates += current_stats.get("skipped_duplicates", 0)
                errors_for_ui.extend(current_errors)
            
            if rejections_buffer:
                self.db.client.table("import_rejected_rows").insert(rejections_buffer).execute()

            total_processed = imported_rows + failed_rows

            try:
                payload_update = {
                    "status": "completed",
                    "imported_count": new_count,
                    "updated_count": updated_count,
                    "skipped_duplicates": skipped_duplicates,
                    "failed_count": failed_rows,
                    "total_rows": total_processed,
                    "errors": errors_for_ui[:200]
                }
                self.db.client.table("import_batches").update(payload_update).eq("id", job_id).execute()
            except Exception as e:
                logger.warning(f"Failed full update for import_batches (likely missing columns): {e}")
                try:
                    fallback_payload = {
                        "status": "completed",
                        "imported_count": imported_rows,
                        "failed_count": failed_rows,
                        "total_rows": total_processed,
                        "errors": errors_for_ui[:200]
                    }
                    self.db.client.table("import_batches").update(fallback_payload).eq("id", job_id).execute()
                except Exception as final_e:
                    logger.error(f"Critical failure updating import_batches: {final_e}")

            self.db.client.table("import_jobs").update({
                "status": "completed",
                "processed_rows": total_processed,
                "failed_rows": failed_rows
            }).eq("id", job_id).execute()
            
            logger.info(f"[{job_id}] Import Finished! Processed={total_processed}, Success={imported_rows}, Failed={failed_rows}")

            try:
                self.db.client.storage.from_("imports").remove([file_key])
                logger.info(f"[{job_id}] Cleaned up storage file: {file_key}")
            except Exception as cleanup_err:
                logger.warning(f"[{job_id}] Storage cleanup failed (non-critical): {cleanup_err}")

        except Exception as e:
            logger.error(f"[{job_id}] Fatal Error processing file: {str(e)}")
            self.db.client.table("import_jobs").update({
                "status": "failed",
                "error_message": f"Worker crash: {str(e)}"
            }).eq("id", job_id).execute()

    async def _submit_chunk(self, tenant_id: str, chunk: list, job_id: str) -> tuple[int, int, list, dict]:
        contacts = [item[1] for item in chunk]
        errors_for_ui = []
        
        try:
            res = ContactService.bulk_upsert(tenant_id, contacts, import_batch_id=job_id)
            
            errors = res.get("errors", [])
            if errors:
                rejection_records = []
                for err in errors:
                    reason = err.get("reason", "Unknown bulk upsert error") if isinstance(err, dict) else str(err)
                    row_raw = err.get("raw", {}) if isinstance(err, dict) else {}
                    
                    errors_for_ui.append({
                        "email": row_raw.get("email", "Unknown"),
                        "reason": reason,
                        "row": "—"
                    })

                    rejection_records.append({
                        "job_id": job_id,
                        "row_data": err if isinstance(err, dict) else {"raw": str(err)},
                        "error_reason": reason
                    })
                self.db.client.table("import_rejected_rows").insert(rejection_records).execute()

            imported = res.get("success", 0)
            failed = res.get("failed", 0)
            return imported, failed, errors_for_ui, res
        except Exception as e:
            logger.error(f"Chunk failure: {e}")
            error_records = []
            for (idx, _, raw) in chunk:
                msg = f"Chunk completely failed: {str(e)}"
                errors_for_ui.append({
                    "email": raw.get("email", "Unknown"),
                    "reason": msg,
                    "row": idx
                })
                error_records.append({
                    "job_id": job_id,
                    "row_data": raw if isinstance(raw, dict) else {"raw": str(raw)},
                    "error_reason": msg
                })
            self.db.client.table("import_rejected_rows").insert(error_records).execute()
            
            return 0, len(chunk), errors_for_ui, {}
