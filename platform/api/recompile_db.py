from utils.supabase_client import db
from services.compile_service import compile_design_json

def recompile_all():
    print('Starting recompilation of all templates...')
    response = db.client.table('templates').select('id, mjml_json').execute()
    templates = response.data
    
    updated_count = 0
    for t in templates:
        mjml_json = t.get('mjml_json')
        if mjml_json:
            # Safely extract design_json from mjml_json
            design_json = mjml_json.get('design_json') if isinstance(mjml_json, dict) and 'design_json' in mjml_json else mjml_json
            try:
                html = compile_design_json(design_json)
                if html:
                    db.client.table('templates').update({'compiled_html': html}).eq('id', t['id']).execute()
                    updated_count += 1
                    print(f"Updated template {t['id']}")
            except Exception as e:
                print(f"Failed to compile template {t['id']}: {str(e)}")
    print(f'Successfully updated {updated_count} templates.')

recompile_all()
