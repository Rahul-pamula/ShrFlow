import os
import shutil
import io
from abc import ABC, abstractmethod
from fastapi import UploadFile
from pathlib import Path
from typing import List, Dict, Optional

class StorageProvider(ABC):
    """
    Abstract Interface for Storage Providers.
    Any new storage method (S3, Azure, Google Cloud) must implement these methods.
    """
    @abstractmethod
    async def upload(self, file: UploadFile, key: str, tenant_id: str) -> str:
        """Uploads a file and returns its public URL."""
        pass

    @abstractmethod
    async def upload_bytes(self, content: bytes, key: str, content_type: str, tenant_id: str) -> str:
        """Uploads raw bytes and returns public URL."""
        pass

    @abstractmethod
    def delete(self, key: str, tenant_id: str) -> bool:
        """Deletes a file by its key."""
        pass

    @abstractmethod
    def list_files(self, tenant_id: str) -> List[Dict[str, str]]:
        """Lists files scoped to a tenant."""
        pass


    @abstractmethod
    def generate_presigned_post(self, key: str, content_type: str, expires_in: int = 3600) -> Dict:
        """Generates a presigned URL/POST data for direct client-side upload."""
        pass

class LocalStorageProvider(StorageProvider):
    """
    Implementation for Local Disk Storage.
    Best for Development and Student Projects.
    """
    def __init__(self, base_path: str = "assets", base_url: str = "http://127.0.0.1:8000/static/assets"):
        self.base_path = Path(base_path)
        self.base_url = base_url
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def upload(self, file: UploadFile, key: str, tenant_id: str) -> str:
        scoped_dir = self.base_path / tenant_id
        scoped_dir.mkdir(parents=True, exist_ok=True)
        file_path = scoped_dir / key
        await file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return f"{self.base_url}/{tenant_id}/{key}"

    async def upload_bytes(self, content: bytes, key: str, content_type: str, tenant_id: str) -> str:
        scoped_dir = self.base_path / tenant_id
        scoped_dir.mkdir(parents=True, exist_ok=True)
        file_path = scoped_dir / key
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        return f"{self.base_url}/{tenant_id}/{key}"


    def list_files(self, tenant_id: str) -> List[Dict[str, str]]:
        assets = []
        scoped_dir = self.base_path / tenant_id
        if not scoped_dir.exists():
            return []
            
        for file in scoped_dir.iterdir():
            if file.is_file() and not file.name.startswith("."):
                assets.append({
                    "src": f"{self.base_url}/{tenant_id}/{file.name}",
                    "name": file.name,
                    "type": "image" 
                })
        return assets

    def delete(self, key: str, tenant_id: str) -> bool:
        file_path = self.base_path / tenant_id / key
        if file_path.exists():
            os.remove(file_path)
            return True
        return False


    def generate_presigned_post(self, key: str, content_type: str, expires_in: int = 3600) -> Dict:
        """Mock implementation for local storage."""
        return {
            "url": f"{self.base_url}/{key}",
            "fields": {"key": key, "Content-Type": content_type},
            "method": "PUT" # Local uses PUT via static serving usually, or a custom route
        }

# Placeholder for S3 - This shows verify scalability
import boto3
from botocore.config import Config

class S3StorageProvider(StorageProvider):
    """
    Implementation for S3-compatible Storage (AWS/Supabase/Cloudflare R2).
    """
    def __init__(self, bucket_name: str, region: str, access_key: str, secret_key: str, endpoint_url: Optional[str] = None):
        self.bucket_name = bucket_name
        self.s3_client = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            endpoint_url=endpoint_url,
            config=Config(signature_version='s3v4')
        )
        # For Supabase/S3-compatible, we often need to construct the public URL manually if not using signed URLs
        # Extract the base host from endpoint_url if provided
        self.base_url = endpoint_url.replace("/storage/v1/s3", "/storage/v1/object/public") if endpoint_url else ""

    async def upload(self, file: UploadFile, key: str, tenant_id: str) -> str:
        try:
            await file.seek(0)
            scoped_key = f"{tenant_id}/{key}"
            print(f"DEBUG: Attempting upload to S3. Bucket: {self.bucket_name}, Key: {scoped_key}")
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                scoped_key,
                ExtraArgs={"ContentType": file.content_type}
            )
            print(f"DEBUG: Upload successful.")
            
            if self.base_url:
                return f"{self.base_url}/{self.bucket_name}/{scoped_key}"
            return f"https://{self.bucket_name}.s3.amazonaws.com/{scoped_key}"
        except Exception as e:
            print(f"DEBUG: S3 upload exception: {str(e)}")
            raise e

    async def upload_bytes(self, content: bytes, key: str, content_type: str, tenant_id: str) -> str:
        try:
            scoped_key = f"{tenant_id}/{key}"
            print(f"DEBUG: Attempting bytes upload to S3. Bucket: {self.bucket_name}, Key: {scoped_key}")
            self.s3_client.upload_fileobj(
                io.BytesIO(content),
                self.bucket_name,
                scoped_key,
                ExtraArgs={"ContentType": content_type}
            )
            print(f"DEBUG: Bytes upload successful.")
            
            if self.base_url:
                return f"{self.base_url}/{self.bucket_name}/{scoped_key}"
            return f"https://{self.bucket_name}.s3.amazonaws.com/{scoped_key}"
        except Exception as e:
            print(f"DEBUG: S3 bytes upload exception: {str(e)}")
            raise e

    def list_files(self, tenant_id: str) -> List[Dict[str, str]]:
        prefix = f"{tenant_id}/"
        response = self.s3_client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
        assets = []
        for obj in response.get("Contents", []):
            key = obj["Key"]
            src = f"{self.base_url}/{self.bucket_name}/{key}" if self.base_url else f"https://{self.bucket_name}.s3.amazonaws.com/{key}"
            assets.append({"src": src, "name": key.replace(prefix, ""), "type": "image"})
        return assets

    def delete(self, key: str, tenant_id: str) -> bool:
        scoped_key = f"{tenant_id}/{key}"
        self.s3_client.delete_object(Bucket=self.bucket_name, Key=scoped_key)
        return True


    def generate_presigned_post(self, key: str, content_type: str, expires_in: int = 3600) -> Dict:
        """Returns a presigned POST policy for direct S3 upload."""
        return self.s3_client.generate_presigned_post(
            Bucket=self.bucket_name,
            Key=key,
            Fields={"Content-Type": content_type},
            Conditions=[{"Content-Type": content_type}],
            ExpiresIn=expires_in
        )

def get_storage_provider() -> StorageProvider:
    """Factory method to get the configured storage provider."""
    storage_type = os.getenv("STORAGE_TYPE", "local")
    
    if storage_type == "s3":
        return S3StorageProvider(
            bucket_name=os.getenv("S3_BUCKET", ""),
            region=os.getenv("S3_REGION", ""),
            access_key=os.getenv("AWS_ACCESS_KEY_ID", ""),
            secret_key=os.getenv("AWS_SECRET_ACCESS_KEY", ""),
            endpoint_url=os.getenv("S3_ENDPOINT", "")
        )
    
    return LocalStorageProvider()
