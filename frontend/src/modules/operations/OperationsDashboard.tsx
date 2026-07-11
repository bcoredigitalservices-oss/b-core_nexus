import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Layers,
  Briefcase,
  CheckSquare,
  Clock,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  FolderKanban,
  ClipboardList,
  CalendarDays,
} from "lucide-react";

import { useAppContext } from "../../context/AppContext";

// ─── Sidebar Config ────────────────────────────────────────────────────────────
const OPERATIONS_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: "operations",
  workspaceName: "Operations",
  accentColor: "#06b6d4", // Vibrant Operations Cyan
  icon: <Activity size={18} />,
  navItems: [
    { label: "Operations Overview", subPath: "", icon: <Layers size={15} /> },
    {
      label: "Active Projects",
      subPath: "projects",
      icon: <Briefcase size={15} />,
    },
    { label: "My Tasks", subPath: "tasks", icon: <CheckSquare size={15} /> },
    { label: "Timesheets", subPath: "timesheets", icon: <Clock size={15} /> },
  ],
};

interface Project {
  id: string;
  project_name: string;
  customer_id: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  start_date: string;
  target_end_date: string;
}

interface Task {
  id: string;
  project_id: string;
  task_title: string;
  assigned_user_id: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export default function OperationsDashboard() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Metrics
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [tasksOverdueCount, setTasksOverdueCount] = useState(0);
  const [upcomingDeadlinesCount, setUpcomingDeadlinesCount] = useState(0);

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/operations`;

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("bcore_token");

      // Fetch projects and tasks in parallel
      const [projRes, taskRes] = await Promise.all([
        fetch(`${API_BASE}/projects?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/tasks?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!projRes.ok || !taskRes.ok) {
        if (projRes.status === 403 || taskRes.status === 403) {
          throw new Error(
            "Access Denied: You do not have permission to view the Operations Workspace.",
          );
        }
        throw new Error("Failed to retrieve Operations dashboard statistics.");
      }

      const projData = await projRes.json();
      const taskData = await taskRes.json();

      const projectsList: Project[] = projData.items || [];
      const tasksList: Task[] = taskData.items || [];

      setProjects(projectsList);
      setTasks(tasksList);

      // Compute Dashboard Metrics
      // 1. Active Projects Count
      const activeProj = projectsList.filter(
        (p) => p.status === "ACTIVE",
      ).length;
      setActiveProjectsCount(activeProj);

      // 2. Tasks Overdue/Outstanding (non-DONE tasks, especially high/urgent priority)
      const overdueTasks = tasksList.filter(
        (t) =>
          t.status !== "DONE" &&
          (t.priority === "URGENT" || t.priority === "HIGH"),
      ).length;
      setTasksOverdueCount(overdueTasks);

      // 3. Upcoming Deadlines (Projects target date within next 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const upcoming = projectsList.filter((p) => {
        if (p.status === "COMPLETED") return false;
        const targetDate = new Date(p.target_end_date);
        return targetDate >= today && targetDate <= thirtyDaysFromNow;
      }).length;
      setUpcomingDeadlinesCount(upcoming);
    } catch (err: any) {
      setErrorMsg(
        err.message || "An error occurred while fetching operations data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div
      style={{
        padding: "2rem",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        background: "var(--bg-main)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          width: "100%",
        }}
      >
        {/* Header Block */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "var(--text-main)",
                fontFamily: "var(--font-display)",
              }}
            >
              Project & Service Operations
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                marginTop: "0.2rem",
              }}
            >
              Operations control center. Coordinate project timelines, task
              prioritization, and operational milestones.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              height: "38px",
              padding: "0 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw
              size={14}
              className={loading ? "spin" : ""}
              style={{
                animation: loading ? "spin 1.5s linear infinite" : "none",
              }}
            />
            Sync Dashboard
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,51,102,0.1)",
              border: "1px solid rgba(255,51,102,0.25)",
              color: "#ff3366",
              padding: "1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Glassmorphic Metric Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {/* Card 1: Active Projects */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.5rem",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.2)",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Active Projects
                </p>
                <h3
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {loading ? "..." : activeProjectsCount}
                </h3>
              </div>
              <div
                style={{
                  background: "rgba(6, 182, 212, 0.1)",
                  padding: "10px",
                  borderRadius: "12px",
                  color: "#06b6d4",
                  border: "1px solid rgba(6, 182, 212, 0.15)",
                }}
              >
                <FolderKanban size={20} />
              </div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                color: "#10b981",
              }}
            >
              <TrendingUp size={12} />
              <span>In production pipeline</span>
            </div>
          </div>

          {/* Card 2: Tasks Overdue */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.5rem",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.2)",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tasks Overdue
                </p>
                <h3
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {loading ? "..." : tasksOverdueCount}
                </h3>
              </div>
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "10px",
                  borderRadius: "12px",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                }}
              >
                <ClipboardList size={20} />
              </div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <span>High/Urgent incomplete priority</span>
            </div>
          </div>

          {/* Card 3: Upcoming Deadlines */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.5rem",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 32px 0 rgba(0,0,0,0.2)",
              backdropFilter: "blur(8px)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Upcoming Deadlines
                </p>
                <h3
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 800,
                    color: "var(--text-main)",
                    marginTop: "0.5rem",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {loading ? "..." : upcomingDeadlinesCount}
                </h3>
              </div>
              <div
                style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  padding: "10px",
                  borderRadius: "12px",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.15)",
                }}
              >
                <CalendarDays size={20} />
              </div>
            </div>
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.75rem",
                color: "#f59e0b",
              }}
            >
              <span>Targets due within 30 days</span>
            </div>
          </div>
        </div>

        {/* Projects Roster & Tasks Overview split panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
            width: "100%",
          }}
        >
          {/* Projects List Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Corporate Projects
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  marginTop: "0.1rem",
                }}
              >
                Operational milestones and timeline progress.
              </p>
            </div>

            <div
              style={{
                overflowX: "auto",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      color: "var(--text-muted)",
                      background: "var(--bg-card)",
                      fontWeight: 600,
                    }}
                  >
                    <th style={{ padding: "0.75rem" }}>Project Name</th>
                    <th style={{ padding: "0.75rem" }}>Target Date</th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        Querying projects...
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        No projects defined.
                      </td>
                    </tr>
                  ) : (
                    projects.slice(0, 5).map((proj) => {
                      let statusColor = "var(--text-muted)";
                      let statusBg = "rgba(148, 163, 184, 0.12)";
                      if (proj.status === "ACTIVE") {
                        statusColor = "#06b6d4";
                        statusBg = "rgba(6, 182, 212, 0.12)";
                      } else if (proj.status === "COMPLETED") {
                        statusColor = "#10b981";
                        statusBg = "rgba(16, 185, 129, 0.12)";
                      } else if (proj.status === "ON_HOLD") {
                        statusColor = "#f59e0b";
                        statusBg = "rgba(245, 158, 11, 0.12)";
                      }

                      return (
                        <tr
                          key={proj.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.75rem",
                              fontWeight: 700,
                              color: "var(--text-main)",
                            }}
                          >
                            {proj.project_name}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {proj.target_end_date}
                          </td>
                          <td
                            style={{ padding: "0.75rem", textAlign: "center" }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background: statusBg,
                                color: statusColor,
                                border: `1px solid ${statusColor}33`,
                              }}
                            >
                              {proj.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tasks List Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-main)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Recent Tasks
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  marginTop: "0.1rem",
                }}
              >
                Assigned task allocation status.
              </p>
            </div>

            <div
              style={{
                overflowX: "auto",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.85rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      color: "var(--text-muted)",
                      background: "var(--bg-card)",
                      fontWeight: 600,
                    }}
                  >
                    <th style={{ padding: "0.75rem" }}>Task Title</th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>
                      Priority
                    </th>
                    <th style={{ padding: "0.75rem", textAlign: "center" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        Querying tasks...
                      </td>
                    </tr>
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                        }}
                      >
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    tasks.slice(0, 5).map((tsk) => {
                      let priorityColor = "var(--text-muted)";
                      if (tsk.priority === "URGENT") priorityColor = "#ff3366";
                      else if (tsk.priority === "HIGH")
                        priorityColor = "#f59e0b";
                      else if (tsk.priority === "MEDIUM")
                        priorityColor = "#3b82f6";

                      return (
                        <tr
                          key={tsk.id}
                          style={{
                            borderBottom: "1px solid var(--border-color)",
                          }}
                        >
                          <td
                            style={{
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "var(--text-main)",
                            }}
                          >
                            {tsk.task_title}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              color: priorityColor,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                            }}
                          >
                            {tsk.priority}
                          </td>
                          <td
                            style={{ padding: "0.75rem", textAlign: "center" }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                background:
                                  tsk.status === "DONE"
                                    ? "rgba(16, 185, 129, 0.12)"
                                    : "rgba(255, 255, 255, 0.05)",
                                color:
                                  tsk.status === "DONE"
                                    ? "#10b981"
                                    : "var(--text-muted)",
                              }}
                            >
                              {tsk.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
