import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { circle as C } from '@sentinel/domain';

import { Gap, SecondaryAction } from '../components/Actions';
import { Text } from '../components/Text';
import { space, target } from '../design/tokens';
import { t } from '../phrases';

/**
 * The second rung (ADR-0009): the organisations somebody vouched for, by
 * the name of a place, and the one the person opted into. Opting in is an
 * invitation the organisation accepts from its console; until then it is
 * told nothing, and either side ends it now.
 */
export function OrganisationsScreen({
  organisations,
  circle,
  onOptIn,
  onOptOut,
  onBack,
}: {
  organisations: ReadonlyArray<{ phoneHash: string; name: string }> | null;
  circle: C.Circle;
  onOptIn: (org: { phoneHash: string; name: string }) => void;
  onOptOut: (phoneHash: string) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.organisations}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.organisationsHint}
        </Text>
        <Gap />
        {organisations === null ? (
          <Text variant="body" tone="attention">
            {t.organisationsUnreachable}
          </Text>
        ) : organisations.length === 0 ? (
          <Text variant="secondary" tone="secondary">
            {t.organisationsNone}
          </Text>
        ) : (
          organisations.map((o) => {
            const rel = circle.members.find((m) => m.with === o.phoneHash);
            return (
              <View key={o.phoneHash} style={styles.row} testID={`org-${o.name}`}>
                <View style={styles.grow}>
                  <Text variant="body">{o.name}</Text>
                  {rel ? (
                    <Text variant="small" tone="secondary">
                      {rel.state === 'member' ? t.ladderOrganisation : t.optedIn}
                    </Text>
                  ) : null}
                </View>
                {rel ? <SecondaryAction label={t.optOut} onPress={() => onOptOut(o.phoneHash)} /> : <SecondaryAction label={t.optIn} onPress={() => onOptIn(o)} />}
              </View>
            );
          })
        )}
        <Gap />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: target.standard, gap: space.s },
  grow: { flex: 1 },
});
