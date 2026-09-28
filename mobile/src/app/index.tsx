import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useApp } from '@/providers/app-provider';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const auth = useAuth();
  const app = useApp();

  if (auth.loading || (auth.ownerId && app.loading)) return <LoadingScreen />;
  if (!auth.ownerId) return <Redirect href="/(auth)/sign-in" />;
  if (!app.profile?.onboardingComplete) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/today" />;
}
