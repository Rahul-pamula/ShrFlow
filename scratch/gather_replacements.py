import os
import re

IGNORE_DIRS = {'.git', 'node_modules', 'venv', '.venv', '.next', '__pycache__', 'dist', 'build'}
ROOT = '/Users/akshaypurane/Desktop/Sh_R_Mail'

regexes = [
    re.compile(r'(shrmail)', re.IGNORECASE),
    re.compile(r'(sh_r_mail)', re.IGNORECASE)
]

matches = []

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    for file in files:
        if file.endswith(('.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.pyc', '.webm', '.webp', '.mp4')):
            continue
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                if any(r.search(line) for r in regexes):
                    matches.append((path, i+1, line.strip()))
        except Exception:
            pass

with open(os.path.join(ROOT, 'scratch/search_results.txt'), 'w', encoding='utf-8') as out:
    for m in matches:
        out.write(f"{m[0]}:{m[1]}:{m[2]}\n")

print(f"Found {len(matches)} matching lines. Results written to scratch/search_results.txt")
