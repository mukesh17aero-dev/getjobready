"use client";

// Video uploads: the welcome teaser, and the films that show a simulation
// before somebody takes it.
//
// Nothing is generated here. A minute of generated video costs dollars a go
// and looks better when a person has chosen the shots, so the making happens
// wherever it is cheapest and this keeps the result - in our own storage,
// with a player to check it in before anyone sees it.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const KINDS = [
  { id: "teaser" as const, label: "Teaser", blurb: "The film on the welcome page." },
  {
    id: "simulations" as const,
    label: "Simulations",
    blurb: "What a simulation looks like, shown before somebody takes it.",
  },
];
type Kind = (typeof KINDS)[number]["id"];

type Upload = {
  id: string;
  url: string;
  filename: string;
  bytes: number;
  note: string;
  uploadedAt: string;
};
type Library = Record<Kind, Upload[]>;

const EMPTY: Library = { teaser: [], simulations: [] };

function Film({
  upload,
  live,
  onRemove,
}: {
  upload: Upload;
  live: boolean;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        live ? "border-slate-200 bg-surface" : "border-amber-300 bg-amber-50/40"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-400">
          {live ? "Published - what people see" : "Draft - not live yet"}
        </p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="min-h-8 cursor-pointer text-[0.75rem] font-semibold text-slate-500 underline underline-offset-2 hover:text-rose-700"
          >
            Remove
          </button>
        )}
      </div>
      {/^https?:\/\/\S+\.(mp4|webm|mov)(\?|$)/i.test(upload.url) ? (
        <video
          src={upload.url}
          controls
          playsInline
          preload="metadata"
          className="mt-2 aspect-video w-full rounded-xl border border-slate-200 bg-black"
        />
      ) : (
        <a
          href={upload.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex aspect-video w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-center text-[0.85rem] font-semibold text-slate-600 underline underline-offset-2"
        >
          Hosted elsewhere - open it in a new tab
        </a>
      )}
      {upload.note && (
        <p className="mt-2 text-[0.82rem] leading-relaxed text-slate-700">{upload.note}</p>
      )}
      <p className="mt-1 text-[0.72rem] text-slate-400">
        {upload.filename}
        {upload.bytes ? ` · ${Math.round((upload.bytes / 1024 / 1024) * 10) / 10}MB` : ""}
        {upload.uploadedAt
          ? ` · ${new Date(upload.uploadedAt).toLocaleDateString()}`
          : ""}
      </p>
    </div>
  );
}

export function VideoUploadsEditor({
  onSaved,
  refreshKey = 0,
}: {
  onSaved: () => void;
  /** Changes when the console publishes, so this reads the shelf again. */
  refreshKey?: number;
}) {
  const [kind, setKind] = useState<Kind>("teaser");
  const [draft, setDraft] = useState<Library>(EMPTY);
  const [published, setPublished] = useState<Library>(EMPTY);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = useCallback(async () => {
    const { data } = await supabaseBrowser().auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const load = useCallback(async (): Promise<
    { draft: Library; published: Library } | null
  > => {
    const t = await token();
    if (!t) return null;
    try {
      const res = await fetch(`${API_URL}/v1/admin/videos`, {
        headers: { Authorization: `Bearer ${t}` },
        cache: "no-store",
      });
      const body = (await res.json()) as { draft?: Library; published?: Library };
      return { draft: body.draft ?? EMPTY, published: body.published ?? EMPTY };
    } catch {
      // An empty shelf is honest: nothing has been uploaded yet.
      return null;
    }
  }, [token]);

  // Read on arrival, and again after a publish - a film that has gone live
  // must stop calling itself a draft.
  useEffect(() => {
    let cancelled = false;
    void load().then((library) => {
      if (cancelled || !library) return;
      setDraft(library.draft);
      setPublished(library.published);
    });
    return () => {
      cancelled = true;
    };
  }, [load, refreshKey]);

  async function upload(file: File) {
    const t = await token();
    if (!t) return;
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append("kind", kind);
    form.append("note", note);
    form.append("file", file, file.name);
    try {
      const res = await fetch(`${API_URL}/v1/admin/videos/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
        body: form,
      });
      const body = (await res.json()) as { draft?: Library; error?: string };
      if (!res.ok || !body.draft) {
        setMessage(body.error ?? "That did not upload. Try again.");
        return;
      }
      setDraft(body.draft);
      setNote("");
      setMessage("Uploaded. Watch it below, then publish when it is right.");
      onSaved();
    } catch {
      setMessage("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  // The way round the size cap: a film hosted anywhere, kept here as a link.
  async function addLink() {
    const t = await token();
    if (!t || !link.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/v1/admin/videos/link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ kind, url: link.trim(), note }),
      });
      const body = (await res.json()) as { draft?: Library; error?: string };
      if (!res.ok || !body.draft) {
        setMessage(body.error ?? "That link was not accepted.");
        return;
      }
      setDraft(body.draft);
      setLink("");
      setNote("");
      setMessage("Link saved. Publish when it is right.");
      onSaved();
    } catch {
      setMessage("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const t = await token();
    if (!t) return;
    const res = await fetch(`${API_URL}/v1/admin/videos/${kind}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = (await res.json()) as { draft?: Library };
    if (body.draft) {
      setDraft(body.draft);
      onSaved();
    }
  }

  const chosen = KINDS.find((k) => k.id === kind)!;
  const drafts = draft[kind] ?? [];
  const lives = published[kind] ?? [];

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-slate-200 bg-surface p-5">
        <label className="block">
          <span className="text-[0.78rem] font-semibold text-slate-800">
            Which videos?
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
            className="mt-1.5 min-h-11 w-full max-w-sm cursor-pointer rounded-xl border border-slate-300 bg-surface px-3 text-[0.88rem] font-semibold text-slate-900 outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
          >
            {KINDS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-1.5 text-[0.8rem] text-slate-500">{chosen.blurb}</p>

        <label className="mt-4 block">
          <span className="text-[0.78rem] font-semibold text-slate-800">
            What this one is (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Second cut - slower open, new closing line"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-surface px-3 text-[0.88rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
          />
        </label>

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-brand-teal-deep px-5 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:opacity-50"
          >
            {busy ? "Uploading…" : `Upload a ${chosen.label.toLowerCase()} video`}
          </button>
          <span className="text-[0.75rem] text-slate-400">
            mp4, webm or mov, up to 50MB
          </span>
        </div>

        {/* Fifty megabytes is what this storage plan accepts, and a minute of
            720p is nowhere near it. Anything longer lives on YouTube or Vimeo
            and comes in here as a link. */}
        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="block">
            <span className="text-[0.78rem] font-semibold text-slate-800">
              Or paste a link to a film hosted elsewhere
            </span>
            <span className="mt-0.5 block text-[0.72rem] text-slate-500">
              YouTube, Vimeo or anywhere with a direct https link. Use this for
              anything over 50MB.
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-surface px-3 text-[0.88rem] outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30"
              />
              <button
                type="button"
                disabled={busy || !link.trim()}
                onClick={() => void addLink()}
                className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-50"
              >
                Save the link
              </button>
            </div>
          </label>
        </div>

        {message && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3.5 py-2 text-[0.82rem] text-slate-700">
            {message}
          </p>
        )}
      </div>

      {drafts.length + lives.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-[0.85rem] text-slate-400">
          No {chosen.label.toLowerCase()} videos yet. Upload one and it appears
          here to watch before you publish it.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {drafts.map((film) => (
            <Film key={film.id} upload={film} live={false} onRemove={() => void remove(film.id)} />
          ))}
          {lives
            .filter((film) => !drafts.some((d) => d.id === film.id))
            .map((film) => (
              <Film key={film.id} upload={film} live />
            ))}
        </div>
      )}
    </section>
  );
}
