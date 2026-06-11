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
} from '../../services/api/departments';

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: 'var(--text-muted)', gap: '1rem' }}>
        <Loader2 className="udg-spinner" size={32} />
        <span>Loading corporate network...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Header Panel */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.12) 0%, rgba(0, 242, 254, 0.04) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 8px 32px rgba(9, 13, 26, 0.2)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            style={{
              background: 'linear-gradient(135deg, #9d4edd 0%, #00f2fe 100%)',
              borderRadius: '12px',
              padding: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(157, 78, 221, 0.3)'
            }}
          >
            <Network size={26} color='var(--text-main)' />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.3rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Hierarchical Departments
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.4' }}>
              Configure parent-child organizational hierarchies, assign team managers, and provision isolated department nodes.
            </p>
          </div>
        </div>

        <button onClick={handleOpenModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', fontWeight: 600 }}>
          <Plus size={16} />
          New Department
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '12px', color: '#ff3366', fontSize: '0.88rem' }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Departments Tree Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)' }}>
        <div 
          style={{ 
            padding: '1.25rem 2rem', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card-hover)'
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.02em' }}>Active Organizational Hierarchy</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-card-hover)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>{departments.length} Nodes</span>
        </div>

        <div style={{ padding: '1.5rem 2rem', overflowX: 'auto' }}>
          {flatDepartments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No departments registered in this organization yet. Click "New Department" to begin mapping the hierarchy.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '1rem 0.75rem' }}>Department Name</th>
                  <th style={{ padding: '1rem 0.75rem' }}>Parent Department</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {flatDepartments.map((dept) => (
                  <tr 
                    key={dept.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.2s',
                    }}
                    className="hover-row"
                  >
                    <td style={{ 
                      padding: '1.1rem 0.75rem', 
                      fontWeight: 600, 
                      color: 'var(--text-main)',
                      paddingLeft: `${dept.depth * 24 + 12}px`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {dept.depth > 0 && <CornerDownRight size={14} color='var(--text-muted)' style={{ minWidth: '14px' }} />}
                      <span style={{ color: dept.depth === 0 ? 'var(--text-main)' : 'var(--text-main)' }}>{dept.name}</span>
                    </td>
                    <td style={{ padding: '1.1rem 0.75rem', color: 'var(--text-muted)' }}>
                      {dept.parent_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <ChevronRight size={12} color="#00f2fe" />
                          <span>{dept.parent_name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(0, 242, 254, 0.5)', background: 'rgba(0, 242, 254, 0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.1)' }}>
                          Root
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1.1rem 0.75rem', textAlign: 'center' }}>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: '#00f5a0', 
                          background: 'rgba(0, 245, 160, 0.1)', 
                          padding: '4px 10px', 
                          borderRadius: '100px', 
                          border: '1px solid rgba(0, 245, 160, 0.2)' 
                        }}
                      >
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
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(9, 13, 26, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1.5rem'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '480px', 
              backgroundColor: 'var(--bg-main)', 
              border: '1px solid rgba(157, 78, 221, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
                <Network size={20} color="#9d4edd" />
                New Department
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'var(--bg-card-hover)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Notifications */}
            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(0, 245, 160, 0.1)', border: '1px solid rgba(0, 245, 160, 0.2)', borderRadius: '8px', color: '#00f5a0', fontSize: '0.85rem' }}>
                <CheckCircle size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px', color: '#ff3366', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Name *</label>
                <div style={{ position: 'relative' }}>
                  <Network size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    required 
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="e.g. Operations & Fleet Management"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Description</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <textarea 
                    style={{ paddingLeft: '38px', minHeight: '70px', width: '100%', resize: 'vertical' }}
                    placeholder="Describe operational focus and metrics..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Parent Department Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Parent Department</label>
                <div style={{ position: 'relative' }}>
                  <Network size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select 
                    value={parentId} 
                    onChange={(e) => setParentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingLeft: '38px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="udg-spinner" />
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
