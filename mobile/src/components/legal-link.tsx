import { router, type Href } from 'expo-router';
import { Pressable, type PressableProps } from 'react-native';

import type { LegalDocumentId } from '@/legal/policies';
import { AppText } from './app-text';

type LegalLinkProps = Omit<PressableProps, 'children' | 'onPress'> & {
  document: LegalDocumentId;
  label: string;
};

export function LegalLink({ document, label, ...props }: LegalLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Open ${label}`}
      hitSlop={10}
      onPress={() => router.push(`/legal/${document}` as Href)}
      {...props}
    >
      <AppText variant="label" tone="accent" style={{ textDecorationLine: 'underline' }}>{label}</AppText>
    </Pressable>
  );
}
