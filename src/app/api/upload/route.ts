import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("[upload] Content-Type:", req.headers.get("content-type"));
  console.log("[upload] Content-Length:", req.headers.get("content-length"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("[upload] No auth");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  console.log("[upload] User:", user.id);

  try {
    const rawBody = req.body;
    if (!rawBody) {
      console.log("[upload] Request body is null/undefined");
      return NextResponse.json({ error: "Body vacío" }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (parseErr) {
      console.error("[upload] formData parse error:", parseErr);
      return NextResponse.json(
        {
          error: "Failed to parse body as FormData",
          detail: parseErr instanceof Error ? parseErr.message : String(parseErr),
          contentType: req.headers.get("content-type"),
          contentLength: req.headers.get("content-length"),
        },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string || "videos";
    console.log("[upload] File:", file?.name, "size:", file?.size, "type:", file?.type, "uploadType:", type);

    if (!file) {
      return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo supera el límite de 50MB (pesa ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
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
    console.log("[upload] Buffer size:", buffer.length, "writing to:", filePath);
    await writeFile(filePath, buffer);
    console.log("[upload] File written OK:", filePath);

    const publicUrl = `/api/uploads/${uploadDir}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }
}
