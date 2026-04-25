import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run():
    if len(sys.argv) < 2:
        print("Usage: python scripts/apply_sql_direct.py <path_to_sql_file>")
        return

    sql_file = sys.argv[1]
    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        print("❌ Error: Missing DATABASE_URL in .env")
        return

    if not os.path.exists(sql_file):
        print(f"❌ Error: File not found: {sql_file}")
        return

    print(f"🚀 Connecting to database...")
    try:
        # Use connection string from .env
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        print(f"📜 Reading {sql_file}...")
        with open(sql_file, "r") as f:
            sql = f.read()
            
        print("▶️ Executing SQL migration...")
        # psycopg2 can execute multiple statements in one call if they are separated by semicolons
        cur.execute(sql)
        
        print("✅ Success! Migration applied successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error applying migration: {e}")

if __name__ == "__main__":
    run()
