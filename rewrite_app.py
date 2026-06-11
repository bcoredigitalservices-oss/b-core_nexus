import re

with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import { 
  Shield, Users, Package, Activity, AlertTriangle, Send, 
  Plus, RefreshCw, Layers, CheckCircle, Database, Server, User, Key, Wifi, AlertOctagon
} from 'lucide-react';
import DirectoryTab from './features/directory/components/DirectoryTab';
import CatalogTab from './features/catalog/components/CatalogTab';
import VirtualGridTab from './features/virtualized/components/VirtualGridTab';
"""
content = re.sub(r"import \{[^}]+\} from 'lucide-react';", imports, content, count=1)

# Remove unused seed data and handleAddDirectory, handleAddCatalog, etc. (Optional, but let's keep it simple and just replace the JSX tabs)

# Replace Directory Tab
dir_tab_pattern = re.compile(r"\{\/\* Tab 1: Global Directory \*\/\}.*?\{\/\* Tab 2: Universal Catalog \*\/\}", re.DOTALL)
dir_tab_replacement = """{/* Tab 1: Global Directory */}
          {activeTab === 'directory' && (
            <DirectoryTab 
              localDirectory={localDirectory} 
              setLocalDirectory={setLocalDirectory} 
              roleTier={roleTier} 
              logSystemEvent={logSystemEvent} 
            />
          )}

          {/* Tab 2: Universal Catalog */}"""
content = dir_tab_pattern.sub(dir_tab_replacement, content)

# Replace Catalog Tab
cat_tab_pattern = re.compile(r"\{\/\* Tab 2: Universal Catalog \*\/\}.*?\{\/\* Tab 3: Virtualized 100k Rows \*\/\}", re.DOTALL)
cat_tab_replacement = """{/* Tab 2: Universal Catalog */}
          {activeTab === 'catalog' && (
            <CatalogTab 
              localCatalog={localCatalog} 
              setLocalCatalog={setLocalCatalog} 
              roleTier={roleTier} 
              logSystemEvent={logSystemEvent} 
            />
          )}

          {/* Tab 3: Virtualized 100k Rows */}"""
content = cat_tab_pattern.sub(cat_tab_replacement, content)

# Replace Virtualized Tab
virt_tab_pattern = re.compile(r"\{\/\* Tab 3: Virtualized 100k Rows \*\/\}.*?(?=\<\/section\>)", re.DOTALL)
virt_tab_replacement = """{/* Tab 3: Virtualized 100k Rows */}
          {activeTab === 'virtualized' && (
            <VirtualGridTab />
          )}

        """
content = virt_tab_pattern.sub(virt_tab_replacement, content)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
