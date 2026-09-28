import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { AppScreen } from '@/components/app-screen';
import { AppSlider } from '@/components/app-slider';
import { AppText } from '@/components/app-text';
import { AvatarStage } from '@/components/avatar-stage';
import { Card } from '@/components/card';
import { ConsentRow } from '@/components/consent-row';
import { FormField } from '@/components/form-field';
import { LegalLink } from '@/components/legal-link';
import { cloneRoutine, createCustomWeek, routineTemplates } from '@/domain/routines';
import type { Gender, RoutinePlan, UnitSystem } from '@/domain/types';
import { LEGAL_VERSION } from '@/legal/policies';
import { useApp } from '@/providers/app-provider';
import { useAuth } from '@/providers/auth-provider';
import { palette, radius, spacing } from '@/theme';

const stepTitles = ['Meet your training self', 'Set your baseline', 'Shape the goal', 'Choose your rhythm', 'Control your data'];

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? palette.lime : palette.line,
        backgroundColor: selected ? `${palette.lime}18` : palette.panel,
      }}
    >
      <AppText variant="label" tone={selected ? 'accent' : 'primary'}>{label}</AppText>
    </Pressable>
  );
}

function displayHeight(cm: number, units: UnitSystem) {
  if (units === 'metric') return `${Math.round(cm)} cm`;
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′ ${inches % 12}″`;
}

function displayWeight(kg: number, units: UnitSystem) {
  return units === 'metric' ? `${Math.round(kg)} kg` : `${Math.round(kg * 2.20462)} lb`;
}

export default function OnboardingScreen() {
  const auth = useAuth();
  const app = useApp();
  const [step, setStep] = useState(0);
  const [preferredName, setPreferredName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [ageText, setAgeText] = useState('25');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [heightCm, setHeightCm] = useState(175);
  const [currentWeightKg, setCurrentWeightKg] = useState(75);
  const [goalWeightKg, setGoalWeightKg] = useState(72);
  const [selectedPlan, setSelectedPlan] = useState<RoutinePlan>(routineTemplates[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthConsent, setHealthConsent] = useState(false);

  const age = Number(ageText);
  const canContinue = useMemo(() => {
    if (step === 0) return preferredName.trim().length >= 2 && Number.isInteger(age) && age >= 18 && age <= 100;
    if (step === stepTitles.length - 1) return healthConsent;
    return true;
  }, [step, preferredName, age, healthConsent]);

  if (!auth.ownerId) return <Redirect href="/(auth)/sign-in" />;
  if (app.profile?.onboardingComplete) return <Redirect href="/(tabs)/today" />;

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const plan = selectedPlan.isCustom ? createCustomWeek() : cloneRoutine(selectedPlan);
      await app.completeOnboarding({
        preferredName: preferredName.trim(),
        gender,
        age,
        unitSystem,
        heightCm,
        currentWeightKg,
        goalWeightKg,
        healthConsentVersion: LEGAL_VERSION,
        healthConsentAt: new Date().toISOString(),
      }, plan);
      router.replace('/(tabs)/today');
    } catch (finishError) {
      setError(finishError instanceof Error ? finishError.message : 'Could not save onboarding.');
    } finally {
      setBusy(false);
    }
  }

  const footer = (
    <>
      {error ? <AppText accessibilityLiveRegion="polite" role="alert" tone="danger">{error}</AppText> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {step > 0 ? <View style={{ flex: 1 }}><AppButton label="Back" variant="secondary" onPress={() => setStep((value) => value - 1)} /></View> : null}
        <View style={{ flex: 2 }}>
          <AppButton
            label={step === stepTitles.length - 1 ? 'Build my plan' : 'Continue'}
            disabled={!canContinue}
            loading={busy}
            onPress={() => step === stepTitles.length - 1 ? void finish() : setStep((value) => value + 1)}
          />
        </View>
      </View>
    </>
  );

  return (
    <AppScreen footer={footer}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {stepTitles.map((_, index) => (
          <View key={index} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: index <= step ? palette.lime : palette.line }} />
        ))}
      </View>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">STEP {step + 1} OF {stepTitles.length}</AppText>
        <AppText variant="title">{stepTitles[step]}</AppText>
      </View>

      {step === 0 ? (
        <View style={{ gap: spacing.lg }}>
          <FormField label="What should we call you?" value={preferredName} onChangeText={setPreferredName} placeholder="Preferred name" autoCapitalize="words" />
          <View style={{ gap: spacing.sm }}>
            <AppText variant="label">Gender</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['male', 'female', 'other'] as Gender[]).map((value) => (
                <Choice key={value} label={value[0]!.toUpperCase() + value.slice(1)} selected={gender === value} onPress={() => setGender(value)} />
              ))}
            </View>
          </View>
          <FormField label="Age" value={ageText} onChangeText={setAgeText} keyboardType="number-pad" maxLength={3} error={age < 18 ? 'You must be 18 or older to use Full Body.' : null} />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: spacing.lg }}>
          <AvatarStage gender={gender} heightCm={heightCm} currentWeightKg={currentWeightKg} goalWeightKg={currentWeightKg} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Choice label="Metric" selected={unitSystem === 'metric'} onPress={() => setUnitSystem('metric')} />
            <Choice label="Imperial" selected={unitSystem === 'imperial'} onPress={() => setUnitSystem('imperial')} />
          </View>
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="label">Height</AppText><AppText variant="heading" tone="accent">{displayHeight(heightCm, unitSystem)}</AppText>
            </View>
            <AppSlider accessibilityLabel="Height in centimetres" value={heightCm} onValueChange={setHeightCm} min={140} max={220} step={1} testID="height-slider" />
          </Card>
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="label">Current weight</AppText><AppText variant="heading" tone="accent">{displayWeight(currentWeightKg, unitSystem)}</AppText>
            </View>
            <AppSlider accessibilityLabel="Current weight in kilograms" value={currentWeightKg} onValueChange={setCurrentWeightKg} min={40} max={180} step={1} testID="weight-slider" />
          </Card>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: spacing.lg }}>
          <AvatarStage gender={gender} heightCm={heightCm} currentWeightKg={currentWeightKg} goalWeightKg={goalWeightKg} />
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="label">Goal weight</AppText><AppText variant="heading" tone="accent">{displayWeight(goalWeightKg, unitSystem)}</AppText>
            </View>
            <AppSlider accessibilityLabel="Goal weight in kilograms" value={goalWeightKg} onValueChange={setGoalWeightKg} min={40} max={180} step={1} testID="goal-weight-slider" />
            <AppText tone="muted">
              {goalWeightKg < currentWeightKg ? 'Leaner is the direction. We will track strength while weight moves down.' : goalWeightKg > currentWeightKg ? 'More mass is the direction. Consistent progression will lead the way.' : 'Maintain your weight while building consistency and strength.'}
            </AppText>
          </Card>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: spacing.sm }}>
          {routineTemplates.map((plan) => (
            <Pressable accessibilityRole="radio" accessibilityState={{ selected: selectedPlan.id === plan.id }} key={plan.id} onPress={() => setSelectedPlan(plan)}>
              <Card style={{ gap: spacing.xs, borderColor: selectedPlan.id === plan.id ? palette.lime : palette.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                  <AppText variant="heading" style={{ flex: 1 }}>{plan.name}</AppText>
                  <AppText variant="label" tone="accent">{plan.daysPerWeek} DAYS</AppText>
                </View>
                <AppText tone="muted">{plan.description}</AppText>
              </Card>
            </Pressable>
          ))}
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: selectedPlan.isCustom }} onPress={() => setSelectedPlan(createCustomWeek())}>
            <Card style={{ gap: spacing.xs, borderColor: selectedPlan.isCustom ? palette.lime : palette.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="heading">Custom Week</AppText><AppText variant="label" tone="accent">FLEXIBLE</AppText>
              </View>
              <AppText tone="muted">Set every weekday to training or rest, then choose each exercise yourself.</AppText>
            </Card>
          </Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="heading" accessibilityRole="header">Your fitness data stays focused.</AppText>
            <AppText>
              Full Body uses your height, weight, goal, routine, sets, reps, and workout history to build your plan, save progress, and sync it to your account.
            </AppText>
            <AppText tone="muted">
              We do not send this data to advertisers or analytics tools. You can export it or delete your account and associated data from Profile.
            </AppText>
          </Card>
          <ConsentRow
            checked={healthConsent}
            onChange={setHealthConsent}
            label="I explicitly consent to Full Body processing my body measurements and workout records to provide fitness tracking and account sync. I understand that I can withdraw consent by deleting my account and data."
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <LegalLink document="privacy" label="Read Privacy Notice" />
            <LegalLink document="cookies" label="Device storage" />
          </View>
          <AppText variant="caption" tone="muted">This consent is separate from the Terms and is never preselected.</AppText>
        </View>
      ) : null}

    </AppScreen>
  );
}
