import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useAppContext } from "../../../context/AppContext";

interface UserItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedUserId?: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    owner_id: string;
  } | null;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedUserId,
  task,
}: CreateTaskModalProps) {
  const { token, authFetch } = useAppContext();

  // Data states
  const [operators, setOperators] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("pending");
    setPriority("medium");
    setDueDate("");
    setOwnerId(preselectedUserId || "");
    setErrorMsg("");
  };

  // Load operators if no preselected user or if we need to show the selector
  const loadOperators = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const usersData = await authFetch("/auth/users");
      if (usersData) {
        setOperators(usersData);
      }
    } catch (err) {
      console.error("Failed to load operators list:", err);
      setErrorMsg("Failed to load operators directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      if (!preselectedUserId) {
        loadOperators();
      }

      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setStatus(task.status);
        setPriority(task.priority);
        setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
        setOwnerId(task.owner_id);
      } else {
        resetForm();
      }
    }
  }, [isOpen, token, task, preselectedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Task title is required.");
      return;
    }
    if (!ownerId) {
      setErrorMsg("Please select an assignee.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      owner_id: ownerId,
    };

    try {
      if (task) {
        // Edit flow
        await authFetch(`/tasks/${task.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // Create flow
        await authFetch("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error("Failed to save task:", err);
      setErrorMsg(err.message || "Failed to save task details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-[999] p-4">
      <div className="glass-panel w-full max-w-[500px] bg-card border border-color rounded-2xl p-6 shadow-xl relative animate-[float-in_0.25s_ease] flex flex-col gap-5">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-5 right-5 bg-card-hover border border-color text-text-muted cursor-pointer p-1.5 rounded-full flex items-center justify-center transition hover:text-text-main hover:border-accent-primary"
        >
          <X size={14} />
        </button>

        {/* Modal Header */}
        <div className="border-b border-color pb-3">
          <h3 className="text-md font-bold text-text-main flex items-center gap-2 m-0">
            <ClipboardList size={18} className="text-accent-primary" />
            {task ? "Edit Task Assignment" : "Assign New Task"}
          </h3>
          <span className="text-[10px] text-text-muted mt-1 block">
            {task
              ? "Modify existing task details and tracking"
              : "Create and assign operational task logs"}
          </span>
        </div>

        {/* Errors */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center py-12 text-text-muted gap-3">
            <Loader2 className="animate-spin text-accent-primary" size={24} />
            <span className="text-xs">Loading context parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Task Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Audit ledger logs or review quotation #104"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full text-xs py-2.5 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Enter details, scopes, or references..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={submitting}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Assignee *
                </label>
                {preselectedUserId ? (
                  <div className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card-hover text-text-muted font-medium cursor-not-allowed select-none">
                    Locked to target Operator
                  </div>
                ) : (
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    disabled={submitting}
                    required
                    className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
                  >
                    <option value="">-- Choose Operator --</option>
                    {operators.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.first_name
                          ? `${op.first_name} ${op.last_name || ""} (${op.email})`
                          : op.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Due Date
                </label>
                <div className="relative flex items-center">
                  <Calendar
                    size={12}
                    className="absolute left-3 text-text-muted pointer-events-none"
                  />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={submitting}
                    className="pl-9 w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer h-[34px]"
                  />
                </div>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3 border-t border-color pt-4 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full rounded-lg py-2 px-4 font-semibold border border-color bg-card text-text-muted hover:bg-card-hover hover:text-text-main transition cursor-pointer text-xs h-[36px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-2 px-4 font-semibold border border-transparent bg-accent-primary text-white shadow shadow-accent-primary/10 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5 text-xs h-[36px]"
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                {task ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
