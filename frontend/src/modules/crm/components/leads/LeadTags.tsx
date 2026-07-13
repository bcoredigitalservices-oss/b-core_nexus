import React, { useState } from "react";
import { Tag, Plus, X, Loader2 } from "lucide-react";

interface LeadTagsProps {
  tags: { id: string; tag_name: string }[];
  onAddTag: (name: string) => Promise<void>;
  onRemoveTag: (id: string) => Promise<void>;
}

export function LeadTags({ tags = [], onAddTag, onRemoveTag }: LeadTagsProps) {
  const [newTag, setNewTag] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || tags.some((t) => t.tag_name.toLowerCase() === newTag.trim().toLowerCase())) return;
    
    setAdding(true);
    try {
      await onAddTag(newTag.trim());
      setNewTag("");
    } catch (err) {
      console.error("Failed to add tag:", err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await onRemoveTag(id);
    } catch (err) {
      console.error("Failed to remove tag:", err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-card border border-color rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-color pb-2">
        <Tag size={12} className="text-accent-primary" /> Label Classifications
      </span>

      {/* Tag badges */}
      <div className="flex flex-wrap gap-1.5 py-1">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2.5 py-0.5 bg-main border border-color rounded-full text-[10px] font-semibold text-[var(--text-main)]"
          >
            {tag.tag_name}
            <button
              type="button"
              disabled={removingId === tag.id}
              onClick={() => handleRemove(tag.id)}
              className="text-[var(--text-muted)] hover:text-rose-500 cursor-pointer disabled:opacity-50"
            >
              {removingId === tag.id ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <X size={10} />
              )}
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-[var(--text-muted)] italic">No tags classified</span>
        )}
      </div>

      {/* Add tag form */}
      <form onSubmit={handleAdd} className="flex gap-2.5 mt-1 border-t border-color/40 pt-2.5">
        <input
          type="text"
          placeholder="New tag..."
          disabled={adding}
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="flex-1 rounded-lg border border-color bg-main py-1 px-2 text-[11px] focus:border-accent-primary outline-none text-[var(--text-main)]"
        />
        <button
          type="submit"
          disabled={adding || !newTag.trim()}
          className="p-1.5 bg-accent-primary hover:brightness-110 text-white rounded-lg cursor-pointer transition flex items-center justify-center disabled:opacity-50"
        >
          {adding ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Plus size={12} />
          )}
        </button>
      </form>
    </div>
  );
}
