import React, { useState, useEffect } from "react";
import { Shield, X, ChevronDown } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExistingRole {
  id?: string;
  name: string;
  description?: string;
}

export default function CreateRoleModal({ isOpen, onClose, onSuccess }: CreateRoleModalProps) {
  const { authFetch } = useAppContext();
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [existingRoles, setExistingRoles] = useState<ExistingRole[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch existing roles when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchExistingRoles = async () => {
        try {
          const data: any = await authFetch("/iam/roles");
          // Handle both array responses or object-wrapped data layouts
          const rolesList = Array.isArray(data) ? data : data?.roles || [];
          setExistingRoles(rolesList);
        } catch (err) {
          console.error("Failed to load existing roles reference collection:", err);
        }
      };
      fetchExistingRoles();
    }
  }, [isOpen, authFetch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await authFetch("/iam/roles", {
        method: "POST",
        body: JSON.stringify({
          name: roleName.trim(),
          description: description.trim(),
        }),
      });
      
      setRoleName("");
      setDescription("");
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save role configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Automatically pre-fill the description if they click an existing role item
  const handleSelectExisting = (role: ExistingRole) => {
    setRoleName(role.name);
    if (role.description) {
      setDescription(role.description);
    }
    setShowDropdown(false);
  };

  // Filter dropdown dynamically based on user typed queries
  const filteredRoles = existingRoles.filter((r) =>
    r.name.toLowerCase().includes(roleName.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-[500px] shadow-2xl border border-color rounded-2xl bg-[var(--bg-card)]">
        {/* Header */}
        <div className="py-4 px-6 border-b border-color flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield size={18} className="text-accent-blue" />
            <h3 className="text-[1.1rem] font-bold text-text-main">Configure Functional Role</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-main cursor-pointer bg-transparent border-none">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[0.8rem]">
              {errorMsg}
            </div>
          )}

          {/* Role Name Input + Selection Dropdown Container */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[0.75rem] font-bold text-text-muted uppercase tracking-wider">Role Name</label>
            <div className="relative flex items-center">
              <input
                type="text"
                required
                placeholder="Type a new name or select existing..."
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay allows click events to register first
                className="w-full bg-[var(--bg-main)] border border-color rounded-xl px-3 py-2 pr-10 text-text-main text-[0.875rem] focus:outline-none focus:border-accent-blue"
              />
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                className="absolute right-2 p-1 text-text-muted hover:text-text-main bg-transparent border-none cursor-pointer"
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Suggestions Overlay Dropdown Node */}
            {showDropdown && filteredRoles.length > 0 && (
              <ul className="absolute left-0 right-0 top-[100%] mt-1 bg-[var(--bg-card)] border border-color rounded-xl max-h-[160px] overflow-y-auto shadow-xl z-10 p-1 list-none m-0">
                <li className="text-[0.7rem] font-bold text-text-muted px-3 py-1.5 uppercase border-b border-color/45">
                  Existing Platform Roles
                </li>
                {filteredRoles.map((role, idx) => (
                  <li key={role.id || idx}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectExisting(role)}
                      className="w-full text-left px-3 py-2 text-[0.85rem] text-text-main hover:bg-[var(--bg-main)] rounded-lg cursor-pointer bg-transparent border-none transition-colors"
                    >
                      {role.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.75rem] font-bold text-text-muted uppercase tracking-wider">Description</label>
            <textarea
              required
              placeholder="Describe the operational responsibilities mapped to this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-[var(--bg-main)] border border-color rounded-xl px-3 py-2 text-text-main text-[0.875rem] focus:outline-none focus:border-accent-blue resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-2 border-t border-color pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2">
              {loading ? "Saving..." : "Save Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}