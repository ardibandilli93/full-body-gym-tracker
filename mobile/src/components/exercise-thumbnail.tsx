import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { exerciseArtFor } from '@/domain/exercise-art';
import { palette, radius } from '@/theme';

export function ExerciseThumbnail({ exerciseId, size = 72 }: { exerciseId: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        overflow: 'hidden',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: `${palette.lime}24`,
        backgroundColor: '#0C110D',
      }}
    >
      <LinearGradient colors={['#1C2A1B', '#0A0E0B']} style={{ position: 'absolute', inset: 0 }} />
      <View style={{ position: 'absolute', width: size * 0.72, height: size * 0.72, left: size * 0.14, top: size * 0.14, borderRadius: size, backgroundColor: `${palette.lime}10` }} />
      <Image accessible={false} source={exerciseArtFor(exerciseId)} contentFit="contain" transition={160} style={{ width: size, height: size }} />
    </View>
  );
}
