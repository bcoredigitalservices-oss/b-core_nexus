import os
import re

directory = 'frontend/src'

replacements = [
    # Light greys/whites (were used on dark backgrounds, now invisible on light bg)
    (r"['\"]#[eE]2[eE]8[fF]0['\"]", "'var(--text-main)'"),
    (r"['\"]#[cC][bB][dD]5[eE]1['\"]", "'var(--text-main)'"),
    (r"['\"]#[fF]1[fF]5[fF]9['\"]", "'var(--text-main)'"),
    (r"['\"]#[fF]8[fF][aA][fF][cC]['\"]", "'var(--text-main)'"),
    (r"['\"]#[fF]3[fF]4[fF]6['\"]", "'var(--text-main)'"),
    (r"['\"]#ffffff['\"]", "'var(--text-main)'"),
    (r"['\"]#FFFFFF['\"]", "'var(--text-main)'"),
    
    # Mid greys (usually muted text)
    (r"['\"]#9[cC][aA]3[aA][fF]['\"]", "'var(--text-muted)'"),
    (r"['\"]#94[aA]3[bB]8['\"]", "'var(--text-muted)'"),
    (r"['\"]#64748[bB]['\"]", "'var(--text-muted)'"),
    (r"['\"]#6[bB]7280['\"]", "'var(--text-muted)'"),
    
    # Dark greys/blues (were used as backgrounds or text, replace with theme vars)
    (r"['\"]#0[aA]0[fF]1[dD]['\"]", "'var(--text-main)'"),
    (r"['\"]#1[eE]293[bB]['\"]", "'var(--bg-main)'"),
    (r"['\"]#0[bB]1120['\"]", "'var(--bg-main)'"),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            # Skip Login files since we reverted them to dark theme
            if "Login" in file:
                continue
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Patched Text Colors: {filepath}")

print("Done patching text colors.")
