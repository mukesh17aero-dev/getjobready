"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ResumeData, ResumeTemplate } from "./resume-api";
import { ResumeSheet } from "./resume-sheet";
import s from "./resume-studio.module.css";

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Print outside the app layout so hidden navigation cannot create blank pages. */
export function ResumePrintDocument({ resume, template, role, track }: {
  resume: ResumeData; template: ResumeTemplate; role: string; track?: "student" | "early_career";
}) {
  const mounted = useSyncExternalStore(subscribe, client, server);
  return mounted ? createPortal(<div className={s.printDocument}><ResumeSheet resume={resume} template={template} roleLine={role} track={track} /></div>, document.body) : null;
}
