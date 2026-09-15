import { journey as J } from '@sentinel/domain';

import { Gap, SecondaryAction } from './Actions';
import { Glass } from './Glass';
import { Text } from './Text';
import { space } from '../design/tokens';
import { t } from '../phrases';

/** A journey under way, on the home: its state in one line, and the arrival that still asks. */
export function JourneyCard({ journey, nowMinutes, onArrived }: { journey: J.Journey; nowMinutes: number; onArrived: () => void }) {
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
