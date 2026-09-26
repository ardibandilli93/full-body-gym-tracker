import { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { interpolate, useCurrentFrame } from 'remotion';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const strike = (frame, start) => interpolate(frame, [start, start + 5, start + 8, start + 19], [0, 1, 1, 0], clamp);
const mix = (a, b, progress) => a + (b - a) * progress;

// Original articulated artwork; all movement follows the Remotion frame clock.
function TrainingPartner({ x, mirror, frame, punch, block, squat, alternate }) {
  const accent = alternate ? '#a4d8e7' : '#c5fa82';
  const shade = alternate ? '#477b91' : '#709842';
  const skin = alternate ? '#cf957c' : '#efc4a0';
  const hair = alternate ? '#dce8df' : '#293940';
  const bob = Math.sin(frame * Math.PI / 15) * 1.4;
  const drop = squat * 17 + bob;
  const lean = punch * 6 - block * 3;
  const wrist = [mix(35, 98, punch) + block * 35, mix(-66, -76, Math.max(punch, block))];
  const elbow = [mix(33, 57, punch) + block * 7, mix(-29, -64, punch)];
  const knee = 25 + squat * 13;
  return <g transform={`translate(${x + (mirror ? -lean : lean)},${214 + drop}) scale(${mirror ? -1 : 1},1)`} stroke="#0b171b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
    {alternate && <path d={`M-17 -111 Q-56 -119 -46 ${-71 + bob * 3} Q-33 -84 -20 -85Z`} fill={hair} />}
    {/* Far arm and leg are shaded to give the stance depth. */}
    <path d={`M-13 -49 L-32 -25 L-15 -62`} fill="none" stroke="#0b171b" strokeWidth="18" />
    <path d="M-13 -49 L-32 -25 L-15 -62" fill="none" stroke={shade} strokeWidth="13" />
    <path d={`M-10 -2 L${-knee} 28 L${-31 - squat * 8} ${59 - drop}`} fill="none" stroke="#0b171b" strokeWidth="24" />
    <path d={`M-10 -2 L${-knee} 28 L${-31 - squat * 8} ${59 - drop}`} fill="none" stroke="#26383e" strokeWidth="18" />
    <path d={`M-42 ${53 - drop} l17 2 5 11 -31 0 q-2 -6 9 -13Z`} fill={shade} transform={`translate(${-squat * 8},0)`} />
    <path d={`M13 -2 L${knee + 3} 28 L${37 + squat * 8} ${59 - drop}`} fill="none" stroke="#0b171b" strokeWidth="25" />
    <path d={`M13 -2 L${knee + 3} 28 L${37 + squat * 8} ${59 - drop}`} fill="none" stroke="#344b51" strokeWidth="19" />
    <path d={`M18 7 L${knee + 6} 28 L${40 + squat * 8} ${47 - drop}`} fill="none" stroke={accent} strokeWidth="3" />
    <path d={`M28 ${53 - drop} l16 0 13 9 q2 4 -3 4 h-29Z`} fill={accent} transform={`translate(${squat * 8},0)`} />
    <path d={`M-19 -62 Q0 -70 20 -57 L26 -4 Q0 8 -23 -3Z`} fill={accent} />
    <path d="M-19 -54 L-8 -42 -12 -5 -23 -3Z" fill={shade} stroke="none" />
    <path d="M6 -51 L18 -46 M5 -46 L15 -42" stroke="#efffdc" strokeWidth="2" />
    <path d="M-22 -8 Q0 -3 24 -9 L26 1 Q0 8 -23 1Z" fill="#18282d" />
    <path d="M2 -5 L10 -5 9 17 3 11 -1 17Z" fill={accent} />
    <path d="M-7 -78 L-7 -64 Q0 -56 8 -65 L8 -79" fill={skin} />
    <g transform={`rotate(${punch * -6 + block * 5},0,-94)`}>
      <path d="M-23 -109 Q-21 -133 4 -132 Q30 -129 27 -108 L25 -88 12 -76 Q5 -71 -3 -76 L-18 -88Z" fill={skin} />
      <path d="M-19 -108 Q-29 -116 -29 -133 L-13 -128 -10 -147 3 -133 18 -145 20 -133 37 -133 28 -120 35 -114 16 -115 8 -105 4 -116 -10 -104 -14 -92Z" fill={hair} />
      <path d="M-18 -120 L-6 -130 M1 -129 L10 -134" fill="none" stroke={alternate ? '#ffffff' : '#486068'} strokeWidth="2" />
      <path d="M-19 -109 Q2 -117 27 -109 L27 -103 Q5 -109 -18 -101Z" fill={accent} />
      <path d="M-18 -107 L-37 -106 -44 -95 -28 -101 -20 -100" fill={accent} />
      <path d="M-1 -96 L8 -98 6 -91 0 -91Z M15 -98 L23 -98 20 -92 16 -92Z" fill="#fffdf3" strokeWidth="1.4" />
      <path d="M5 -96 L5 -92 M20 -96 L19 -93" stroke="#18282d" strokeWidth="2.6" />
      <path d="M-2 -101 L8 -102 M15 -102 L23 -101" strokeWidth="2" />
      <path d="M13 -94 L15 -87 11 -86 M8 -81 L16 -81" fill="none" stroke="#815b4e" strokeWidth="1.5" />
      <path d="M-19 -99 Q-29 -103 -25 -91 L-17 -89" fill={skin} />
    </g>
    <path d="M-24 -66 Q-24 -78 -15 -79 Q-3 -78 -4 -65 L-11 -57 -22 -58Z" fill={shade} />
    <path d={`M16 -51 L${elbow[0]} ${elbow[1]} L${wrist[0]} ${wrist[1]}`} fill="none" stroke="#0b171b" strokeWidth="19" />
    <path d={`M16 -51 L${elbow[0]} ${elbow[1]} L${wrist[0]} ${wrist[1]}`} fill="none" stroke={skin} strokeWidth="13" />
    <path d="M11 -58 Q25 -59 29 -45 L18 -36 9 -46Z" fill={accent} />
    <g transform={`translate(${wrist[0]},${wrist[1]}) rotate(${punch * 70})`}>
      <path d="M-8 5 L-8 -7 Q-8 -16 2 -16 Q13 -15 13 -5 L12 5 6 10 -6 9Z" fill={accent} />
      <path d="M-7 5 L10 5 8 13 -6 13Z" fill="#e8f1df" />
      <path d="M-1 -11 L6 -11" stroke="#ffffff" strokeWidth="2" />
    </g>
  </g>;
}

function TrainingScene() {
  const frame = useCurrentFrame();
  const leftPunch = strike(frame, 112) + strike(frame, 153);
  const rightPunch = strike(frame, 197) + strike(frame, 238);
  const squat = frame < 90 ? Math.sin(frame * Math.PI / 45) ** 2 : 0;
  const impact = Math.max(leftPunch, rightPunch);
  const impactX = leftPunch > rightPunch ? 319 : 281;
  const sparring = frame >= 100 && frame < 270;
  return <svg viewBox="0 0 600 360" width="100%" height="100%" style={{ display: 'block', background: '#0e181b' }}>
    <defs>
      <radialGradient id="training-glow"><stop stopColor="#3b5341" stopOpacity=".65" /><stop offset="1" stopColor="#101c1e" stopOpacity="0" /></radialGradient>
      <linearGradient id="training-floor" x2="0" y2="1"><stop stopColor="#1a302d" /><stop offset="1" stopColor="#101b1d" /></linearGradient>
      <pattern id="training-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#b5dcb9" strokeOpacity=".035" /></pattern>
    </defs>
    <rect width="600" height="360" fill="url(#training-grid)" />
    <ellipse cx="300" cy="170" rx="260" ry="180" fill="url(#training-glow)" />
    <circle cx="300" cy="171" r="112" fill="none" stroke="#b9e7a0" strokeOpacity=".07" />
    <circle cx="300" cy="171" r="91" fill="none" stroke="#b9e7a0" strokeOpacity=".05" strokeDasharray="2 9" />
    <path d="M24 266 H576 L600 360 H0Z" fill="url(#training-floor)" />
    <path d="M24 266H576 M0 294H600 M200 266L168 360 M400 266L432 360" stroke="#688d75" strokeOpacity=".15" fill="none" />
    <text x="28" y="33" fill="#9aaea4" fontSize="10" fontFamily="system-ui" fontWeight="700" letterSpacing="2.6">THE DAILY DOJO</text>
    <circle cx="454" cy="29" r="3" fill="#c5fa82" />
    <text x="466" y="33" fill="#c5fa82" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1.4">{sparring ? 'LIGHT SPARRING' : 'WARM-UP SET'}</text>
    <text x="300" y="128" textAnchor="middle" fill="#c5fa82" opacity=".065" fontFamily="system-ui" fontWeight="900" fontStyle="italic" fontSize="78" letterSpacing="-5">TRAIN</text>
    <ellipse cx="216" cy="279" rx="60" ry="9" fill="#050d10" opacity=".55" />
    <ellipse cx="384" cy="279" rx="60" ry="9" fill="#050d10" opacity=".55" />
    <TrainingPartner x={216} frame={frame} punch={leftPunch} block={rightPunch} squat={squat} />
    <TrainingPartner x={384} frame={frame} mirror alternate punch={rightPunch} block={leftPunch} squat={squat} />
    {impact > .75 && <g transform={`translate(${impactX},137)`} opacity={(impact - .75) * 3} stroke="#e2ffbd" fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M-4 -13L-8 -23 M7 -12L13 -20 M11 0L22 -2 M4 12L8 21" />
      <circle r={12 + impact * 5} strokeWidth="1" opacity=".35" />
    </g>}
    <text x="28" y="324" fill="#e1f4d4" fontFamily="system-ui" fontSize="17" fontWeight="800" letterSpacing="1.5">BETTER. TOGETHER.</text>
    <text x="28" y="343" fill="#8aaba0" fontFamily="system-ui" fontSize="10" letterSpacing=".6">Show up. Put in the reps. Find your rhythm.</text>
    {[0, 1, 2, 3].map(index => <rect key={index} x={516 + index * 13} y="320" width="7" height={8 + index * 4} rx="2" fill={frame / 75 >= index ? '#c5fa82' : '#314a40'} />)}
  </svg>;
}

export function ProgressMotion() {
  const player = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (reduced || paused) player.current?.pause();
    else player.current?.play();
  }, [reduced, paused]);
  return <div className="motion-frame training-animation">
    <div role="img" aria-label="Two anime-style training partners warming up and practicing friendly sparring" style={{ width: '100%', height: '100%' }}>
    <Player ref={player} key={String(reduced)} component={TrainingScene} durationInFrames={300} compositionWidth={600} compositionHeight={360} fps={30} autoPlay={!reduced && !paused} loop={!reduced} initiallyMuted controls={false} clickToPlay={false} doubleClickToFullscreen={false} acknowledgeRemotionLicense style={{ width: '100%', height: '100%' }} />
    </div>
    {!reduced && <button className="animation-toggle" aria-label={paused ? 'Play training animation' : 'Pause training animation'} onClick={() => setPaused(value => !value)}>{paused ? '▷' : 'Ⅱ'}</button>}
  </div>;
}
