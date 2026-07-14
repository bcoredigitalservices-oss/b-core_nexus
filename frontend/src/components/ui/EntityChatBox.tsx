import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Paperclip, Loader2, User as UserIcon, Check, CheckCheck, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { User } from "../../modules/crm/types/types";

interface Message {
  id: string;
  content: string;
  entity_type: string;
  entity_id: string;
  sender_id: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  mentions?: any[];
  read_receipts?: any[];
}

interface EntityChatBoxProps {
  entityType: "lead" | "contact" | "customer" | "deal" | "quotation" | "sales_order";
  entityId: string;
  users: User[];
}

export function EntityChatBox({ entityType, entityId, users = [] }: EntityChatBoxProps) {
  const { authFetch, currentUser } = useAppContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Mention Autocomplete States
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [collectedMentions, setCollectedMentions] = useState<string[]>([]); // User IDs

  // Attachment Simulation States
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await authFetch(`/messages/${entityType}/${entityId}`) as Message[];
      setMessages(data || []);
      
      // Auto-read messages sent by others
      if (data && data.length > 0) {
        data.forEach((msg) => {
          if (msg.sender_id !== currentUser?.id) {
            const hasRead = msg.read_receipts?.some((r) => r.user_id === currentUser?.id);
            if (!hasRead) {
              markAsRead(msg.id);
            }
          }
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await authFetch(`/messages/${messageId}/read`, { method: "POST" });
    } catch (e) {
      console.error("Failed to mark message as read:", e);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchMessages();
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachmentUrl) return;

    setSending(true);
    setErrorMsg("");
    try {
      const payload = {
        content: content.trim(),
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        mentions: collectedMentions,
      };

      const created = await authFetch(`/messages/${entityType}/${entityId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessages((prev) => [...prev, created]);
      setContent("");
      setAttachmentName("");
      setAttachmentUrl("");
      setCollectedMentions([]);
      inputRef.current?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post message.");
    } finally {
      setSending(false);
    }
  };

  // Mention Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === " ")) {
      const searchStr = textBeforeCursor.slice(lastAtIdx + 1);
      if (!searchStr.includes(" ")) {
        setShowMentionList(true);
        setMentionSearch(searchStr);
        setMentionStartIndex(lastAtIdx);
        return;
      }
    }
    setShowMentionList(false);
  };

  const selectMentionUser = (user: User) => {
    if (mentionStartIndex === -1) return;

    const before = content.slice(0, mentionStartIndex);
    const after = content.slice(inputRef.current?.selectionStart || 0);
    const mentionText = `@${user.first_name} ${user.last_name || ""} `;

    setContent(before + mentionText + after);
    if (!collectedMentions.includes(user.id)) {
      setCollectedMentions((prev) => [...prev, user.id]);
    }
    setShowMentionList(false);
    inputRef.current?.focus();
  };

  // Filter users matching search string
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name || ""}`.toLowerCase();
    return fullName.includes(mentionSearch.toLowerCase()) && u.id !== currentUser?.id;
  });

  const getUserName = (id: string) => {
    const user = users.find((u) => u.id === id);
    return user ? `${user.first_name} ${user.last_name || ""}`.trim() : "System User";
  };

  const getUserInitials = (id: string) => {
    const name = getUserName(id);
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  // Simulate file upload
  const handleSimulateUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const mockName = `document_attachment_${Math.floor(Math.random() * 1000)}.pdf`;
      setAttachmentName(mockName);
      setAttachmentUrl(`https://storage.bcore.digital/vault/${mockName}`);
      setUploading(false);
    }, 1200);
  };

  return (
    <div className="bg-card border border-color rounded-2xl flex flex-col h-[550px] shadow-sm overflow-hidden animate-[fadeIn_0.15s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-color px-6 py-4 bg-main/20 select-none">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-accent-primary animate-pulse" size={16} />
          <h3 className="text-sm font-extrabold text-[var(--text-main)] m-0">
            Collaborative Conversation Thread
          </h3>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase bg-main border border-color px-2 py-0.5 rounded-full">
          {messages.length} {messages.length === 1 ? "Message" : "Messages"}
        </span>
      </div>

      {errorMsg && (
        <div className="py-2 px-6 bg-rose-500/10 border-b border-rose-500/20 text-rose-500 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Messages Scroll View */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-main/5"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <Loader2 className="animate-spin text-accent-primary" size={24} />
            <span className="text-xs text-[var(--text-muted)]">Retrieving pipeline discussions…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 h-full text-center p-8 select-none">
            <div className="w-12 h-12 bg-main border border-color rounded-full flex items-center justify-center text-[var(--text-muted)]">
              <MessageSquare size={20} />
            </div>
            <strong className="text-xs text-[var(--text-main)] font-semibold mt-1">No dialogue logs</strong>
            <p className="text-[11px] text-[var(--text-muted)] max-w-[240px] leading-relaxed m-0 mt-1">
              Start the discussion by typing a message below. Use `@` to mention stakeholders.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id;
            const senderName = getUserName(msg.sender_id);
            const initials = getUserInitials(msg.sender_id);
            
            // Checks if anyone else has read it (read receipts count)
            const readReceiptsCount = msg.read_receipts?.filter((r) => r.user_id !== msg.sender_id).length || 0;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}
              >
                {/* Avatar */}
                <div
                  className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold select-none ${
                    isMe
                      ? "bg-accent-primary text-white"
                      : "bg-main border border-color text-[var(--text-main)]"
                  }`}
                  title={senderName}
                >
                  {initials}
                </div>

                {/* Message Bubble Column */}
                <div className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  {/* Sender Name */}
                  <span className="text-[10px] text-[var(--text-muted)] font-bold px-1 select-none">
                    {senderName}
                  </span>

                  {/* Bubble content */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-accent-primary text-white rounded-tr-none shadow-xs"
                        : "bg-card border border-color text-[var(--text-main)] rounded-tl-none"
                    }`}
                  >
                    <p className="m-0 whitespace-pre-wrap select-text selection:bg-main/30 font-medium">
                      {msg.content}
                    </p>

                    {/* Attachment Link */}
                    {msg.attachment_url && (
                      <div className="mt-2 pt-2 border-t border-white/20 flex items-center gap-1.5 font-bold select-none">
                        <Paperclip size={11} />
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[10px]"
                        >
                          {msg.attachment_name || "Attachment File"}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timestamp & Read Status */}
                  <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] px-1 select-none mt-0.5">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      <span className="flex items-center">
                        {readReceiptsCount > 0 ? (
                          <CheckCheck size={11} className="text-emerald-500" title="Seen by others" />
                        ) : (
                          <Check size={11} className="text-[var(--text-muted)]" title="Sent successfully" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mention Auto-suggest Menu */}
      {showMentionList && filteredUsers.length > 0 && (
        <div className="mx-6 bg-card border border-color rounded-xl max-h-40 overflow-y-auto shadow-lg p-1.5 animate-[fadeIn_0.1s_ease]">
          <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2.5 py-1 select-none">
            Mention Stakeholder
          </div>
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => selectMentionUser(u)}
              className="flex items-center gap-2 w-full p-2 text-left rounded-lg text-xs font-semibold hover:bg-main text-[var(--text-main)] cursor-pointer transition-colors border-none"
            >
              <div className="h-5 w-5 bg-accent-primary/10 text-accent-primary text-[9px] font-bold rounded-full flex items-center justify-center">
                {u.first_name[0]}{u.last_name ? u.last_name[0] : ""}
              </div>
              <div className="flex-1 truncate">
                {u.first_name} {u.last_name || ""} <span className="text-[10px] text-[var(--text-muted)]">({u.email})</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-4 border-t border-color flex flex-col gap-3 bg-main/5">
        {/* Attachment preview indicator */}
        {attachmentName && (
          <div className="flex items-center justify-between bg-main border border-color px-3 py-1.5 rounded-xl text-[10px] font-semibold text-[var(--text-main)] select-none">
            <span className="flex items-center gap-1.5 truncate">
              <Paperclip size={12} className="text-accent-primary" /> {attachmentName}
            </span>
            <button
              type="button"
              onClick={() => {
                setAttachmentName("");
                setAttachmentUrl("");
              }}
              className="text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {/* File upload trigger button */}
          <button
            type="button"
            onClick={handleSimulateUpload}
            disabled={sending || uploading}
            className="p-2.5 rounded-xl border border-color bg-card text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-main cursor-pointer transition disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Attach Document File"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-accent-primary" size={16} />
            ) : (
              <Paperclip size={16} />
            )}
          </button>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={content}
              disabled={sending}
              placeholder="Type your message... (use @ to mention)"
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="w-full rounded-xl border border-color bg-card py-2.5 px-4 text-xs outline-none focus:border-accent-primary text-[var(--text-main)] font-medium resize-none max-h-20"
            />
          </div>

          {/* Send */}
          <button
            type="submit"
            disabled={sending || (!content.trim() && !attachmentUrl)}
            className="p-2.5 rounded-xl bg-accent-primary text-white hover:brightness-110 cursor-pointer transition disabled:opacity-50 shrink-0 flex items-center justify-center"
          >
            {sending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
