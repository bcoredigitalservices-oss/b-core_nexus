import os
import glob

finance_dir = '/home/palankarta/WorkSpace/Development/b-core_nexus/frontend/src/pages/workspaces/finance'
for filepath in glob.glob(os.path.join(finance_dir, '*.tsx')):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content.replace('href="/finance/', 'href="/workspaces/finance/')
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
