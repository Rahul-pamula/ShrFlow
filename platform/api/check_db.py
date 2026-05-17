from utils.supabase_client import db

def check_db():
    response = db.client.table('templates').select('id, mjml_json').execute()
    for t in response.data:
        mj = t.get('mjml_json') or {}
        has_blocks_root = 'bodyBlocks' in mj
        has_dj = 'design_json' in mj
        dj = mj.get('design_json') or {}
        has_blocks_dj = 'bodyBlocks' in dj
        print(f"Template {t['id']}: root_blocks={has_blocks_root} dj_blocks={has_blocks_dj}")

check_db()
