'use client';

import {useState} from 'react';
import type {SkillModule} from '@/lib/admin-studio-api';
import {playbackSeconds, playbackTime, youtubeEmbedUrl, youtubeVideoId} from '@/lib/youtube-playback';
import s from './studio.module.css';

type Resource = SkillModule['youtube'][number];

export function YouTubePreview({resource}: {resource: Resource}) {
  const src = youtubeEmbedUrl(resource);
  return <div className={s.card}>
    <h3>{resource.title || 'Optional related video'}</h3>
    <p>{resource.whyRelevant}</p>
    {src ? <>
      <p><strong>Lesson segment:</strong> {playbackTime(resource.startSeconds ?? 0)}–{resource.endSeconds === undefined ? 'end of video' : playbackTime(resource.endSeconds)}</p>
      <iframe key={src} title={resource.title || resource.query} src={src} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen/>
      <p>The selected segment uses YouTube’s playback controls. The full video remains available on YouTube.</p>
    </> : <a target="_blank" rel="noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${resource.query} English`)}`}>Search YouTube: {resource.query} ↗</a>}
    <p>{resource.reviewed ? 'Reviewed resource' : 'Not yet reviewed'}</p>
  </div>;
}

export function YouTubeEditor({resource, onChange}: {resource: Resource; onChange: (resource: Resource) => void}) {
  const [link, setLink] = useState(resource.videoId ? `https://www.youtube.com/watch?v=${resource.videoId}` : '');
  const [start, setStart] = useState(playbackTime(resource.startSeconds ?? 0));
  const [end, setEnd] = useState(resource.endSeconds === undefined ? '' : playbackTime(resource.endSeconds));
  const [error, setError] = useState('');
  function apply() {
    const videoId = youtubeVideoId(link);
    const startSeconds = playbackSeconds(start);
    const endSeconds = end.trim() ? playbackSeconds(end) : undefined;
    if (!videoId) { setError('Paste a YouTube video link or its 11-character video ID.'); return; }
    if (startSeconds === undefined || (end.trim() && endSeconds === undefined)) { setError('Use minutes:seconds, for example 0:00 and 4:00.'); return; }
    if (endSeconds !== undefined && endSeconds <= startSeconds) { setError('The end must be later than the start.'); return; }
    setError('');
    onChange({...resource, videoId, startSeconds, endSeconds, reviewed: false, englishReviewed: false});
  }
  return <div className={s.card}>
    <h3>Select the useful part of this video</h3>
    {resource.videoId&&<button type="button" className={s.button} onClick={()=>{setLink('');setStart('0:00');setEnd('');onChange({query:resource.query,whyRelevant:resource.whyRelevant,reviewed:false});}}>Remove this video</button>}
    <p>{resource.query}</p><p><a target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${resource.query} beginner basics English`)}`}>Search YouTube for this lesson ↗</a></p>
    <label>YouTube video link<input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></label>
    <div className={s.cards}>
      <label>Start (minutes:seconds)<input type="text" value={start} onChange={e => setStart(e.target.value)} placeholder="0:00"/></label>
      <label>End (minutes:seconds)<input type="text" value={end} onChange={e => setEnd(e.target.value)} placeholder="4:00 — leave blank for full video"/></label>
    </div>
    {error && <p role="alert">{error}</p>}
    <button type="button" className={s.button} onClick={apply}>Apply video & segment</button>
    <p>Apply to update the preview above, watch the selected part, then save the draft. A 0:00–4:00 selection stops normal playback before a final one-minute outro. YouTube ads are unaffected.</p>
    <label><input type="checkbox" checked={resource.reviewed} disabled={!resource.videoId} onChange={e => onChange({...resource, reviewed: e.target.checked, englishReviewed: e.target.checked})}/>I watched this segment, confirmed the spoken audio is English, and reviewed its relevance and accuracy.</label>
  </div>;
}
