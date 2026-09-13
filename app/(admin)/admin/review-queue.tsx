'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { studioRequest, type ReviewInbox, type ReviewRequest } from '@/lib/admin-studio-api';
import { ReviewSnapshot } from './review-snapshot';
import s from './studio.module.css';
const contentLabel = (resource: string) => resource.replace(/^content:/, '').replaceAll('_', ' ').replace(/^./, c => c.toUpperCase());
export function ReviewQueue() {
    const [data, setData] = useState<ReviewInbox | null>(null), [selected, setSelected] = useState(''), [comment, setComment] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [status, setStatus] = useState(''), [snapshot, setSnapshot] = useState<ReviewRequest | null>(null);
    async function load() { try {
        const d = await studioRequest<ReviewInbox>('/reviews');
        setData(d);
        setSelected(id => id || new URLSearchParams(window.location.search).get('review') || d.reviews[0]?.id || '');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load reviews.');
    } }
    useEffect(() => { let active = true; const refresh = () => studioRequest<ReviewInbox>('/reviews').then(d => { if (active) {
        setData(d);
        setSelected(id => id || new URLSearchParams(window.location.search).get('review') || d.reviews[0]?.id || '');
    } }).catch(e => { if (active)
        setError(e instanceof Error ? e.message : 'Unable to load reviews.'); }); void refresh(); const timer = setInterval(() => void refresh(), 30000); return () => { active = false; clearInterval(timer); }; }, []);
    useEffect(() => { if (!selected)
        return; let active = true; void studioRequest<ReviewRequest>(`/reviews/${selected}`).then(r => { if (active)
        setSnapshot(r); }).catch(e => { if (active)
        setError(e instanceof Error ? e.message : 'Unable to load snapshot.'); }); return () => { active = false; }; }, [selected, data]);
    const review = snapshot?.id === selected ? snapshot : null;
    async function decide(decision: string) { if (!review)
        return; setBusy(true); setError(''); try {
        await studioRequest(`/reviews/${review.id}/decision`, { decision, comment });
        setStatus('Your review was recorded.');
        setComment('');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save review.');
    }
    finally {
        setBusy(false);
    } }
    return <main className={s.root}><header className={s.header}><div><div className={s.eyebrow}>Admin · Review inbox</div><h1>Review before it reaches learners.</h1><p>Two distinct approvals. One exact revision. Feedback the author can act on.</p></div><nav className={s.links}><Link href="/admin/studio">Role studio</Link><Link href="/admin?view=content">Content console</Link><button className={s.button} onClick={() => void load()}>Refresh inbox</button></nav></header>{error && <div role="alert" className={s.error}>{error}</div>}{status && <div role="status" className={s.status}>{status}</div>}{data?.testApprovalBypass && <div className={s.notice}>LOCAL TEST: approval checks are bypassed for publication to the local database. Live environments still require two admin approvals. No review emails are sent in test mode.</div>}{data && !data.emailConfigured && <div className={s.notice}>Email delivery is not configured. In-app notifications remain available; emails stay queued until the sender and background worker are configured.</div>}{data && data.reviewerCount < 2 && <div className={s.notice}>Publishing approvers have not been configured. Live publication requires two reviewers other than the author.</div>}
    {!!data?.notifications.length && <details className={s.inbox}><summary>Notifications · {data.notifications.filter(n => !n.read_at).length} unread</summary>{data.notifications.map(n => <div className={s.row} key={n.id}><div><strong>{n.title}</strong><p>{n.message}</p><small>Email: {n.email_status}{n.last_error ? ` · ${n.last_error}` : ''}</small></div><button className={s.button} onClick={() => { setSelected(n.review_id); void studioRequest(`/notifications/${n.id}/read`, {}).then(load).catch(e => setError(String(e))); }}>Open review</button></div>)}</details>}
    <div className={s.grid}><aside className={s.rail}>{data?.reviews.map(r => <button key={r.id} className={`${s.role} ${r.id === selected ? s.selected : ''}`} onClick={() => { setSelected(r.id); setComment(''); }}><strong>{r.title === 'LOCAL TEST — approval bypass' ? contentLabel(r.resource) : r.title}</strong><small>{r.state} · {r.approvals}/2 approvals{r.blocked ? ' · Changes needed' : ''}</small></button>)}{data?.reviews.length === 0 && <p className={s.card}>No review requests yet. Save a draft, then request review.</p>}</aside><section className={s.workspace}><div className={s.body}>{review ? <><div className={s.title}><div><span className={s.eyebrow}>Fixed review snapshot</span><h2>{review.title === 'LOCAL TEST — approval bypass' ? contentLabel(review.resource) : review.title}</h2><p>Requested by {review.author_email}</p></div><span className={s.tag}>{review.approvals} / 2 approvals</span></div><div className={s.notice}>{review.state === 'published' ? 'This revision has been published.' : review.state === 'superseded' ? 'A newer revision replaced this request. Open the latest review.' : review.blocked ? 'Changes requested or declined. Resolve feedback before publication.' : review.ready ? 'Approved by two admins. The author can publish this exact revision.' : 'Waiting for two distinct admin approvals.'}</div><ReviewSnapshot key={review.id} value={review.snapshot} resource={review.resource}/><h3>Review history</h3>{review.events.length ? review.events.map((e, i) => <div className={s.row} key={i}><div><strong>{e.actor_email} · {e.decision.replaceAll('_', ' ')}</strong><p>{e.comment || 'Approved this revision.'}</p><small>{new Date(e.created_at).toLocaleString()}</small></div></div>) : <p>No decisions yet.</p>}<label htmlFor="feedback">Feedback for the author</label><textarea id="feedback" value={comment} onChange={e => setComment(e.target.value)} placeholder="Be specific: name the skill or task, explain the issue and suggest a correction."/><div className={s.actions}>{[['approve', 'Approve revision'], ['changes_requested', 'Request changes'], ['comment', 'Add comment'], ['decline', 'Decline']].map(([v, label]) => <button key={v} className={v === 'approve' ? s.primary : s.button} disabled={busy || !data?.canReview || review.state !== 'pending'} onClick={() => void decide(v)}>{label}</button>)}</div></> : <p>Select a review request to preview its exact content and leave feedback.</p>}</div></section></div></main>;
}
