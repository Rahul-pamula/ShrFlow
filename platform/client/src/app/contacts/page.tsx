"use client";

import React, { useState, useEffect, useRef, useDeferredValue } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
    Search,
    Upload,
    Trash2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Check,
    FileText,
    FileSpreadsheet,
    Download,
    Globe2,
    Loader2,
    CheckCircle2,
    XCircle,
    Tag,
    ShieldOff,
    ArrowUp,
    Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";

import { Badge, Button, ConfirmModal, EmptyState, FilterBar, InlineAlert, Input, ModalShell, PageHeader, SectionCard, StatCard, TableToolbar, useToast } from "@/components/ui";

// ===== API Helper =====
const API_BASE = "http://localhost:8000";

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

// ===== Types =====
interface Contact {
    id: string;
    email: string;
    email_domain?: string | null;
    first_name: string | null;
    last_name: string | null;
    custom_fields: Record<string, string> | null;
    tags?: string[];
    created_at: string;
}

interface DomainStat {
    domain: string;
    count: number;
    suggested_domain?: string;
    reason?: string;
}

interface Stats {
    total_contacts: number;
    limit: number;
    usage_percent: number;
    available: number;
}

interface SuppressedContact {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    bounce_reason?: string;
    created_at: string;
}

interface Batch {
    id: string;
    file_name: string;
    total_rows: number;
    imported_count: number;
    failed_count: number;
    status: string;
    errors?: any;
    meta?: any;
    created_at: string;
}

function deriveImportCounts(job: any, fallbackTotal: number) {
    const total = Number(job?.total_rows ?? job?.total_items ?? fallbackTotal ?? 0);

    if (job?.processed_rows !== undefined || job?.failed_rows !== undefined) {
        const success = Number(job?.processed_rows ?? 0);
        const failed = Number(job?.failed_rows ?? 0);
        return {
            total,
            success: Math.max(0, Math.min(success, total)),
            failed: Math.max(0, Math.min(failed, total)),
        };
    }

    const processed = Number(job?.processed_items ?? 0);
    const failed = Number(job?.failed_items ?? 0);
    const safeFailed = Math.max(0, Math.min(failed, total));
    const safeSuccess = Math.max(0, Math.min(total - safeFailed, total));

    if ((job?.status === "processing" || job?.status === "pending") && total > 0) {
        return {
            total,
            success: Math.max(0, Math.min(processed - safeFailed, safeSuccess)),
            failed: safeFailed,
        };
    }

    return {
        total,
        success: safeSuccess,
        failed: safeFailed,
    };
}

// ===== ErrorRow Component =====
function ErrorRow({ err, idx, batchId, token, colors, onResolved }: {
    err: any; idx: number; batchId: string; token: string;
    colors: any; onResolved: () => void;
}) {
    const { success, error } = useToast();
    const [email, setEmail] = useState(err.email || "");
    const [firstName, setFirstName] = useState(err.first_name || "");
    const [lastName, setLastName] = useState(err.last_name || "");
    const [saving, setSaving] = useState(false);
    const [resolved, setResolved] = useState(false);

    const handleResolve = async () => {
        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            error("Email, first name, and last name are all required.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/resolve-error`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    batch_id: batchId, 
                    error_index: idx, 
                    email,
                    first_name: firstName,
                    last_name: lastName
                })
            });
            if (res.ok) {
                setResolved(true);
                success(`${email} added successfully.`);
                setTimeout(onResolved, 500);
            } else {
                const data = await res.json();
                error(data.detail || "Failed to add contact");
            }
        } catch { error("Error resolving contact"); }
        setSaving(false);
    };

    if (resolved) {
        return (
            <tr className="bg-[var(--success-bg)]">
                <td colSpan={6} className="px-3 py-2 text-xs font-medium text-[var(--success)]">
                    ✓ {email} added successfully
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-t border-[var(--danger-border)]">
            <td className="px-3 py-2 text-xs text-[var(--text-muted)]">{err.row || "—"}</td>
            <td className="px-2 py-2">
                <div className="flex flex-col gap-1">
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (Required)" className="h-8 text-xs" />
                    <div className="flex gap-1">
                        <div className="flex-1">
                            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name *" className="h-8 text-xs" />
                        </div>
                        <div className="flex-1">
                            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name *" className="h-8 text-xs" />
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-3 py-2 text-[11px] text-[var(--danger)]">{err.reason}</td>
            <td className="px-2 py-2">
                <Button
                    onClick={handleResolve}
                    disabled={saving || !email.trim() || !firstName.trim() || !lastName.trim()}
                    size="sm"
                    variant="success"
                    isLoading={saving}
                    className="h-8 text-[11px]"
                >
                    <Plus className="h-3 w-3" /> Add
                </Button>
            </td>
        </tr>
    );
}

function getBatchMeta(batch: Batch) {
    if (!batch.meta) return {};
    if (typeof batch.meta === 'string') {
        try {
            return JSON.parse(batch.meta);
        } catch {
            return {};
        }
    }
    return batch.meta;
}

function BatchStatusBadge({ status }: { status: string }) {
    if (status === "completed") {
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Done</Badge>;
    }
    if (status === "failed") {
        return <Badge variant="danger" className="gap-1"><XCircle className="h-3.5 w-3.5" />Failed</Badge>;
    }
    return <Badge variant="info" className="gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />Importing</Badge>;
}

function UploadMetric({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "success" | "accent" | "danger" }) {
    const toneClass = tone === "success" ? "text-[var(--success)]" : tone === "accent" ? "text-[var(--accent)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[var(--text-primary)]";
    return (
        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</div>
            <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
        </div>
    );
}

export default function ContactsPage() {
    const { token, user } = useAuth();
    const { success, error, info, warning } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"contacts" | "history" | "suppression">("contacts");

    // Stats
    const [stats, setStats] = useState<Stats | null>(null);

    // Suppression List
    const [suppressedContacts, setSuppressedContacts] = useState<SuppressedContact[]>([]);
    const [suppressionPage, setSuppressionPage] = useState(1);
    const [suppressionTotalPages, setSuppressionTotalPages] = useState(1);
    const [suppressionTotal, setSuppressionTotal] = useState(0);
    const [suppressionLoading, setSuppressionLoading] = useState(false);

    // Contacts
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [batchFilter, setBatchFilter] = useState("");
    const [domainFilter, setDomainFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
    const [domainsLoading, setDomainsLoading] = useState(false);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [tagFilter, setTagFilter] = useState("");

    // Dynamic columns
    const customFieldKeys = React.useMemo(() => {
        const keys = new Set<string>();
        contacts.forEach(c => {
            if (c.custom_fields) {
                Object.keys(c.custom_fields).forEach(k => keys.add(k));
            }
        });
        return Array.from(keys).sort();
    }, [contacts]);

    // Selection
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Batches
    const [batches, setBatches] = useState<Batch[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [batchDomains, setBatchDomains] = useState<DomainStat[]>([]);
    const [batchDomainsLoading, setBatchDomainsLoading] = useState(false);
    const [batchContacts, setBatchContacts] = useState<Contact[]>([]);
    const [batchContactsLoading, setBatchContactsLoading] = useState(false);
    const [batchSearch, setBatchSearch] = useState("");
    const [batchDomainFilter, setBatchDomainFilter] = useState<string | null>(null);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

    // Modals
    const [showUpload, setShowUpload] = useState(false);
    const [showDeleteAll, setShowDeleteAll] = useState(false);
    const [showBulkDelete, setShowBulkDelete] = useState(false);
    const [showBulkTag, setShowBulkTag] = useState(false);
    const [bulkTagInput, setBulkTagInput] = useState("");
    const [showBatchDelete, setShowBatchDelete] = useState<Batch | null>(null);
    const [showSingleDelete, setShowSingleDelete] = useState<string | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [validationResult, setValidationResult] = useState<any>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Upload state
    const [uploadStep, setUploadStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [importResult, setImportResult] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [downloadingBatch, setDownloadingBatch] = useState<string | null>(null);

    // Phase 7.5: Job progress polling
    const [jobProgress, setJobProgress] = useState<{ id: string; progress: number; status: string; processed_items: number; total_items: number; failed_items: number } | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const contactsAbortRef = useRef<AbortController | null>(null);
    const domainsAbortRef = useRef<AbortController | null>(null);
    const batchesAbortRef = useRef<AbortController | null>(null);

    // Helper to get mapped column or empty
    const getMappedCol = (target: string) => {
        return Object.entries(columnMappings).find(([_, v]) => v === target)?.[0] || "";
    };
    const emailCol = getMappedCol("email");

    // ===== Data Fetching =====
    const fetchStats = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/contacts/stats`, { headers: apiHeaders(token) });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error("Stats error:", e); }
    };
    
    const fetchTags = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/contacts/tags`, { headers: apiHeaders(token) });
            if (res.ok) setAvailableTags(await res.json());
        } catch (e) { console.error("Tags error:", e); }
    };

    const fetchContacts = async () => {
        if (!token) return;
        setLoading(true);
        if (contactsAbortRef.current) {
            contactsAbortRef.current.abort();
        }
        const controller = new AbortController();
        contactsAbortRef.current = controller;
        try {
            const params = new URLSearchParams({ page: String(page), limit: "20" });
            if (deferredSearch) params.set("search", deferredSearch);
            if (batchFilter) params.set("batch_id", batchFilter);
            if (domainFilter) params.set("domain", domainFilter);
            if (tagFilter) params.set("tag", tagFilter);
            const res = await fetch(`${API_BASE}/contacts/?${params}`, { headers: apiHeaders(token), signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setContacts(data.data || []);
                setTotalPages(data.meta?.total_pages || 0);
                setTotal(data.meta?.total || 0);
            }
        } catch (e: any) {
            if (e.name !== "AbortError") {
                console.error("Contacts error:", e);
            }
        }
        setLoading(false);
    };

    const fetchDomains = async () => {
        if (!token) return;
        setDomainsLoading(true);
        if (domainsAbortRef.current) {
            domainsAbortRef.current.abort();
        }
        const controller = new AbortController();
        domainsAbortRef.current = controller;
        try {
            const params = new URLSearchParams({ limit: "10" });
            if (batchFilter) params.set("batch_id", batchFilter);
            const res = await fetch(`${API_BASE}/contacts/domains?${params}`, { headers: apiHeaders(token), signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setDomainStats(data.data || []);
            }
        } catch (e: any) {
            if (e.name !== "AbortError") {
                console.error("Domains error:", e);
            }
        }
        setDomainsLoading(false);
    };

    const fetchBatches = async () => {
        if (!token) return;
        setBatchesLoading(true);
        if (batchesAbortRef.current) {
            batchesAbortRef.current.abort();
        }
        const controller = new AbortController();
        batchesAbortRef.current = controller;
        try {
            // Add timestamp to bypass browser caching of the batches list
            const res = await fetch(`${API_BASE}/contacts/batches?t=${Date.now()}`, { headers: apiHeaders(token), signal: controller.signal });
            if (res.ok) {
                const data = await res.json();
                setBatches(data.data || []);
            }
        } catch (e: any) {
            if (e.name !== "AbortError") {
                console.error("Batches error:", e);
            }
        }
        setBatchesLoading(false);
    };

    const fetchSuppressionList = async () => {
        if (!token) return;
        setSuppressionLoading(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/suppression?page=${suppressionPage}&limit=20`, {
                headers: apiHeaders(token),
            });
            if (res.ok) {
                const data = await res.json();
                setSuppressedContacts(data.data || []);
                setSuppressionTotalPages(data.meta?.total_pages || 1);
                setSuppressionTotal(data.meta?.total || 0);
            }
        } catch (e) {
            console.error("Suppression list error:", e);
        } finally {
            setSuppressionLoading(false);
        }
    };

    useEffect(() => { fetchStats(); fetchTags(); }, [token]);
    useEffect(() => { fetchContacts(); }, [token, page, deferredSearch, batchFilter, domainFilter, tagFilter]);
    useEffect(() => { fetchDomains(); }, [token, batchFilter]);
    
    // Optimized Polling: Only poll history if specifically on that tab
    useEffect(() => {
        if (!token) return;
        
        if (user && !can(user, "VIEW_CONTACT")) {
            router.replace("/dashboard");
            return;
        }

        if (activeTab === "history") {
            fetchBatches();
            const interval = setInterval(fetchBatches, 8000); // Poll every 8 seconds to prevent "looping" logs
            return () => clearInterval(interval);
        }
        if (activeTab === "suppression") {
            fetchSuppressionList();
        }
    }, [token, user, activeTab, suppressionPage]);

    if (!user || (user && !can(user, "VIEW_CONTACT"))) {
        return null;
    }


    // ===== Selection =====
    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelected(next);
    };

    const toggleSelectAll = () => {
        if (selected.size === contacts.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(contacts.map(c => c.id)));
        }
    };

    // ===== Upload Flow =====
    const handleFileSelect = async (f: File) => {
        setFile(f);
        setUploading(true);
        setIsValidating(true);
        setValidationResult(null);

        try {
            // 1. Get Row Count & Headers (Preview)
            const formData = new FormData();
            formData.append("file", f);
            const previewRes = await fetch(`${API_BASE}/contacts/upload/preview`, {
                method: "POST",
                headers: apiHeaders(token!),
                body: formData
            });

            if (!previewRes.ok) {
                const err = await previewRes.json();
                throw new Error(err.detail || "Preview failed");
            }
            const previewData = await previewRes.json();
            setHeaders(previewData.headers);
            setRowCount(previewData.row_count);

            // 2. Validate Limit
            const valRes = await fetch(`${API_BASE}/contacts/import/validate`, {
                method: "POST",
                headers: { ...apiHeaders(token!), "Content-Type": "application/json" },
                body: JSON.stringify({ file_contact_count: previewData.row_count })
            });

            if (!valRes.ok) throw new Error("Validation failed");
            const valData = await valRes.json();
            setValidationResult(valData);

            if (valData.status !== "OK") {
                // If limit exceeded, we stay on Step 1 but show the error UI
                setUploading(false);
                setIsValidating(false);
                return;
            }

            // 3. Auto-detect columns (if OK)
            const autoMap: Record<string, string> = {};
            previewData.headers.forEach((col: string) => {
                const lower = col.toLowerCase().trim();
                if (lower === "email" || lower === "email address" || lower === "e-mail") {
                    autoMap[col] = "email";
                } else if (lower === "first name" || lower === "firstname" || lower === "fname") {
                    autoMap[col] = "first_name";
                } else if (lower === "last name" || lower === "lastname" || lower === "lname") {
                    autoMap[col] = "last_name";
                } else {
                    autoMap[col] = "skip";
                }
            });
            setColumnMappings(autoMap);
            setUploadStep(2);

        } catch (e: any) {
            console.error("Upload error caught:", e);
            error(`Upload failed: ${e.message || e}`);
        } finally {
            setUploading(false);
            setIsValidating(false);
        }
    };

    const handleImport = async () => {
        if (!file || !emailCol) return;
        setUploading(true);
        try {
            // Build custom field mappings
            const customMappings: Record<string, string> = {};
            Object.entries(columnMappings).forEach(([csvCol, target]) => {
                if (target.startsWith("custom:")) {
                    const fieldName = target.replace("custom:", "");
                    customMappings[fieldName] = csvCol;
                }
            });

            // 1. INITIALIZE (Get S3 Ticket)
            const initRes = await fetch(`${API_BASE}/contacts/import/initialize?project_id=default`, {
                method: "POST",
                headers: { ...apiHeaders(token!), "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: file.name,
                    content_type: file.type || "text/csv",
                    estimated_rows: rowCount
                })
            });
            
            if (!initRes.ok) {
                const err = await initRes.json();
                throw new Error(err.detail || "Failed to initialize import");
            }
            const initData = await initRes.json();

            // 2. UPLOAD TO S3 (Direct via Signed URL using PUT)
            const s3Res = await fetch(initData.upload_url, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type || "text/csv"
                },
                body: file
            });
            
            if (!s3Res.ok) throw new Error("Failed to upload file to storage");

            // 3. SIGNAL PROCESS (Trigger RabbitMQ)
            const processRes = await fetch(`${API_BASE}/contacts/import/process/${initData.job_id}`, {
                method: "POST",
                headers: { ...apiHeaders(token!), "Content-Type": "application/json" },
                body: JSON.stringify({
                    email_col: emailCol,
                    first_name_col: getMappedCol("first_name") || null,
                    last_name_col: getMappedCol("last_name") || null,
                    custom_mappings: Object.keys(customMappings).length > 0 ? customMappings : null
                })
            });

            if (!processRes.ok) throw new Error("Failed to start processing");

            // 4. POLL FOR PROGRESS
            setJobProgress({ 
                id: initData.job_id, 
                progress: 0, 
                status: 'pending', 
                processed_items: 0, 
                total_items: rowCount, 
                failed_items: 0 
            });
            setUploadStep(3); // Progress UI

            pollRef.current = setInterval(async () => {
                try {
                    // Update this endpoint to poll the new import_jobs table
                    // Add timestamp to bypass browser caching
                    const jr = await fetch(`${API_BASE}/contacts/jobs/${initData.job_id}?t=${Date.now()}`, { headers: apiHeaders(token!) });
                    if (jr.ok) {
                        const job = await jr.json();
                        const counts = deriveImportCounts(job, rowCount);
                        const progressProcessed = Number(job?.processed_rows ?? job?.processed_items ?? 0);
                        const progressFailed = Number(job?.failed_rows ?? job?.failed_items ?? 0);
                        const progressPct = counts.total > 0
                            ? Math.min(100, Math.round(((progressProcessed + progressFailed) / counts.total) * 100))
                            : 0;
                        
                        setJobProgress({ 
                            id: job.id, 
                            progress: progressPct, 
                            status: job.status, 
                            processed_items: counts.success, 
                            total_items: counts.total, 
                            failed_items: counts.failed 
                        });
                        
                        if (job.status === 'completed' || job.status === 'failed') {
                            if (pollRef.current) clearInterval(pollRef.current);
                            setImportResult({
                                total: counts.total,
                                success: counts.success,
                                failed: counts.failed,
                                batch_id: null,
                                skipped_blank: 0,
                                skipped_duplicates: 0,
                            });
                            setUploadStep(4);
                            // Refresh all data
                            fetchStats();
                            fetchContacts();
                            fetchDomains();
                            fetchBatches();
                            // Second check after a tiny delay just to be 100% safe
                            setTimeout(() => fetchBatches(), 1500);
                        }
                    } else {
                        console.error("Polling fetch failed:", jr.status);
                    }
                } catch (err) { 
                    console.error("Polling error caught:", err);
                }
            }, 1000);

        } catch (e: any) { 
            console.error(e);
            error(`Import failed: ${e.message}`); 
        } finally {
            setUploading(false);
        }
    };

    const resetUpload = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        setShowUpload(false);
        setUploadStep(1);
        setFile(null);
        setHeaders([]);
        setRowCount(0);
        setColumnMappings({});
        setImportResult(null);
        setJobProgress(null);
        setValidationResult(null);
    };

    // ===== Delete Operations =====
    const handleSingleDelete = async (id: string) => {
        try {
            await fetch(`${API_BASE}/contacts/${id}`, {
                method: "DELETE",
                headers: apiHeaders(token!)
            });
            success("Contact deleted.");
            setShowSingleDelete(null);
            fetchContacts();
            fetchStats();
            fetchDomains();
        } catch (e) { error("Delete failed"); }
    };

    const handleBulkDelete = async () => {
        try {
            await fetch(`${API_BASE}/contacts/bulk-delete`, {
                method: "POST",
                headers: { ...apiHeaders(token!), "Content-Type": "application/json" },
                body: JSON.stringify({ contact_ids: Array.from(selected) })
            });
            setSelected(new Set());
            setShowBulkDelete(false);
            success("Selected contacts deleted.");
            fetchContacts();
            fetchStats();
            fetchDomains();
        } catch (e) { error("Bulk delete failed"); }
    };

    const handleBulkTag = async () => {
        if (selected.size === 0 || !token || !bulkTagInput.trim()) return;
        try {
            const tags = bulkTagInput.split(",").map(t => t.trim()).filter(t => t);
            await fetch(`${API_BASE}/contacts/bulk-tag`, {
                method: "POST",
                headers: { ...apiHeaders(token!), "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    contact_ids: Array.from(selected),
                    tags: tags,
                    action: "add"
                })
            });
            setSelected(new Set());
            setBulkTagInput("");
            setShowBulkTag(false);
            success("Tags added to selected contacts.");
            fetchContacts();
            fetchTags();
        } catch (e) { error("Bulk tag failed"); }
    };

    const handleDeleteAll = async () => {
        try {
            await fetch(`${API_BASE}/contacts/all`, {
                method: "DELETE",
                headers: apiHeaders(token!)
            });
            setShowDeleteAll(false);
            setDeleteConfirmText("");
            success("All contacts deleted.");
            fetchContacts();
            fetchStats();
            fetchBatches();
            fetchDomains();
        } catch (e) { error("Delete all failed"); }
    };

    const handleDeleteBatch = async (batch: Batch) => {
        try {
            await fetch(`${API_BASE}/contacts/batch/${batch.id}`, {
                method: "DELETE",
                headers: apiHeaders(token!)
            });
            setShowBatchDelete(null);
            success(`Deleted batch ${batch.file_name}.`);
            fetchContacts();
            fetchStats();
            fetchBatches();
            fetchDomains();
        } catch (e) { error("Batch delete failed"); }
    };

    // ===== Styles =====
    const colors = {
        bg: "var(--bg-primary)",
        bgMuted: "var(--bg-card)",
        border: "var(--border)",
        text: "var(--text-primary)",
        textSecondary: "var(--text-muted)",
        accent: "var(--accent)",
        danger: "var(--danger)",
        dangerBg: "var(--danger-bg)",
        dangerBorder: "var(--danger-border)",
        success: "var(--success)"
    };

    const tabStyle = (active: boolean) => ({
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: 500 as const,
        color: active ? colors.accent : colors.textSecondary,
        background: "none",
        border: "none",
        borderTopStyle: "solid" as const,
        borderTopWidth: "0px",
        borderTopColor: "transparent",
        borderBottomStyle: "solid" as const,
        borderBottomWidth: active ? "2px" : "0px",
        borderBottomColor: active ? colors.accent : "transparent",
        cursor: "pointer",
        transition: "all 150ms"
    });

    const highlightedBatch = batches.find((entry) => entry.id === batchFilter) || null;

    const handleSelectBatch = async (batch: Batch) => {
        if (expandedBatch === batch.id) {
            setExpandedBatch(null);
            return;
        }
        
        // 1. Instantly show the expanded row (loading state)
        setExpandedBatch(batch.id);
        setBatchDomainsLoading(true);
        setBatchContactsLoading(true);
        setBatchSearch("");
        setBatchDomainFilter(null);
        
        try {
            // 2. Fetch data
            const [domainRes, contactRes] = await Promise.all([
                fetch(`${API_BASE}/contacts/domains?batch_id=${batch.id}`, { headers: apiHeaders(token!) }),
                fetch(`${API_BASE}/contacts/?batch_id=${batch.id}&limit=10`, { headers: apiHeaders(token!) })
            ]);

            const domainData = await domainRes.json();
            const contactData = await contactRes.json();

            setBatchDomains(domainData.data || []);
            setBatchContacts(contactData.data || []);
        } catch (e) {
            console.error("Failed to fetch batch details", e);
        } finally {
            setBatchDomainsLoading(false);
            setBatchContactsLoading(false);
        }
    };

    const fetchBatchContacts = async (batchId: string, search: string, domain: string | null) => {
        setBatchContactsLoading(true);
        try {
            const params = new URLSearchParams({
                batch_id: batchId,
                limit: "10",
                ...(search ? { search } : {}),
                ...(domain ? { domains: domain } : {})
            });
            const res = await fetch(`${API_BASE}/contacts/?${params}`, {
                headers: apiHeaders(token!)
            });
            const data = await res.json();
            setBatchContacts(data.data || []);
        } catch (e) {
            console.error("Failed to fetch batch contacts", e);
        } finally {
            setBatchContactsLoading(false);
        }
    };

    // Debounced search for batch contacts
    useEffect(() => {
        if (expandedBatch) {
            const timer = setTimeout(() => {
                fetchBatchContacts(expandedBatch, batchSearch, batchDomainFilter);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [batchSearch, batchDomainFilter, expandedBatch]);

    const handleExportBatch = async (batchId: string, fileName: string) => {
        try {
            const res = await fetch(`${API_BASE}/contacts/export?batch_id=${batchId}`, {
                headers: apiHeaders(token!)
            });
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `export_${fileName.replace(/\.[^/.]+$/, "")}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            error("Failed to export batch.");
        }
    };

    const handleExport = async () => {
        if (!token) return;
        setIsExporting(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/export/async`, { 
                method: "POST",
                headers: apiHeaders(token) 
            });
            if (res.ok) {
                const data = await res.json();
                if (data.job_id) {
                    const poll = setInterval(async () => {
                        try {
                            const jr = await fetch(`${API_BASE}/contacts/jobs/${data.job_id}`, { headers: apiHeaders(token) });
                            if (jr.ok) {
                                const job = await jr.json();
                                if (job.status === 'completed') {
                                    clearInterval(poll);
                                    setIsExporting(false);
                                    let url = '';
                                    try {
                                        const errorLog = JSON.parse(job.error_log);
                                        url = errorLog.result_url;
                                    } catch (e) {}
                                    if (url) {
                                        const workspacePrefix = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || "workspace";
                                        const exportFilename = `${workspacePrefix.toLowerCase()}_contacts.csv.gz`;
                                        const finalUrl = url + (url.includes('?') ? '&' : '?') + `download=${encodeURIComponent(exportFilename)}`;
                                        
                                        const a = document.createElement("a");
                                        a.href = finalUrl;
                                        a.download = exportFilename;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    } else {
                                        warning("Export completed but no download URL was returned.");
                                    }
                                } else if (job.status === 'failed') {
                                    clearInterval(poll);
                                    setIsExporting(false);
                                    error("Export failed.");
                                }
                            }
                        } catch (e) {}
                    }, 2000);
                } else {
                    setIsExporting(false);
                    error("No export job ID returned.");
                }
            } else {
                setIsExporting(false);
                error("Failed to start export.");
            }
        } catch (e) {
            setIsExporting(false);
            console.error("Export error:", e);
            error("An error occurred starting export.");
        }
    };

    const handleBatchExport = async (batchId: string, batchFileName: string) => {
        if (!token) return;
        setDownloadingBatch(batchId);
        try {
            const res = await fetch(`${API_BASE}/contacts/export/batch/${batchId}`, {
                method: "GET",
                headers: apiHeaders(token),
            });
            if (res.ok) {
                const blob = await res.blob();
                const cleanName = batchFileName.replace(/\.[^/.]+$/, ""); // Strip original file extension
                const exportFilename = `batch_${cleanName}.csv.gz`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = exportFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                success(`Exported batch ${batchFileName}.`);
            } else if (res.status === 429) {
                info("An export is already running for this workspace.");
            } else {
                error("Failed to export batch.");
            }
        } catch (e) {
            console.error("Batch Export error:", e);
            error("An error occurred during batch export.");
        } finally {
            setDownloadingBatch(null);
        }
    };

    const btnPrimary = {
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 500,
        color: "white",
        backgroundColor: colors.accent,
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px"
    };

    const btnDanger = {
        ...btnPrimary,
        backgroundColor: colors.danger
    };

    const btnOutline = {
        ...btnPrimary,
        backgroundColor: "transparent",
        color: colors.text,
        border: `1px solid ${colors.border}`
    };

    const statsSummary = stats ? [
        { label: "Total Contacts", value: stats.total_contacts.toLocaleString() },
        { label: "Plan Limit", value: stats.limit.toLocaleString() },
        { label: "Remaining", value: stats.available.toLocaleString() },
        { label: "Active Filters", value: [batchFilter, domainFilter, tagFilter].filter(Boolean).length.toString() },
    ] : [];

    return (
        <div className="space-y-6 pb-8">
            <PageHeader
                title="Contacts"
                subtitle="Import, filter, tag, and maintain audience health without leaving the operational workspace."
                action={
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={handleExport} disabled={isExporting} variant="outline">
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {isExporting ? "Preparing Export..." : "Export CSV"}
                        </Button>
                        <Button
                            onClick={() => stats && stats.usage_percent < 100 ? setShowUpload(true) : null}
                            disabled={stats?.usage_percent === 100}
                            title={stats?.usage_percent === 100 ? "Contact limit reached — upgrade your plan to add more" : "Upload Contacts"}
                        >
                            <Upload className="h-4 w-4" />
                            Upload Contacts
                        </Button>
                    </div>
                }
            />

            {/* Stats Bar */}
            {stats && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statsSummary.map((item) => (
                            <StatCard key={item.label} label={item.label} value={item.value} />
                        ))}
                    </div>

                </div>
            )}

            {/* Contact limit warning banners */}
            {stats && stats.usage_percent >= 100 && (
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/70 p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--danger)]" />
                        <div>
                            <p className="text-sm font-semibold text-[var(--danger)]">Contact limit reached</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                You've used all {stats.limit.toLocaleString()} contacts on your plan. Upgrade to continue adding contacts.
                            </p>
                        </div>
                    </div>
                    <Link href="/settings/billing" className="whitespace-nowrap">
                        <Button variant="outline" size="sm">Upgrade Plan</Button>
                    </Link>
                </div>
            )}
            {stats && stats.usage_percent >= 80 && stats.usage_percent < 100 && (
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--warning-border)] bg-[var(--warning-bg)]/70 p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--warning)]" />
                        <p className="text-sm text-[var(--text-primary)]">
                            You've used <strong>{stats.usage_percent}%</strong> of your {stats.limit.toLocaleString()} contact limit.
                            Consider upgrading before you hit the cap.
                        </p>
                    </div>
                    <Link href="/settings/billing" className="whitespace-nowrap">
                        <Button variant="outline" size="sm">View Plans</Button>
                    </Link>
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-2">
                <button
                    onClick={() => setActiveTab("contacts")}
                    className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${activeTab === "contacts" ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                >
                    Contacts
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${activeTab === "history" ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                >
                    Import History
                </button>
                <button
                    onClick={() => setActiveTab("suppression")}
                    className={`rounded-[var(--radius)] px-4 py-2 text-sm font-medium transition ${activeTab === "suppression" ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                >
                    Suppression List
                </button>
            </div>

            {/* ===== TAB: Contacts ===== */}
            {activeTab === "contacts" && (
                <>
                    <TableToolbar
                        title="Contact Filters"
                        description={highlightedBatch ? `Currently scoped to ${highlightedBatch.file_name}` : 'Filter by search, import batch, domain, or tag to narrow a large audience quickly.'}
                        trailing={<span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]"><Globe2 className="h-4 w-4" />Audience Query</span>}
                    >
                        <FilterBar className="rounded-[var(--radius)] border-0 bg-transparent p-0">
                            <div className="relative min-w-[280px] flex-[1_1_280px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    placeholder="Search by email..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="h-10 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
                                />
                            </div>
                            <select
                                value={batchFilter}
                                onChange={(e) => {
                                    setBatchFilter(e.target.value);
                                    setDomainFilter("");
                                    setPage(1);
                                }}
                                className="h-10 min-w-[220px] flex-[1_1_220px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"
                            >
                                <option value="">All contacts</option>
                                {batches.filter((entry) => entry.imported_count > 0).map((entry) => (
                                    <option key={entry.id} value={entry.id}>
                                        {entry.file_name} ({entry.imported_count})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={domainFilter}
                                onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
                                className="h-10 min-w-[180px] flex-[1_1_180px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"
                            >
                                <option value="">All domains</option>
                                {domainStats.map((entry) => (
                                    <option key={entry.domain} value={entry.domain}>
                                        {entry.domain} ({entry.count})
                                        {entry.suggested_domain ? ` • maybe ${entry.suggested_domain}` : ""}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={tagFilter}
                                onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
                                className="h-10 min-w-[180px] flex-[1_1_180px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"
                            >
                                <option value="">All Tags</option>
                                {availableTags.map((tag) => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            {(domainFilter || batchFilter || tagFilter) && (
                                <Button onClick={() => { setBatchFilter(""); setDomainFilter(""); setTagFilter(""); setPage(1); }} variant="outline">
                                    Clear
                                </Button>
                            )}
                        </FilterBar>
                        {domainsLoading && domainStats.length === 0 && (
                            <p className="mt-3 text-xs text-[var(--text-muted)]">Loading domains...</p>
                        )}
                    </TableToolbar>

                    {selected.size > 0 && (
                        <InlineAlert
                            variant="info"
                            title={`${selected.size} contact${selected.size > 1 ? "s" : ""} selected`}
                            description="Apply tags, remove records, or clear the current selection without losing your filter context."
                            action={
                                <>
                                    <Button onClick={() => setShowBulkTag(true)} variant="outline" size="sm">
                                        <Tag className="h-3.5 w-3.5" /> Bulk Tag
                                    </Button>
                                    <Button onClick={() => setShowBulkDelete(true)} variant="danger" size="sm">
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                                    </Button>
                                    <Button onClick={() => setSelected(new Set())} variant="ghost" size="sm">
                                        Clear
                                    </Button>
                                </>
                            }
                        />
                    )}

                    {/* Contacts Table */}
                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                    <th className="w-10 px-3 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={contacts.length > 0 && selected.size === contacts.length}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Tags</th>
                                    {customFieldKeys.map(key => (
                                        <th key={key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                            {key.replace(/_/g, " ")}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Created</th>
                                    <th className="w-[60px] px-3 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4 + customFieldKeys.length} className="px-3 py-10 text-center text-[var(--text-muted)]">Loading...</td></tr>
                                ) : contacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4 + customFieldKeys.length} className="p-0">
                                            <EmptyState
                                                title={domainFilter ? `No contacts found for ${domainFilter}` : "No contacts yet"}
                                                description={domainFilter ? "Clear the filter or import more data." : "Upload a CSV or Excel file to start building your audience."}
                                                action={domainFilter ? <Button variant="outline" onClick={() => { setDomainFilter(""); setPage(1); }}>Clear Domain Filter</Button> : <Button onClick={() => setShowUpload(true)}>Upload Contacts</Button>}
                                            />
                                        </td>
                                    </tr>
                                ) : contacts.map((c) => (
                                    <tr key={c.id} className="border-b border-[var(--border)] transition hover:bg-[var(--bg-hover)]">
                                        <td className="px-3 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(c.id)}
                                                onChange={() => toggleSelect(c.id)}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col gap-1">
                                                <Link href={`/contacts/${c.id}`} className="font-semibold text-[var(--accent)] no-underline">
                                                    {c.email}
                                                </Link>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        {(c.first_name || c.last_name)
                                                            ? [c.first_name, c.last_name].filter(Boolean).join(" ")
                                                            : "Unnamed contact"}
                                                    </span>
                                                    {c.email_domain && (
                                                        <span className="rounded-full border border-[var(--accent-border)] bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] text-[var(--accent)]">
                                                            {c.email_domain}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-[var(--text-muted)]">
                                            <div className="flex flex-wrap gap-1">
                                                {c.tags?.map((t: string) => (
                                                    <span key={t} className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-hover)] px-1.5 py-0.5 text-[11px]">
                                                        {t}
                                                    </span>
                                                ))}
                                                {(!c.tags || c.tags.length === 0) && "—"}
                                            </div>
                                        </td>
                                        {customFieldKeys.map(key => (
                                            <td key={key} className="px-3 py-3 text-[var(--text-muted)]">
                                                {c.custom_fields?.[key] || "—"}
                                            </td>
                                        ))}
                                        <td className="px-3 py-3 text-sm text-[var(--text-muted)]">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-3">
                                            <button
                                                onClick={() => setShowSingleDelete(c.id)}
                                                className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-[var(--text-muted)]">
                                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
                            </span>
                            <div className="flex gap-2">
                                <Button disabled={page <= 1} onClick={() => setPage(p => p - 1)} variant="outline" size="sm">
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} variant="outline" size="sm">
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    {stats && stats.total_contacts > 0 && (
                        <div className="rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/70 p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--danger)]">Danger Zone</h3>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        Permanently delete all {stats.total_contacts.toLocaleString()} contacts. This action cannot be undone.
                                    </p>
                                </div>
                                <Button onClick={() => setShowDeleteAll(true)} variant="danger">
                                    <AlertTriangle className="h-4 w-4" /> Delete All Contacts
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ===== TAB: Import History ===== */}
            {activeTab === "history" && (
                <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                    <TableToolbar
                        title="Import History"
                        description="Review previous uploads, investigate failed contacts, and export or remove specific batches."
                        trailing={batches.length > 0 ? <Badge variant="outline">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</Badge> : null}
                        className="rounded-none border-0 border-b border-[var(--border)]"
                    />
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">File Name</th>
                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Status</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">New</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Failed</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Total</th>
                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Date</th>
                                <th className="w-[100px] px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {batchesLoading && batches.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--accent)]" /></td></tr>
                            ) : batches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-10 py-20 text-center">
                                        <FileText className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]/30" />
                                        <p className="text-[var(--text-muted)]">No import history found.</p>
                                    </td>
                                </tr>
                            ) : batches.map((b) => (
                                <React.Fragment key={b.id}>
                                    <tr 
                                        onClick={() => handleSelectBatch(b)}
                                        className={`cursor-pointer border-b border-[var(--border)] transition hover:bg-[var(--bg-hover)] ${expandedBatch === b.id ? 'bg-[var(--accent)]/5' : ''}`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
                                                    <FileSpreadsheet className="h-4 w-4 text-[var(--accent)]" />
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleSelectBatch(b); }}
                                                    className="text-left text-sm font-semibold text-[var(--accent)] transition hover:underline"
                                                >
                                                    {b.file_name}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4"><BatchStatusBadge status={b.status} /></td>
                                        <td className="px-5 py-4 text-right font-semibold text-[var(--success)]">{b.imported_count}</td>
                                        <td className={`px-5 py-4 text-right ${b.failed_count > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>{b.failed_count}</td>
                                        <td className="px-5 py-4 text-right font-medium text-[var(--text-primary)]">{b.total_rows}</td>
                                        <td className="px-5 py-4 text-right text-sm text-[var(--text-muted)]">
                                            {new Date(b.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleExportBatch(b.id, b.file_name); }}
                                                    className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--accent)]"
                                                    title="Export this batch"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setShowBatchDelete(b); }} 
                                                    className="rounded-[var(--radius)] p-1 text-[var(--text-muted)] transition hover:bg-[var(--danger-bg)] hover:text-[var(--danger)]"
                                                    title="Delete this batch"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedBatch === b.id && (
                                        <tr className="bg-[var(--bg-primary)]/70">
                                            <td colSpan={7} className="border-b border-[var(--border)] px-8 py-6">
                                                <div className="fade-in space-y-5">
                                                    <div className="grid gap-4 md:grid-cols-4">
                                                        <UploadMetric label="New Contacts" value={b.imported_count || 0} tone="success" />
                                                        <UploadMetric label="Updated" value={getBatchMeta(b).updated || 0} tone="accent" />
                                                        <UploadMetric label="Duplicates" value={getBatchMeta(b).skipped_duplicates || 0} />
                                                        <UploadMetric label="Failed" value={b.failed_count || 0} tone="danger" />
                                                    </div>

                                                    {batchDomains.some(d => d.suggested_domain) && (
                                                        <InlineAlert
                                                            variant="warning"
                                                            description={`Potential typos detected: ${batchDomains.filter(d => d.suggested_domain).slice(0, 2).map(d => `${d.domain} -> ${d.suggested_domain}`).join(", ")}`}
                                                        />
                                                    )}

                                                    <div className="flex flex-wrap gap-2">
                                                        <button 
                                                            onClick={() => setBatchDomainFilter(null)}
                                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!batchDomainFilter ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                                                        >
                                                            All Domains
                                                        </button>
                                                        {batchDomains.map((d, idx) => (
                                                            <button 
                                                                key={`${d.domain}-${idx}`}
                                                                onClick={() => setBatchDomainFilter(d.domain)}
                                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition ${batchDomainFilter === d.domain ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
                                                            >
                                                                {d.domain} <span className="opacity-60">{d.count}</span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px" }}>
                                                        {/* Left Column: Contact List & Search */}
                                                        <div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Imported Contacts</h3>
                                                                <div style={{ position: "relative", width: "240px" }}>
                                                                    <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
                                                                    <input 
                                                                        placeholder="Search this batch..."
                                                                        value={batchSearch}
                                                                        onChange={(e) => setBatchSearch(e.target.value)}
                                                                        style={{ 
                                                                            width: "100%", padding: "6px 10px 6px 32px", fontSize: "12px",
                                                                            backgroundColor: "rgba(0,0,0,0.2)", border: `1px solid ${colors.border}`,
                                                                            borderRadius: "6px", color: "white", outline: "none"
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div style={{ maxHeight: "300px", overflowY: "auto", border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
                                                                {batchContactsLoading ? (
                                                                    <div style={{ padding: "40px", textAlign: "center" }}><Loader2 className="spinner" /></div>
                                                                ) : batchContacts.length === 0 ? (
                                                                    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No contacts found.</div>
                                                                ) : (
                                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                                                        <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bg-card)", zIndex: 10 }}>
                                                                            <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: `1px solid ${colors.border}` }}>
                                                                                <th style={{ padding: "10px 16px" }}>Email</th>
                                                                                <th style={{ padding: "10px 16px" }}>Name</th>
                                                                                <th style={{ padding: "10px 16px" }}>Status</th>
                                                                                <th style={{ padding: "10px 16px", textAlign: "right" }}>Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {batchContacts.map((c) => (
                                                                                <tr key={c.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                                                                                    <td style={{ padding: "10px 16px", color: "var(--accent)", fontWeight: 500 }}>
                                                                                        <Link href={`/contacts/${c.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                                                                                            {c.email}
                                                                                        </Link>
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 16px" }}>{c.first_name || ""} {c.last_name || ""}</td>
                                                                                    <td style={{ padding: "10px 16px" }}>
                                                                                        <span style={{ 
                                                                                            padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 700,
                                                                                            backgroundColor: "rgba(34, 197, 94, 0.1)", color: "var(--success)"
                                                                                        }}>SUBSCRIBED</span>
                                                                                    </td>
                                                                                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                                                                                        <Link href={`/contacts/${c.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                                                                                            Edit
                                                                                        </Link>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Column: Error Resolver */}
                                                        <div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                                                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                                                                    Failed Contacts {b.failed_count > 0 && `(${b.failed_count})`}
                                                                </h3>
                                                                {b.failed_count > 0 && (
                                                                    <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 600 }}>Action Required</span>
                                                                )}
                                                            </div>

                                                            {b.failed_count === 0 ? (
                                                                <div style={{ padding: "32px 20px", textAlign: "center", backgroundColor: "rgba(34, 197, 94, 0.03)", borderRadius: "8px", border: "1px dashed rgba(34, 197, 94, 0.2)" }}>
                                                                    <CheckCircle2 style={{ width: "24px", height: "24px", color: "var(--success)", margin: "0 auto 8px" }} />
                                                                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>100% Success Rate!</p>
                                                                </div>
                                                            ) : (
                                                                <div style={{ maxHeight: "300px", overflowY: "auto", border: `1px solid ${colors.border}`, borderRadius: "8px" }}>
                                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                                                                        <tbody>
                                                                            {(b.errors || []).map((err: any, idx: number) => (
                                                                                <ErrorRow 
                                                                                    key={idx} err={err} idx={idx} 
                                                                                    batchId={b.id} token={token!} 
                                                                                    colors={colors} onResolved={fetchBatches} 
                                                                                />
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== TAB: Suppression List ===== */}
            {activeTab === "suppression" && (
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)]">
                        <TableToolbar
                            title="Suppression List"
                            description="Review bounced, complained, and unsubscribed contacts before they affect future deliverability."
                            trailing={<Badge variant="outline">{suppressionTotal} suppressed</Badge>}
                            className="rounded-none border-0 border-b border-[var(--border)]"
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Email</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Name</th>
                                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Reason</th>
                                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Date Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppressionLoading && suppressedContacts.length === 0 ? (
                                        <tr><td colSpan={4} className="px-5 py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--accent)]" /></td></tr>
                                    ) : suppressedContacts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-20 text-center">
                                                <ShieldOff className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]/30" />
                                                <p className="text-[var(--text-muted)]">Your suppression list is currently clear.</p>
                                            </td>
                                        </tr>
                                    ) : suppressedContacts.map((c) => (
                                        <tr key={c.id} className="border-b border-[var(--border)] transition hover:bg-[var(--bg-hover)]">
                                            <td className="px-5 py-4 font-medium text-[var(--text-primary)]">{c.email}</td>
                                            <td className="px-5 py-4 text-[var(--text-muted)]">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td>
                                            <td className="px-5 py-4">
                                                <span
                                                    title={c.bounce_reason || 'No bounce reason recorded'}
                                                    className="inline-flex items-center gap-1 rounded-full border border-[var(--danger-border)] bg-[var(--danger-bg)]/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--danger)]"
                                                >
                                                    <AlertTriangle className="h-3 w-3" />
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-[var(--text-muted)]">{new Date(c.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {suppressionTotalPages > 1 && (
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-[var(--text-muted)]">
                                Page {suppressionPage} of {suppressionTotalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button disabled={suppressionPage <= 1} onClick={() => setSuppressionPage(p => p - 1)} variant="outline" size="sm">
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <Button disabled={suppressionPage >= suppressionTotalPages} onClick={() => setSuppressionPage(p => p + 1)} variant="outline" size="sm">
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== MODAL: Upload Flow ===== */}
            <ModalShell
                isOpen={showUpload}
                onClose={resetUpload}
                title={`Import Contacts (Step ${uploadStep}/4)`}
                description="Upload a file, map fields, validate the import, and review results before returning to your audience workspace."
                maxWidthClass="max-w-2xl"
            >

                        {/* Step 1: File Selection / Upload */}
                        {uploadStep === 1 && !validationResult && (
                            <div>
                                {!file ? (
                                    <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-10 text-center transition hover:border-[var(--accent-border)]"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]); }}
                                    >
                                        <Upload className="mb-2 h-6 w-6 text-[var(--text-muted)]" />
                                        <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                                            {isValidating ? "Validating plan limits..." : uploading ? "Parsing file..." : "Click to upload or drag and drop"}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">CSV or Excel files (up to 2MB)</p>
                                        <input id="file-upload" type="file" accept=".csv,.xlsx" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} style={{ display: "none" }} />
                                    </label>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-10 text-center">
                                        <FileSpreadsheet className="mb-2 h-8 w-8 text-[var(--accent)]" />
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{file.name}</p>
                                        <p className="mb-4 text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB · {rowCount} rows</p>
                                        <div className="flex w-full gap-2">
                                            <Button variant="outline" onClick={() => { setFile(null); setRowCount(0); setHeaders([]); }} fullWidth>Remove</Button>
                                            <Button onClick={() => handleFileSelect(file)} fullWidth isLoading={isValidating}>Upload</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Limit Exceeded UI */}
                        {uploadStep === 1 && validationResult && validationResult.status !== "OK" && (
                            <div className="space-y-6">
                                <div className="rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--danger-bg)]/20 p-6">
                                    <div className="flex items-center gap-3 text-[var(--danger)]">
                                        <AlertTriangle className="h-6 w-6" />
                                        <h3 className="text-base font-bold">Contact Limit Reached</h3>
                                    </div>
                                    <div className="mt-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-muted)]">Your plan allows:</span>
                                            <span className="font-semibold text-[var(--text-primary)]">{validationResult.limit.toLocaleString()} contacts</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[var(--text-muted)]">You currently have:</span>
                                            <span className="font-semibold text-[var(--text-primary)]">{validationResult.current.toLocaleString()} contacts</span>
                                        </div>
                                        <div className="flex justify-between border-t border-[var(--danger-border)] pt-2">
                                            <span className="text-[var(--text-muted)]">This file contains:</span>
                                            <span className="font-bold text-[var(--danger)]">{validationResult.attempting.toLocaleString()} contacts</span>
                                        </div>
                                        <p className="mt-2 text-xs italic text-[var(--text-muted)]">
                                            👉 You can only add {validationResult.remaining.toLocaleString()} more contacts on your current plan.
                                        </p>
                                    </div>
                                </div>

                                {validationResult.recommended_plan && (
                                    <div className="rounded-[var(--radius-lg)] border border-[var(--accent-border)] bg-[var(--accent)]/5 p-6">
                                        <div className="flex items-center gap-3 text-[var(--accent)]">
                                            <Zap className="h-5 w-5" />
                                            <h4 className="text-sm font-bold uppercase tracking-wider">Recommended Plan</h4>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-[var(--text-primary)]">{validationResult.recommended_plan.name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">Allows up to {validationResult.recommended_plan.limit.toLocaleString()} contacts</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">{validationResult.recommended_plan.price}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setValidationResult(null)} className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={() => router.push("/settings/billing")} className="flex-1 gap-2">
                                        Upgrade Plan <ArrowUp className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Dynamic Column Mapping */}
                        {uploadStep === 2 && (
                            <div>
                                <p className="mb-3 text-sm text-[var(--text-muted)]">
                                    Map each file column to a contact field. <strong>Email, First Name, and Last Name are required.</strong>
                                </p>
                                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                                    {headers.map((col) => {
                                        const mapping = columnMappings[col] || "skip";
                                        const isCustom = mapping.startsWith("custom:");
                                        const customName = isCustom ? mapping.replace("custom:", "") : "";

                                        return (
                                            <div key={col} className={`rounded-[var(--radius)] border px-3 py-2 ${mapping !== "skip" ? 'border-[var(--border)] bg-[var(--bg-hover)]' : 'border-transparent bg-transparent'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="min-w-[110px] truncate text-sm font-medium text-[var(--text-primary)]" title={col}>{col}</span>
                                                    <span className="text-sm text-[var(--text-muted)]">→</span>
                                                    <select
                                                        value={isCustom ? "custom" : mapping}
                                                        onChange={(e) => {
                                                            const newMappings = { ...columnMappings };
                                                            const val = e.target.value;
                                                            if (val === "skip") {
                                                                delete newMappings[col];
                                                            } else if (val === "custom") {
                                                                // Set custom with default name from column header
                                                                newMappings[col] = `custom:${col.toLowerCase().replace(/\s+/g, "_")}`;
                                                            } else {
                                                                // Standard field — ensure uniqueness
                                                                Object.keys(newMappings).forEach(k => {
                                                                    if (newMappings[k] === val && k !== col) {
                                                                        delete newMappings[k];
                                                                    }
                                                                });
                                                                newMappings[col] = val;
                                                            }
                                                            setColumnMappings(newMappings);
                                                        }}
                                                        className="h-9 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-2 text-sm text-[var(--text-primary)]"
                                                    >
                                                        <option value="skip">⊘ Skip</option>
                                                        <option value="email" disabled={!!getMappedCol("email") && getMappedCol("email") !== col}>📧 Email (required)</option>
                                                        <option value="first_name" disabled={!!getMappedCol("first_name") && getMappedCol("first_name") !== col}>👤 First Name (required)</option>
                                                        <option value="last_name" disabled={!!getMappedCol("last_name") && getMappedCol("last_name") !== col}>👤 Last Name (required)</option>
                                                        <option value="custom">📋 Custom Field</option>
                                                    </select>
                                                </div>
                                                {isCustom && (
                                                    <div className="mt-2 pl-[118px]">
                                                        <Input
                                                            type="text"
                                                            value={customName}
                                                            placeholder="Enter field name (e.g. phone, company)"
                                                            onChange={(e) => {
                                                                const newMappings = { ...columnMappings };
                                                                const fieldName = e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                                                                newMappings[col] = `custom:${fieldName}`;
                                                                setColumnMappings(newMappings);
                                                            }}
                                                            className="h-8 text-xs"
                                                        />
                                                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                                            Stored as: <code className="rounded bg-[var(--bg-hover)] px-1 py-0.5 text-[11px]">{customName || "..."}</code>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {(!emailCol || !getMappedCol("first_name") || !getMappedCol("last_name")) && (
                                    <p className="mt-2 text-xs text-[var(--danger)]">
                                        ⚠ You must map Email, First Name, and Last Name columns.
                                    </p>
                                )}
                                <Button 
                                    disabled={!emailCol || !getMappedCol("first_name") || !getMappedCol("last_name")} 
                                    onClick={() => setUploadStep(3)}
                                    fullWidth
                                    className="mt-3"
                                >
                                    Continue
                                </Button>
                            </div>
                        )}

                        {/* Step 3: Validation (Only show if not polling) */}
                        {uploadStep === 3 && !jobProgress && (
                            <div>
                                <SectionCard title="Ready to import" description="Review the file details and field mappings before processing begins.">
                                    <div className="space-y-1 text-sm text-[var(--text-muted)]">
                                        <p>📁 File: {file?.name}</p>
                                        <p>📊 Total rows: {rowCount}</p>
                                    </div>
                                    <div className="mt-4 border-t border-[var(--border)] pt-4">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-primary)]">Field Mappings</p>
                                        {Object.entries(columnMappings).map(([csvCol, target]) => (
                                            <p key={csvCol} className="mb-1 text-xs text-[var(--text-muted)]">
                                                {csvCol} → <span className="font-medium text-[var(--text-primary)]">
                                                    {target === "email" ? "📧 Email" : `📋 ${target.replace("custom:", "")}`}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                </SectionCard>
                                <div className="mt-4 flex gap-2">
                                    <Button onClick={() => setUploadStep(2)} variant="outline" className="flex-1 justify-center">Back</Button>
                                    <Button onClick={handleImport} disabled={uploading} className="flex-1 justify-center">
                                        {uploading ? "Importing..." : "Import Contacts"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Progress Polling (Phase 7.5) */}
                        {uploadStep === 3 && jobProgress && (
                            <div className="py-5 text-center">
                                <div
                                    className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                                    style={{ background: `conic-gradient(var(--accent) ${jobProgress.progress * 3.6}deg, var(--bg-hover) 0deg)` }}
                                >
                                    <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[var(--bg-card)] text-xs font-bold text-[var(--accent)]">
                                        {jobProgress.progress}%
                                    </div>
                                </div>
                                <h3 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
                                    Processing Import...
                                </h3>
                                <p className="mb-4 text-sm text-[var(--text-muted)]">
                                    {jobProgress.processed_items.toLocaleString()} / {jobProgress.total_items.toLocaleString()} contacts processed
                                </p>
                                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-hover)]">
                                    <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${jobProgress.progress}%` }} />
                                </div>
                                <p className="text-xs italic text-[var(--text-muted)]">
                                    Do not close this window. Your contacts are being processed in the background.
                                </p>
                            </div>
                        )}

                        {/* Step 4: Success */}
                        {uploadStep === 4 && importResult && (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--success-bg)]">
                                    <Check className="h-6 w-6 text-[var(--success)]" />
                                </div>
                                <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Import Complete</h3>
                                <SectionCard>
                                    <div className="space-y-1 text-left text-sm text-[var(--text-muted)]">
                                        <p>Total processed: {importResult.total}</p>
                                        <p className="font-medium text-[var(--success)]">✓ Imported: {importResult.success}</p>
                                        {importResult.new !== undefined && <p>New: {importResult.new} | Updated: {importResult.updated}</p>}
                                        {importResult.skipped_blank > 0 && <p>Skipped blank rows: {importResult.skipped_blank}</p>}
                                        {importResult.skipped_duplicates > 0 && <p>Skipped duplicates: {importResult.skipped_duplicates}</p>}
                                        {importResult.failed > 0 && <p className="text-[var(--danger)]">✗ Failed: {importResult.failed}</p>}
                                        {importResult.success + importResult.failed !== importResult.total && (
                                            <p className="text-[var(--warning)]">
                                                Import counts are inconsistent. Check batch history for the final backend totals.
                                            </p>
                                        )}
                                    </div>
                                </SectionCard>

                                {/* Failed contacts detail */}
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div className="mb-4 mt-4 text-left">
                                        <p className="mb-2 text-sm font-semibold text-[var(--danger)]">
                                            Failed Contacts — Fix these and re-upload:
                                        </p>
                                        <div className="max-h-[200px] overflow-y-auto rounded-[var(--radius)] border border-[var(--danger-border)]">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-[var(--danger-bg)]">
                                                        <th className="px-2.5 py-1.5 text-left font-medium text-[var(--danger)]">Row</th>
                                                        <th className="px-2.5 py-1.5 text-left font-medium text-[var(--danger)]">Email</th>
                                                        <th className="px-2.5 py-1.5 text-left font-medium text-[var(--danger)]">Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importResult.errors.map((err: any, i: number) => (
                                                        <tr key={i} className="border-t border-[var(--danger-border)]">
                                                            <td className="px-2.5 py-1.5 text-[var(--text-muted)]">{err.row || "—"}</td>
                                                            <td className="px-2.5 py-1.5 font-mono text-[11px] text-[var(--text-primary)]">{err.email || "—"}</td>
                                                            <td className="px-2.5 py-1.5 text-[var(--danger)]">{err.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {importResult.failed > importResult.errors.length && (
                                            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                                Showing first {importResult.errors.length} of {importResult.failed} errors
                                            </p>
                                        )}
                                    </div>
                                )}

                                <Button onClick={resetUpload} fullWidth>Done</Button>
                            </div>
                        )}
            </ModalShell>

            {/* ===== MODAL: Bulk Delete Confirm ===== */}
            <ConfirmModal
                isOpen={!!showSingleDelete}
                onClose={() => setShowSingleDelete(null)}
                onConfirm={() => showSingleDelete && handleSingleDelete(showSingleDelete)}
                title="Delete Contact?"
                message="This contact will be permanently removed from the audience."
                confirmLabel="Delete Contact"
                variant="danger"
            />

            <ConfirmModal
                isOpen={showBulkDelete}
                onClose={() => setShowBulkDelete(false)}
                onConfirm={handleBulkDelete}
                title={`Delete ${selected.size} Contact${selected.size > 1 ? "s" : ""}?`}
                message="This action cannot be undone. The selected contacts will be permanently removed."
                confirmLabel="Delete"
                variant="danger"
            />

            {/* ===== MODAL: Delete All (Type to Confirm) ===== */}
            <ConfirmModal
                isOpen={showDeleteAll}
                onClose={() => { setShowDeleteAll(false); setDeleteConfirmText(""); }}
                onConfirm={handleDeleteAll}
                title="Delete All Contacts"
                message={`This will permanently delete ${stats?.total_contacts.toLocaleString() || 0} contacts and all import history. This action cannot be undone.`}
                confirmLabel="Delete All Contacts"
                variant="danger"
                confirmDisabled={deleteConfirmText !== "DELETE"}
                children={
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                            Type <strong>DELETE</strong> to confirm:
                        </p>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                        />
                    </div>
                }
            />

            {/* ===== MODAL: Delete Batch Confirm ===== */}
            <ConfirmModal
                isOpen={!!showBatchDelete}
                onClose={() => setShowBatchDelete(null)}
                onConfirm={() => showBatchDelete && handleDeleteBatch(showBatchDelete)}
                title="Delete Import Batch?"
                message={`This will delete all contacts imported from ${showBatchDelete?.file_name || 'this batch'}. ${showBatchDelete?.imported_count || 0} contact${showBatchDelete?.imported_count === 1 ? '' : 's'} will be removed.`}
                confirmLabel="Delete Batch"
                variant="danger"
            />

            {/* ===== MODAL: Bulk Tag ===== */}
            <ModalShell
                isOpen={showBulkTag}
                onClose={() => setShowBulkTag(false)}
                title={`Add Tags to ${selected.size} Contact${selected.size === 1 ? '' : 's'}`}
                description="Enter one or more tags separated by commas. They will be added to every selected contact."
                maxWidthClass="max-w-md"
            >
                <div className="space-y-5">
                    <Input
                        value={bulkTagInput}
                        onChange={(e) => setBulkTagInput(e.target.value)}
                        placeholder="e.g. VIP, Newsletter, Q2-Lead"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button onClick={() => setShowBulkTag(false)} variant="outline">Cancel</Button>
                        <Button onClick={handleBulkTag} disabled={!bulkTagInput.trim()}>
                            Add Tags
                        </Button>
                    </div>
                </div>
            </ModalShell>
        </div>
    );
}
