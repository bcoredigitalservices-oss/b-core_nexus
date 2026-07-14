import React, { useState } from "react";
import { MessageSquare, Phone, Mail, Calendar, Send, Loader2 } from "lucide-react";
import { User } from "../../types/types";

interface LeadActivitiesProps {
  activities: any[];
  users: User[];
  onAddActivity: (type: string, title: string, description: string) => Promise<void>;
}

export function LeadActivities({
  activities = [],
  users = [],
  onAddActivity,
}: LeadActivitiesProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("call");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    setLocalError("");
    try {
      await onAddActivity(newType, newTitle.trim(), newDesc.trim());
      setNewTitle("");
      setNewDesc("");
    } catch (err: any) {
      setLocalError(err.message || "Failed to log activity.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone size={13} className="text-blue-500" />;
      case "email":
        return <Mail size={13} className="text-amber-500" />;
      case "meeting":
        return <Calendar size={13} className="text-emerald-500" />;
      default:
        return <MessageSquare size={13} className="text-purple-500" />;
    }
  };

  const getUserName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "System";
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div className="bg-card border border-color rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-color pb-3">
        <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0 flex items-center gap-2">
          <MessageSquare className="text-accent-primary" size={16} />
          Activity Log Timeline
        </h3>
      </div>

      {localError && (
        <div className="py-2 px-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-semibold">
          {localError}
        </div>
      )}

      {/* Log Form */}
      <form onSubmit={handleAdd} className="bg-main/30 border border-color p-4 rounded-xl flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Log activity title..."
            required
            disabled={submitting}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="col-span-2 rounded-lg border border-color bg-main py-1.5 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
          <select
            value={newType}
            disabled={submitting}
            onChange={(e) => setNewType(e.target.value)}
            className="rounded-lg border border-color bg-main py-1.5 px-2 text-xs focus:border-accent-primary outline-none text-[var(--text-main)] cursor-pointer"
          >
            <option value="call">Call Log</option>
            <option value="email">Email Ping</option>
            <option value="meeting">Meeting</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add short description or summary..."
            disabled={submitting}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="flex-1 rounded-lg border border-color bg-main py-1.5 px-3 text-xs focus:border-accent-primary outline-none text-[var(--text-main)]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="py-1.5 px-3 rounded-lg bg-accent-primary text-white font-bold text-xs hover:brightness-110 flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Send size={11} />
            )}
            Save
          </button>
        </div>
      </form>

      {/* Timeline list */}
      <div className="flex flex-col gap-4 relative pl-4 border-l border-color ml-2 mt-2">
        {activities.map((act) => {
          const notes = act.notes || "";
          const doubleNewlineIndex = notes.indexOf("\n\n");
          let actTitle = notes;
          let actDesc = "";
          if (doubleNewlineIndex !== -1) {
            actTitle = notes.substring(0, doubleNewlineIndex);
            actDesc = notes.substring(doubleNewlineIndex + 2);
          }

          return (
            <div key={act.id} className="relative flex flex-col gap-1">
              {/* Timeline Dot */}
              <div className="absolute -left-[23px] top-1 h-5 w-5 bg-card border border-color rounded-full flex items-center justify-center shadow-sm">
                {getIcon(act.activity_type)}
              </div>

              <div className="flex items-center justify-between">
                <strong className="text-xs text-[var(--text-main)] font-semibold">
                  {actTitle}
                </strong>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {formatDate(act.created_at)}
                </span>
              </div>
              {actDesc && (
                <p className="text-xs text-[var(--text-muted)] m-0 leading-relaxed">
                  {actDesc}
                </p>
              )}
              <span className="text-[9px] text-[var(--text-muted)] font-bold mt-1 opacity-70">
                Logged by {getUserName(act.created_by_id)}
              </span>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] italic py-2">
            No activities logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
