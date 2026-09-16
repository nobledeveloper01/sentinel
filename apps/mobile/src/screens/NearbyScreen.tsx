import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { DISPUTE_REASONS, type DisputeReason, type NearbyReport } from '../community';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * The radius-bounded feed (FR-4.2). Every row is an event at a place with its
 * stage in words; there is no count, no ranking and no map — the reach engine
 * decided what is here, and the screen only shows it. A withdrawal the person
 * was shown is the first thing on the screen.
 */
export function NearbyScreen({
  reports,
  corrections,
  mine,
  state,
  onReport,
  onCorroborate,
  onDispute,
  onWithdraw,
  onBack,
}: {
  reports: ReadonlyArray<NearbyReport> | null;
  corrections: ReadonlyArray<string>;
  /** Ids of this phone's own reports, so the row offers *take back* and not *saw it too*. */
  mine: ReadonlyArray<string>;
  state: 'ok' | 'no position' | 'unreachable';
  onReport: () => void;
  onCorroborate: (id: string) => void;
  onDispute: (id: string, reason: DisputeReason) => void;
  onWithdraw: (id: string) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [disputing, setDisputing] = useState<string | null>(null);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.nearby}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.nearbyHint}
        </Text>
        <Gap />
        {corrections.length > 0 ? (
          <>
            <Glass depth="mid" testID="correction">
              <Text variant="body" tone="attention">
                {t.corrected}
              </Text>
            </Glass>
            <Gap />
          </>
        ) : null}
        {state === 'no position' ? (
          <Text variant="body" tone="attention" testID="nearbyState">
            {t.nearbyNoPosition}
          </Text>
        ) : state === 'unreachable' ? (
          <Text variant="body" tone="attention" testID="nearbyState">
            {t.nearbyUnreachable}
          </Text>
        ) : reports === null || reports.length === 0 ? (
          <Text variant="body" tone="secondary" testID="nearbyState">
            {t.nearbyEmpty}
          </Text>
        ) : (
          reports.map((r) => (
            <View key={r.id}>
              <Glass depth="low" testID={`report-${r.id}`}>
                <Text variant="title">{t.category[r.category] ?? r.category}</Text>
                <Text variant="small" tone="secondary">
                  {t.aboutMetres(r.distanceM)} · {stageWord(r.stage)}
                </Text>
                {r.text ? (
                  <>
                    <Gap h={space.xs} />
                    <Text variant="body">{r.text}</Text>
                  </>
                ) : null}
                <Gap h={space.s} />
                {mine.includes(r.id) ? (
                  <SecondaryAction label={t.withdrawMine} onPress={() => onWithdraw(r.id)} />
                ) : disputing === r.id ? (
                  <View>
                    <Text variant="small" tone="secondary">
                      {t.disputeWhy}
                    </Text>
                    {DISPUTE_REASONS.map((reason) => (
                      <View key={reason}>
                        <Gap h={space.xs} />
                        <SecondaryAction
                          label={t.disputeReason[reason] ?? reason}
                          onPress={() => {
                            setDisputing(null);
                            onDispute(r.id, reason);
                          }}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.row}>
                    <View style={styles.grow}>
                      <SecondaryAction label={t.sawItToo} onPress={() => onCorroborate(r.id)} />
                    </View>
                    <View style={styles.grow}>
                      <SecondaryAction label={t.disputeIt} onPress={() => setDisputing(r.id)} />
                    </View>
                  </View>
                )}
              </Glass>
              <Gap h={space.s} />
            </View>
          ))
        )}
        <Gap />
        <PrimaryAction label={t.reportSomething} onPress={onReport} disabled={state === 'no position'} />
        <Gap h={space.s} />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

function stageWord(stage: NearbyReport['stage']): string {
  return { reported: t.stageReported, corroborated: t.stageCorroborated, confirmed: t.stageConfirmed, verified: t.stageVerified }[stage];
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  row: { flexDirection: 'row', gap: space.s },
  grow: { flex: 1 },
});
