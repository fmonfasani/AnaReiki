"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { addComment, deleteComment } from "@/actions/community";

type Comment = {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

interface CommentsSectionProps {
  contentId: string;
}

export default function CommentsSection({ contentId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const { data } = await supabase
        .from("content_comments")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("content_id", contentId)
        .order("created_at", { ascending: false });

      setComments((data as Comment[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [contentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await addComment(contentId, text);
    setText("");

    const { data } = await supabase
      .from("content_comments")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    setComments((data as Comment[]) || []);
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 font-display flex items-center gap-2">
        <span className="material-symbols-outlined text-pink-500">chat</span>
        Comentarios ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          placeholder="Dejá tu comentario..."
          className="flex-1 border-gray-200 rounded-xl text-sm focus:ring-pink-500 focus:border-pink-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all"
        >
          {submitting ? "..." : "Enviar"}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl" />
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-[10px]">
                    {(comment.profiles?.full_name || "A")[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {comment.profiles?.full_name || "Anónimo"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                  </span>
                </div>
                {userId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600">{comment.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">
          No hay comentarios todavía. ¡Sé el primero en comentar!
        </p>
      )}
    </div>
  );
}
