// Same strip as the shared design, honest contents: factual product claims
// only. Real platform numbers replace these once real data exists — invented
// counts and ratings never ship.
const CLAIMS = [
  { icon: "🧾", title: "Evidence-first", caption: "Every claim backed by stored proof" },
  { icon: "⚖️", title: "Rules decide", caption: "Scores from published rules, not AI opinion" },
  { icon: "🛡️", title: "You control sharing", caption: "Nothing employer-facing without consent" },
  { icon: "📈", title: "Built for", caption: "Real career growth, 0–3 yrs" },
];

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-2 gap-y-3 rounded-2xl border border-slate-200 bg-white px-3 py-4 sm:grid-cols-4 sm:gap-y-0">
      {CLAIMS.map(({ icon, title, caption }, i) => (
        <li
          key={title}
          className={`flex items-center justify-start gap-2.5 px-3 text-xs text-slate-500 sm:justify-center ${
            i > 0 ? "sm:border-l sm:border-slate-200" : ""
          }`}
        >
          <span aria-hidden className="text-xl">
            {icon}
          </span>
          <span>
            <span className="block text-[0.85rem] font-semibold text-slate-900">
              {title}
            </span>
            {caption}
          </span>
        </li>
      ))}
    </ul>
  );
}
