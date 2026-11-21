"use client";

import { useState } from "react";
import { encryptForFenwright } from "@/lib/intake/envelope";
import { night } from "@/components/portal/night";

/** "paper" on the public upload page, "night" inside the dark client portal. */
type Tone = "paper" | "night";

const TONES = {
  paper: {
    done: "border-accent/20 bg-accent-soft/60 text-ink",
    doneBody: "text-stone-600",
    doneMeta: "text-stone-500",
    label: "text-ink",
    file: "text-stone-600 file:bg-stone-100 file:text-ink hover:file:bg-stone-200",
    hint: "text-stone-500",
    button: "btn-primary",
    track: "bg-stone-100",
    bar: "bg-accent",
    error: "text-red-700",
  },
  night: {
    done: "border-signal-mint/30 bg-signal-mint/10 text-night-text",
    doneBody: "text-night-dim",
    doneMeta: "text-night-mute",
    label: "text-night-text",
    file: "text-night-dim file:bg-night-raised file:text-night-text file:ring-1 file:ring-night-edge hover:file:bg-night-hover",
    hint: "text-night-mute",
    button: night.btnPrimary,
    track: "bg-night-edge",
    bar: "bg-signal-mint",
    error: "text-signal-orange",
  },
} as const;

type Stage =
  | { kind: "idle" }
  | { kind: "working"; label: string; percent?: number }
  | { kind: "done"; name: string; sha256: string }
  | { kind: "error"; message: string };

function putWithProgress(url: string, body: Uint8Array<ArrayBuffer>, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    const failed = "The upload did not go through. Check your connection and try again, or email us.";
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(failed)));
    xhr.onerror = () => reject(new Error(failed));
    xhr.send(new Blob([body]));
  });
}

async function postJson(path: string, payload: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

/**
 * Picks a file, encrypts it here, uploads the ciphertext straight to storage,
 * then confirms. The plain file never leaves the browser.
 */
export function UploadForm({
  token,
  publicKeyPem,
  maxBytes,
  tone = "paper",
}: {
  token: string;
  publicKeyPem: string;
  maxBytes: number;
  tone?: Tone;
}) {
  const t = TONES[tone];
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const busy = stage.kind === "working";

  async function send() {
    if (!file) return;
    if (file.size > maxBytes) {
      setStage({ kind: "error", message: `That file is over ${Math.round(maxBytes / 1048576)} MB. Email us and we will arrange another way.` });
      return;
    }
    try {
      setStage({ kind: "working", label: "Encrypting in your browser..." });
      const prospect = token.split(".")[0];
      const { envelope, sha256 } = await encryptForFenwright(
        await file.arrayBuffer(),
        { name: file.name, type: file.type || "application/octet-stream", uploadedAt: new Date().toISOString(), prospect },
        publicKeyPem,
      );
      setStage({ kind: "working", label: "Preparing upload..." });
      const { url, key } = await postJson("/api/intake/sign", { token, size: envelope.byteLength });
      await putWithProgress(url, envelope, (percent) => setStage({ kind: "working", label: "Uploading...", percent }));
      setStage({ kind: "working", label: "Confirming..." });
      await postJson("/api/intake/complete", { token, key });
      setStage({ kind: "done", name: file.name, sha256 });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  if (stage.kind === "done") {
    return (
      <div className={`mt-6 rounded-xl border px-4 py-4 text-sm leading-relaxed ${t.done}`}>
        <p className="font-semibold">Received, encrypted.</p>
        <p className={`mt-1 ${t.doneBody}`}>
          {stage.name} arrived safely. We will be in touch with your First Look, usually within two working days.
        </p>
        <p className={`mt-3 break-all text-xs ${t.doneMeta}`}>
          SHA-256 fingerprint: <span className="font-mono">{stage.sha256}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <label htmlFor="firmware" className={`block text-sm font-medium ${t.label}`}>
        Firmware file
      </label>
      <input
        id="firmware"
        type="file"
        disabled={busy}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setStage({ kind: "idle" });
        }}
        className={`mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium ${t.file}`}
      />
      <p className={`mt-2 text-xs leading-relaxed ${t.hint}`}>
        A firmware image, update file or zip, up to {Math.round(maxBytes / 1048576)} MB. Send one file per upload.
      </p>

      <button type="button" onClick={send} disabled={!file || busy} className={`${t.button} mt-5 w-full disabled:opacity-60`}>
        {busy ? stage.label : "Encrypt and send"}
      </button>

      {stage.kind === "working" && stage.percent !== undefined && (
        <div className={`mt-3 h-1.5 w-full overflow-hidden rounded-full ${t.track}`} aria-hidden="true">
          <div className={`h-full transition-all ${t.bar}`} style={{ width: `${stage.percent}%` }} />
        </div>
      )}
      {stage.kind === "error" && (
        <p role="alert" className={`mt-3 text-sm ${t.error}`}>
          {stage.message}
        </p>
      )}
    </div>
  );
}
