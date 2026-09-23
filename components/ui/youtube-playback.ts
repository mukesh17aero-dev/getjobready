/** URL and time formatting only; content approval stays in the backend. */
export function youtubeVideoId(value: string): string | undefined {
  const input = value.trim();
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol)) return undefined;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    const id = host === 'youtu.be' ? parts[0]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)
        ? url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : undefined
        : undefined;
    return id && /^[\w-]{11}$/.test(id) ? id : undefined;
  } catch { return undefined; }
}

export function playbackSeconds(value: string): number | undefined {
  const text = value.trim();
  if (!/^\d{1,4}:[0-5]\d$/.test(text)) return undefined;
  const [minutes, seconds] = text.split(':').map(Number);
  const total = minutes * 60 + seconds;
  return total <= 86400 ? total : undefined;
}

export function playbackTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function youtubeEmbedUrl(resource: {videoId?: string; startSeconds?: number; endSeconds?: number}): string | undefined {
  if (!resource.videoId || !/^[\w-]{11}$/.test(resource.videoId)) return undefined;
  const params = new URLSearchParams({start: String(resource.startSeconds ?? 0), playsinline: '1', enablejsapi: '1'});
  if (resource.endSeconds !== undefined) params.set('end', String(resource.endSeconds));
  return `https://www.youtube-nocookie.com/embed/${resource.videoId}?${params}`;
}
