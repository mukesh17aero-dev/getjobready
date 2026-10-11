import s from './interest-selection.module.css';

export function InterestSelection({ options, selected, onToggle, onContinue }: {
  options: Array<{id:string;title:string;caption:string;disabled:boolean}>;
  selected:string[]; onToggle:(id:string)=>void; onContinue:()=>void;
}) {
  return <main className={s.main}>
    <header><p>A QUICK START</p><h1>You don’t need a career plan yet.</h1><span>Start with the kind of work you might enjoy. You can change this any time.</span></header>
    <div className={s.grid}>
      <aside className={s.intro}><h2>What sounds like you?</h2><p>Your interests help organise roles.<br/>They don’t decide your future.</p><div className={s.art} aria-hidden="true"/><p>Not sure where to begin?<br/>Browse every role and see what catches your attention.</p><button onClick={onContinue}>{selected.length ? 'Show matching roles first' : 'Explore all roles'} <span aria-hidden="true">→</span></button></aside>
      <section aria-label="Your interests"><div className={s.options}>{options.map((option,index)=><label className={s.option} key={option.id} data-disabled={option.disabled||undefined}><span className={s.icon} aria-hidden="true">{['⌂','▣','◇','▷'][index%4]}</span><span><strong>{option.title}</strong><small>{option.caption}</small></span><input type="checkbox" checked={selected.includes(option.id)} disabled={option.disabled} onChange={()=>onToggle(option.id)}/></label>)}</div><p className={s.hint}>Pick any that interest you, or explore all roles.</p></section>
    </div>
  </main>;
}
