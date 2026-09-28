import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppScreen } from '@/components/app-screen';
import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { isLegalDocumentId, LEGAL_VERSION, policyDocuments } from '@/legal/policies';
import { palette, radius, spacing } from '@/theme';

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document?: string }>();
  if (!isLegalDocumentId(document)) return <Redirect href="/" />;
  const policy = policyDocuments[document];

  return (
    <AppScreen>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          minHeight: 44,
          minWidth: 80,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: palette.line,
          backgroundColor: palette.panel,
          opacity: pressed ? 0.76 : 1,
        })}
      >
        <AppText variant="label">← Back</AppText>
      </Pressable>

      <View style={{ gap: spacing.xs }}>
        <AppText variant="caption" tone="accent">LEGAL · VERSION {LEGAL_VERSION}</AppText>
        <AppText variant="title" accessibilityRole="header">{policy.title}</AppText>
        <AppText tone="muted">{policy.summary}</AppText>
      </View>

      {policy.sections.map((section) => (
        <Card key={section.heading} style={{ gap: spacing.sm }}>
          <AppText variant="heading" accessibilityRole="header">{section.heading}</AppText>
          {section.paragraphs?.map((paragraph) => <AppText key={paragraph}>{paragraph}</AppText>)}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <AppText tone="accent" accessibilityElementsHidden>•</AppText>
              <AppText style={{ flex: 1 }}>{bullet}</AppText>
            </View>
          ))}
        </Card>
      ))}
    </AppScreen>
  );
}
