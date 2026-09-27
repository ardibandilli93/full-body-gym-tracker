import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkoutScene } from './WorkoutScene';
import { AuthPage } from './AuthPage';
import { supabase, loadCloudHistory, saveCloudDay, deleteCloudDay } from './supabase';
import { addDays, dateKey, emptySets, exerciseById, exerciseWeekVolume, format, guestHistoryKey, hasWorkout, legacyHistoryKey, parseDate, plan, prettyDate, previousExercise, readHistory, scheduledSession, sessionExercises, sessionFor, totalVolume, updateHistory, userHistoryKey, volume, weekStats } from './workout';
import './style.css';
import { readBackup, validateHistory } from './validation.js';

const today = dateKey(new Date());
const guestInitial = () => { const current = readHistory(guestHistoryKey); return Object.keys(current).length ? current : readHistory(legacyHistoryKey); };
const authModeFromLocation = () => window.location.pathname === '/sign-in' ? 'login' : window.location.pathname === '/account' ? new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login' : null;

function Calendar({ selected, onSelect, history }) {
  const [month, setMonth] = useState(() => new Date(parseDate(selected).getFullYear(), parseDate(selected).getMonth(), 1));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - (first.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, index) => { const d = new Date(start); d.setDate(start.getDate() + index); return d; });
  const changeMonth = amount => setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  const choose = key => { onSelect(key); setMonth(new Date(parseDate(key).getFullYear(), parseDate(key).getMonth(), 1)); };
  return <section className="panel calendar" aria-label="Workout calendar">
    <div className="panel-head"><div><span className="eyebrow">YOUR TIMELINE</span><h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2></div><div className="calendar-controls"><button aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button><button onClick={() => choose(today)}>Today</button><button aria-label="Next month" onClick={() => changeMonth(1)}>›</button></div></div>
    <div className="calendar-grid">{['M','T','W','T','F','S','S'].map((name, index) => <span className="weekday" key={index}>{name}</span>)}
      {days.map(date => { const key = dateKey(date), session = scheduledSession(key); return <button key={key} title={prettyDate(key)} aria-label={`${prettyDate(key)}${hasWorkout(history[key]) ? ', workout logged' : ''}`} aria-pressed={key === selected} className={`cal-day ${date.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === selected ? 'selected' : ''} ${key === today ? 'today' : ''} ${hasWorkout(history[key]) ? 'logged' : ''}`} onClick={() => choose(key)}><span>{date.getDate()}</span>{session && <small>{session}</small>}</button>; })}</div>
  </section>;
}

function ExerciseCard({ exercise, index, session, state, previous, onChange }) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(`/${exercise.gif}`);
  const sets = state?.sets?.length ? state.sets : emptySets(exercise);
  const completed = sets.filter(set => set.done).length;
  const currentVolume = volume({ sets });
  const previousVolume = volume(previous?.state);
  const difference = previousVolume && currentVolume ? Math.round((currentVolume / previousVolume - 1) * 100) : null;
  const patch = nextSets => onChange({ sets: nextSets, notes: state?.notes || '' });
  return <article className={`exercise ${open ? 'open' : ''}`}>
    <button className="exercise-top" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? 'Hide' : 'Show'} ${exercise.name} demonstration`}>
      <span className="exercise-index">{String(index + 1).padStart(2, '0')}</span><span className="exercise-heading"><strong>{exercise.name}</strong><small>{exercise.target} · {exercise.sets} sets × {exercise.reps}</small></span><span className={`completion ${completed === sets.length ? 'complete' : ''}`}>{completed}/{sets.length}</span><span className="demo-toggle">{open ? 'Hide demo' : 'View demo'}</span><span className="chevron">⌄</span>
    </button>
    <div className="exercise-body">
      {open && <div className="demo"><img src={imageUrl} alt={`${exercise.name} demonstration`} loading="lazy" onError={() => setImageUrl(exercise.remoteGif)} /><span>DAY {session} · MOVEMENT {index + 1}</span></div>}
      <div className="exercise-detail"><div className="exercise-meta"><div><span>Equipment</span><strong>{exercise.equipment}</strong></div><div><span>Last time</span><strong>{previous ? `${prettyDate(previous.date)} · ${format(previousVolume)} kg` : 'First session'}</strong></div></div>
        {difference !== null && <div className={`comparison ${difference > 0 ? 'positive' : ''}`}>{difference > 0 ? '+' : ''}{difference}% training volume vs last time</div>}
        <p className="logging-hint">Log each set below · {sets.length} sets</p>
        <div className="set-grid set-labels"><span>SET</span><span>WEIGHT · KG</span><span>REPS</span><span>DONE</span></div>
        {sets.map((set, setIndex) => <div className="set-grid set-line" key={setIndex}><span className="set-index">{String(setIndex + 1).padStart(2, '0')}</span><input aria-label={`${exercise.name} set ${setIndex + 1} weight in kilograms`} inputMode="decimal" type="number" min="0" max="9999" step="0.5" placeholder="0" value={set.weight} onChange={event => patch(sets.map((item, i) => i === setIndex ? { ...item, weight: event.target.value === '' ? '' : String(Math.min(9999, Math.max(0, Number(event.target.value)))) } : item))}/><input aria-label={`${exercise.name} set ${setIndex + 1} reps`} inputMode="numeric" type="number" min="0" max="999" step="1" placeholder="0" value={set.reps} onChange={event => patch(sets.map((item, i) => i === setIndex ? { ...item, reps: event.target.value === '' ? '' : String(Math.min(999, Math.max(0, Number(event.target.value)))) } : item))}/><button type="button" className={`done-button ${set.done ? 'done' : ''}`} aria-label={`${set.done ? 'Unmark' : 'Mark'} ${exercise.name} set ${setIndex + 1} done`} aria-pressed={!!set.done} onClick={() => patch(sets.map((item, i) => i === setIndex ? { ...item, done: !item.done } : item))}>{set.done ? '✓' : '○'}</button></div>)}
        <div className="exercise-actions"><button disabled={sets.length >= 12} onClick={() => sets.length < 12 && patch([...sets, { weight: '', reps: '', done: false }])}>+ Add set</button>{sets.length > 1 && <button onClick={() => patch(sets.slice(0, -1))}>Remove last</button>}{previous && <button onClick={() => patch(previous.state.sets.map(set => ({ ...set, done: false })))}>Copy last</button>}</div>
        <label className="note-label">Notes<input maxLength={2000} value={state?.notes || ''} onChange={event => onChange({ sets, notes: event.target.value })} placeholder="How did it feel?" /></label>
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
  const requestRef = useRef(0);
  const syncQueue = useRef(Promise.resolve());
  const key = user ? userHistoryKey(user.id) : guestHistoryKey;
  const session = sessionFor(history, selected);
  const exercises = sessionExercises(session);
  const day = history[selected];
  const sets = exercises.flatMap(exercise => day?.exercises?.[exercise.id]?.sets || []);
  const doneCount = sets.filter(set => set.done).length;
  const week = weekStats(history, selected), lastWeek = weekStats(history, addDays(selected, -7));
  const loggedDays = Object.values(history).filter(hasWorkout).length;
  const previousDay = Object.keys(history).filter(date => date < selected && hasWorkout(history[date]) && sessionFor(history, date) === session).sort().pop();
  const toastTimer = useRef();
  const message = text => { setToast(text); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2800); };
  const replaceHistory = (next, storageKey) => { historyRef.current = next; setHistory(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setSync('Browser storage unavailable'); } };
  const save = (next, date = selected) => { replaceHistory(next, key); if (user && supabase) { setSync('Syncing…'); syncQueue.current = syncQueue.current.catch(() => {}).then(() => saveCloudDay(user.id, date, next[date])); syncQueue.current.then(() => setSync('Synced to Supabase')).catch(error => setSync(`Sync failed: ${error.message}`)); } else setSync('Saved on this device'); };
  const changeDay = change => save(updateHistory(historyRef.current, selected, change));
  const changeExercise = (id, value) => changeDay(day => { day.exercises[id] = value; });

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
  const clearDay = async () => { if (!window.confirm(`Clear ${prettyDate(selected)}?`)) return; const next = { ...historyRef.current }; delete next[selected]; replaceHistory(next, key); if (user) { try { syncQueue.current = syncQueue.current.catch(() => {}).then(() => deleteCloudDay(user.id, selected)); await syncQueue.current; setSync('Synced to Supabase'); } catch (error) { setSync(`Sync failed: ${error.message}`); } } message('Day cleared'); };
  if (authView && supabase && !user) return <AuthPage initialMode={authView} onClose={closeAuth} onSignedIn={closeAuth} />;
  return <div className="app-shell">
    <header className="site-header"><a className="brand" href="#top" aria-label="Full Body home"><span className="brand-mark">F<span>·</span>B</span><span>FULL BODY <small>TRAINING JOURNAL</small></span></a><div className="header-actions"><span className="header-date">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>{supabase && !user && <button className="header-signin" onClick={() => openAuth('login')}>Sign in <span>↗</span></button>}{user && <span className="header-account">{user.email}</span>}</div></header>
    <main id="top">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">THE EVERYDAY STRENGTH PLAN</span><h1>Make every<br/><em>rep count.</em></h1><p>Three focused full body sessions. One clear place to track the work and see yourself grow stronger.</p><div className="hero-actions"><a className="button primary" href="#workout">Start today's session <span>↗</span></a><span>{loggedDays} {loggedDays === 1 ? 'workout' : 'workouts'} logged</span></div></div><WorkoutScene /></section>
      <div className="dashboard"><div className="main-column"><Calendar selected={selected} onSelect={setSelected} history={history}/><section id="workout" className="workout-section"><div className="workout-header"><div><span className="eyebrow">YOUR SESSION</span><h2>{prettyDate(selected)}</h2><p>{session ? `Day ${session} · ${exercises.length} movements` : 'Recovery day · move when you feel ready'}</p></div><select aria-label="Choose workout session" value={session} onChange={event => changeDay(day => { day.session = event.target.value; })}><option value="">Rest day</option><option value="A">Day A</option><option value="B">Day B</option><option value="C">Day C</option></select></div>{previousDay && <button className="copy-day" onClick={copyPreviousDay}>Copy last Day {session} ↗</button>}
        {session ? <><div className="workout-save-status"><span>Enter weight and reps for each set. Changes save automatically.</span><strong role="status">{sync}{!user && supabase ? ' · Sign in to sync across devices' : ''}</strong></div><div className="session-progress"><div><span>SESSION PROGRESS</span><strong>{doneCount} of {exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)} sets complete</strong></div><div className="progress-track"><span style={{ width: `${Math.min(100, doneCount / Math.max(1, exercises.reduce((sum, exercise) => sum + (day?.exercises?.[exercise.id]?.sets?.length || exercise.sets), 0)) * 100)}%` }}/></div></div>{exercises.map((exercise, index) => <ExerciseCard key={`${selected}-${exercise.id}`} exercise={exercise} index={index} session={session} state={day?.exercises?.[exercise.id]} previous={previousExercise(history, selected, exercise.id)} onChange={value => changeExercise(exercise.id, value)} />)}</> : <div className="rest-panel"><span>✦</span><h3>Recovery is part of the plan.</h3><p>Take today off, or choose a session above if your schedule has changed.</p></div>}
      </section></div>
      <aside className="side-column"><section className="panel overview"><span className="eyebrow">AT A GLANCE</span><h2>Keep the momentum.</h2><div className="stat-list"><div><strong>{doneCount}</strong><span>Sets completed today</span></div><div><strong>{format(totalVolume(history, selected))}<small> kg</small></strong><span>Today's volume</span></div><div><strong>{week.days}<small> / 3</small></strong><span>Sessions this week</span></div></div></section><section className="panel weekly"><span className="eyebrow">WEEKLY PULSE</span><h2>{format(week.volume)} <small>kg</small></h2><p>Total training volume this week</p><div className="weekly-bars"><span style={{ height: `${Math.max(8, lastWeek.volume / Math.max(week.volume, lastWeek.volume, 1) * 100)}%` }} title={`Previous week: ${format(lastWeek.volume)} kg`}/><span className="current" style={{ height: `${Math.max(8, week.volume / Math.max(week.volume, lastWeek.volume, 1) * 100)}%` }} title={`This week: ${format(week.volume)} kg`}/></div><div className="bar-labels"><span>LAST WEEK</span><span>THIS WEEK</span></div><details className="weekly-detail"><summary>Exercise-by-exercise report</summary>{Object.values(plan).flat().map(id => { const current = exerciseWeekVolume(history, selected, id), previous = exerciseWeekVolume(history, addDays(selected, -7), id); if (!current && !previous) return null; return <div className="weekly-row" key={id}><span>{exerciseById[id].name}</span><strong>{current ? `${format(current)} kg` : '—'}{previous ? ` · ${current > previous ? '+' : ''}${Math.round((current / previous - 1) * 100)}%` : ''}</strong></div>; })}</details></section><section className="panel account"><span className="eyebrow">YOUR ACCOUNT</span><h2>Keep your progress.</h2><AccountPanel user={user} onError={message} onSignIn={() => openAuth('login')} onSignUp={() => openAuth('register')}/><p className="sync-state">{sync}</p>{user && Object.keys(guestInitial()).length > 0 && <button className="text-button" onClick={importGuest}>Import workouts from this browser ↗</button>}<div className="data-buttons"><button onClick={exportData}>Export backup</button><label>Import backup<input type="file" accept="application/json,.json" onChange={event => { if (event.target.files?.[0]) importData(event.target.files[0]); event.target.value = ''; }}/></label><button onClick={clearDay}>Clear selected day</button></div></section><section className="panel routine"><span className="eyebrow">THE ROUTINE</span><h2>Simple by design.</h2>{Object.entries(plan).map(([label, ids]) => <div key={label} className="routine-row"><span>DAY {label}</span><strong>{ids.length} movements</strong></div>)}<p>Train on Monday, Wednesday, and Friday, or choose the days that work for you.</p></section></aside></div>
    </main><footer>FULL BODY · A SMALL STEP, REPEATED.</footer>{toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
