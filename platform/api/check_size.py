from utils.supabase_client import db

def check_size():
    response = db.client.table('templates').select('id, compiled_html').execute()
    for t in response.data:
        html = t.get('compiled_html') or ''
        print(f"Template {t['id']}: {len(html.encode('utf-8')) if html else 0} bytes")

check_size()
