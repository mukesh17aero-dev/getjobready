'use client';

import {useState, type ReactNode} from 'react';
import type {RolePackage} from '@/features/admin';
import {IntroductionPreview} from './role-introduction';
import {ModulePreview} from './role-studio';
import s from './studio.module.css';

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Row : {};
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const label = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
const title = (value: unknown, index = 0): string => {
  const item = row(value);
  return text(item.roleTitle || item.title || item.name || item.label || item.filename || item.question || item.id) || `Entry ${index + 1}`;
};

/** Render every snapshot field as readable content, including older/custom fields. */
function Value({value}: {value: unknown}): ReactNode {
  if (value === null || value === undefined || value === '') return <p>Not provided</p>;
  if (typeof value === 'boolean') return <p>{value ? 'Yes' : 'No'}</p>;
  if (typeof value !== 'object') return <p className={s.previewText}>{String(value)}</p>;
  if (Array.isArray(value)) {
    if (!value.length) return <p>No entries</p>;
    if (value.every(v => typeof v !== 'object')) return <ul>{value.map((v, i) => <li key={i}>{String(v)}</li>)}</ul>;
    return <div>{value.map((v, i) => <details key={i}><summary>{title(v, i)}</summary><Fields value={row(v)}/></details>)}</div>;
  }
  return <Fields value={row(value)}/>;
}
function Fields({value, omit = []}: {value: Row; omit?: string[]}) {
  return <div className={s.previewFields}>{Object.entries(value).filter(([key]) => !omit.includes(key)).map(([key, v]) =>
    v !== null && typeof v === 'object' ? <details key={key}><summary>{label(key)}{Array.isArray(v) ? ` · ${v.length}` : ''}</summary><Value value={v}/></details>
      : <div key={key}><strong>{label(key)}</strong><Value value={v}/></div>)}</div>;
}
function Records({items, noun, render}: {items: unknown[]; noun: string; render: (item: Row, index: number) => ReactNode}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const filtered = items.map((value, index) => ({value: row(value), index})).filter(item => JSON.stringify(item.value).toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const current = Math.min(page, pages - 1);
  return <section>
    <label>Search {noun}<input type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(0);}} placeholder={`Search this revision’s ${noun}`}/></label>
    <p>{filtered.length} {noun} · Showing {filtered.length ? current * 5 + 1 : 0}–{Math.min((current + 1) * 5, filtered.length)}</p>
    <div className={s.previewRecords}>{filtered.slice(current * 5, current * 5 + 5).map(({value, index}) => <article key={index} className={s.card}>{render(value, index)}</article>)}</div>
    {!filtered.length && <p>No matching {noun} in this revision.</p>}
    {pages > 1 && <nav className={s.actions} aria-label={`${noun} pages`}><button className={s.button} disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button><span>Page {current + 1} of {pages}</span><button className={s.button} disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Next</button></nav>}
  </section>;
}
function RolePicker({items, render, noun = 'role'}: {items: unknown[]; noun?: string; render: (item: Row) => ReactNode}) {
  const [index, setIndex] = useState(0);
  if (!items.length) return <p>No roles in this revision.</p>;
  const selected = Math.min(index, items.length - 1);
  return <><label>Preview {noun}<select className={s.previewSelect} value={selected} onChange={e => setIndex(Number(e.target.value))}>{items.map((item, i) => <option key={i} value={i}>{title(item, i)}</option>)}</select></label><div key={selected}>{render(row(items[selected]))}</div></>;
}
function Question({item, index}: {item: Row; index: number}) {
  return <>
    <span className={s.tag}>{text(item.round || item.day) || `Question ${index + 1}`}</span>
    <h3>{text(item.title || item.question) || `Question ${index + 1}`}</h3>
    {item.brief !== undefined && <Value value={item.brief}/>}
    {item.cards !== undefined && <div className={s.cards}>{list(item.cards).map((card, i) => <div className={s.scene} key={i}><h3>{title(card, i)}</h3><Value value={row(card).body}/></div>)}</div>}
    {item.fields !== undefined && <><h4>What to provide</h4><Value value={item.fields}/></>}
    {item.interaction !== undefined && <><h4>Response options</h4><Value value={item.interaction}/></>}
    <details><summary>Skills & reviewer guidance</summary><Fields value={item} omit={['title', 'question', 'brief', 'cards', 'fields', 'interaction', 'round', 'day']}/></details>
  </>;
}
function Simulation({value}: {value: Row}) {
  const [view, setView] = useState('Curriculum');
  const p = value as unknown as RolePackage;
  return <><h2>{p.roleTitle}</h2><p className={s.previewText}>{p.context}</p><p>{p.reviewerNotes}</p>
    {p.learningJourney&&<section><h3>Learning journey · {p.learningJourney.title}</h3><p>{p.learningJourney.description}</p><Records items={p.learningJourney.activities} noun="learning activities" render={activity=><><h3>{text(activity.title)}</h3><Fields value={activity}/></>}/></section>}
    <details><summary>Role skills & assessment policy</summary><Fields value={value} omit={['modules', 'roleTitle', 'context', 'reviewerNotes']}/></details>
    <nav className={s.tabs} aria-label="Material preview">{['Curriculum', 'Assessment', 'Simulations'].map(tab => <button className={view === tab ? s.active : ''} aria-pressed={view === tab} key={tab} onClick={() => setView(tab)}>{tab}</button>)}</nav>
    {view==='Curriculum'&&p.introduction&&<IntroductionPreview intro={p.introduction}/>}
    {p.modules.length ? <RolePicker noun="skill" items={p.modules} render={m => <ModulePreview module={m as unknown as RolePackage['modules'][number]} view={view}/>}/> : <p>No generated modules in this revision.</p>}
  </>;
}

export function ReviewSnapshot({value, resource}: {value: unknown; resource: string}) {
  const snapshot = row(value);
  const kind = resource.replace(/^content:/, '');
  if (Array.isArray(snapshot.modules) && typeof snapshot.roleTitle === 'string') return <Simulation value={snapshot}/>;
  if (kind === 'role_catalogue' || Array.isArray(snapshot.roles)) {
    const details = list(snapshot.details).map(row);
    return <><h3>Discovery role preview</h3><RolePicker items={list(snapshot.roles)} render={role => {
      const detail = details.find(d => d.roleId === role.id) || {};
      return <><span className={s.tag}>{text(detail.sector || role.world)}</span><h2>{text(role.title)}</h2><p>{text(role.summary)}</p><div className={s.scene}><h3>{text(detail.pitch) || 'About this role'}</h3><p className={s.previewText}>{text(detail.description)}</p></div>
        <div className={s.cards}><section className={s.card}><h3>What you will do</h3><Value value={detail.responsibilities}/></section><section className={s.card}><h3>Skills you will use</h3><Value value={detail.skills}/></section></div>
        <Fields value={detail} omit={['roleId', 'sector', 'pitch', 'description', 'responsibilities', 'skills']}/><details><summary>Role mapping details</summary><Fields value={role} omit={['title', 'summary', 'world']}/></details></>;
    }}/><details><summary>Other catalogue details</summary><Fields value={snapshot} omit={['roles', 'details']}/></details></>;
  }
  if (kind === 'assessment_arc' || Array.isArray(snapshot.arcs)) return <><h3>Role assessment preview</h3><RolePicker items={list(snapshot.arcs)} render={arc => <><h2>{text(arc.roleTitle)}</h2><p>{text(arc.company)}</p><details><summary>Workplace & assignment context</summary><Fields value={arc} omit={['roleTitle', 'company', 'scenes']}/></details><Records items={list(arc.scenes)} noun="questions" render={(item, index) => <Question item={item} index={index}/>}/></>}/><Fields value={snapshot} omit={['arcs']}/></>;
  if (kind === 'interview_bank' || Array.isArray(snapshot.sets)) return <><h3>Interview question preview</h3><RolePicker items={list(snapshot.sets)} render={set => <><h2>{text(set.roleTitle)}</h2><Records items={list(set.questions)} noun="questions" render={(item, index) => <Question item={item} index={index}/>}/><Fields value={set} omit={['roleTitle', 'questions']}/></>}/><Fields value={snapshot} omit={['sets']}/></>;
  if (kind === 'skill_model' || Array.isArray(snapshot.skills)) return <><h3>Skills & role coverage</h3><Records items={list(snapshot.skills)} noun="skills" render={skill => <><h3>{text(skill.name)}</h3><p>{text(skill.description)}</p><div className={s.previewTable}><table><thead><tr><th>Role</th><th>Importance</th></tr></thead><tbody>{Object.entries(row(row(snapshot.skillRole)[text(skill.id)])).map(([roleId, weight]) => <tr key={roleId}><td>{label(roleId)}</td><td>{text(weight)}{typeof weight === 'number' ? ` · ${['Not mapped', 'Helpful', 'Daily', 'Critical'][weight] || 'Configured weight'}` : ''}</td></tr>)}</tbody></table></div><Fields value={skill} omit={['name', 'description']}/></>}/><details><summary>Signal & trait configuration</summary><Fields value={snapshot} omit={['skills', 'skillRole']}/></details><details><summary>Complete role mapping</summary><Value value={snapshot.skillRole}/></details></>;
  if (kind === 'video_uploads') return <><h3>Video library preview</h3>{Object.entries(snapshot).map(([category, items]) => <section key={category}><h3>{label(category)}</h3><Records items={list(items)} noun="videos" render={video => <><h3>{text(video.filename)}</h3>{/^https?:\/\//.test(text(video.url)) && <video controls playsInline preload="none" src={text(video.url)}/>}<Fields value={video} omit={['filename']}/></>}/></section>)}</>;
  return <><h3>{label(kind || 'Content')} preview</h3><Fields value={snapshot}/>{Object.keys(snapshot).length === 0 && <Value value={value}/>}</>;
}
