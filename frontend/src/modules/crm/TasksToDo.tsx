import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Loader2,
  Edit3,
  Calendar,
  Check,
  CheckSquare,
  Square,
  User as UserIcon,
  HelpCircle,
  Sliders,
  Lock,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import CreateTaskModal from "../users/components/CreateTaskModal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  owner_id: string;
  created_by_id: string | null;
  created_at: string;
}

interface UserItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function TasksToDo() {
  const { token, authFetch, currentUser } = useAppContext();

  const canReadTasks =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("tasks:read") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  const canCreateTasks =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("tasks:create") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  const canWriteTasks =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("tasks:write") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  const canReadUsers =
    currentUser?.permissions?.includes("*:*") ||
    currentUser?.permissions?.includes("user:read") ||
    currentUser?.permissions?.includes("iam:manage") ||
    currentUser?.functional_roles?.includes("admin") ||
    currentUser?.functional_roles?.includes("manager");

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");

  // Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadTasksAndUsers = async () => {
    if (!canReadTasks) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const promises = [authFetch("/tasks")];
      if (canReadUsers) {
        promises.push(authFetch("/auth/users"));
      }

      const results = await Promise.all(promises);
      const tasksData = results[0];
      const usersData = canReadUsers ? results[1] : null;

      if (tasksData) {
        setTasks(tasksData);
      }
      if (usersData) {
        setUsers(usersData);
      }
    } catch (err) {
      console.error("Failed to load tasks database:", err);
      setErrorMsg("Failed to load operational tasks checklist database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTasksAndUsers();
    }
  }, [token, canReadTasks, canReadUsers]);

  // Filters Reset
  const handleClearFilters = () => {
    setSearchTitle("");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
  };

  // Quick toggle task completed
  const handleToggleTaskCompleted = async (task: Task) => {
    setActionLoadingId(task.id);
    setSuccessMsg("");
    setErrorMsg("");
    const newStatus = task.status === "completed" ? "in_progress" : "completed";
    try {
      await authFetch(`/tasks/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      setSuccessMsg(`Task status updated to ${newStatus.replace("_", " ")}.`);
      // Reload silently
      const tasksData = await authFetch("/tasks");
      if (tasksData) {
        setTasks(tasksData);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update task status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditClick = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  // Helpers
  const getAssigneeName = (ownerId: string) => {
    const matched = users.find((u) => u.id === ownerId);
    if (!matched) return "Unassigned";
    return matched.first_name
      ? `${matched.first_name} ${matched.last_name || ""}`
      : matched.email;
  };

  const getInitials = (ownerId: string) => {
    const matched = users.find((u) => u.id === ownerId);
    if (!matched) return "?";
    if (matched.first_name) {
      return `${matched.first_name[0]}${matched.last_name ? matched.last_name[0] : ""}`.toUpperCase();
    }
    return matched.email[0].toUpperCase();
  };

  // Filter computation
  const filteredTasks = tasks.filter((tsk) => {
    if (searchTitle.trim()) {
      const q = searchTitle.trim().toLowerCase();
      const matchTitle = tsk.title.toLowerCase().includes(q);
      const matchDesc = tsk.description
        ? tsk.description.toLowerCase().includes(q)
        : false;
      if (!matchTitle && !matchDesc) return false;
    }
    if (filterStatus !== "all" && tsk.status !== filterStatus) return false;
    if (filterPriority !== "all" && tsk.priority !== filterPriority)
      return false;
    if (filterAssignee !== "all" && tsk.owner_id !== filterAssignee)
      return false;
    return true;
  });

  // Metric summaries
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const inProgressCount = tasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
        <Loader2 className="animate-spin text-accent-primary" size={32} />
        <span className="font-semibold text-sm">Loading task boards...</span>
      </div>
    );
  }

  if (!canReadTasks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-text-muted gap-4">
        <Lock size={48} className="text-red-400 opacity-60 animate-pulse" />
        <span className="font-bold text-lg text-text-main">Access Denied</span>
        <span className="text-sm">
          You do not have clearance to view operational tasks. (Requires
          tasks:read permission)
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1250px] mx-auto p-4 relative animate-[fadeIn_0.3s_ease]">
      {/* ── Governance Header & Banner ── */}
      <div className="bg-gradient-to-r from-[#0F2E59] to-[#1a3f73] border border-[var(--border-color)] rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center gap-4.5 z-10">
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center shadow-lg">
            <ClipboardList size={24} className="text-[#C5A85C]" />
          </div>
          <div>
            <h1 className="text-[1.5rem] font-black text-white font-display mb-1 flex items-center gap-2">
              Operational Task Governance
            </h1>
            <p className="text-white/80 text-[0.82rem] font-medium max-w-[550px] leading-relaxed">
              Create, schedule, and assign core system checklists and tasks to
              operator profiles, monitoring compliance in real time.
            </p>
          </div>
        </div>

        {canCreateTasks && (
          <button
            onClick={handleCreateClick}
            className="bg-[#C5A85C] text-[#0F2E59] hover:brightness-110 font-bold flex items-center gap-2 py-3 px-5 rounded-xl border border-transparent shadow-lg shadow-[#C5A85C]/10 transition-all duration-200 z-10 cursor-pointer text-sm"
          >
            <Plus size={16} />
            Create Task
          </button>
        )}
      </div>

      {/* Success/Errors */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[#00f5a0] text-[0.88rem] shadow-sm">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[0.88rem] shadow-sm">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Dynamic Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tasks */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
              Total Tasks
            </span>
            <span className="text-2xl font-black text-text-main leading-none">
              {totalCount}
            </span>
            <span className="text-[10px] text-text-muted mt-1 font-semibold">
              Active in ledger
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent-primary/5 border border-accent-primary/10 flex items-center justify-center text-accent-primary">
            <ClipboardList size={18} />
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
              Pending
            </span>
            <span className="text-2xl font-black text-text-main leading-none">
              {pendingCount}
            </span>
            <span className="text-[10px] text-amber-500 font-semibold mt-1">
              Pending Start
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock size={18} />
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
              In Progress
            </span>
            <span className="text-2xl font-black text-text-main leading-none">
              {inProgressCount}
            </span>
            <span className="text-[10px] text-sky-500 font-semibold mt-1">
              Being Executed
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-500/5 border border-sky-500/10 flex items-center justify-center text-sky-500">
            <SlidersHorizontal size={18} />
          </div>
        </div>

        {/* Completed */}
        <div className="glass-panel p-5 flex items-center justify-between bg-card border border-color rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
              Completed
            </span>
            <span className="text-2xl font-black text-text-main leading-none">
              {completedCount}
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1">
              Done & Audited
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="glass-panel p-5 bg-card border border-color rounded-xl shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-color text-text-main text-[0.8rem] font-bold uppercase tracking-wider">
          <SlidersHorizontal size={14} className="text-accent-primary" />
          Filter Operational Tasks
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">
              Search Query
            </label>
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                placeholder="Search title, details..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="pl-9 w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.7rem] text-text-muted font-bold uppercase tracking-wider mb-1.5">
              Assignee
            </label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-color bg-card outline-none focus:border-accent-primary cursor-pointer"
            >
              <option value="all">All Operators</option>
              {users.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.first_name
                    ? `${op.first_name} ${op.last_name || ""}`
                    : op.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchTitle ||
          filterStatus !== "all" ||
          filterPriority !== "all" ||
          filterAssignee !== "all") && (
          <div className="flex justify-end mt-1">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-card-hover border border-color text-text-muted text-[0.75rem] font-bold rounded-lg cursor-pointer transition hover:text-text-main"
            >
              <RefreshCw size={12} />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* ── Tasks List Table ── */}
      <div className="glass-panel p-0 overflow-hidden bg-card border border-color rounded-2xl shadow-sm">
        <div className="py-5 px-7 border-b border-color flex items-center justify-between bg-card-hover">
          <span className="text-[0.8rem] font-bold text-text-main tracking-wider uppercase">
            Tasks Roster
          </span>
          <span className="text-[0.7rem] text-text-muted font-bold bg-card py-1 px-3 rounded-full border border-color">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}{" "}
            shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-color text-text-muted text-[0.7rem] uppercase tracking-wider bg-card-hover font-bold">
                <th className="py-4 px-6 w-[60px] text-center">Done</th>
                <th className="py-4 px-4 w-[280px]">Task Summary</th>
                <th className="py-4 px-4 w-[120px]">Status</th>
                <th className="py-4 px-4 w-[120px]">Priority</th>
                <th className="py-4 px-4 w-[200px]">Assignee</th>
                <th className="py-4 px-4 w-[150px]">Due Date</th>
                <th className="py-4 px-6 text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Sliders
                        size={28}
                        className="text-text-muted opacity-50"
                      />
                      <span className="text-sm font-semibold">
                        No operational tasks matches your criteria.
                      </span>
                      {(searchTitle ||
                        filterStatus !== "all" ||
                        filterPriority !== "all" ||
                        filterAssignee !== "all") && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-1 py-1.5 px-4 bg-accent-primary text-white font-semibold rounded-lg text-xs cursor-pointer shadow hover:brightness-110"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((tsk) => {
                  const isCompleted = tsk.status === "completed";
                  return (
                    <tr
                      key={tsk.id}
                      className={`border-b border-color transition-colors duration-150 hover:bg-card-hover/30 ${isCompleted ? "opacity-80" : ""}`}
                    >
                      {/* Done quick-toggle */}
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTaskCompleted(tsk)}
                          disabled={
                            actionLoadingId === tsk.id || !canWriteTasks
                          }
                          className="text-text-muted hover:text-accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center p-1 rounded-md hover:bg-card-hover"
                          title={
                            !canWriteTasks
                              ? "Requires task writing clearance"
                              : isCompleted
                                ? "Mark in progress"
                                : "Mark completed"
                          }
                        >
                          {actionLoadingId === tsk.id ? (
                            <Loader2
                              className="animate-spin text-accent-primary"
                              size={16}
                            />
                          ) : isCompleted ? (
                            <CheckSquare
                              className="text-emerald-500"
                              size={18}
                            />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-text-main text-[0.88rem] ${isCompleted ? "line-through text-text-muted" : ""}`}
                          >
                            {tsk.title}
                          </span>
                          {tsk.description && (
                            <span className="text-[11px] text-text-muted line-clamp-1 mt-0.5 font-normal">
                              {tsk.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {tsk.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15 uppercase tracking-wide">
                            Completed
                          </span>
                        )}
                        {tsk.status === "in_progress" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/15 uppercase tracking-wide">
                            In Progress
                          </span>
                        )}
                        {tsk.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/15 uppercase tracking-wide animate-pulse">
                            Pending
                          </span>
                        )}
                        {tsk.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/15 uppercase tracking-wide">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-4">
                        {tsk.priority === "high" && (
                          <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wide">
                            High
                          </span>
                        )}
                        {tsk.priority === "medium" && (
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-wide">
                            Medium
                          </span>
                        )}
                        {tsk.priority === "low" && (
                          <span className="text-[10px] font-medium text-text-muted bg-card px-2 py-0.5 rounded border border-color uppercase tracking-wide">
                            Low
                          </span>
                        )}
                      </td>

                      {/* Assignee initials card */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-bold text-[9px] flex items-center justify-center shadow-sm shrink-0">
                            {getInitials(tsk.owner_id)}
                          </div>
                          <span
                            className="font-medium text-text-main text-[0.82rem] truncate max-w-[140px]"
                            title={getAssigneeName(tsk.owner_id)}
                          >
                            {getAssigneeName(tsk.owner_id)}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4 font-medium text-[0.82rem] text-text-muted flex items-center gap-1.5 mt-1.5">
                        <Calendar size={13} className="opacity-60" />
                        {tsk.due_date ? (
                          new Date(tsk.due_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        ) : (
                          <em className="opacity-40">No due date</em>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {canWriteTasks && (
                          <button
                            type="button"
                            onClick={() => handleEditClick(tsk)}
                            className="p-1.5 bg-card hover:bg-card-hover border border-color text-text-main text-[0.75rem] font-bold rounded-lg cursor-pointer transition shadow-sm inline-flex items-center justify-center"
                            title="Edit Task Details"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reusable Task Form Modal ── */}
      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={() => {
          setTaskModalOpen(false);
          loadTasksAndUsers();
        }}
        task={selectedTask}
      />
    </div>
  );
}
