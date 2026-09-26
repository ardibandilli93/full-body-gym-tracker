import { useEffect, useRef, useState } from 'react';

const source = '/assets/training/duo.mp4';
const poster = '/assets/training/poster.jpg';

export function ProgressMotion() {
  const video = useRef(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!video.current) return;
    if (reduced || paused) video.current.pause();
    else video.current.play().catch(() => setPaused(true));
  }, [reduced, paused]);

  return <div className="motion-frame training-film">
    {reduced
      ? <img src={poster} alt="Two 3D anime athletes ready to train together" />
      : <video ref={video} src={source} poster={poster} autoPlay loop muted playsInline preload="metadata" aria-label="Two 3D anime athletes exercise and practice light sparring" />}
    {!reduced && <button type="button" className="film-toggle" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play animation' : 'Pause animation'}>{paused ? '▶' : 'Ⅱ'}</button>}
  </div>;
}
