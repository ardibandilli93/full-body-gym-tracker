import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppSlider } from '@/components/app-slider';
import { AppText } from '@/components/app-text';
import { AvatarStage } from '@/components/avatar-stage';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import type { UnitSystem } from '@/domain/types';
import { useApp } from '@/providers/app-provider';
import { useAuth } from '@/providers/auth-provider';
import { palette, radius, spacing } from '@/theme';

function weightLabel(kg: number, units: UnitSystem) {
  return units === 'metric' ? `${Math.round(kg)} kg` : `${Math.round(kg * 2.20462)} lb`;
}

export default function ProfileScreen() {
  const auth = useAuth();
  const { profile, activePlan, sessions, updateProfile } = useApp();
  const [name, setName] = useState(profile?.preferredName ?? '');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile?.unitSystem ?? 'metric');
  const [currentWeightKg, setCurrentWeightKg] = useState(profile?.currentWeightKg ?? 75);
  const [goalWeightKg, setGoalWeightKg] = useState(profile?.goalWeightKg ?? 72);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  async function save() {
    await updateProfile({ preferredName: name.trim() || profile!.preferredName, unitSystem, currentWeightKg, goalWeightKg });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function signOut() {
    await auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  return (
    <AppScreen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">PROFILE</AppText>
        <AppText variant="title">Your training self.</AppText>
      </View>

      <AvatarStage gender={profile.gender} heightCm={profile.heightCm} currentWeightKg={currentWeightKg} goalWeightKg={goalWeightKg} />

      <Card style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}><AppText variant="heading" tone="accent">{profile.age}</AppText><AppText variant="caption" tone="muted">AGE</AppText></View>
        <View style={{ width: 1, backgroundColor: palette.line }} />
        <View style={{ alignItems: 'center' }}><AppText variant="heading" tone="accent">{Math.round(profile.heightCm)}</AppText><AppText variant="caption" tone="muted">CM</AppText></View>
        <View style={{ width: 1, backgroundColor: palette.line }} />
        <View style={{ alignItems: 'center' }}><AppText variant="heading" tone="accent">{sessions.filter((item) => item.status === 'complete').length}</AppText><AppText variant="caption" tone="muted">WORKOUTS</AppText></View>
      </Card>

      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">Personal details</AppText>
        <FormField label="Preferred name" value={name} onChangeText={setName} autoCapitalize="words" />
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label">Display units</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {(['metric', 'imperial'] as UnitSystem[]).map((unit) => (
              <Pressable key={unit} onPress={() => setUnitSystem(unit)} style={{ flex: 1, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: unitSystem === unit ? `${palette.lime}18` : palette.panel, borderWidth: 1, borderColor: unitSystem === unit ? palette.lime : palette.line }}>
                <AppText variant="label" tone={unitSystem === unit ? 'accent' : 'primary'}>{unit[0]!.toUpperCase() + unit.slice(1)}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText variant="label">Current weight</AppText><AppText variant="heading" tone="accent">{weightLabel(currentWeightKg, unitSystem)}</AppText></View>
          <AppSlider value={currentWeightKg} onValueChange={setCurrentWeightKg} min={40} max={180} step={1} />
        </Card>
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><AppText variant="label">Goal weight</AppText><AppText variant="heading" tone="accent">{weightLabel(goalWeightKg, unitSystem)}</AppText></View>
          <AppSlider value={goalWeightKg} onValueChange={setGoalWeightKg} min={40} max={180} step={1} />
        </Card>
        <AppButton label={saved ? 'Saved' : 'Save changes'} onPress={() => void save()} />
      </View>

      <Card style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="muted">CURRENT ROUTINE</AppText>
        <AppText variant="heading">{activePlan?.name}</AppText>
        <AppText tone="muted">{activePlan?.days.filter((day) => !day.isRest).length ?? 0} training days planned.</AppText>
      </Card>

      <AppButton label="Sign out" variant="danger" onPress={() => void signOut()} />
      <AppText variant="caption" tone="muted" style={{ textAlign: 'center' }}>Full Body stores workout changes offline first and syncs them when your account is online.</AppText>
    </AppScreen>
  );
}
