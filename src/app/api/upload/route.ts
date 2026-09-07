import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

// Allow-list by MIME *and* extension. Never trust the client filename.
const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORISED" }, { status: 401 });
  }

  // Vercel's filesystem is read-only apart from /tmp, and /tmp does not persist
  // between invocations — a file written there would 404 on the next request.
  // Fail loudly with a pointer rather than appearing to succeed.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "STORAGE_NOT_CONFIGURED",
        detail:
          "Local disk uploads do not work on Vercel. Wire this route to Vercel Blob, S3 or Cloudinary and return the resulting public URL.",
      },
      { status: 501 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE" }, { status: 413 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "TYPE_NOT_ALLOWED" }, { status: 415 });
  }

  // Generated name — the uploaded filename never reaches the filesystem, so
  // there is no path-traversal surface.
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${name}` });
}
