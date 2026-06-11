import os
import re

directory = 'frontend/src'

replacements = [
    # Backgrounds
    (r"backgroundColor:\s*['\"]#090[dD]1[aA]['\"]", "backgroundColor: 'var(--bg-main)'"),
    (r"background:\s*['\"]#090[dD]1[aA]['\"]", "background: 'var(--bg-main)'"),
    (r"backgroundColor:\s*['\"]#0[fF]172[aA]['\"]", "backgroundColor: 'var(--bg-card)'"),
    (r"background:\s*['\"]#0[fF]172[aA]['\"]", "background: 'var(--bg-card)'"),
    (r"backgroundColor:\s*['\"]#141[bB]2[eE]['\"]", "backgroundColor: 'var(--bg-card)'"),
    (r"background:\s*['\"]#141[bB]2[eE]['\"]", "background: 'var(--bg-card)'"),
    (r"backgroundColor:\s*['\"]#0[cC]1224['\"]", "backgroundColor: 'var(--bg-main)'"),
    (r"background:\s*['\"]#0[cC]1224['\"]", "background: 'var(--bg-main)'"),
    (r"background:\s*['\"]rgba\(20\s*,\s*30\s*,\s*50\s*,\s*0\.[345]\)['\"]", "background: 'var(--bg-card)'"),
    (r"background:\s*['\"]rgba\(12\s*,\s*18\s*,\s*36\s*,\s*0\.6\)['\"]", "background: 'var(--bg-card)'"),
    (r"background:\s*['\"]rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[1-5]\)['\"]", "background: 'var(--bg-card-hover)'"),
    (r"backgroundColor:\s*['\"]rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[1-5]\)['\"]", "backgroundColor: 'var(--bg-card-hover)'"),

    # Borders
    (r"border:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[4-9]\)['\"]", "border: '1px solid var(--border-color)'"),
    (r"border:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.1\)['\"]", "border: '1px solid var(--border-color)'"),
    (r"borderBottom:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[4-9]\)['\"]", "borderBottom: '1px solid var(--border-color)'"),
    (r"borderTop:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[4-9]\)['\"]", "borderTop: '1px solid var(--border-color)'"),
    (r"borderLeft:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[4-9]\)['\"]", "borderLeft: '1px solid var(--border-color)'"),
    (r"borderRight:\s*['\"]1px solid rgba\(255\s*,\s*255\s*,\s*255\s*,\s*0\.0[4-9]\)['\"]", "borderRight: '1px solid var(--border-color)'"),

    # Text Colors
    (r"color:\s*['\"]#ffffff['\"]", "color: 'var(--text-main)'"),
    (r"color:\s*['\"]#FFFFFF['\"]", "color: 'var(--text-main)'"),
    (r"color:\s*['\"]#F1F5F9['\"]", "color: 'var(--text-main)'"),
    (r"color:\s*['\"]#F8FAFC['\"]", "color: 'var(--text-main)'"),
    (r"color:\s*['\"]#F3F4F6['\"]", "color: 'var(--text-main)'"),
    (r"color:\s*['\"]#9CA3AF['\"]", "color: 'var(--text-muted)'"),
    (r"color:\s*['\"]#94A3B8['\"]", "color: 'var(--text-muted)'"),
    (r"color:\s*['\"]#64748B['\"]", "color: 'var(--text-muted)'"),
    (r"color:\s*['\"]#CBD5E1['\"]", "color: 'var(--text-muted)'"),

    # Accents
    (r"color:\s*['\"]#9d4edd['\"]", "color: 'var(--accent-primary)'"),
    (r"color:\s*['\"]#c8b6ff['\"]", "color: 'var(--accent-primary)'"),
    (r"backgroundColor:\s*['\"]#9d4edd['\"]", "backgroundColor: 'var(--accent-primary)'"),
]

css_replacements = [
    # In CSS files we want to replace hexes too
    (r"#090D1A", "var(--bg-main)"),
    (r"#0F172A", "var(--bg-card)"),
    (r"#141b2e", "var(--bg-card)"),
    (r"#ffffff", "var(--text-main)"),
    (r"#FFFFFF", "var(--text-main)"),
    (r"rgba\(255, ?255, ?255, ?0.0[4-9]\)", "var(--border-color)"),
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
                print(f"Patched TSX/JSX: {filepath}")

        elif file.endswith('.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            new_content = content
            for pattern, repl in css_replacements:
                # ignore replacing #ffffff in index.css for the root vars
                if "index.css" in filepath and "var(--" not in repl:
                    pass
                else:
                    new_content = re.sub(pattern, repl, new_content)
            
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Patched CSS: {filepath}")

print("Done patching.")
