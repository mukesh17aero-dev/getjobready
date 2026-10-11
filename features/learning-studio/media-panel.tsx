"use client";

// Media for a step: drop a file in, pick one already uploaded, or paste a
// link. Video steps can also use the film the AI made from a storyboard.

import { useRef, useState } from "react";
import { uploadLearningAsset, type LearningAsset, type StudioJourney, type LearningStep } from "@/lib/api";
import { useAdminToken } from "./use-admin-token";
import s from "./learning-studio.module.css";

const ACCEPT: Record<string, string> = {
  image: "image/png,image/jpeg,image/webp,image/gif",
  video: "video/mp4,video/quicktime,video/webm",
  audio: "audio/mpeg,audio/mp4,audio/wav",
};

export function MediaPanel({
  journeyId, journey, step, onChange, onSaved,
}: {
  journeyId: string;
  journey: StudioJourney;
  step: LearningStep;
  onChange: (patch: Partial<LearningStep>) => void;
  onSaved: (journey: StudioJourney) => void;
}) {
  const token = useAdminToken();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const kind = step.type as "image" | "video" | "audio";
  const mine = journey.assets.filter((a) => a.kind === kind);
  const chosen = journey.assets.find((a) => a.id === step.assetId);
  const render = journey.renders[step.id];

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const t = await token();
    const res = t ? await uploadLearningAsset(t, journeyId, file) : null;
    setBusy(false);
    if (!res) return setError("Sign in again to upload.");
    if (!res.ok) return setError(res.reason);
    const asset: LearningAsset = res.data;
    onSaved({ ...journey, assets: [asset, ...journey.assets] });
    if (asset.kind === kind) onChange({ assetId: asset.id, mediaUrl: "" });
    else setError(`That file was added to the journey as a ${asset.kind}, so it cannot be used on this ${kind} step.`);
  }

  return (
    <>
      <div
        className={s.drop}
        data-over={over || undefined}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); const file = e.dataTransfer.files[0]; if (file) void upload(file); }}
      >
        {busy ? <span className={s.progress}><span className={s.pulse} aria-hidden="true" />Uploading…</span> : <><strong>Drop a {kind} here</strong><span>or press to choose a file · up to {kind === "video" ? "50" : kind === "audio" ? "20" : "10"} MB</span></>}
      </div>
      <input ref={input} type="file" accept={ACCEPT[kind]} hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = ""; }} />
      {error && <p className={s.error} role="alert">{error}</p>}

      {chosen && (
        <div>
          <p className={s.note}>Using <strong>{chosen.filename}</strong></p>
          {/* eslint-disable-next-line @next/next/no-img-element -- a private, short-lived signed link; next/image cannot optimise it */}
          {chosen.url && kind === "image" && <img className={s.media} src={chosen.url} alt={step.altText || ""} />}
          {chosen.url && kind === "video" && <video className={s.media} src={chosen.url} controls />}
          {chosen.url && kind === "audio" && <audio src={chosen.url} controls />}
          <button type="button" className={s.quiet} onClick={() => onChange({ assetId: undefined })}>Use something else</button>
        </div>
      )}

      {!chosen && mine.length > 0 && (
        <fieldset className={s.group}>
          <legend>Already uploaded to this journey</legend>
          <ul className={s.assetList}>
            {mine.map((a) => (
              <li key={a.id}>
                <span>{a.filename}</span>
                <button type="button" className={s.secondary} onClick={() => onChange({ assetId: a.id, mediaUrl: "" })}>Use this</button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <label>Or paste a link · must start with https://
        <input type="url" value={step.mediaUrl} onChange={(e) => onChange({ mediaUrl: e.target.value, assetId: undefined })} placeholder="https://" />
      </label>

      {kind === "video" && !chosen && !step.mediaUrl && (
        <p className={s.note}>
          {render?.state === "completed" ? "This step uses the video the AI made. Preview it on the AI help tab." : "No video yet. Upload one, paste a link, or make one with AI on the AI help tab."}
        </p>
      )}
    </>
  );
}
