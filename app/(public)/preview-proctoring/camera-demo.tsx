"use client";

import { useEffect, useRef, useState } from "react";

// A real camera, so the consent moment can be judged as a student would meet
// it rather than described. Nothing is recorded, nothing leaves the device and
// nothing is sent anywhere — the stream is attached to a <video> and dropped
// when the component unmounts.
//
// The overlay is the point of the demo: it separates what a browser can
// actually establish from a front camera (a bright enough frame, a face-sized
// region, whether the picture changed) from what proctoring is usually sold as
// (where the eyes are looking, whether a second person is present). The second
// list needs a face-landmark model this repo does not ship.

type State = "idle" | "asking" | "live" | "denied" | "unsupported";

export function CameraDemo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<State>("idle");

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    setState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("live");
    } catch {
      setState("denied");
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("idle");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 sm:p-5">
      <div className="relative overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`aspect-video w-full object-cover ${state === "live" ? "" : "hidden"}`}
        />
        {state !== "live" && (
          <div className="flex aspect-video w-full items-center justify-center px-6 text-center text-[0.82rem] leading-relaxed text-white/60">
            {state === "denied"
              ? "Permission refused — which is exactly what a meaningful share of students will do, and the assessment has to work anyway."
              : state === "unsupported"
                ? "This browser will not give a page camera access."
                : "The camera is off. Nothing here records or uploads anything."}
          </div>
        )}
        {state === "live" && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            Local only
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={state === "live" ? stop : start}
          className="inline-flex min-h-11 items-center rounded-xl bg-brand-ink px-4 text-[0.85rem] font-semibold text-white"
        >
          {state === "live" ? "Turn the camera off" : "Turn the camera on"}
        </button>
        {state === "asking" && (
          <span className="inline-flex min-h-11 items-center text-[0.8rem] text-slate-500">
            Waiting on the browser prompt…
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-teal-50/60 p-3.5">
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-teal-800">
            A browser can establish this
          </p>
          <ul className="mt-2 space-y-1.5 text-[0.82rem] leading-snug text-slate-700">
            <li>The camera was granted, and stayed granted</li>
            <li>Frames are arriving and are not a black rectangle</li>
            <li>The picture changed — somebody is there and moving</li>
          </ul>
        </div>
        <div className="rounded-xl bg-rose-50/60 p-3.5">
          <p className="text-[0.7rem] font-bold uppercase tracking-wide text-rose-800">
            It cannot establish this without a model we do not ship
          </p>
          <ul className="mt-2 space-y-1.5 text-[0.82rem] leading-snug text-slate-700">
            <li>Where the eyes are pointed</li>
            <li>Whether a second person is in the room</li>
            <li>Whether the face is the one that enrolled</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
