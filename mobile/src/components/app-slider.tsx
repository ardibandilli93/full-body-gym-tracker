import { Host, Slider, type SliderProps } from '@expo/ui';
import { View } from 'react-native';

type AppSliderProps = SliderProps & {
  accessibilityLabel?: string;
};

// @expo/ui renders SwiftUI / Jetpack Compose views, which crash natively unless they sit inside a Host.
export function AppSlider({ accessibilityLabel, ...props }: AppSliderProps) {
  const value = typeof props.value === 'number' ? props.value : 0;
  const min = typeof props.min === 'number' ? props.min : 0;
  const max = typeof props.max === 'number' ? props.max : 1;
  const step = typeof props.step === 'number' ? props.step : 1;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) => {
        const amount = nativeEvent.actionName === 'increment' ? step : nativeEvent.actionName === 'decrement' ? -step : 0;
        if (amount) props.onValueChange?.(Math.min(max, Math.max(min, value + amount)));
      }}
    >
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <Slider {...props} />
      </Host>
    </View>
  );
}
