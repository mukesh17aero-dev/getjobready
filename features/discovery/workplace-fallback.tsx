export function WorkplaceFallback({ stop, title }: { stop: number; title: string }) {
  const labels = ["The workplace: a work desk, tools and a team", "A working day: receive a task, check the records, complete a handoff", "The role reality: competing requests need a decision and an escalation boundary"];
  return <div className="discovery-workplace-stage" style={{ minHeight: 260, display: "grid", placeItems: "center", background: "var(--color-violet-50)", padding: 20 }}>
    <svg viewBox="0 0 480 300" role="img" aria-label={`${title}. ${labels[stop]}. Conceptual illustration.`} style={{ width: "100%", maxWidth: 520, color: "var(--color-violet-700)" }}>
      <rect x="15" y="15" width="450" height="270" rx="24" fill="var(--color-surface)" />
      {stop === 0 ? <g fill="none" stroke="currentColor" strokeWidth="5"><path d="M65 200H415M95 200V255M385 200V255" /><rect x="160" y="85" width="150" height="95" rx="8"/><path d="M235 180V200M185 112H280M185 135H252"/><circle cx="85" cy="130" r="22"/><path d="M55 180Q85 140 115 180"/><circle cx="380" cy="130" r="22"/><path d="M350 180Q380 140 410 180"/></g>
        : stop === 1 ? <g fill="none" stroke="currentColor" strokeWidth="4"><rect x="45" y="80" width="100" height="140" rx="10"/><rect x="190" y="80" width="100" height="140" rx="10"/><rect x="335" y="80" width="100" height="140" rx="10"/><path d="M65 110H125M65 135H115M65 160H125M150 150H180L170 140M180 150L170 160M295 150H325L315 140M325 150L315 160M210 150L230 170L270 120M355 110H415M355 135H405M355 160H415"/></g>
          : <g fill="none" stroke="currentColor" strokeWidth="5"><rect x="45" y="65" width="95" height="70" rx="10"/><rect x="45" y="170" width="95" height="70" rx="10"/><path d="M140 100L220 150M140 205L220 150M255 150L335 85M255 150L335 215"/><circle cx="240" cy="150" r="28"/><path d="M350 110V60M333 77L350 60L367 77M335 215L350 230L385 190"/></g>}
      <text x="240" y="265" textAnchor="middle" fill="currentColor" fontSize="17">{["People · Tools · Workplace", "Receive → Check → Handoff", "Prioritise · Check authority · Escalate"][stop]}</text>
    </svg>
    <p className="discovery-workplace-caption">Illustrative 2D view · {title}</p>
  </div>;
}
