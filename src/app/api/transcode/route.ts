import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const TRANSCODE_DIR = path.join(UPLOADS_DIR, "transcode");

export const runtime = "nodejs";

const QUALITY_PRESETS: Record<string, { crf: number; preset: string; audioBitrate: string; label: string }> = {
  alta: { crf: 18, preset: "slow", audioBitrate: "192k", label: "Alta calidad (~70% del original)" },
  balanceado: { crf: 23, preset: "medium", audioBitrate: "128k", label: "Balanceado (~30% del original)" },
  compacto: { crf: 28, preset: "fast", audioBitrate: "96k", label: "Compacto (~15% del original)" },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { filename, quality = "balanceado" } = await req.json();

    if (!filename) {
      return NextResponse.json({ error: "filename requerido" }, { status: 400 });
    }

    if (!QUALITY_PRESETS[quality]) {
      return NextResponse.json(
        { error: `Calidad inválida. Opciones: ${Object.keys(QUALITY_PRESETS).join(", ")}` },
        { status: 400 }
      );
    }

    const sourcePath = path.join(UPLOADS_DIR, "videos", filename);
    if (!existsSync(sourcePath)) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    const jobId = `${Date.now()}-${filename}`;
    await mkdir(TRANSCODE_DIR, { recursive: true });

    const preset = QUALITY_PRESETS[quality];
    const jobFile = path.join(TRANSCODE_DIR, `${jobId}.json`);
    const job = {
      id: jobId,
      source_file: filename,
      quality,
      quality_label: preset.label,
      crf: preset.crf,
      preset: preset.preset,
      audio_bitrate: preset.audioBitrate,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    await writeFile(jobFile, JSON.stringify(job, null, 2));
    console.log("[transcode] Job created:", jobId, "quality:", quality, "for", filename);

    return NextResponse.json({
      job_id: jobId,
      quality,
      quality_label: preset.label,
      status: "pending",
      message: `Transcode encolado (${preset.label}). El video se procesará en background.`,
    });
  } catch (err) {
    console.error("[transcode] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al encolar transcode" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get("job_id");

  if (jobId) {
    const jobFile = path.join(TRANSCODE_DIR, `${jobId}.json`);
    if (!existsSync(jobFile)) {
      return NextResponse.json({ error: "Job no encontrado" }, { status: 404 });
    }
    const data = JSON.parse(await readFile(jobFile, "utf-8"));
    return NextResponse.json(data);
  }

  const allJobs = await readdir(TRANSCODE_DIR).catch(() => []);
  const jobs = [];
  for (const f of allJobs) {
    if (f.endsWith(".json")) {
      try {
        const data = JSON.parse(await readFile(path.join(TRANSCODE_DIR, f), "utf-8"));
        jobs.push(data);
      } catch {}
    }
  }
  jobs.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return NextResponse.json(jobs.slice(0, 50));
}

async function readdir(dir: string): Promise<string[]> {
  const { readdir: readDir } = await import("fs/promises");
  return readDir(dir);
}
