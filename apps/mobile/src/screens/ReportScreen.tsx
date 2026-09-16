import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { categories as Cat, screen as S } from '@sentinel/domain';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { screenOnDevice, type Refusal } from '../community';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';

/**
 * The reporting screen (FR-4.1): the closed list as tiles, the place is where
 * the phone is, and a sentence about the event that the screen checks on
 * every keystroke — the blocked-report explainer says why and offers the
 * event instead. The one category about a person is not on this screen at all.
 */
export function ReportScreen({ refused, onSend, onBack }: { refused: Refusal | null; onSend: (category: Cat.Category, text: string | null) => void; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const [category, setCategory] = useState<Cat.Category | null>(null);
  const [text, setText] = useState('');
  const screened = text.trim() ? screenOnDevice(text) : null;
  const blocked = screened !== null && !screened.ok;
  const list = Cat.CATEGORIES.filter((k) => !Cat.HUMAN_REVIEW_ALWAYS.has(k));
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.reportSomething}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.reportHint}
        </Text>
        <Gap />
        <Text variant="title">{t.whatHappened}</Text>
        <Gap h={space.s} />
        <View style={styles.grid}>
          {list.map((k) => {
            const on = category === k;
            return (
              <Pressable
                key={k}
                testID={`cat-${k}`}
                accessibilityRole="button"
                accessibilityLabel={t.category[k] ?? k}
                accessibilityState={{ selected: on }}
                onPress={() => setCategory(k)}
                style={[styles.tile, { backgroundColor: on ? c.accent : c.glassMid, borderColor: c.hairline }]}
              >
                <Text variant="body" tone={on ? 'onAccent' : 'primary'}>
                  {t.category[k] ?? k}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Gap />
        <TextInput
          testID="reportText"
          value={text}
          onChangeText={setText}
          multiline
          placeholder={t.describeEvent}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.describeEvent}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        {blocked ? <Explainer reasons={screened.reasons} /> : null}
        {refused ? (
          <>
            <Gap h={space.s} />
            <Text variant="body" tone="attention" testID="refused">
              {refusalWords(refused)}
            </Text>
          </>
        ) : null}
        <Gap />
        <PrimaryAction label={t.send} disabled={category === null || blocked} onPress={() => category && onSend(category, text.trim() || null)} />
        <Gap h={space.s} />
        <SecondaryAction label={t.back} onPress={onBack} />
      </ScrollView>
    </View>
  );
}

/** The blocked-report explainer: each reason as a sentence, and the way out. */
function Explainer({ reasons }: { reasons: ReadonlyArray<S.Reason> }) {
  return (
    <>
      <Gap h={space.s} />
      <Glass depth="mid" testID="explainer">
        <Text variant="title" tone="attention">
          {t.blockedTitle}
        </Text>
        {reasons.map((r) => (
          <Text key={r} variant="body">
            {reasonWords(r)}
          </Text>
        ))}
        <Gap h={space.xs} />
        <Text variant="small" tone="secondary">
          {t.blockedHint}
        </Text>
      </Glass>
    </>
  );
}

function reasonWords(r: string): string {
  switch (S.reasonKey(r)) {
    case 'name':
      return t.reasonName;
    case 'looks':
      return t.reasonDescription;
    case 'clothing':
      return t.reasonClothing;
    case 'group':
      return t.reasonIdentifier;
    case 'plate':
      return t.reasonPlate;
    case 'phone':
      return t.reasonPhone;
    default:
      return r;
  }
}

export function refusalWords(r: Refusal): string {
  switch (r.reason) {
    case 'about a person':
      return r.details.map(reasonWords).join(' ');
    case 'too many':
      return t.reasonTooMany;
    case 'no account':
      return t.reasonNoAccount;
    case 'screener unavailable':
      return t.reasonScreener;
    case 'unreachable':
      return t.refusedUnreachable;
    default:
      return r.reason;
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: space.l },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  tile: { minHeight: target.standard, borderRadius: radius.card, borderWidth: 1, paddingHorizontal: space.m, justifyContent: 'center', flexGrow: 1 },
  input: { borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.m, paddingVertical: space.s, minHeight: target.standard * 1.6 },
});
