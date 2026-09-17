import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gap, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * The data-request page (ADR-0013): what the server holds, what it cannot
 * read, and what happens when somebody with authority asks — in the words
 * of the code, with the lines the privacy card derives from state above
 * them, and no promise about people.
 */
export function PolicyScreen({ knows, onBack }: { knows: ReadonlyArray<string>; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.policy}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.policyHint}
        </Text>
        <Gap />
        <Glass depth="low">
          <Text variant="title">{t.policyHolds}</Text>
          <Gap h={space.xs} />
          <Text variant="body">{t.policyHoldsLines}</Text>
          <Gap h={space.xs} />
          <Text variant="small" tone="secondary" testID="policyKnows">
            {knows.join(' · ')}
          </Text>
        </Glass>
        <Gap h={space.s} />
        <Glass depth="low">
          <Text variant="title">{t.policyCannot}</Text>
          <Gap h={space.xs} />
          <Text variant="body">{t.policyCannotLines}</Text>
        </Glass>
        <Gap h={space.s} />
        <Glass depth="low">
          <Text variant="title">{t.policyAsked}</Text>
          <Gap h={space.xs} />
          <Text variant="body">{t.policyAskedLines}</Text>
        </Glass>
        <Gap h={space.s} />
        <Text variant="small" tone="secondary">
          {t.policyNoPromise}
        </Text>
        <Gap />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
});
