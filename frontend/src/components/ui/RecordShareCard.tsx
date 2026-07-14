import React, { useEffect, useState } from "react";
import { Share2, User as UserIcon, Trash2, Shield, Loader2, Check } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { User } from "../../modules/crm/types/types";

interface Share {
  id: string;
  entity_type: string;
  entity_id: string;
  shared_with_user_id: string;
  access_level: string;
}

interface RecordShareCardProps {
  entityType: "lead" | "contact" | "customer" | "quotation" | "sales_order" | "deal";
  entityId: string;
  users: User[];
  currentUserId?: string;
  ownerId?: string;
}

export function RecordShareCard({
  entityType,
  entityId,
  users = [],
  currentUserId,
  ownerId,
}: RecordShareCardProps) {
  const { authFetch } = useAppContext();

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [accessLevel, setAccessLevel] = useState<"read" | "write">("read");

  const isOwner = currentUserId === ownerId;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setSharing(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        shared_with_user_id: selectedUserId,
        access_level: accessLevel,
      };

      const res = await authFetch("/crm/share", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccessMsg("Record shared successfully.");
      
      if (res && res.id) {
        setShares((prev) => {
          const filtered = prev.filter((s) => s.shared_with_user_id !== selectedUserId);
          return [...filtered, res];
        });
      }
      setSelectedUserId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to share record.");
    } finally {
      setSharing(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authFetch(`/crm/share/${shareId}`, {
        method: "DELETE",
      });
      setSuccessMsg("Share permissions revoked.");
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to revoke share permissions.");
    }
  };

  const getUserName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "System User";
  };

  const shareCandidates = users.filter((u) => {
    if (u.id === ownerId) return false;
    if (u.id === currentUserId) return false;
    const isAlreadyShared = shares.some((s) => s.shared_with_user_id === u.id);
    return !isAlreadyShared;
  });

  return (
    <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm select-none">
      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
        <Share2 size={12} className="text-accent-primary" /> Access Control & Sharing
      </span>

      {errorMsg && (
        <div className="text-[10px] text-rose-500 font-semibold bg-rose-500/10 py-1.5 px-3 rounded-lg border border-rose-500/20">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20 flex items-center gap-1">
          <Check size={11} /> {successMsg}
        </div>
      )}

      {isOwner ? (
        <form onSubmit={handleShare} className="flex flex-col gap-2 mt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-0.5">
              Share With User
            </label>
            <select
              value={selectedUserId}
              required
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border border-color bg-main py-1.5 px-2.5 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
            >
              <option value="">Select teammate...</option>
              {shareCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-0.5">
                Permission Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as "read" | "write")}
                className="w-full rounded-lg border border-color bg-main py-1.5 px-2.5 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] cursor-pointer"
              >
                <option value="read">Read Only</option>
                <option value="write">Read & Write</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sharing || !selectedUserId}
              className="px-3 py-1.5 bg-accent-primary text-white text-xs font-bold rounded-lg hover:brightness-110 cursor-pointer disabled:opacity-50 transition flex items-center gap-1.5 h-[32px] justify-center select-none border-none shrink-0"
            >
              {sharing ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <>
                  <Share2 size={12} /> Share
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-main/30 border border-color/45 rounded-xl p-3 flex items-start gap-2 mt-1">
          <Shield size={13} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed m-0 font-medium">
            Only the record owner ({getUserName(ownerId || "")}) can share or modify access privileges.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-2">
        <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider pl-0.5 select-none">
          Current Access Lists ({shares.length})
        </span>

        {loading ? (
          <div className="flex items-center gap-2 py-3 px-2">
            <Loader2 className="animate-spin text-accent-primary" size={14} />
            <span className="text-[10px] text-[var(--text-muted)]">Checking permissions…</span>
          </div>
        ) : shares.length === 0 ? (
          <span className="text-[10px] text-[var(--text-muted)] italic py-1 px-2 select-none">
            No external users have access.
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {shares.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-main border border-color rounded-xl p-2.5 hover:bg-main/50 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 bg-accent-primary/10 text-accent-primary font-bold text-[9px] rounded-full flex items-center justify-center shrink-0">
                    {getUserName(s.shared_with_user_id).split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                      {getUserName(s.shared_with_user_id)}
                    </span>
                    <span className="text-[9px] text-accent-primary font-bold uppercase tracking-wider">
                      {s.access_level === "write" ? "Read & Write" : "Read Only"}
                    </span>
                  </div>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRevoke(s.id)}
                    className="p-1 rounded bg-transparent border-none text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition"
                    title="Revoke sharing access"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
