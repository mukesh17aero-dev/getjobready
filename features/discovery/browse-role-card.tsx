
import type { RoleCard } from "./discovery-browse";
import s from "./browse-role-card.module.css";

/** Shared card hierarchy from the Explore handoff. Data and actions stay with the caller. */
export function BrowseRoleCard({ role, chosen, saved, comparing, choosing, saving, onSave, onCompare, onOpen, onChoose }: {
  role: RoleCard; chosen: boolean; saved: boolean; comparing: boolean; choosing: boolean; saving: boolean;
  onSave: () => void; onCompare: () => void; onOpen: () => void; onChoose: () => void;
}) {
  return <article className={s.card} data-chosen={chosen || undefined}>
    <div className={s.visual}>
      <div className={s.illustration} style={{ backgroundImage: `url(/design/role-${/support|success|service|customer/i.test(role.title) ? "support" : /project|coordinat|plan/i.test(role.title) ? "planning" : "store"}.svg)` }} aria-hidden="true" />
      <button className={s.save} type="button" aria-pressed={saved} disabled={saving} onClick={onSave} aria-label={`${saved ? "Remove" : "Add"} ${role.title} ${saved ? "from" : "to"} saved roles`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>
      </button>
    </div>
    <div className={s.body}>
      <h2>{role.title}</h2>
      <p className={s.summary}>{role.summary}</p>
      <p className={s.pay}>{role.pay || "Pay not listed yet"}</p>
      {role.pay && <small>Indicative pay · see role details</small>}
      <p className={s.context}>{role.mix[0]?.label ?? role.world.title}</p>
      <button type="button" className={s.open} onClick={onOpen}>See the day-to-day <span aria-hidden="true">→</span></button>
      <details className={s.more}><summary>Compare or choose this role</summary><div className={s.actions}>
        <label><input type="checkbox" aria-label={`Compare ${role.title}`} checked={comparing} onChange={onCompare} />Compare</label>
        <button type="button" disabled={choosing || chosen} onClick={onChoose}>{chosen ? "Chosen direction" : "Choose this role"}</button>
      </div></details>
    </div>
  </article>;
}
