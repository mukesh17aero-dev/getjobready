"use client";

// How a reply is recorded — duplicated from the AI Interview page's own
// recording helper rather than shared, since that helper lives outside any
// feature's public barrel and this page is a fully separate domain.

/** The best mime type this browser's MediaRecorder actually supports, or null when none is. */
export function recordingFormat(): { mime: string; filename: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mime: "audio/webm", filename: "reply.webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return { mime: "audio/mp4", filename: "reply.mp4" };
  }
  return null;
}
