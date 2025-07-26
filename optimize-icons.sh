#!/bin/bash
echo "Optimizing Lucide Icons imports for better performance..."

# Find all files with lucide-react imports
find src -name "*.js" -o -name "*.jsx" | xargs grep -l "from 'lucide-react'" | while read file; do
    echo "Optimizing: $file"
    
    # Backup original file
    cp "$file" "$file.backup"
    
    # Extract icon names and create individual imports
    # This reduces bundle size significantly
    python3 -c "
import re
import sys

file_path = '$file'
with open(file_path, 'r') as f:
    content = f.read()

# Find lucide-react imports
pattern = r'import\s*{\s*([^}]+)\s*}\s*from\s*[\'\"]\s*lucide-react\s*[\'\"]\s*;?'
matches = re.findall(pattern, content)

if matches:
    icons = []
    for match in matches:
        # Split by comma and clean up
        icon_list = [icon.strip() for icon in match.split(',')]
        icons.extend(icon_list)
    
    # Remove old import
    content = re.sub(pattern, '', content)
    
    # Add individual imports at the top
    import_lines = []
    for icon in icons:
        if icon:
            import_lines.append(f'import {icon} from \"lucide-react/dist/esm/icons/{icon.lower().replace(\"_\", \"-\")}\";')
    
    # Find the first import line and insert before it
    lines = content.split('\n')
    first_import_index = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import'):
            first_import_index = i
            break
    
    # Insert optimized imports
    for import_line in reversed(import_lines):
        lines.insert(first_import_index, import_line)
    
    content = '\n'.join(lines)
    
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f'Optimized {len(icons)} icons in {file_path}')
"
done
