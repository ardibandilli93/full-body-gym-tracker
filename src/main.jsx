import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import lottie from 'lottie-web/build/player/lottie_light.js';
import { WorkoutScene } from './WorkoutScene';
import { AuthPage } from './AuthPage';
import { supabase, loadCloudHistory, saveCloudDay, deleteCloudDay } from './supabase';
import { addDays, dateKey, emptySets, exerciseById, format, guestHistoryKey, hasValidSetValues, hasWorkout, isCompletedSet, legacyHistoryKey, parseDate, plan, prettyDate, previousExercise, readHistory, scheduledSession, sessionExercises, sessionFor, updateHistory, userHistoryKey } from './workout';
import './style.css';
import { readBackup, validateHistory } from './validation.js';
import { calculateCompletion, recapMood } from './recap.js';

const today = dateKey(new Date());
const guestInitial = () => { const current = readHistory(guestHistoryKey); return Object.keys(current).length ? current : readHistory(legacyHistoryKey); };
const authModeFromLocation = () => window.location.pathname === '/sign-in' ? 'login' : window.location.pathname === '/account' ? new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login' : null;

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

function ExerciseCard({ exercise, index, session, state, previous, onChange, readOnly }) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(`/${exercise.gif}`);
  const sets = state?.sets?.length ? state.sets : emptySets(exercise);
  const completed = sets.filter(isCompletedSet).length;
  const patch = nextSets => onChange({ sets: nextSets, notes: state?.notes || '' });
  return <article className={`exercise ${open ? 'open' : ''}`}>
    <button className="exercise-top" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${exercise.name} demonstration`}>
      <span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><span className="exercise-heading"><strong>{exercise.name}</strong><small>{exercise.target} · {exercise.sets} sets × {exercise.reps}</small></span><span className={`completion ${completed === sets.length ? 'complete' : ''}`}>{completed}/{sets.length}</span><span className="demo-toggle">{open ? 'Hide demo' : 'View demo'}</span><span className="chevron">⌄</span>
    </button>
    <div className="exercise-body">
      {open && <div className="demo"><img src={imageUrl} alt={`${exercise.name} demonstration`} loading="lazy" onError={() => setImageUrl(exercise.remoteGif)} /><span>DAY {session} · MOVEMENT {index + 1}</span></div>}
      <div className="exercise-detail"><div className="exercise-meta"><div><span>Equipment</span><strong>{exercise.equipment}</strong></div><div><span>Last time</span><strong>{previous ? prettyDate(previous.date) : 'First session'}</strong></div></div>
        <p className="logging-hint">Log each set below · {sets.length} sets</p>
        <div className="set-grid set-labels"><span>SET</span><span>WEIGHT · KG</span><span>REPS</span><span>DONE</span></div>
        {sets.map((set, setIndex) => { const setComplete = isCompletedSet(set); const canComplete = hasValidSetValues(set); return <div className="set-grid set-line" key={setIndex}><span className="set-index">{String(setIndex + 1).padStart(2, '0')}</span><input disabled={readOnly} aria-label={`${exercise.name} set ${setIndex + 1} weight in kilograms`} inputMode="decimal" type="number" min="0" max="9999" step="0.5" placeholder="0" value={set.weight} onChange={event => patch(sets.map((item, i) => { if (i !== setIndex) return item; const next = { ...item, weight: event.target.value === '' ? '' : String(Math.min(9999, Math.max(0, Number(event.target.value)))) }; return hasValidSetValues(next) ? next : { ...next, done: false }; }))}/><input disabled={readOnly} aria-label={`${exercise.name} set ${setIndex + 1} reps`} inputMode="numeric" type="number" min="0" max="999" step="1" placeholder="0" value={set.reps} onChange={event => patch(sets.map((item, i) => { if (i !== setIndex) return item; const next = { ...item, reps: event.target.value === '' ? '' : String(Math.min(999, Math.max(0, Number(event.target.value)))) }; return hasValidSetValues(next) ? next : { ...next, done: false }; }))}/><button disabled={readOnly || (!setComplete && !canComplete)} title={!readOnly && !canComplete ? 'Enter a weight and reps first' : undefined} type="button" className={`done-button ${setComplete ? 'done' : ''}`} aria-label={`${setComplete ? 'Unmark' : 'Mark'} ${exercise.name} set ${setIndex + 1} done`} aria-pressed={setComplete} onClick={() => patch(sets.map((item, i) => i === setIndex ? { ...item, done: !setComplete } : item))}>{setComplete ? '✓' : '○'}</button></div>; })}
        {!readOnly && <div className="exercise-actions"><button disabled={sets.length >= 12} onClick={() => sets.length < 12 && patch([...sets, { weight: '', reps: '', done: false }])}>+ Add set</button>{sets.length > 1 && <button onClick={() => patch(sets.slice(0, -1))}>Remove last</button>}{previous && <button onClick={() => patch(previous.state.sets.map(set => ({ ...set, done: false })))}>Copy last</button>}</div>}
        <label className="note-label">Notes<input disabled={readOnly} maxLength={2000} value={state?.notes || ''} onChange={event => onChange({ sets, notes: event.target.value })} placeholder="How did it feel?" /></label>
        <details><summary>How to do it</summary><p>{exercise.instructions}</p></details>
      </div>
    </div>
  </article>;
}

function AccountPanel({ user, onError, onSignIn, onSignUp }) {
  if (!supabase) return <div className="account-note"><span className="status-light"/>Saved on this device · Add Supabase keys to enable sync</div>;
  if (user) return <div className="account-row"><span className="status-light"/><span>Syncing as <strong>{user.email}</strong></span><button onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) onError(error.message); }}>Sign out</button></div>;
  return <div className="account-cta"><p>Save every session and pick up your training on any device.</p><button onClick={onSignIn}>Sign in</button><button className="account-create" onClick={onSignUp}>Create account</button></div>;
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
  const [authView, setAuthView] = useState(authModeFromLocation);
  const openAuth = mode => { window.history.pushState({}, '', mode === 'login' ? '/sign-in' : '/account?mode=register'); setAuthView(mode); window.scrollTo(0, 0); };
  const closeAuth = () => { window.history.replaceState({}, '', '/'); setAuthView(null); };
  const [history, setHistory] = useState(guestInitial);
  const historyRef = useRef(history);
  const [user, setUser] = useState(null);
  const [sync, setSync] = useState('Saved on this device');
  const [toast, setToast] = useState('');
  const [recap, setRecap] = useState(null);
  const [duration, setDuration] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const requestRef = useRef(0);
  const syncQueue = useRef(Promise.resolve());
  const key = user ? userHistoryKey(user.id) : guestHistoryKey;
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
  const replaceHistory = (next, storageKey) => { historyRef.current = next; setHistory(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setSync('Browser storage unavailable'); } };
  const save = (next, date = selected) => { replaceHistory(next, key); if (user && supabase) { setSync('Syncing…'); syncQueue.current = syncQueue.current.catch(() => {}).then(() => saveCloudDay(user.id, date, next[date])); syncQueue.current.then(() => setSync('Synced to Supabase')).catch(error => setSync(`Sync failed: ${error.message}`)); } else setSync('Saved on this device'); };
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

  useEffect(() => {
    const onPopState = () => setAuthView(authModeFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    async function connect(session) {
      const request = ++requestRef.current;
      const nextUser = session?.user || null;
      if (!nextUser) { setUser(null); const guest = guestInitial(); historyRef.current = guest; setHistory(guest); setSync('Saved on this device'); return; }
      if (window.location.pathname === '/sign-in') {
        window.history.replaceState({}, '', '/');
        setAuthView(null);
      }
      setUser(nextUser); setSync('Loading cloud history…');
      const cached = readHistory(userHistoryKey(nextUser.id)); historyRef.current = cached; setHistory(cached);
      try {
        const cloud = await loadCloudHistory(nextUser.id);
        if (!active || request !== requestRef.current) return;
        const latestLocal = historyRef.current;
        const merged = { ...latestLocal, ...cloud };
        for (const [date, local] of Object.entries(latestLocal)) if (!cloud[date] || (local.updatedAt || '') > (cloud[date].updatedAt || '')) merged[date] = local;
        replaceHistory(merged, userHistoryKey(nextUser.id));
        setSync('Synced to Supabase');
        for (const [date, item] of Object.entries(merged)) {
          if (!active || request !== requestRef.current) return;
          if (!cloud[date] || item === latestLocal[date]) await saveCloudDay(nextUser.id, date, item);
        }
      } catch (error) { if (active) setSync(`Sync failed: ${error.message}`); }
    }
    supabase.auth.getSession().then(({ data }) => { if (active) connect(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') connect(session); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const importGuest = async () => {
    if (!user) return;
    const request = requestRef.current;
    const guest = guestInitial();
    const additions = Object.entries(guest).filter(([date]) => !historyRef.current[date]);
    if (!additions.length) return message('All browser workouts already exist in your account');
    const merged = { ...historyRef.current, ...Object.fromEntries(additions) };
    replaceHistory(merged, userHistoryKey(user.id));
    try {
      for (const [date, item] of additions) {
        if (request !== requestRef.current) return;
        await saveCloudDay(user.id, date, item);
      }
      if (request !== requestRef.current) return;
      setSync('Synced to Supabase'); message(`${additions.length} workout days imported`);
    } catch (error) { if (request === requestRef.current) setSync(`Sync failed: ${error.message}`); }
  };
  const exportData = () => { const blob = new Blob([JSON.stringify({ app: '3-day-full-body-gym-tracker', version: 3, history }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `workouts-${today}.json`; a.click(); URL.revokeObjectURL(url); };
  const importData = async file => {
    const request = requestRef.current;
    try {
      const imported = await readBackup(file);
      if (request !== requestRef.current) throw new Error('Account changed. Please import again.');
      const next = validateHistory({ ...historyRef.current, ...imported });
      replaceHistory(next, key);
      if (user) {
        // Bound concurrency: a backup must not launch thousands of requests at once.
        for (const [date, item] of Object.entries(imported)) {
          if (request !== requestRef.current) return;
          await saveCloudDay(user.id, date, item);
        }
      }
      if (request === requestRef.current) message('Backup imported');
    } catch (error) { message(error.message); }
  };
  const copyPreviousDay = () => { if (!previousDay || (hasWorkout(historyRef.current[selected]) && !window.confirm('Replace the current workout with the previous session?'))) return; changeDay(day => { for (const exercise of exercises) { const previous = historyRef.current[previousDay].exercises?.[exercise.id]; if (previous) day.exercises[exercise.id] = { ...structuredClone(previous), sets: previous.sets.map(set => ({ ...set, done: false })) }; } }); message(`Copied ${prettyDate(previousDay)}`); };
  const clearDay = async () => { if (selected !== today || historyRef.current[selected]?.completion || !window.confirm(`Clear ${prettyDate(selected)}?`)) return; const next = { ...historyRef.current }; delete next[selected]; replaceHistory(next, key); if (user) { try { syncQueue.current = syncQueue.current.catch(() => {}).then(() => deleteCloudDay(user.id, selected)); await syncQueue.current; setSync('Synced to Supabase'); } catch (error) { setSync(`Sync failed: ${error.message}`); } } message('Day cleared'); };
  if (authView && supabase && !user) return <AuthPage initialMode={authView} onClose={closeAuth} onSignedIn={closeAuth} />;
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#top" aria-label="Full Body home"><img className="brand-mark" src="/branding/full-body-header-icon.png" width="44" height="44" alt="" /><span>FULL BODY <small>TRAINING JOURNAL</small></span></a><div className="header-actions"><span className="header-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>{supabase && !user && <button className="header-signin" onClick={() => openAuth('login')}>Sign in <span>↗</span></button>}{user && <span className="header-account">{user.email}</span>}</div></header>
    <main id="top">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">THE EVERYDAY STRENGTH PLAN</span><h1>Make every<br/><em>rep count.</em></h1><p>Three focused full body sessions. One clear place to track the work and see yourself grow stronger.</p><div className="hero-actions"><a className="button primary" href="#workout">Start today's session <span>↗</span></a><span>{loggedDays} {loggedDays === 1 ? 'workout' : 'workouts'} logged</span></div></div><WorkoutScene /></section>
      <div className="dashboard"><div className="main-column"><Calendar selected={selected} onSelect={setSelected} history={history}/><section id="workout" className="workout-section"><div className="workout-header"><div><span className="eyebrow">{readOnly ? 'WORKOUT HISTORY · READ ONLY' : 'YOUR SESSION'}</span><h2>{prettyDate(selected)}</h2><p>{session ? `Day ${session} · ${exercises.length} movements` : 'Recovery day · move when you feel ready'}</p></div><select disabled={readOnly} aria-label="Choose workout session" value={session} onChange={event => changeDay(day => { day.session = event.target.value; })}><option value="">Rest day</option><option value="A">Day A</option><option value="B">Day B</option><option value="C">Day C</option></select></div>{previousDay && !readOnly && <button className="copy-day" onClick={copyPreviousDay}>Copy last Day {session} ↗</button>}
        {session ? <><div className="workout-save-status"><span>{day?.completion ? 'This workout is complete and locked.' : readOnly ? 'Previous dates are for viewing only.' : 'Enter weight and reps. You can edit until you finish today.'}</span><strong role="status">{sync}{!user && supabase ? ' · Sign in to sync across devices' : ''}</strong></div><div className="session-progress"><div><span>{day?.completion ? 'SESSION COMPLETE' : 'SESSION PROGRESS'}</span><strong>{doneCount} of {exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)} sets complete</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, doneCount / Math.max(1, exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)) * 100)}%` }}/></div></div>{exercises.map((exercise, index) => <ExerciseCard key={`${selected}-${exercise.id}`} exercise={exercise} index={index} session={session} state={day?.exercises?.[exercise.id]} previous={previousExercise(history, selected, exercise.id)} onChange={value => changeExercise(exercise.id, value)} readOnly={readOnly} />)}
          {day?.completion ? <div className="finish-card finished"><span className="eyebrow">SESSION WRAPPED</span><strong>{day.completion.progressPct === null ? 'First benchmark set' : `${day.completion.progressPct > 0 ? '+' : ''}${day.completion.progressPct}% average progress`} · ≈{day.completion.calories} kcal</strong><button type="button" onClick={() => setRecap({ date: selected, completion: day.completion })}>View recap ↗</button></div> : !readOnly && <div className="finish-card"><span className="eyebrow">FINISH YOUR SESSION</span><h3>Ready to wrap today?</h3><p>Duration and body weight let us estimate calories. Your progress and calorie estimate are calculated when you finish.</p><div className="finish-fields"><label>Workout minutes<input type="number" min="5" max="300" step="1" placeholder="e.g. 45" value={duration} onChange={event => setDuration(event.target.value)} /></label><label>Your weight · kg<input type="number" min="20" max="400" step="0.1" placeholder="e.g. 70" value={bodyWeight} onChange={event => setBodyWeight(event.target.value)} /></label></div><button type="button" className="finish-button" disabled={!doneCount || !duration || !bodyWeight} onClick={finishToday}>Done for today ↗</button></div>}
        </> : <div className="rest-panel"><span>✦</span><h3>Recovery is part of the plan.</h3><p>{readOnly ? 'This date is available for viewing only.' : 'Take today off, or choose a session above if your schedule has changed.'}</p></div>}
      </section></div>
      <aside className="side-column"><section className="panel overview"><span className="eyebrow">AT A GLANCE</span><h2>{day?.completion ? 'Session complete.' : 'Keep the momentum.'}</h2><div className="stat-list"><div><strong>{day?.completion ? `${day.completion.progressPct > 0 ? '+' : ''}${day.completion.progressPct ?? '—'}${day.completion.progressPct === null ? '' : '%'}` : '—'}</strong><span>Average exercise progress</span></div><div><strong>{day?.completion ? `≈${day.completion.calories}` : '—'}</strong><span>Estimated calories · kcal</span></div><div><strong>{day?.completion?.completedSets ?? '—'}</strong><span>Completed sets</span></div></div><p className="metric-note">Results appear when you press Done for today.</p></section><section className="panel weekly"><span className="eyebrow">WEEKLY PULSE</span><h2>{weekAverage === null ? '—' : `${weekAverage > 0 ? '+' : ''}${weekAverage}%`}</h2><p>Average progress across comparable sessions this week</p><div className="stat-list"><div><strong>≈{format(weekCalories)}</strong><span>Estimated kcal this week</span></div><div><strong>{weekCompletions.length}<small> / 3</small></strong><span>Sessions completed</span></div></div></section><section className="panel account"><span className="eyebrow">YOUR ACCOUNT</span><h2>Keep your progress.</h2><AccountPanel user={user} onError={message} onSignIn={() => openAuth('login')} onSignUp={() => openAuth('register')}/><p className="sync-state">{sync}</p>{user && Object.keys(guestInitial()).length > 0 && <button className="text-button" onClick={importGuest}>Import workouts from this browser ↗</button>}<div className="data-buttons"><button onClick={exportData}>Export backup</button><label>Import backup<input type="file" accept="application/json,.json" onChange={event => { if (event.target.files?.[0]) importData(event.target.files[0]); event.target.value = ''; }}/></label>{!readOnly && <button onClick={clearDay}>Clear today</button>}</div></section><section className="panel routine"><span className="eyebrow">THE ROUTINE</span><h2>Simple by design.</h2>{Object.entries(plan).map(([label, ids]) => <div key={label} className="routine-row"><span>DAY {label}</span><strong>{ids.length} movements</strong></div>)}<p>Train on Monday, Wednesday, and Friday, or choose the days that work for you.</p></section></aside></div>
    </main><footer>FULL BODY · A SMALL STEP, REPEATED.</footer>{toast && <div className="toast" role="status">{toast}</div>}{recap && <RecapModal key={`${recap.date}-${recap.completion.finishedAt}`} date={recap.date} completion={recap.completion} onClose={() => setRecap(null)} />}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
