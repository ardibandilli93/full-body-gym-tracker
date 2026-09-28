import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { LoadingScreen } from '@/components/loading-screen';
import { useApp } from '@/providers/app-provider';
import { useAuth } from '@/providers/auth-provider';
import { palette } from '@/theme';

export default function TabsLayout() {
  const auth = useAuth();
  const app = useApp();
  if (auth.loading || (auth.ownerId && app.loading)) return <LoadingScreen />;
  if (!auth.ownerId) return <Redirect href="/(auth)/sign-in" />;
  if (!app.profile?.onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs
      backgroundColor={palette.panel}
      tintColor={palette.lime}
      iconColor={{ default: palette.muted, selected: palette.lime }}
      labelStyle={{ default: { color: palette.muted }, selected: { color: palette.lime, fontWeight: '700' } }}
    >
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} md="fitness_center" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="routine">
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar.circle.fill' }} md="calendar_month" />
        <NativeTabs.Trigger.Label>Routine</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="monitoring" />
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
