import React, { useEffect, useState } from 'react';
import { 
  Network, 
  Plus, 
  X, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  CornerDownRight,
  ChevronRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  fetchDepartments, 
  createDepartment, 
  DepartmentItem 
} from '../../modules/admin/services/departments';

export default function Departments() {
  const { token } = useAppContext();
  
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Status notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formError, setFormError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');

  // Fetch departments list
  const fetchData = async () => {
    try {
      if (!token) return;
      const deptsData = await fetchDepartments(token);
      setDepartments(deptsData);
    } catch (err: any) {
      console.error('Failed to load IAM department data:', err);
      setErrorMsg('Failed to sync corporate departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleOpenModal = () => {
    setName('');
    setDescription('');
    setParentId('');
    setFormError('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setSuccessMsg('');

    try {
      await createDepartment(token, {
        name,
        description: description || null,
        parent_id: parentId || null
      });

      setSuccessMsg(`Department "${name}" created successfully!`);
      await fetchData();
      
      // Auto close modal
      setTimeout(() => {
        setModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving department.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build a tree of departments and flatten it to list children with their depth
  const buildFlatTree = (items: DepartmentItem[]): (DepartmentItem & { depth: number })[] => {
    const itemMap = new Map<string, DepartmentItem>();
    const childrenMap = new Map<string, DepartmentItem[]>();
    const roots: DepartmentItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id, item);
    });

    items.forEach(item => {
      if (item.parent_id && itemMap.has(item.parent_id)) {
        const list = childrenMap.get(item.parent_id) || [];
        list.push(item);
        childrenMap.set(item.parent_id, list);
      } else {
        roots.push(item);
      }
    });

    const result: (DepartmentItem & { depth: number })[] = [];
    
    function traverse(node: DepartmentItem, depth: number) {
      result.push({ ...node, depth });
      const children = childrenMap.get(node.id) || [];
      children.sort((a, b) => a.name.localeCompare(b.name));
      children.forEach(child => traverse(child, depth + 1));
    }

    roots.sort((a, b) => a.name.localeCompare(b.name));
    roots.forEach(root => traverse(root, 0));

    // Fallback for any items missed due to cyclic parent references
    items.forEach(item => {
      if (!result.some(r => r.id === item.id)) {
        result.push({ ...item, depth: 0 });
      }
    });

    return result;
  };

  const flatDepartments = buildFlatTree(departments);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin" size={32} />
        <span>Loading corporate network...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto p-4">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-br from-[#9d4edd]/12 to-[#00f2fe]/4 border border-color rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 shadow-[0_8px_32px_rgba(9,13,26,0.2)] backdrop-blur-[4px]">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-br from-[#9d4edd] to-[#00f2fe] rounded-xl p-3 flex items-center justify-center shadow-[0_4px_20px_rgba(157,78,221,0.3)]">
            <Network size={26} className="text-text-main" />
          </div>
          <div>
            <h1 className="text-[1.6rem] font-extrabold text-text-main font-display mb-1.5 tracking-tight">
              Hierarchical Departments
            </h1>
            <p className="text-text-muted text-[0.88rem] leading-normal">
              Configure parent-child organizational hierarchies, assign team managers, and provision isolated department nodes.
            </p>
          </div>
        </div>

        <button onClick={handleOpenModal} className="btn btn-primary flex items-center gap-2 py-3 px-5 font-semibold">
          <Plus size={16} />
          New Department
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[0.88rem]">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Departments Tree Table */}
      <div className="glass-panel p-0 overflow-hidden bg-card border border-color rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
        <div className="py-5 px-8 border-b border-color flex items-center justify-between bg-card-hover">
          <span className="text-[0.9rem] font-bold text-text-main tracking-wide">Active Organizational Hierarchy</span>
          <span className="text-[0.75rem] text-text-muted bg-card-hover py-1 px-2.5 rounded-full font-semibold">{departments.length} Nodes</span>
        </div>

        <div className="py-6 px-8 overflow-x-auto">
          {flatDepartments.length === 0 ? (
            <div className="text-center py-16 px-8 text-text-muted text-[0.95rem]">
              No departments registered in this organization yet. Click "New Department" to begin mapping the hierarchy.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-[0.9rem]">
              <thead>
                <tr className="border-b border-color text-text-muted text-[0.75rem] uppercase tracking-wider">
                  <th className="py-4 px-3">Department Name</th>
                  <th className="py-4 px-3">Parent Department</th>
                  <th className="py-4 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {flatDepartments.map((dept) => (
                  <tr 
                    key={dept.id} 
                    className="border-b border-color transition-colors duration-200 hover:bg-card-hover"
                  >
                    <td 
                      className="py-4.5 px-3 font-semibold text-text-main flex items-center gap-2"
                      style={{ paddingLeft: `${dept.depth * 24 + 12}px` }}
                    >
                      {dept.depth > 0 && <CornerDownRight size={14} className="text-text-muted min-w-[14px]" />}
                      <span>{dept.name}</span>
                    </td>
                    <td className="py-4.5 px-3 text-text-muted">
                      {dept.parent_name ? (
                        <div className="flex items-center gap-1.5 text-[0.85rem]">
                          <ChevronRight size={12} className="text-[#00f2fe]" />
                          <span>{dept.parent_name}</span>
                        </div>
                      ) : (
                        <span className="text-[0.75rem] text-[#00f2fe]/50 bg-[#00f2fe]/5 py-0.5 px-2 rounded border border-[#00f2fe]/10">
                          Root
                        </span>
                      )}
                    </td>
                    <td className="py-4.5 px-3 text-center">
                      <span className="text-[0.75rem] font-bold text-[#00f5a0] bg-[#00f5a0]/10 py-1 px-2.5 rounded-full border border-[#00f5a0]/20">
                        Enabled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create Department Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#090d1a]/85 backdrop-blur-md flex items-center justify-center z-[999] p-6">
          <div className="glass-panel w-full max-w-[480px] bg-main border border-[#9d4edd]/30 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 font-display">
                <Network size={20} className="text-[#9d4edd]" />
                New Department
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="bg-card-hover border-none text-text-muted cursor-pointer p-1.5 rounded-full flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* Notifications */}
            {successMsg && (
              <div className="flex items-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[0.85rem]">
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateDepartment} className="flex flex-col gap-5">
              
              {/* Name */}
              <div>
                <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">Name *</label>
                <div className="relative">
                  <Network size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="text" 
                    required 
                    className="pl-[38px] w-full"
                    placeholder="e.g. Operations & Fleet Management"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">Description</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3.5 text-text-muted" />
                  <textarea 
                    className="pl-[38px] min-h-[70px] w-full resize-vertical"
                    placeholder="Describe operational focus and metrics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Parent Department Selector */}
              <div>
                <label className="block text-[0.78rem] text-text-muted font-semibold uppercase tracking-wider mb-1.5">Parent Department</label>
                <div className="relative">
                  <Network size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select 
                    value={parentId} 
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full py-3 px-4 pl-[38px] bg-input border border-color rounded-lg text-text-main text-[0.9rem]"
                  >
                    <option value="">-- Root Department (None) --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-1" 
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Register Node'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
