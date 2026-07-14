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
import { useAppContext } from "../../../context/AppContext";
import CreateTaskModal from "../../users/components/CreateTaskModal";
import WorkspaceLayout from "../../users/components/WorkspaceLayout";
import { CRM_SIDEBAR } from "../crmSidebarConfig";

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
  const [viewMode, setViewMode] = useState<"all" | "my">("all");

  const loadTasksAndUsers = async () => {
    if (!canReadTasks) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      const tasksUrl = viewMode === "my" ? "/tasks/my" : "/tasks";
      const [tasksRes, usersRes] = await Promise.all([
        authFetch(tasksUrl).catch(() => []) as Promise<Task[]>,
        canReadUsers
          ? (authFetch("/auth/users").catch(() => []) as Promise<UserItem[]>)
          : Promise.resolve([]),
      ]);
      setTasks(tasksRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load tasks database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasksAndUsers();
  }, [token, viewMode]);

  // Actions
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    if (!canWriteTasks) {
      setErrorMsg("Forbidden: You do not have clearance to modify tasks.");
      return;
    }
    setActionLoadingId(taskId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authFetch(`/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg("Task status updated successfully.");
      loadTasksAndUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update task.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEdit = (task: Task) => {
    if (!canWriteTasks) {
      setErrorMsg("Forbidden: You do not have clearance to edit tasks.");
      return;
    }
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleCreateNew = () => {
    if (!canCreateTasks) {
      setErrorMsg("Forbidden: You do not have clearance to schedule new tasks.");
      return;
    }
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  // Helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Pending";
    }
  };

  const getOwnerLabel = (ownerId: string) => {
    const owner = users.find((u) => u.id === ownerId);
    if (!owner) return "Unassigned";
    return `${owner.first_name || ""} ${owner.last_name || ""}`.trim() || owner.email;
  };

  const filteredTasks = tasks.filter((tsk) => {
    if (searchTitle.trim()) {
      const matchTitle = tsk.title
        .toLowerCase()
        .includes(searchTitle.toLowerCase());
      const matchDesc = tsk.description
        ? tsk.description.toLowerCase().includes(searchTitle.toLowerCase())
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
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted gap-4">
          <Loader2 className="animate-spin text-accent-primary" size={32} />
          <span className="font-semibold text-sm">Loading task boards...</span>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canReadTasks) {
    return (
      <WorkspaceLayout config={CRM_SIDEBAR}>
        <div className="flex flex-col items-center justify-center min-h-[450px] text-text-muted gap-4">
          <Lock size={48} className="text-red-400 opacity-60 animate-pulse" />
          <span className="font-bold text-lg text-text-main">Access Denied</span>
          <span className="text-sm">
            You do not have clearance to view operational tasks. (Requires
            tasks:read permission)
          </span>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div className="flex flex-col gap-8 w-full max-w-[1250px] mx-auto p-4 relative animate-[fadeIn_0.3s_ease]">
        {/* ── Governance Header & Banner ── */}
        <div className="bg-gradient-to-r from-[#0F2E59] to-[#1a3f73] border border-[var(--border-color)] rounded-2xl py-7 px-8 flex justify-between items-center flex-wrap gap-6 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="flex items-center gap-4.5 z-10">
            <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center shadow-lg">
              <ClipboardList size={24} className="text-[#C5A85C]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white m-0 tracking-tight">
                Governance Operations Log
              </h2>
              <p className="text-xs text-white/75 mt-1 m-0 max-w-[450px]">
                Monitor tasks, assign operational logs, and ensure administrative audits align with clearances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={loadTasksAndUsers}
              className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white cursor-pointer transition flex items-center justify-center"
              title="Refresh Task Board"
            >
              <RefreshCw size={15} />
            </button>

            {canCreateTasks && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-[#C5A85C] to-[#E3C57C] hover:brightness-110 text-[#0F2E59] font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition"
              >
                <Plus size={14} /> Schedule Task
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="flex items-center gap-2.5 py-3.5 px-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs animate-[fadeIn_0.2s_ease]">
            <AlertCircle size={16} />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2.5 py-3.5 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs animate-[fadeIn_0.2s_ease]">
            <CheckCircle2 size={16} />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* ── Metric Summary Tiles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-color rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Total Board Tasks
            </span>
            <div className="flex items-baseline justify-between mt-2.5">
              <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                {totalCount}
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                100%
              </span>
            </div>
          </div>

          <div className="bg-card border border-color rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Pending Clearances
            </span>
            <div className="flex items-baseline justify-between mt-2.5">
              <span className="text-2xl font-black text-rose-500 tracking-tight">
                {pendingCount}
              </span>
              <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                {totalCount ? Math.round((pendingCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-card border border-color rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              In Development
            </span>
            <div className="flex items-baseline justify-between mt-2.5">
              <span className="text-2xl font-black text-amber-500 tracking-tight">
                {inProgressCount}
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                {totalCount ? Math.round((inProgressCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="bg-card border border-color rounded-2xl p-5 shadow-sm">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Signed & Approved
            </span>
            <div className="flex items-baseline justify-between mt-2.5">
              <span className="text-2xl font-black text-emerald-500 tracking-tight">
                {completedCount}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                {totalCount ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Filter Controls ── */}
        <div className="bg-card border border-color rounded-2xl p-4.5 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative w-full max-w-[320px] flex items-center">
              <Search size={14} className="absolute left-3 text-[var(--text-muted)] pointer-events-none" />
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full bg-main border border-color rounded-xl py-2 pl-9 pr-4 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-color bg-main rounded-xl p-0.5 select-none gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  viewMode === "all"
                    ? "bg-accent-primary text-white"
                    : "text-[var(--text-muted)] hover:bg-card-hover"
                }`}
              >
                All Tasks
              </button>
              <button
                type="button"
                onClick={() => setViewMode("my")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                  viewMode === "my"
                    ? "bg-accent-primary text-white"
                    : "text-[var(--text-muted)] hover:bg-card-hover"
                }`}
              >
                Assigned to Me
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center gap-2 bg-main border border-color rounded-xl py-1 px-3.5 text-xs text-[var(--text-muted)]">
              <SlidersHorizontal size={13} />
              <span className="font-semibold select-none">Quick Filters</span>
            </div>

            {/* Status Select */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-card border border-color rounded-xl py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Select */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-card border border-color rounded-xl py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Select */}
            {canReadUsers && (
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="bg-card border border-color rounded-xl py-2 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] font-semibold cursor-pointer max-w-[150px]"
              >
                <option value="all">All Assignees</option>
                {users.map((usr) => (
                  <option key={usr.id} value={usr.id}>
                    {usr.first_name ? `${usr.first_name} ${usr.last_name || ""}`.trim() : usr.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Operational Grid Table ── */}
        <div className="bg-card border border-color rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-color bg-main/40 select-none">
                <th className="py-3 px-4 font-bold text-[var(--text-muted)] w-12 text-center">Status</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Task Title</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)] w-24 text-center">Priority</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Due Date</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Owner</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)] w-20 text-center">Clearance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-color">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] font-medium">
                    No active tasks match current parameters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isDone = task.status === "completed";
                  const isChecking = actionLoadingId === task.id;

                  return (
                    <tr key={task.id} className={`hover:bg-main/20 transition-colors ${isDone ? "opacity-75" : ""}`}>
                      <td className="py-4 px-4 text-center">
                        <button
                          disabled={!canWriteTasks || isChecking}
                          onClick={() => handleUpdateStatus(task.id, isDone ? "pending" : "completed")}
                          className="text-[var(--text-muted)] hover:text-accent-primary transition cursor-pointer disabled:opacity-50 inline-flex items-center"
                        >
                          {isChecking ? (
                            <Loader2 className="animate-spin text-accent-primary" size={16} />
                          ) : isDone ? (
                            <CheckSquare className="text-emerald-500" size={16} />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-bold text-[var(--text-main)] ${isDone ? "line-through text-[var(--text-muted)] font-medium" : ""}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[10px] text-[var(--text-muted)] font-medium truncate max-w-[320px]">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-[var(--text-muted)] font-medium">
                        {task.due_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="opacity-40 italic">No Deadline</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-semibold text-[var(--text-main)]">
                        {getOwnerLabel(task.owner_id)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(task)}
                            disabled={!canWriteTasks}
                            className="p-1.5 border border-color rounded-lg bg-card hover:bg-main text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer disabled:opacity-50"
                            title="Edit Parameters"
                          >
                            <Edit3 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
    </WorkspaceLayout>
  );
}
