import { Player } from '@remotion/player';
import { Lottie } from '@remotion/lottie';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import pulse from './pulse.json';

function MotionScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const drift = interpolate(frame, [0, 75, 150], [0, -8, 0]);
  return <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 48%, #283a24 0%, #131d1b 55%, #0d1518 100%)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <div style={{ width: 206, height: 206, scale, translate: `0 ${drift}px`, filter: 'drop-shadow(0 22px 34px #0008)' }}><Lottie animationData={pulse} /></div>
    <div style={{ position: 'absolute', left: 24, bottom: 21, color: '#d7fbbc', fontFamily: 'system-ui', fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>SHOW UP. GET STRONGER.</div>
  </AbsoluteFill>;
}

export function ProgressMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <div className="motion-frame" aria-hidden="true"><Player component={MotionScene} durationInFrames={150} compositionWidth={400} compositionHeight={250} fps={30} autoPlay={!reduced} loop={!reduced} muted acknowledgeRemotionLicense style={{ width: '100%', height: '100%' }} /></div>;
}
