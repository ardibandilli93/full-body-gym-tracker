import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function TodayLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ink } }} />;
}
