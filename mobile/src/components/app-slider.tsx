import { Host, Slider, type SliderProps } from '@expo/ui';

// @expo/ui renders SwiftUI / Jetpack Compose views, which crash natively unless they sit inside a Host.
export function AppSlider(props: SliderProps) {
  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Slider {...props} />
    </Host>
  );
}
