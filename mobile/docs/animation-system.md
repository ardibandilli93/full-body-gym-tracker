# Animation and visual effects

The app uses each motion tool where it performs best.

| Layer | Runtime | Current use |
| --- | --- | --- |
| Touch feedback and layout motion | React Native Reanimated | Spring-driven avatar dimensions, press feedback, staged progress bars, and reduced-motion behavior |
| Platform controls and transitions | Expo UI and Expo Router | Native sliders, native tab behavior, stack transitions, and platform typography/interaction conventions |
| Celebratory illustration | Lottie | First workout, progress up, progress down, and steady-progress recap sequences |
| Character art | Rive-compatible component boundary | `AvatarStage` accepts gender, height, current weight, and goal weight; the current vector fallback can be replaced by one Rive state machine without changing onboarding screens |
| Shareable video | Remotion render service | Planned recap and milestone video export; it consumes a recap data object and renders off-device rather than running a browser video renderer inside the native interaction loop |

## Character state machine contract

The production `.riv` file should expose numeric inputs for `height`, `bodyMass`, and `goalDirection`, a discrete `presentation` input for the selected gender treatment, and triggers for `idle`, `confirm`, and `celebrate`. Inputs must interpolate continuously so dragging a slider never snaps between body states. The current fallback follows the same contract with Reanimated springs and timing curves.

## Motion rules

- Press reactions complete within 120 ms and never delay navigation.
- Slider-driven character changes update on the UI thread and avoid React state per animation frame.
- Entry transitions stay near 420 ms; completion motion is reserved for the recap.
- Reduced-motion preferences remove spring travel and long sequencing while preserving state changes.
- Lottie assets are local, deterministic, and do not block workout persistence or navigation.
- Remotion is reserved for exported media. Embedding it into the mobile runtime would add a web renderer to high-frequency native screens and reduce interaction quality.

## Artwork handoff

The remaining art dependency is a commissioned Rive file with male, female, and inclusive presentation states. Add the asset under `assets/rive`, install the current Expo-compatible Rive runtime in the development client, and replace the internals of `AvatarStage`; its public props and all screens stay unchanged.
