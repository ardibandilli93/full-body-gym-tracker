import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function RoutineLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ink } }} />;
}
