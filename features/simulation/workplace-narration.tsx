"use client";

import { useEffect, useRef, useState } from "react";
import s from "./workplace-orientation.module.css";

/** Optional device narration. The complete transcript always remains on screen. */
export function WorkplaceNarration({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      window.speechSynthesis?.cancel();
      utterance.current = null;
    }
  }, [text]);

  function toggle() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setNotice("Audio isn't supported in this browser. The full explanation is below.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 0.92;
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => {
      setSpeaking(false);
      setNotice("Audio stopped. You can read the explanation or try again.");
    };
    utterance.current = speech;
    setNotice("");
    setSpeaking(true);
    window.speechSynthesis.speak(speech);
  }

  return <div className={s.audio}>
    <button type="button" onClick={toggle} aria-pressed={speaking}>
      <span aria-hidden="true">{speaking ? "■" : "▷"}</span> {speaking ? "Stop narration" : "Listen to this chapter"}
    </button>
    <small>Optional device voice · text available below</small>
    {notice && <p role="status">{notice}</p>}
  </div>;
}
