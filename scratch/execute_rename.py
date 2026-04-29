import os
import re

ROOT = '/Users/akshaypurane/Desktop/Sh_R_Mail'
IGNORE_DIRS = {'.git', 'node_modules', 'venv', '.venv', '.next', '__pycache__', 'dist', 'build', 'migrations', 'scratch'}
IGNORE_FILES_EXT = ('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pyc', '.webm', '.webp', '.mp4')
IGNORE_FILES = {'pyproject.toml', '.env'}

EXCLUSIONS = [
    "shrmail.app@gmail.com",
    "mail.shrmail.app",
    "trk.shrmail.app",
    "shrmail_phases_tracker",
    "shrmail-theme",
    "sh_r_mail_platform",
    "shrmail_client",
    "shrmail_service",
    "shrmail_id",
    "SHRMAIL_API_KEY",
    "shrmail-js",
    "shrmail-python"
]

def rename_callback(match):
    original = match.group(0)
    if original == "ShrMail": return "ShrFlow"
    if original == "shrmail": return "shrflow"
    if original == "SHRMAIL": return "SHRFLOW"
    if original == "Sh_R_Mail": return "ShrFlow"
    
    if original.lower() == "shrmail":
        if original.istitle(): return "ShrFlow"
        if original.isupper(): return "SHRFLOW"
        return "shrflow"
    
    if original.lower() == "sh_r_mail":
        if original.istitle(): return "ShrFlow"
        if original.isupper(): return "SHRFLOW"
        return "ShrFlow"
        
    return original

def process_line(line):
    placeholders = {}
    temp_line = line
    for i, exc in enumerate(EXCLUSIONS):
        if exc in temp_line:
            placeholder = f"__EXCLUSION_{i}__"
            placeholders[placeholder] = exc
            temp_line = temp_line.replace(exc, placeholder)
    
    pattern = re.compile(r'sh_r_mail|shrmail', re.IGNORECASE)
    temp_line = pattern.sub(rename_callback, temp_line)
    
    for placeholder, exc in placeholders.items():
        temp_line = temp_line.replace(placeholder, exc)
    
    return temp_line

changed_files_count = 0
total_replacements = 0

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    for file in files:
        if file.endswith(IGNORE_FILES_EXT) or file in IGNORE_FILES:
            continue
        
        path = os.path.join(root, file)
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            new_lines = []
            file_changed = False
            for line in lines:
                new_line = process_line(line)
                new_lines.append(new_line)
                if new_line != line:
                    file_changed = True
                    total_replacements += line.lower().count('shrmail') + line.lower().count('sh_r_mail') - new_line.lower().count('shrmail') - new_line.lower().count('sh_r_mail')
            
            if file_changed:
                with open(path, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                changed_files_count += 1
                
        except Exception as e:
            pass

print(f"Summary of changes:")
print(f"Files Modified: {changed_files_count}")
print(f"Total Lines Changed / Replacements Evaluated: OK")
