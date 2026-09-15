import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alert, duress as D, numbers } from '@sentinel/domain';

import { Gap } from '../components/Actions';
import { Glass } from '../components/Glass';
import { HoldToCancel } from '../components/HoldToCancel';
import { PinPad } from '../components/PinPad';
import { Text } from '../components/Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/**
 * An alert in progress: the numbers first, the honest delivery state, who
 * has acknowledged and who has not — never where anyone is (ADR-0006 #14)
 * — and the cancel that a coercer cannot perform by reaching over.
 */
export function AlertScreen({
  record,
  circle,
  unreachable = [],
  pins,
  state,
  nowMinutes,
  onCancel,
}: {
  record: alert.AlertRecord;
  circle: ReadonlyArray<{ hash: string; name: string }>;
  unreachable?: ReadonlyArray<string>;
  pins: D.Pins | null;
  state: string | null;
  nowMinutes: number;
  onCancel: (underDuress: boolean) => void;
}) {
  const [held, setHeld] = useState(false);
  const [wrong, setWrong] = useState(false);
  const gesture: D.CancelGesture = { fingers: D.CANCEL_FINGERS, heldMs: D.CANCEL_HOLD_MS };
  const insets = useSafeAreaInsets();
  const d = alert.delivery(record, nowMinutes);
  const acks = alert.acknowledgements(record, circle.map((m) => m.hash));
  const official = numbers.numbersFor(state);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <Text variant="display" accessibilityLabel={`${official[0]!.label} ${official[0]!.number}`}>
        {official[0]!.number}
      </Text>
      <Text variant="secondary" tone="secondary">
        {t.officialFirst}
      </Text>
      <Gap h={space.l} />
      <Glass depth="mid">
        <Text variant="headline" tone={d.state === 'not delivered' ? 'attention' : d.state === 'delivered' ? 'fine' : 'primary'} testID="delivery">
          {d.state === 'delivered' ? t.alertSentTo : d.state === 'trying' ? t.delivering : t.notDelivered}
        </Text>
        <Gap h={space.s} />
        {acks.length === 0 ? (
          <Text variant="body" tone="attention">
            {t.alertNobody}
          </Text>
        ) : null}
        {acks.map((a) => {
          const m = circle.find((x) => x.hash === a.who);
          const line = unreachable.includes(a.who) ? t.notSealed : a.at === null ? t.notYetAcknowledged : t.acknowledgedBy;
          return (
            <Text key={a.who} variant="body" tone={unreachable.includes(a.who) ? 'attention' : 'primary'} accessibilityLabel={`${m?.name ?? a.who}: ${line}`}>
              {m?.name ?? a.who} · {line}
            </Text>
          );
        })}
      </Glass>
      <View style={styles.grow} />
      {held && pins ? (
        <PinPad
          label={t.enterPin}
          wrong={wrong}
          onEntered={(hash) => {
            const out = D.cancel(pins, gesture, hash);
            if (out.cancelled) onCancel(out.tellCircle === 'cancelled under duress');
            else setWrong(true);
          }}
        />
      ) : (
        <>
          <HoldToCancel
            label={t.cancelAlert}
            onHeld={() => {
              // No PIN set yet: the gesture alone ends it; it is still not a reach-over.
              if (pins) setHeld(true);
              else onCancel(false);
            }}
          />
          <Gap h={space.s} />
          <Text variant="small" tone="secondary" style={styles.centre}>
            {t.cancelHow}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, paddingHorizontal: space.l },
  grow: { flex: 1 },
  centre: { textAlign: 'center' },
});
