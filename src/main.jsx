import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import lottie from 'lottie-web/build/player/lottie_light.js';
import { WorkoutScene } from './WorkoutScene';
import { addDays, dateKey, emptySets, format, guestHistoryKey, hasValidSetValues, hasWorkout, isCompletedSet, legacyHistoryKey, parseDate, plan, prettyDate, previousExercise, readHistory, scheduledSession, sessionExercises, sessionFor, updateHistory } from './workout';
import './style.css';
import { readBackup, validateHistory } from './validation.js';
import { calculateCompletion, recapMood } from './recap.js';

const today = dateKey(new Date());
const priorAccountHistoryKeys = () => Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(item => item && /^full-body:history:[^:]+:v1$/.test(item));
const guestInitial = () => {
  const current = readHistory(guestHistoryKey);
  if (Object.keys(current).length) return current;
  const legacy = readHistory(legacyHistoryKey);
  if (Object.keys(legacy).length) return legacy;
  try {
    const priorAccountKeys = priorAccountHistoryKeys();
    if (priorAccountKeys.length !== 1) return {};
    const priorAccountHistory = readHistory(priorAccountKeys[0]);
    if (Object.keys(priorAccountHistory).length) localStorage.setItem(guestHistoryKey, JSON.stringify(priorAccountHistory));
    return priorAccountHistory;
  } catch { return {}; }
};

function Calendar({ selected, onSelect, history }) {
  const [month, setMonth] = useState(() => new Date(parseDate(selected).getFullYear(), parseDate(selected).getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - (first.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, index) => { const d = new Date(start); d.setDate(start.getDate() + index); return d; });
  const changeMonth = amount => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const choose = key => { onSelect(key); setMonth(new Date(parseDate(key).getFullYear(), parseDate(key).getMonth(), 1)); };
  return <section className="panel calendar" aria-label="Workout calendar">
    <div className="panel-head"><div><span className="eyebrow">YOUR TIMELINE</span><h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2></div><div className="calendar-controls"><button aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button><button onClick={() => choose(today)}>Today</button><button aria-label="Next month" disabled={month.getFullYear() === parseDate(today).getFullYear() && month.getMonth() >= parseDate(today).getMonth()} onClick={() => changeMonth(1)}>›</button></div></div>
    <div className="calendar-grid">{['M','T','W','T','F','S','S'].map((name, index) => <span className="weekday" key={index}>{name}</span>)}
      {days.map(date => { const key = dateKey(date), session = scheduledSession(key); return <button key={key} disabled={key > today} title={key > today ? 'Future dates are unavailable' : prettyDate(key)} aria-label={`${prettyDate(key)}${hasWorkout(history[key]) ? ', workout logged' : ''}`} aria-pressed={key === selected} className={`cal-day ${date.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === selected ? 'selected' : ''} ${key === today ? 'today' : ''} ${hasWorkout(history[key]) ? 'logged' : ''}`} onClick={() => choose(key)}><span>{date.getDate()}</span>{session && <small>{session}</small>}</button>; })}</div>
  </section>;
}

function ExerciseCard({ exercise, index, session, state, previous, onChange, readOnly, open, onToggle }) {
  const [imageUrl, setImageUrl] = useState(`/${exercise.gif}`);
  const sets = state?.sets?.length ? state.sets : emptySets(exercise);
  const completed = sets.filter(isCompletedSet).length;
  const patch = nextSets => onChange({ sets: nextSets, notes: state?.notes || '' });
  const bodyId = `exercise-${exercise.id}-${index}`;
  return <article className={`exercise ${open ? 'open' : ''}`}>
    <button className="exercise-top" onClick={onToggle} aria-expanded={open} aria-controls={bodyId} aria-label={`${open ? 'Collapse' : 'Expand'} ${exercise.name}`}>
      <span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><span className="exercise-heading"><strong>{exercise.name}</strong><small>{exercise.target} · {exercise.sets} sets × {exercise.reps}</small></span><span className={`completion ${completed === sets.length ? 'complete' : ''}`}>{completed}/{sets.length}</span><span className="demo-toggle">{open ? 'Close' : 'Log sets'}</span><span className="chevron">⌄</span>
    </button>
    {open && <div className="exercise-body" id={bodyId}>
      {imageUrl && <div className="demo"><img src={imageUrl} alt={`${exercise.name} demonstration`} loading="lazy" onError={() => setImageUrl('')} /><span>DAY {session} · MOVEMENT {index + 1}</span></div>}
      <div className="exercise-detail"><div className="exercise-meta"><div><span>Equipment</span><strong>{exercise.equipment}</strong></div><div><span>Last time</span><strong>{previous ? prettyDate(previous.date) : 'First session'}</strong></div></div>
        <p className="logging-hint">Log each set below · {sets.length} sets</p>
        <div className="set-grid set-labels"><span>SET</span><span>WEIGHT · KG</span><span>REPS</span><span>DONE</span></div>
        {sets.map((set, setIndex) => { const setComplete = isCompletedSet(set); const canComplete = hasValidSetValues(set); return <div className="set-grid set-line" key={setIndex}><span className="set-index">{String(setIndex + 1).padStart(2, '0')}</span><input disabled={readOnly} aria-label={`${exercise.name} set ${setIndex + 1} weight in kilograms`} inputMode="decimal" type="number" min="0" max="9999" step="0.5" placeholder="0" value={set.weight} onChange={event => patch(sets.map((item, i) => { if (i !== setIndex) return item; const next = { ...item, weight: event.target.value === '' ? '' : String(Math.min(9999, Math.max(0, Number(event.target.value)))) }; return hasValidSetValues(next) ? next : { ...next, done: false }; }))}/><input disabled={readOnly} aria-label={`${exercise.name} set ${setIndex + 1} reps`} inputMode="numeric" type="number" min="0" max="999" step="1" placeholder="0" value={set.reps} onChange={event => patch(sets.map((item, i) => { if (i !== setIndex) return item; const next = { ...item, reps: event.target.value === '' ? '' : String(Math.min(999, Math.max(0, Number(event.target.value)))) }; return hasValidSetValues(next) ? next : { ...next, done: false }; }))}/><button disabled={readOnly || (!setComplete && !canComplete)} title={!readOnly && !canComplete ? 'Enter a weight and reps first' : undefined} type="button" className={`done-button ${setComplete ? 'done' : ''}`} aria-label={`${setComplete ? 'Unmark' : 'Mark'} ${exercise.name} set ${setIndex + 1} done`} aria-pressed={setComplete} onClick={() => patch(sets.map((item, i) => i === setIndex ? { ...item, done: !setComplete } : item))}>{setComplete ? '✓' : '○'}</button></div>; })}
        {!readOnly && <div className="exercise-actions"><button disabled={sets.length >= 12} onClick={() => sets.length < 12 && patch([...sets, { weight: '', reps: '', done: false }])}>+ Add set</button>{sets.length > 1 && <button onClick={() => patch(sets.slice(0, -1))}>Remove last</button>}{previous && <button onClick={() => patch(previous.state.sets.map(set => ({ ...set, done: false })))}>Copy last</button>}</div>}
        <label className="note-label">Notes<input disabled={readOnly} maxLength={2000} value={state?.notes || ''} onChange={event => onChange({ sets, notes: event.target.value })} placeholder="How did it feel?" /></label>
        <details><summary>How to do it</summary><p>{exercise.instructions}</p></details>
      </div>
    </div>}
  </article>;
}

function RecapModal({ completion, date, onClose }) {
  const dialog = useRef(null);
  const animation = useRef(null);
  const mood = recapMood(completion);
  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    const motion = lottie.loadAnimation({ container: animation.current, renderer: 'svg', loop: mood !== 'up', autoplay: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, path: `/lottie/${mood}.json` });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) motion.addEventListener('DOMLoaded', () => motion.goToAndStop(45, true));
    return () => { motion.destroy(); node.close(); };
  }, [mood]);
  const headline = { up: 'Strong progress!', down: 'A tougher session today.', same: 'It’s okay. Tomorrow can be better.', first: 'Your first session is in the books.' }[mood];
  return <dialog className={`recap-modal ${mood}`} ref={dialog} onClose={onClose} aria-labelledby="recap-title">
    <button type="button" className="recap-close" aria-label="Close workout recap" onClick={() => dialog.current.close()}>×</button>
    <div className="recap-animation" ref={animation} aria-hidden="true" />
    <span className="eyebrow">WORKOUT COMPLETE · {prettyDate(date)}</span>
    <h2 id="recap-title">{headline}</h2>
    <p>{mood === 'up' ? 'Your average across matching exercises improved.' : mood === 'down' ? 'Some sessions are harder. Rest and return when you are ready.' : mood === 'same' ? 'You matched your last session. Keep building the habit.' : 'Finish another session on this routine to see your progress.'}</p>
    <div className="recap-numbers"><div><strong>{completion.progressPct === null ? '—' : `${completion.progressPct > 0 ? '+' : ''}${completion.progressPct}%`}</strong><span>AVERAGE EXERCISE PROGRESS</span></div><div><strong>≈{completion.calories}</strong><span>ESTIMATED KCAL</span></div></div>
    <p className="recap-method">{completion.comparedTo ? `Compared with ${prettyDate(completion.comparedTo)} across ${completion.comparedExercises} matching exercises.` : 'No comparable completed session yet.'} Calories use your entered weight and duration with a 3.5 MET resistance training estimate.</p>
    <button className="recap-done" type="button" onClick={() => dialog.current.close()}>Back to dashboard ↗</button>
  </dialog>;
}

function App() {
  const [selected, setSelected] = useState(today);
  const [history, setHistory] = useState(guestInitial);
  const historyRef = useRef(history);
  const [sync, setSync] = useState('Saved on this device');
  const [toast, setToast] = useState('');
  const [recap, setRecap] = useState(null);
  const [duration, setDuration] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [expandedExerciseId, setExpandedExerciseId] = useState('');
  const key = guestHistoryKey;
  const session = sessionFor(history, selected);
  const exercises = sessionExercises(session);
  const day = history[selected];
  const readOnly = selected !== today || Boolean(day?.completion);
  const sets = exercises.flatMap(exercise => day?.exercises?.[exercise.id]?.sets || []);
  const doneCount = sets.filter(isCompletedSet).length;
  const completedDays = Object.entries(history).filter(([, item]) => item.completion);
  const weekStart = addDays(selected, -(parseDate(selected).getDay() + 6) % 7);
  const weekCompletions = completedDays.filter(([date]) => date >= weekStart && date <= addDays(weekStart, 6)).map(([, item]) => item.completion);
  const weekProgress = weekCompletions.map(item => item.progressPct).filter(value => value !== null);
  const weekAverage = weekProgress.length ? Math.round(weekProgress.reduce((sum, value) => sum + value, 0) / weekProgress.length) : null;
  const weekCalories = weekCompletions.reduce((sum, item) => sum + item.calories, 0);
  const loggedDays = completedDays.length;
  const previousDay = Object.keys(history).filter(date => date < selected && hasWorkout(history[date]) && sessionFor(history, date) === session).sort().pop();
  const toastTimer = useRef();
  const message = text => { setToast(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2800); };
  const replaceHistory = (next, storageKey) => { historyRef.current = next; setHistory(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); setSync('Saved on this device'); return true; } catch { setSync('Browser storage unavailable'); return false; } };
  const save = next => { replaceHistory(next, key); };
  const changeDay = change => { if (selected !== today || historyRef.current[selected]?.completion) return; save(updateHistory(historyRef.current, selected, change)); };
  const changeExercise = (id, value) => changeDay(day => { day.exercises[id] = value; });
  const finishToday = () => {
    if (selected !== today || historyRef.current[selected]?.completion) return;
    try {
      const completion = calculateCompletion(historyRef.current, selected, Number(duration), Number(bodyWeight));
      save(updateHistory(historyRef.current, selected, day => { day.completion = completion; }));
      setRecap({ date: selected, completion });
    } catch (error) { message(error.message); }
  };

  useEffect(() => { setExpandedExerciseId(exercises[0]?.id || ''); }, [selected, session]);

  const exportData = () => { const blob = new Blob([JSON.stringify({ app: '3-day-full-body-gym-tracker', version: 3, history }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `workouts-${today}.json`; a.hidden = true; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); message('Backup download started'); };
  const importData = async file => {
    try {
      const imported = await readBackup(file);
      const next = validateHistory({ ...historyRef.current, ...imported });
      replaceHistory(next, key);
      message('Backup imported');
    } catch (error) { message(error.message); }
  };
  const copyPreviousDay = () => { if (!previousDay || (hasWorkout(historyRef.current[selected]) && !window.confirm('Replace the current workout with the previous session?'))) return; changeDay(day => { for (const exercise of exercises) { const previous = historyRef.current[previousDay].exercises?.[exercise.id]; if (previous) day.exercises[exercise.id] = { ...structuredClone(previous), sets: previous.sets.map(set => ({ ...set, done: false })) }; } }); message(`Copied ${prettyDate(previousDay)}`); };
  const clearDay = () => { if (selected !== today || historyRef.current[selected]?.completion || !window.confirm(`Clear ${prettyDate(selected)}?`)) return; const next = { ...historyRef.current }; delete next[selected]; replaceHistory(next, key); message('Day cleared'); };
  const clearAll = () => { if (!window.confirm('Permanently delete all workout progress saved in this browser? Export a backup first if you want to keep a copy.')) return; let removed = replaceHistory({}, key); try { localStorage.removeItem(legacyHistoryKey); priorAccountHistoryKeys().forEach(item => localStorage.removeItem(item)); } catch { removed = false; setSync('Browser storage unavailable'); } message(removed ? 'All local progress deleted' : 'Progress cleared for now, but browser storage is unavailable'); };
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#top" aria-label="Full Body home"><img className="brand-mark" src="/branding/full-body-header-icon.png" width="44" height="44" alt="" /><span>FULL BODY <small>TRAINING JOURNAL</small></span></a><span className="header-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span></header>
    <main id="top">
      <aside className="local-storage-notice" aria-label="Local progress storage"><span className="status-light" aria-hidden="true"/><p><strong>Your progress is saved locally in this browser.</strong> It does not sync between devices. Clearing browser data can erase it, so export a backup if you want a portable copy.</p></aside>
      <section className="hero"><div className="hero-copy"><span className="eyebrow">THE EVERYDAY STRENGTH PLAN</span><h1>Make every<br/><em>rep count.</em></h1><p>Three focused full body sessions. One clear place to track the work and see yourself grow stronger.</p><div className="hero-actions"><a className="button primary" href="#workout">Start today's session <span>↗</span></a><span>{loggedDays} {loggedDays === 1 ? 'workout' : 'workouts'} logged</span></div></div><WorkoutScene /></section>
      <div className="dashboard"><div className="main-column"><Calendar selected={selected} onSelect={setSelected} history={history}/><section id="workout" className="workout-section"><div className="workout-header"><div><span className="eyebrow">{readOnly ? 'WORKOUT HISTORY · READ ONLY' : 'YOUR SESSION'}</span><h2>{prettyDate(selected)}</h2><p>{session ? `Day ${session} · ${exercises.length} movements` : 'Recovery day · move when you feel ready'}</p></div><select disabled={readOnly} aria-label="Choose workout session" value={session} onChange={event => changeDay(day => { day.session = event.target.value; })}><option value="">Rest day</option><option value="A">Day A</option><option value="B">Day B</option><option value="C">Day C</option></select></div>{previousDay && !readOnly && <button className="copy-day" onClick={copyPreviousDay}>Copy last Day {session} ↗</button>}
        {session ? <><div className="workout-save-status"><span>{day?.completion ? 'This workout is complete and locked.' : readOnly ? 'Previous dates are for viewing only.' : 'Enter weight and reps. You can edit until you finish today.'}</span><strong role="status">{sync}</strong></div><div className="session-progress"><div><span>{day?.completion ? 'SESSION COMPLETE' : 'SESSION PROGRESS'}</span><strong>{doneCount} of {exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)} sets complete</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, doneCount / Math.max(1, exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)) * 100)}%` }}/></div></div>{exercises.map((exercise, index) => <ExerciseCard key={`${selected}-${exercise.id}`} exercise={exercise} index={index} session={session} state={day?.exercises?.[exercise.id]} previous={previousExercise(history, selected, exercise.id)} onChange={value => changeExercise(exercise.id, value)} readOnly={readOnly} open={expandedExerciseId === exercise.id} onToggle={() => setExpandedExerciseId(current => current === exercise.id ? '' : exercise.id)} />)}
          {day?.completion ? <div className="finish-card finished"><span className="eyebrow">SESSION WRAPPED</span><strong>{day.completion.progressPct === null ? 'First benchmark set' : `${day.completion.progressPct > 0 ? '+' : ''}${day.completion.progressPct}% average progress`} · ≈{day.completion.calories} kcal</strong><button type="button" onClick={() => setRecap({ date: selected, completion: day.completion })}>View recap ↗</button></div> : !readOnly && <div className="finish-card"><span className="eyebrow">FINISH YOUR SESSION</span><h3>Ready to wrap today?</h3><p>Duration and body weight let us estimate calories. Your progress and calorie estimate are calculated when you finish.</p><div className="finish-fields"><label>Workout minutes<input type="number" min="5" max="300" step="1" placeholder="e.g. 45" value={duration} onChange={event => setDuration(event.target.value)} /></label><label>Your weight · kg<input type="number" min="20" max="400" step="0.1" placeholder="e.g. 70" value={bodyWeight} onChange={event => setBodyWeight(event.target.value)} /></label></div><button type="button" className="finish-button" disabled={!doneCount || !duration || !bodyWeight} onClick={finishToday}>Done for today ↗</button></div>}
        </> : <div className="rest-panel"><span>✦</span><h3>Recovery is part of the plan.</h3><p>{readOnly ? 'This date is available for viewing only.' : 'Take today off, or choose a session above if your schedule has changed.'}</p></div>}
      </section></div>
      <aside className="side-column"><section className="panel overview"><span className="eyebrow">AT A GLANCE</span><h2>{day?.completion ? 'Session complete.' : 'Keep the momentum.'}</h2><div className="stat-list"><div><strong>{day?.completion ? `${day.completion.progressPct > 0 ? '+' : ''}${day.completion.progressPct ?? '—'}${day.completion.progressPct === null ? '' : '%'}` : '—'}</strong><span>Average exercise progress</span></div><div><strong>{day?.completion ? `≈${day.completion.calories}` : '—'}</strong><span>Estimated calories · kcal</span></div><div><strong>{day?.completion?.completedSets ?? '—'}</strong><span>Completed sets</span></div></div><p className="metric-note">Results appear when you press Done for today.</p></section><section className="panel weekly"><span className="eyebrow">WEEKLY PULSE</span><h2>{weekAverage === null ? '—' : `${weekAverage > 0 ? '+' : ''}${weekAverage}%`}</h2><p>Average progress across comparable sessions this week</p><div className="stat-list"><div><strong>≈{format(weekCalories)}</strong><span>Estimated kcal this week</span></div><div><strong>{weekCompletions.length}<small> / 3</small></strong><span>Sessions completed</span></div></div></section><section className="panel account"><span className="eyebrow">YOUR DATA</span><h2>Keep your progress.</h2><div className="account-note"><span className="status-light"/><span>Stored only in this browser. No account or cloud sync.</span></div><p className="sync-state">Export a backup before clearing browser data or moving devices.</p><div className="data-buttons"><button onClick={exportData}>Export backup</button><label>Import backup<input type="file" accept="application/json,.json" onChange={event => { if (event.target.files?.[0]) importData(event.target.files[0]); event.target.value = ''; }}/></label>{!readOnly && <button onClick={clearDay}>Clear today</button>}<button className="danger-button" onClick={clearAll}>Delete all progress</button></div></section><section className="panel routine"><span className="eyebrow">THE ROUTINE</span><h2>Simple by design.</h2>{Object.entries(plan).map(([label, ids]) => <div key={label} className="routine-row"><span>DAY {label}</span><strong>{ids.length} movements</strong></div>)}<p>Train on Monday, Wednesday, and Friday, or choose the days that work for you.</p></section></aside></div>
    </main><footer>FULL BODY · A SMALL STEP, REPEATED.<nav aria-label="Legal"><a href="/legal.html#privacy">Privacy</a> · <a href="/legal.html#terms">Terms</a> · <a href="/legal.html#cookies">Cookies</a> · <a href="/legal.html#refunds">Refunds</a></nav></footer>{toast && <div className="toast" role="status">{toast}</div>}{recap && <RecapModal key={`${recap.date}-${recap.completion.finishedAt}`} date={recap.date} completion={recap.completion} onClose={() => setRecap(null)} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
