import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.ink } }} />;
}
