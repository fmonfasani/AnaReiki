"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success?: true; error?: string };

export async function createTopic(input: {
  title: string;
  content: string;
  category: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("discussion_topics").insert({
    title: input.title,
    content: input.content,
    author_id: user.id,
    category: input.category,
  });

  if (error) return { error: error.message };
  revalidatePath("/consultantes/comunidad");
  return { success: true };
}

export async function createReply(input: {
  topicId: string;
  content: string;
  parentId?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("discussion_replies").insert({
    topic_id: input.topicId,
    parent_id: input.parentId || null,
    author_id: user.id,
    content: input.content,
  });

  if (error) return { error: error.message };
  revalidatePath(`/consultantes/comunidad/${input.topicId}`);
  return { success: true };
}

export async function closeTopic(topicId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("discussion_topics")
    .update({ is_closed: true })
    .eq("id", topicId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/consultantes/comunidad/${topicId}`);
  return { success: true };
}

export async function pinTopic(topicId: string, isPinned: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase
    .from("discussion_topics")
    .update({ is_pinned: isPinned })
    .eq("id", topicId);

  if (error) return { error: error.message };
  revalidatePath("/consultantes/comunidad");
  return { success: true };
}

export async function deleteTopic(topicId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("discussion_topics").delete().eq("id", topicId);
  if (error) return { error: error.message };
  revalidatePath("/consultantes/comunidad");
  return { success: true };
}

export async function deleteReply(replyId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("discussion_replies").delete().eq("id", replyId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function addComment(contentId: string, text: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { error } = await supabase.from("content_comments").insert({
    content_id: contentId,
    user_id: user.id,
    text,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("content_comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function sendMessage(input: {
  receiverId?: string;
  subject?: string;
  content: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  let receiverId = input.receiverId;
  if (!receiverId) {
    const { createServiceClient } = await import("@/lib/supabase/service");
    const svc = createServiceClient();
    const { data: admin } = await svc
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    if (!admin) return { error: "No se encontró un administrador" };
    receiverId = admin.id;
  }

  const { error } = await supabase.from("direct_messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    subject: input.subject || null,
    content: input.content,
  });

  if (error) return { error: error.message };
  revalidatePath("/consultantes/mensajes");
  return { success: true };
}

export async function markAsRead(messageIds: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", messageIds);

  if (error) return { error: error.message };
  return { success: true };
}
