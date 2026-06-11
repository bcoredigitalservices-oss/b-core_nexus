import os
import re

directory = 'frontend/src'

replacements = [
    # Complex linear gradients with dark colors
    (r"linear-gradient\(135deg, rgba\(30, 41, 59, [^\)]+\) 0%, rgba\(15, 23, 42, [^\)]+\) 100%\)", "var(--bg-card)"),
    (r"linear-gradient\(135deg, rgba\(20, 30, 48, [^\)]+\) 0%, rgba\(12, 18, 36, [^\)]+\) 100%\)", "var(--bg-card)"),
    (r"linear-gradient\(145deg, rgba\(17, 24, 39, [^\)]+\) 0%, rgba\(11, 17, 32, [^\)]+\) 100%\)", "var(--bg-card)"),
    (r"linear-gradient\(135deg, rgba\(30, 41, 59, [^\)]+\) 0%, rgba\(15, 23, 42, [^\)]+\) 100%\)", "var(--bg-card)"),
    (r"linear-gradient\(135deg, rgba\(20, 30, 50, [^\)]+\) 0%, rgba\(12, 18, 36, [^\)]+\) 100%\)", "var(--bg-card)"),
    (r"linear-gradient\(135deg,\s*#141b2e\s*,\s*#0c1224\s*\)", "var(--bg-card)"),
    
    # Specific RGBA replacements for dark backgrounds
    (r"['\"]rgba\(12,\s*18,\s*36,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(20,\s*30,\s*48,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(20,\s*30,\s*50,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(30,\s*41,\s*59,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(15,\s*23,\s*42,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(17,\s*24,\s*39,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(11,\s*17,\s*32,\s*[0-9.]+\)['\"]", "'var(--bg-card)'"),
    (r"['\"]rgba\(0,\s*0,\s*0,\s*0\.6\)['\"]", "'rgba(0,0,0,0.4)'"), # less harsh modals
    
    # Text colors
    (r"color:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.[1-4]\)['\"]", "color: 'var(--text-muted)'"),
    (r"color:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.[5-9]\)['\"]", "color: 'var(--text-main)'"),
    
    # Borders
    (r"border:\s*['\"]1px solid rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)['\"]", "border: '1px solid var(--border-color)'"),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Patched: {filepath}")

print("Done patching pass 2.")
