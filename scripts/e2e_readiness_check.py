import asyncio
import os
import time
import requests
import psycopg2
import uuid
from dotenv import load_dotenv

load_dotenv()

# We need a valid tenant token to test the API.
# We'll just generate a dummy tenant and jwt directly via DB if we have to, 
# or bypass it if we have a test user.

API_URL = "http://localhost:8000"

def setup_db():
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Failed to connect to DB: {e}")
        return None

def test_s3_connection():
    import boto3
    from botocore.config import Config
    print("Testing S3 connection directly...")
    try:
        s3 = boto3.client(
            "s3",
            region_name=os.getenv("S3_REGION", os.getenv("AWS_REGION")),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            endpoint_url=os.getenv("S3_ENDPOINT"),
            config=Config(signature_version='s3v4')
        )
        response = s3.list_objects_v2(Bucket=os.getenv("S3_BUCKET"))
        print(f"✅ S3 Connection OK! Found {len(response.get('Contents', []))} files in bucket '{os.getenv('S3_BUCKET')}'.")
        return True
    except Exception as e:
        print(f"❌ S3 Connection Failed: {e}")
        return False

def generate_dummy_csv():
    filename = "/tmp/test_contacts.csv"
    import csv
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['email', 'first_name', 'last_name', 'company']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for i in range(1, 1001):
            writer.writerow({
                'email': f'testuser{i}_{uuid.uuid4().hex[:6]}@example.com',
                'first_name': f'Test {i}',
                'last_name': 'Testerson',
                'company': 'Testing Inc'
            })
    return filename

if __name__ == "__main__":
    print(f"Starting E2E Readiness Check...")
    print("---------------------------------")
    
    # 1. Test S3 Bucket Status
    s3_ok = test_s3_connection()
    
    # 2. Test RabbitMQ Connection
    import pika
    try:
        params = pika.URLParameters(os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/"))
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.queue_declare(queue="background_tasks", durable=True)
        print("✅ RabbitMQ Connection OK!")
        connection.close()
    except Exception as e:
        print(f"❌ RabbitMQ Connection Failed: {e}")
        print("Please ensure CloudAMQP or intense local RabbitMQ is running.")

    print("\nNext Steps:")
    print("1. Start the API: `uvicorn platform.api.main:app --reload --port 8000`")
    print("2. Start the Worker: `python platform/worker/import_worker.py`")
    print("3. Start the Frontend: `cd platform/client && npm run dev`")
    print("4. Navigate to http://localhost:3000/contacts and upload a test CSV file!")
