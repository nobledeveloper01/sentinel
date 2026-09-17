import { journey as J } from '@sentinel/domain';

import { Gap, SecondaryAction } from './Actions';
import { Glass } from './Glass';
import { Text } from './Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/** A journey under way, on the home: its state in one line, and the arrival that still asks. */
export function JourneyCard({
  journey,
  nowMinutes,
  watcherName,
  hasFix = true,
  onArrived,
}: {
  journey: J.Journey;
  nowMinutes: number;
  /** For a watch: who is watching, by the name the user typed. */
  watcherName?: string | undefined;
  hasFix?: boolean;
  onArrived: () => void;
}) {
  if (J.isWatch(journey)) {
    // A watch (ADR-0011): who is watching and how long is left; the end is
    // its own, and the only action is to end it sooner.
    const line = t.watchUnderway(watcherName ?? journey.notify[0] ?? '', Math.max(0, journey.expectedMinutes - nowMinutes));
    return (
      <Glass depth="mid" accessibilityLabel={line}>
        <Text variant="title" testID="journeyState">
          {line}
        </Text>
        {!hasFix ? (
          <Text variant="small" tone="attention">
            {t.watchNoFix}
          </Text>
        ) : null}
        <Gap h={space.s} />
        <SecondaryAction label={t.endWatch} onPress={onArrived} />
      </Glass>
    );
  }
  const state = J.stateAt(journey, nowMinutes, false, false);
  const line = {
    underway: t.journeyUnderway(journey.destination.label, journey.expectedMinutes - nowMinutes),
    asking: t.areYouHome,
    reminding: t.areYouHome,
    escalated: t.journeyEscalated,
    arrived: t.arrived,
    cancelled: '',
  }[state];
  return (
    <Glass depth="mid" accessibilityLabel={line}>
      <Text variant="title" tone={state === 'escalated' ? 'attention' : 'primary'} testID="journeyState">
        {line}
      </Text>
      <Gap h={space.s} />
      <SecondaryAction label={t.arrived} onPress={onArrived} />
    </Glass>
  );
}
