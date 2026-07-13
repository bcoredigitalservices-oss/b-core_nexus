import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Users, 
  Search, 
  Plus, 
  Sliders, 
  Edit2, 
  Trash2, 
  Loader2, 
  Mail, 
  Phone as PhoneIcon, 
  Briefcase, 
  Folder,
  X,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";
import { useAppContext } from "../../../context/AppContext";
import { useContacts } from "../hooks/useContacts";
import { Contact } from "../types/types";

export default function ContactsPage() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();
  
  const {
    contacts,
    setContacts,
    loading,
    errorMsg,
    setErrorMsg,
    addContactLocally,
    removeContactLocally,
  } = useContacts();
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog States
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");

  // Unique departments & roles for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c: any) => {
      if (c.department) set.add(c.department);
    });
    return Array.from(set);
  }, [contacts]);

  const jobTitles = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c: any) => {
      if (c.job_title) set.add(c.job_title);
    });
    return Array.from(set);
  }, [contacts]);

  // Open creation modal
  const handleOpenCreate = () => {
    setEditContact(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setDepartment("");
    setModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (contact: Contact & { job_title?: string; department?: string }) => {
    setEditContact(contact);
    setFirstName(contact.first_name || "");
    setLastName(contact.last_name || "");
    setEmail(contact.email || "");
    setPhone(contact.phone || "");
    setJobTitle(contact.job_title || "");
    setDepartment(contact.department || "");
    setModalOpen(true);
  };

  // Save Contact (Create or Update)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg("First name is required.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        department: department.trim() || null,
      };

      if (editContact) {
        // Update contact
        const updated = await authFetch(`/crm/contacts/${editContact.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setContacts((prev) => prev.map((c) => (c.id === editContact.id ? { ...c, ...updated } : c)));
        setSuccessMsg("Contact details updated successfully.");
      } else {
        // Create contact
        const created = await authFetch("/crm/contacts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        addContactLocally(created);
        setSuccessMsg("Contact registered successfully.");
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save contact profile.");
    } finally {
      setSaving(false);
    }
  };

  // Soft Delete Contact
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setErrorMsg("");
    try {
      await authFetch(`/crm/contacts/${deleteId}`, {
        method: "DELETE",
      });
      removeContactLocally(deleteId);
      setSuccessMsg("Contact record deactivated successfully.");
      setDeleteId(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deactivate contact.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtering Logic
  const filteredContacts = useMemo(() => {
    return contacts.filter((c: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${c.first_name} ${c.last_name || ""}`.toLowerCase().includes(q);
        const matchesEmail = (c.email || "").toLowerCase().includes(q);
        const matchesPhone = (c.phone || "").toLowerCase().includes(q);
        const matchesRole = (c.job_title || "").toLowerCase().includes(q);
        const matchesDept = (c.department || "").toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesRole && !matchesDept) return false;
      }
      
      // 2. Department
      if (deptFilter !== "all" && c.department !== deptFilter) return false;

      // 3. Job Title
      if (roleFilter !== "all" && c.job_title !== roleFilter) return false;

      return true;
    });
  }, [contacts, searchQuery, deptFilter, roleFilter]);

  // Pagination bounds
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / itemsPerPage));

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto animate-[fadeIn_0.2s_ease]">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-color pb-4 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 bg-emerald-600/10 text-emerald-600 flex items-center justify-center rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--text-main)] m-0">
                Contacts Directory
              </h1>
              <p className="text-[var(--text-muted)] text-xs mt-1 m-0">
                Manage individuals, job roles, departments, and communication details linked to Lead records.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-xs hover:brightness-110 shadow-sm cursor-pointer transition select-none"
          >
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {/* Banner Messages */}
        {successMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-semibold animate-[fadeIn_0.2s_ease]">
            <CheckCircle size={15} />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-semibold animate-[fadeIn_0.2s_ease]">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-card border border-color rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 text-[var(--text-muted)]" size={14} />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] transition"
              />
            </div>

            {/* Department Filter */}
            <div className="relative flex items-center">
              <Folder className="absolute left-3 text-[var(--text-muted)]" size={14} />
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="relative flex items-center">
              <Briefcase className="absolute left-3 text-[var(--text-muted)]" size={14} />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-color bg-main py-2 pl-9 pr-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer appearance-none transition"
              >
                <option value="all">All Job Titles</option>
                {jobTitles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 bg-card border border-color rounded-2xl">
            <Loader2 className="animate-spin text-accent-primary" size={32} />
            <span className="text-xs text-[var(--text-muted)]">Retrieving Contacts Directory…</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 bg-card border border-color rounded-2xl">
            <div className="h-12 w-12 bg-main border border-color rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              <Sliders size={20} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">No contacts matched</h3>
              <p className="text-xs text-[var(--text-muted)] mt-2 m-0 max-w-[280px] leading-relaxed">
                Adjust search queries or reset dropdown selection rules.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Contacts Table */}
            <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-color bg-main/50">
                      <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Contact Name
                      </th>
                      <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Department
                      </th>
                      <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Email & Phone
                      </th>
                      <th className="py-3 px-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-color">
                    {paginatedContacts.map((c: any) => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-main/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/workspace/crm/contacts/${c.id}`)}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center text-xs font-black">
                              {c.first_name[0]}{c.last_name ? c.last_name[0] : ""}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[var(--text-main)] hover:underline">
                                <Link 
                                  to={`/workspace/crm/contacts/${c.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {c.first_name} {c.last_name || ""}
                                </Link>
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5 hover:underline">
                                <Link 
                                  to={`/workspace/crm/contacts/${c.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  ID: {c.id.substring(0, 8)}...
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                          {c.job_title || <span className="text-[var(--text-muted)] font-normal italic">Unassigned</span>}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[var(--text-main)] font-semibold">
                          {c.department || <span className="text-[var(--text-muted)] font-normal italic">Unassigned</span>}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1">
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-accent-primary transition cursor-pointer">
                                <Mail size={12} />
                                <span>{c.email}</span>
                              </div>
                            )}
                            {c.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                <PhoneIcon size={12} />
                                <span>{c.phone}</span>
                              </div>
                            )}
                            {!c.email && !c.phone && (
                              <span className="text-[10px] text-[var(--text-muted)] italic">No parameters logs</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(c);
                              }}
                              className="p-1.5 hover:bg-main border border-transparent hover:border-color text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg cursor-pointer transition"
                              title="Edit contact details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(c.id);
                              }}
                              className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-500 rounded-lg cursor-pointer transition"
                              title="Deactivate contact"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-color pt-4 px-1 mt-2">
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="py-1 px-3 border border-color bg-card rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="py-1 px-3 border border-color bg-card rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Create/Edit Contact Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
            <div className="bg-card border border-color w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-color bg-main/30">
                <h2 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                  {editContact ? "Modify Contact Details" : "Register New Contact"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveContact} className="p-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* First Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Sales Manager"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                  {/* Department */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Sales"
                      className="w-full rounded-lg border border-color bg-main py-2 px-3 text-xs outline-none focus:border-accent-primary text-[var(--text-main)]"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 py-2 px-5 bg-accent-primary text-white font-bold text-xs rounded-xl hover:brightness-110 shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Details"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-[fadeIn_0.2s_ease]">
            <div className="bg-card border border-color w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.25s_ease-out]">
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-rose-500/10 text-rose-500 flex items-center justify-center rounded-xl shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
                      Deactivate Contact Record?
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed m-0">
                      This action will soft-delete/deactivate the contact profile from the active directory. They will no longer appear in linked lists.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-color pt-4 mt-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="py-2 px-4 border border-color rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-main cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex items-center gap-1.5 py-2 px-5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-sm cursor-pointer disabled:opacity-50 transition"
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Deactivating...
                      </>
                    ) : (
                      "Deactivate"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </WorkspaceLayout>
  );
}
