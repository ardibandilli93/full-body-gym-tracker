import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { useAuth } from '@/providers/auth-provider';
import { palette, radius, spacing } from '@/theme';

type Mode = 'sign-in' | 'sign-up' | 'reset';

export default function SignInScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (auth.ownerId) return <Redirect href="/" />;

  async function submit() {
    setMessage(null);
    if (!email.includes('@')) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (mode !== 'reset' && password.length < 8) {
      setMessage('Use at least 8 characters for your password.');
      return;
    }
    setBusy(true);
    const result = mode === 'sign-in'
      ? await auth.signIn(email, password)
      : mode === 'sign-up'
        ? await auth.signUp(email, password)
        : await auth.resetPassword(email);
    setBusy(false);
    if (result.emailAlreadyRegistered) {
      setMode('sign-in');
      setMessage('This email already has an account. Please sign in.');
    }
    else if (result.error) setMessage(result.error);
    else if (result.needsEmailConfirmation) setMessage('Check your inbox, confirm your email, then sign in.');
    else if (mode === 'reset') setMessage('Password reset instructions are on their way.');
    else router.replace('/');
  }

  const title = mode === 'sign-in' ? 'Welcome back' : mode === 'sign-up' ? 'Join the work' : 'Reset access';
  const eyebrow = mode === 'sign-in' ? 'MEMBER ACCESS' : mode === 'sign-up' ? 'NEW ATHLETE' : 'ACCOUNT RECOVERY';
  const buttonLabel = mode === 'sign-in' ? 'Enter training' : mode === 'sign-up' ? 'Create account' : 'Send reset email';

  return (
    <View style={styles.root}>
      <Image
        source={require('../../../assets/art/auth-gym.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ top: 0 }}
        transition={350}
      />
      <LinearGradient
        colors={['rgba(3,6,4,0.16)', 'rgba(3,6,4,0.6)', '#060907']}
        locations={[0, 0.46, 0.88]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.edgeShade} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.brandBlock}>
              <View style={styles.brandRow}>
                <View style={styles.brandMark}>
                  <View style={styles.brandMarkCore} />
                </View>
                <AppText variant="label" style={styles.brandName}>FULL BODY</AppText>
                <View style={styles.brandLine} />
                <AppText variant="caption" tone="muted" style={styles.edition}>01 / TRAIN</AppText>
              </View>
              <AppText variant="display" style={styles.heroTitle}>Built for the{`\n`}next version of you.</AppText>
              <AppText tone="muted" style={styles.heroCopy}>
                Structure every session. See every rep compound.
              </AppText>
            </View>

            <View style={styles.cardShadow}>
              <BlurView intensity={46} tint="dark" style={styles.glassCard}>
                <LinearGradient
                  colors={['rgba(28,37,29,0.91)', 'rgba(10,14,11,0.97)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardHighlight} />

                <View style={styles.cardHeader}>
                  <AppText variant="caption" tone="accent" style={styles.eyebrow}>{eyebrow}</AppText>
                  <AppText variant="title">{title}</AppText>
                  <AppText tone="muted">
                    {mode === 'reset' ? 'We will send a secure reset link to your inbox.' : 'Your plan and progress are waiting.'}
                  </AppText>
                </View>

                <View style={styles.form}>
                  <FormField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder="you@example.com"
                    style={styles.input}
                  />
                  {mode !== 'reset' ? (
                    <FormField
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                      placeholder="At least 8 characters"
                      style={styles.input}
                    />
                  ) : null}
                  {message ? (
                    <AppText variant="label" tone={message.toLowerCase().includes('check') || message.includes('way') ? 'accent' : 'danger'}>
                      {message}
                    </AppText>
                  ) : null}
                  <AppButton label={buttonLabel} loading={busy} onPress={() => void submit()} />
                </View>

                <View style={styles.secondaryActions}>
                  {mode === 'sign-in' ? (
                    <Pressable onPress={() => setMode('reset')} hitSlop={12}>
                      <AppText variant="label" tone="muted">Forgot password?</AppText>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')} hitSlop={12}>
                    <AppText variant="label" tone="accent">
                      {mode === 'sign-up' ? 'Already a member? Sign in' : 'New here? Create an account'}
                    </AppText>
                  </Pressable>
                  {mode === 'reset' ? (
                    <Pressable onPress={() => setMode('sign-in')} hitSlop={12}>
                      <AppText variant="label">Back to sign in</AppText>
                    </Pressable>
                  ) : null}
                </View>

                {!auth.backendConfigured ? (
                  <View style={styles.previewBlock}>
                    <View style={styles.previewCopy}>
                      <AppText variant="caption" tone="muted" style={styles.previewEyebrow}>DEVELOPMENT BUILD</AppText>
                      <AppText variant="caption" tone="muted">Explore the complete offline experience.</AppText>
                    </View>
                    <AppButton label="Preview" variant="secondary" onPress={auth.startOfflinePreview} />
                  </View>
                ) : null}
              </BlurView>
            </View>

            <View style={styles.footerRow}>
              <AppText variant="caption" tone="muted">TRAIN • TRACK • PROGRESS</AppText>
              <View style={styles.footerDot} />
              <AppText variant="caption" tone="muted">EST. 2026</AppText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050806',
  },
  safeArea: {
    flex: 1,
  },
  edgeShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(199,255,74,0.07)',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 560,
    minHeight: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  brandBlock: {
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(199,255,74,0.52)',
    transform: [{ rotate: '45deg' }],
  },
  brandMarkCore: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: palette.lime,
    shadowColor: palette.lime,
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  brandName: {
    color: palette.lime,
    letterSpacing: 1.4,
  },
  brandLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  edition: {
    fontSize: 9,
    letterSpacing: 1,
  },
  heroTitle: {
    maxWidth: 420,
    fontSize: 46,
    lineHeight: 47,
    letterSpacing: -1.8,
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 18,
  },
  heroCopy: {
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  cardShadow: {
    borderRadius: 30,
    backgroundColor: 'rgba(8,12,9,0.76)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.72,
    shadowRadius: 34,
    elevation: 22,
  },
  glassCard: {
    overflow: 'hidden',
    gap: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(222,255,143,0.18)',
    padding: spacing.lg,
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 34,
    right: 34,
    height: 1,
    backgroundColor: 'rgba(230,255,172,0.48)',
  },
  cardHeader: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'rgba(7,11,8,0.78)',
    borderColor: 'rgba(180,198,182,0.2)',
  },
  secondaryActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  previewBlock: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  previewCopy: {
    gap: 3,
  },
  previewEyebrow: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    opacity: 0.7,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: palette.lime,
  },
});
