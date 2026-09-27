import { useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { supabase } from './supabase';

// A site key is public. Keep the hCaptcha secret only in Supabase Auth settings.
const sitekey = import.meta.env.VITE_HCAPTCHA_SITE_KEY || '01344326-ddda-4d34-8238-03d0bc1e9ede';
const confirmationRedirect = 'https://fullbodygym.netlify.app/';

export function AuthPage({ initialMode = 'login', onClose, onSignedIn }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const captcha = useRef(null);
  const register = mode === 'register';

  function switchMode(next) {
    setMode(next);
    window.history.replaceState({}, '', next === 'login' ? '/sign-in' : '/account?mode=register');
    setNotice('');
    setError('');
    setPassword('');
    setCaptchaToken('');
    captcha.current?.resetCaptcha();
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (sitekey && !captchaToken) return setError('Complete the security check first.');
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const address = email.trim().toLowerCase();
      const credentials = { email: address, password };
      const result = register
        ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: confirmationRedirect, ...(captchaToken ? { captchaToken } : {}) } })
        : await supabase.auth.signInWithPassword({ ...credentials, options: captchaToken ? { captchaToken } : undefined });
      if (result.error) throw result.error;
      if (result.data.session) onSignedIn();
      else setNotice('Check your inbox to confirm your email. The link will open your training dashboard.');
    } catch (failure) {
      setError(failure.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
      setCaptchaToken('');
      captcha.current?.resetCaptcha();
    }
  }

  return <div className="auth-page">
    <header className="site-header auth-header"><a className="brand" href="#top" onClick={event => { event.preventDefault(); onClose(); }} aria-label="Full Body home"><img className="brand-mark" src="/brand-mark.svg" width="44" height="44" alt="" /><span>FULL BODY <small>TRAINING JOURNAL</small></span></a><button type="button" className="auth-back" onClick={onClose}>← Back to workouts</button></header>
    <main className="auth-main">
      <div className="auth-art" aria-hidden="true"><img src="/assets/training/poster-gym.jpg" alt="" /><div><span className="eyebrow">TRAIN TOGETHER</span><strong>Your progress<br />goes with you.</strong><p>One account for every session, set and milestone.</p></div></div>
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="eyebrow">YOUR TRAINING SPACE</span>
        <h1 id="auth-title">{register ? 'Create your account.' : 'Welcome back.'}</h1>
        <p>{register ? 'Save your workout history and pick up where you left off on any device.' : 'Sign in to see your workouts across devices.'}</p>
        <div className="auth-tabs" role="group" aria-label="Account action"><button type="button" className={!register ? 'active' : ''} aria-pressed={!register} onClick={() => switchMode('login')}>Sign in</button><button type="button" className={register ? 'active' : ''} aria-pressed={register} onClick={() => switchMode('register')}>Create account</button></div>
        <form onSubmit={submit}>
          <label>Email address<input type="email" value={email} autoComplete="email" required maxLength={254} placeholder="you@example.com" onChange={event => setEmail(event.target.value)} /></label>
          <label>Password<span className="password-input"><input type={showPassword ? 'text' : 'password'} value={password} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : undefined} maxLength={128} placeholder={register ? 'At least 8 characters' : 'Your password'} onChange={event => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></span></label>
          {sitekey && <div className="captcha-wrap"><HCaptcha ref={captcha} sitekey={sitekey} theme="dark" onVerify={setCaptchaToken} onExpire={() => setCaptchaToken('')} onError={() => setCaptchaToken('')} /></div>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-notice" role="status">{notice}</p>}
          <button className="auth-submit" type="submit" disabled={busy || (Boolean(sitekey) && !captchaToken)}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <span>↗</span></button>
        </form>
        <p className="auth-switch">{register ? 'Already tracking?' : 'New to Full Body?'} <button type="button" onClick={() => switchMode(register ? 'login' : 'register')}>{register ? 'Sign in' : 'Create an account'}</button></p>
      </section>
    </main>
  </div>;
}
