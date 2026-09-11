import type { Metadata } from "next";
import { ResumePlans } from "./resume-plans";

export const metadata: Metadata = { title: "Resume plans preview", robots: { index: false, follow: false } };
export default function ResumePlansPreview() { return <ResumePlans />; }
