"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";

// Taking or choosing a profile photo.
//
// A recruiter decides whether to read a headline partly on whether there is a
// face beside it, and a great many first profiles have none - so this is worth
// being easy. Two ways in, because the right one depends on where somebody is
// sitting: choose a file, or take one now.
//
// The cropping and shrinking happen here, in the browser:
//   - square, centre-cropped, 320px, JPEG at 0.82
//   - which lands around 25KB, so the upload works on a phone on 3G
//   - and the API never does image work, which is how a photo upload takes a
//     service down on a busy afternoon
//
// The camera stream is stopped on every exit path. A page that leaves the
// webcam light on is a page nobody trusts twice.

const SIZE = 320;

/** Centre-crop to a square and shrink. Returns a JPEG blob. */
async function square(source: CanvasImageSource, w: number, h: number) {
  const side = Math.min(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(
    source,
    (w - side) / 2,
    (h - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
  );
}

export function PhotoPicker({
  photo,
  name = "You",
  busy = false,
  /** An upload failure from the caller, shown here rather than up the page. */
  uploadError = null,
  onPick,
  onCancel,
}: {
  photo?: string | null;
  name?: string;
  busy?: boolean;
  uploadError?: string | null;
  /** Called with the cropped JPEG. The caller uploads it. */
  onPick: (blob: Blob) => void;
  onCancel?: () => void;
}) {
  const [taking, setTaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setTaking(false);
  }, []);

  // Whatever happens - navigation, an error, a successful shot - the camera
  // stops. This is the safety net for every path that forgets.
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setError(null);
    // No getUserMedia - almost always a phone browser, where the file input
    // with capture opens the camera directly and is the better experience
    // anyway. Fall through to that rather than telling them it cannot be done.
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInput.current?.click();
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 640 },
        audio: false,
      });
      stream.current = media;
      setTaking(true);
      // The element exists only once taking is true, so attach on the next
      // frame rather than guessing at a timeout.
      requestAnimationFrame(() => {
        if (video.current) {
          video.current.srcObject = media;
          void video.current.play();
        }
      });
    } catch {
      setError(
        "The camera did not open — your browser may have blocked it. Choose a photo from your device instead.",
      );
    }
  }, []);

  const shoot = useCallback(async () => {
    const el = video.current;
    if (!el) return;
    const blob = await square(el, el.videoWidth, el.videoHeight);
    stop();
    if (blob) onPick(blob);
  }, [onPick, stop]);

  const chooseFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("That needs to be an image.");
        return;
      }
      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const blob = await square(
          image,
          image.naturalWidth,
          image.naturalHeight,
        );
        if (blob) onPick(blob);
        else setError("Could not read that image. Try a different one.");
      } catch {
        // The common one, and it looks like a broken feature unless it is
        // named: iPhones save HEIC by default and no browser can draw one
        // into a canvas. Nothing is wrong with their phone or with us.
        const heic = /\.(heic|heif)$/i.test(file.name);
        setError(
          heic
            ? "Browsers cannot read iPhone HEIC photos. On your phone: Settings → Camera → Formats → Most Compatible, then take it again — or send yourself the photo, which converts it to JPEG."
            : "Could not read that image. A JPEG or PNG will work.",
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [onPick],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
        Your photo
      </p>

      {taking ? (
        <div className="mt-2.5">
          <video
            ref={video}
            playsInline
            muted
            className="mx-auto aspect-square w-40 rounded-full object-cover"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void shoot()}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-brand-teal-deep px-5 text-[0.85rem] font-bold text-white transition-colors hover:bg-brand-teal"
            >
              Take it
            </button>
            <button
              type="button"
              onClick={() => {
                stop();
                onCancel?.();
              }}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.85rem] font-bold text-brand-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-4">
          <Avatar
            src={photo}
            name={name}
            className="h-20 w-20 shrink-0 rounded-full ring-1 ring-slate-200"
            fallbackClassName="grid place-items-center bg-brand-mist text-[1.3rem] font-bold text-brand-teal-deep"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[0.85rem] leading-relaxed text-slate-600">
              {photo
                ? "Change it whenever you like."
                : "A face beside the headline is most of why somebody reads the rest. Plain background, shoulders up."}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.82rem] font-bold text-brand-ink transition-colors hover:border-brand-teal/60 disabled:opacity-40"
              >
                {busy
                  ? "Uploading…"
                  : photo
                    ? "Choose another"
                    : "Upload a photo"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void start()}
                className="inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-slate-300 px-4 text-[0.82rem] font-bold text-brand-ink transition-colors hover:border-brand-teal/60 disabled:opacity-40"
              >
                Take one now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two inputs, not one. capture="user" opens the camera directly on a
          phone - which is right for "take one now" and wrong for "upload",
          where it hides the photo library the person came for. */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void chooseFile(file);
        }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void chooseFile(file);
        }}
      />

      {(error || uploadError) && (
        <p className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.82rem] leading-relaxed text-amber-900">
          {error ?? uploadError}
        </p>
      )}

      <p className="mt-2.5 text-[0.75rem] leading-snug text-slate-400">
        Cropped square and shrunk on your device before it is sent — nothing
        larger than a thumbnail leaves your phone.
      </p>
    </div>
  );
}
