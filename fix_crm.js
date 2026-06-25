const fs = require('fs');
const path = require('path');

const dir = './frontend/src/pages/workspaces/crm';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'crmSidebarConfig.tsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has WorkspaceLayout
  if (content.includes('WorkspaceLayout')) continue;

  // Add imports
  const importInsertPoint = content.lastIndexOf('import ');
  const endOfLastImport = content.indexOf('\n', importInsertPoint);
  content = content.slice(0, endOfLastImport + 1) +
    "import WorkspaceLayout from '../../../layouts/WorkspaceLayout';\n" +
    "import { CRM_SIDEBAR } from './crmSidebarConfig';\n" +
    content.slice(endOfLastImport + 1);

  // Find the main return statement of the export default function
  // We'll look for "export default function Name() {" and the last "return (" before the end of the function
  // Actually, standard is "export default function" followed by "return (" at indent 2
  const returnMatch = content.match(/\n  return \(\n\s*(<div[^>]*>)/);
  if (returnMatch) {
    const returnStart = returnMatch.index;
    const divStart = returnStart + returnMatch[0].indexOf(returnMatch[1]);
    
    content = content.slice(0, divStart) +
      "<WorkspaceLayout config={CRM_SIDEBAR}>\n      " +
      content.slice(divStart);

    // To find the end, we can replace the last "  );\n}" with
    // "    </WorkspaceLayout>\n  );\n}"
    const endMatch = content.match(/(\s*<\/div>\s*)\);\s*}\s*$/);
    if (endMatch) {
      content = content.replace(/(\s*<\/div>\s*)\);\s*}\s*$/, "$1  </WorkspaceLayout>\n  );\n}\n");
    } else {
      // If it ends differently, maybe just replace ");\n}"
      content = content.replace(/\);\s*}\s*$/, "  </WorkspaceLayout>\n  );\n}\n");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  } else {
    console.log('Could not find main return for', file);
  }
}
