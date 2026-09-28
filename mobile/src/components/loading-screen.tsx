import { ActivityIndicator, View } from 'react-native';

import { palette } from '@/theme';

export function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.ink }}>
      <ActivityIndicator size="large" color={palette.lime} />
    </View>
  );
}
