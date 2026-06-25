const fs = require('fs');
const path = require('path');

const dir = './frontend/src/pages/workspaces/crm';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'crmSidebarConfig.tsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const badImportRegex = /import \{\nimport WorkspaceLayout from '\.\.\/\.\.\/\.\.\/layouts\/WorkspaceLayout';\nimport \{ CRM_SIDEBAR \} from '\.\/crmSidebarConfig';/;
  if (content.match(badImportRegex)) {
    // Remove it from the bad location
    content = content.replace(badImportRegex, 'import {');
    
    // Find the end of all imports (the line before the first non-import, non-empty line)
    // Actually, safer is to just find the last "from " or "import " line and insert after it.
    let lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIdx = i;
      }
    }
    // We want to insert after the *entire* import statement. So let's look for the next line that is not part of the import.
    // We just find the next line that has a semicolon or is not indented.
    // Or we just insert it before the first 'const ' or 'function ' or 'export ' or 'interface '.
    let insertIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('const ') || lines[i].startsWith('interface ') || lines[i].startsWith('export ') || lines[i].startsWith('function ')) {
        insertIdx = i;
        break;
      }
    }
    
    if (insertIdx !== -1) {
      lines.splice(insertIdx, 0, "import WorkspaceLayout from '../../../layouts/WorkspaceLayout';", "import { CRM_SIDEBAR } from './crmSidebarConfig';");
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log('Fixed imports in', file);
    } else {
      console.log('Could not find insert point for', file);
    }
  }
}
