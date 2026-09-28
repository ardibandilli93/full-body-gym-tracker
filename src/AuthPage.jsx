import { useState } from 'react';
import { supabase } from './supabase';

const confirmationRedirect = 'https://fullbodygym.netlify.app/';
const legalVersion = '2026-09-28';

export function AuthPage({ initialMode = 'login', onClose, onSignedIn }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const register = mode === 'register';

  function switchMode(next) {
    setMode(next);
    window.history.replaceState({}, '', next === 'login' ? '/sign-in' : '/account?mode=register');
    setNotice('');
    setError('');
    setPassword('');
    setTermsAccepted(false);
    setPrivacyAcknowledged(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (register && (!termsAccepted || !privacyAcknowledged)) return setError('Accept the Terms and confirm that you read the Privacy Notice first.');
    if (register && (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password))) return setError('Use at least 12 characters with upper-case, lower-case, and a number.');
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const address = email.trim().toLowerCase();
      const credentials = { email: address, password };
      const acceptedAt = new Date().toISOString();
      const result = register
        ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: confirmationRedirect, data: { legal_version: legalVersion, terms_accepted_at: acceptedAt, privacy_acknowledged_at: acceptedAt } } })
        : await supabase.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (result.data.session) onSignedIn();
      else setNotice('Check your inbox to confirm your email. The link will open your training dashboard.');
    } catch (failure) {
      setError(failure.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <header className="site-header auth-header"><a className="brand" href="#top" onClick={event => { event.preventDefault(); onClose(); }} aria-label="Full Body home"><img className="brand-mark" src="/branding/full-body-header-icon.png" width="44" height="44" alt="" /><span>FULL BODY <small>TRAINING JOURNAL</small></span></a><button type="button" className="auth-back" onClick={onClose}>← Back to workouts</button></header>
    <main className="auth-main">
      <div className="auth-art" aria-hidden="true"><img src="/assets/training/poster-gym.jpg" alt="" /><div><span className="eyebrow">TRAIN TOGETHER</span><strong>Your progress<br />goes with you.</strong><p>One account for every session, set and milestone.</p></div></div>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="eyebrow">YOUR TRAINING SPACE</span>
        <h1 id="auth-title">{register ? 'Create your account.' : 'Welcome back.'}</h1>
        <p>{register ? 'Save your workout history and pick up where you left off on any device.' : 'Sign in to see your workouts across devices.'}</p>
        <div className="auth-tabs" role="group" aria-label="Account action"><button type="button" className={!register ? 'active' : ''} aria-pressed={!register} onClick={() => switchMode('login')}>Sign in</button><button type="button" className={register ? 'active' : ''} aria-pressed={register} onClick={() => switchMode('register')}>Create account</button></div>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} autoComplete="email" required maxLength={254} placeholder="you@example.com" onChange={event => setEmail(event.target.value)} /></label>
          <label>Password<span className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : undefined} maxLength={128} placeholder={register ? '12+ characters, mixed case and number' : 'Your password'} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
          {register && <fieldset className="auth-consent"><legend>Required agreements</legend><label><input type="checkbox" checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} /> <span>I agree to the <a href="/legal.html#terms" target="_blank" rel="noreferrer">Terms and Conditions</a>.</span></label><label><input type="checkbox" checked={privacyAcknowledged} onChange={event => setPrivacyAcknowledged(event.target.checked)} /> <span>I have read the <a href="/legal.html#privacy" target="_blank" rel="noreferrer">Privacy Notice</a>.</span></label><p><a href="/legal.html#cookies" target="_blank" rel="noreferrer">Cookie policy</a> · <a href="/legal.html#refunds" target="_blank" rel="noreferrer">Refund policy</a></p></fieldset>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="auth-submit" type="submit" disabled={busy || (register && (!termsAccepted || !privacyAcknowledged))}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <span>↗</span></button>
        </form>
        <p className="auth-switch">{register ? 'Already tracking?' : 'New to Full Body?'} <button type="button" onClick={() => switchMode(register ? 'login' : 'register')}>{register ? 'Sign in' : 'Create an account'}</button></p>
      </section>
    </main>
  </div>;
}
