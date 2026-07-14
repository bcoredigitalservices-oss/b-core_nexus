import React, { useEffect, useState } from "react";
import { Mail, User as UserIcon, AlertCircle, X, ShieldCheck, Briefcase, Loader2 } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";

interface ProvisionUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data?: any) => void;
  departments?: Department[];
  roles?: Role[];
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function ProvisionUserModal({
  isOpen,
  onClose,
  onSuccess,
  departments: departmentsProp,
  roles: rolesProp,
}: ProvisionUserModalProps) {
  const { token, authFetch } = useAppContext();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Core Identity Form Fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !token) return;

    const loadFormData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        if (departmentsProp && departmentsProp.length > 0) {
          setDepartments(departmentsProp);
        } else {
          const depts = await authFetch("/iam/departments");
          if (depts) setDepartments(depts);
        }

        if (rolesProp && rolesProp.length > 0) {
          setRoles(rolesProp);
          setRoleId(rolesProp[0].id);
        } else {
          const fetchedRoles = await authFetch("/iam/roles");
          if (fetchedRoles && fetchedRoles.length > 0) {
            setRoles(fetchedRoles);
            setRoleId(fetchedRoles[0].id);
          }
        }
      } catch (err: any) {
        console.error("Failed to load provisioning form metadata:", err);
        setErrorMsg("Error loading roles or departments metadata.");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [isOpen, token, authFetch, departmentsProp, rolesProp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !roleId) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      // Points to existing /iam/users/invite route which matches UserInvite schema
      const res = await authFetch("/iam/users/invite", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role_id: roleId,
          designation: null,
          department_id: departmentId || null,
        }),
      });

      onSuccess(res);
      onClose();

      // Clear Form Context States
      setEmail("");
      setFirstName("");
      setLastName("");
      setDepartmentId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to provision workspace operator.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6 animate-fade-in">
      <div className="w-full max-w-[550px] bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-text-muted cursor-pointer hover:text-text-main">
          <X size={16} />
        </button>

        <div className="flex flex-col gap-2 border-b border-color pb-4">
          <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 m-0">
            <UserIcon size={20} className="text-accent-primary" />
            Provision Operator User
          </h3>
          <p className="text-[0.8rem] text-text-muted m-0">Generate a secure activation link for a new user.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider pl-1">Operator Name</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm focus:border-accent-primary outline-none" />
                <input type="text" required placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} className="w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm focus:border-accent-primary outline-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider pl-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={14} className="absolute left-3 text-text-muted" />
                <input type="email" required className="pl-9 w-full rounded-lg border border-color bg-card py-2.5 px-3.5 text-sm focus:border-accent-primary outline-none" placeholder="operator@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider pl-1">Baseline Role</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required className="w-full rounded-lg border border-color bg-card py-2.5 px-3 text-sm focus:border-accent-primary outline-none cursor-pointer">
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider pl-1">Department</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full rounded-lg border border-color bg-card py-2.5 px-3 text-sm focus:border-accent-primary outline-none cursor-pointer">
                  <option value="">-- None / Root --</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full rounded-lg py-3 px-4 font-bold bg-accent-primary text-white hover:brightness-110 cursor-pointer transition shadow-md mt-2" disabled={submitting}>
              {submitting ? "Processing..." : "Generate Invitation"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
