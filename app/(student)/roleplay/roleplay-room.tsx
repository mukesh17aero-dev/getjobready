"use client";

// The live conversation: record or type a reply, hear the persona's next
// line, repeat until the conversation concludes.
//
// Turn-based, not a live call — record your reply, then listen to their
// response. There is a short pause while it transcribes, thinks and
// synthesises the next line; the UI says so rather than pretending otherwise.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPersonaAudio,
  finishRoleplay,
  leaveRoleplay,
  personaLineAudioUrl,
  replyWithAudio,
  replyWithText,
  type RoleplaySessionView,
  type RoleplaySummaryView,
} from "@/features/roleplay";
import { recordingFormat } from "./recording";

export function RoleplayRoom({
  session,
  speechAvailable,
  getToken,
  onSessionUpdate,
  onFinished,
  onLeft,
}: {
  session: RoleplaySessionView;
  speechAvailable: boolean;
  getToken: () => Promise<string | null>;
  onSessionUpdate: (session: RoleplaySessionView) => void;
  onFinished: (summary: RoleplaySummaryView) => void;
  onLeft: () => void;
}) {
  const [micState, setMicState] = useState<"idle" | "asking" | "denied">("idle");
  const [recording, setRecording] = useState(false);
  const [typing, setTyping] = useState(!speechAvailable);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState<"sending" | "finishing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioTurn, setAudioTurn] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sendingRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const turns = session.turns;
  const openTurn = turns[turns.length - 1] ?? null;
  const awaitingReply = Boolean(openTurn && openTurn.reply === null);

  // Speak the newest persona line, once, when it arrives. Text is shown
  // immediately regardless — voice is an addition, never something the
  // transcript waits on.
  useEffect(() => {
    if (!speechAvailable || !openTurn || openTurn.reply !== null) return;
    if (audioTurn === openTurn.index) return;
    let cancelled = false;
    (async () => {
      let url: string | null = null;
      if (session.speechTicket) {
        url = personaLineAudioUrl(session.speechTicket, openTurn.index);
      } else {
        const t = await getToken();
        url = t ? await fetchPersonaAudio(t, openTurn.index) : null;
      }
      if (cancelled || !url) return;
      setAudioUrl((old) => {
        if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
        return url;
      });
      setAudioTurn(openTurn.index);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTurn?.index, speechAvailable]);

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    audioRef.current.play().catch(() => {
      // Autoplay refused: the replay control is right there.
    });
  }, [audioUrl]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length]);

  // Release the mic whatever ends this screen.
  useEffect(
    () => () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const advance = useCallback(
    async (result: Awaited<ReturnType<typeof replyWithText>>) => {
      if (!result.ok) {
        if (result.session) {
          onSessionUpdate(result.session);
          return;
        }
        setError(result.error);
        setTyping(true);
        return;
      }
      onSessionUpdate(result.session);
    },
    [onSessionUpdate],
  );

  const submitText = async () => {
    const text = typed.trim();
    if (!text || !awaitingReply || sendingRef.current) return;
    sendingRef.current = true;
    setBusy("sending");
    setError(null);
    const t = await getToken();
    const result = t
      ? await replyWithText(t, text)
      : { ok: false as const, error: "Your session expired. Sign in again." };
    sendingRef.current = false;
    setBusy(null);
    if (result.ok) setTyped("");
    await advance(result);
  };

  const startRecording = async () => {
    const format = recordingFormat();
    if (!format || !navigator.mediaDevices?.getUserMedia) {
      setMicState("denied");
      setTyping(true);
      return;
    }
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: format.mime, audioBitsPerSecond: 32000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: format.mime });
        if (blob.size === 0 || sendingRef.current) return;
        sendingRef.current = true;
        setBusy("sending");
        setError(null);
        const t = await getToken();
        const result = t
          ? await replyWithAudio(t, blob, format.filename)
          : { ok: false as const, error: "Your session expired. Sign in again." };
        sendingRef.current = false;
        setBusy(null);
        await advance(result);
      };
      recorderRef.current = recorder;
      recorder.start();
      setMicState("idle");
      setRecording(true);
    } catch {
      setMicState("denied");
      setTyping(true);
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const finish = async () => {
    setBusy("finishing");
    setError(null);
    const t = await getToken();
    const result = t
      ? await finishRoleplay(t)
      : { error: "Your session expired. Sign in again." };
    setBusy(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onFinished(result.summary);
  };

  const leave = async () => {
    const t = await getToken();
    if (t) await leaveRoleplay(t);
    onLeft();
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-violet-deep">
            {session.scenarioTitle}
          </p>
          <h1 className="text-xl font-bold text-brand-ink">Talking with {session.personaName}</h1>
        </div>
        <button
          type="button"
          onClick={() => void leave()}
          className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline"
        >
          Leave without finishing
        </button>
      </header>

      <audio ref={audioRef} src={audioUrl ?? undefined} className="hidden" />

      <ol className="space-y-3">
        {turns.map((turn) => (
          <li key={turn.index} className="space-y-2">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm leading-relaxed text-slate-800">
              <p className="mb-0.5 text-[0.75rem] font-bold uppercase tracking-wide text-violet-600">
                {session.personaName}
              </p>
              {turn.personaLine}
            </div>
            {turn.reply !== null && (
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm border border-teal-200 bg-teal-50 px-4 py-2.5 text-right text-sm leading-relaxed text-slate-800">
                <p className="mb-0.5 text-[0.75rem] font-bold uppercase tracking-wide text-teal-700">You</p>
                {turn.reply}
              </div>
            )}
          </li>
        ))}
        <div ref={threadEndRef} />
      </ol>

      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      )}

      {session.done ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm font-semibold text-teal-800">
            This conversation has run its course.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void finish()}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-teal-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand-teal disabled:cursor-wait disabled:opacity-60"
          >
            {busy === "finishing" ? "Writing your feedback…" : "Get my feedback →"}
          </button>
        </div>
      ) : awaitingReply ? (
        <div className="rounded-2xl border border-slate-200 bg-surface p-4">
          {typing ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="roleplay-typed">
                Your reply
              </label>
              <textarea
                id="roleplay-typed"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-brand-ink focus-visible:outline-2 focus-visible:outline-brand-violet"
                placeholder="Type what you'd say…"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!typed.trim() || busy !== null}
                  onClick={() => void submitText()}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-violet px-5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:cursor-wait disabled:opacity-60"
                >
                  {busy === "sending" ? "Sending…" : "Send reply →"}
                </button>
                {speechAvailable && (
                  <button
                    type="button"
                    onClick={() => setTyping(false)}
                    className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline"
                  >
                    Switch to speaking
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {recording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-bold text-white"
                >
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-white" />
                  Stop and send
                </button>
              ) : (
                <button
                  type="button"
                  disabled={micState === "asking" || busy !== null}
                  onClick={() => void startRecording()}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-violet px-5 text-sm font-bold text-white transition-colors hover:bg-brand-violet-deep disabled:cursor-wait disabled:opacity-60"
                >
                  {micState === "asking" ? "Asking for your microphone…" : "Record my reply"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setTyping(true)}
                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline"
              >
                Type instead
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500" role="status">
          {session.personaName} is replying…
        </p>
      )}
    </div>
  );
}
