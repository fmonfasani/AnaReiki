import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string || "videos";

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    const uploadDir = type === "thumbnails" ? "thumbnails" : "videos";
    const dir = path.join(process.cwd(), "public", "uploads", uploadDir);
    await mkdir(dir, { recursive: true });

    const ext = file.name.split(".").pop() || "mp4";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uploadDir}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }
}
