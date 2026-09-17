import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { circle as C, journey as J, places as P } from '@sentinel/domain';

import { Gap, PrimaryAction, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';

/**
 * Safe arrival (FR-3), the wedge: where, by when, who to tell — under
 * twenty seconds. The plan is shown before it starts, so the person knows
 * what happens at +15 and that the server escalates even if the phone dies.
 */
export function JourneyScreen({
  circle,
  names,
  nowMinutes,
  batteryMinutesLeft,
  places = P.NONE,
  onStart,
  onKeep,
  onBack,
}: {
  circle: C.Circle;
  names: Readonly<Record<string, string>>;
  nowMinutes: number;
  batteryMinutesLeft: number | null;
  /** Templates as one tap and safe places as destinations (ADR-0010). */
  places?: P.Places;
  onStart: (j: J.Journey) => void;
  /** Keep this journey as a template, on the phone only. */
  onKeep?: (template: P.Template) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const [where, setWhere] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [notify, setNotify] = useState<string[]>(C.members(circle).map((m) => m.with));
  const expected = nowMinutes + (Number(minutes) || 0);
  const draft: J.Journey = {
    id: String(nowMinutes),
    startedMinutes: nowMinutes,
    expectedMinutes: expected,
    notify,
    liveShare: false,
    graceMinutes: J.DEFAULT_GRACE_MINUTES,
    destination: { x: 0, y: 0, label: where.trim() },
  };
  const plan = J.plan(draft);
  const ready = where.trim().length > 0 && Number(minutes) > 0 && notify.length > 0;
  const memberHashes = C.members(circle).map((m) => m.with);
  const fromTemplate = (tpl: P.Template): J.Journey => {
    const u = P.usable(tpl, memberHashes);
    return { ...draft, id: String(nowMinutes), expectedMinutes: nowMinutes + u.minutes, notify: u.notify, destination: { x: 0, y: 0, label: u.label } };
  };
  const battery = batteryMinutesLeft !== null && !J.batteryOutlasts(batteryMinutesLeft, draft, nowMinutes);
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.journeyStart}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.journeyHint}
        </Text>
        <Gap />
        {places.templates.length > 0 ? (
          <>
            <Text variant="title">{t.templates}</Text>
            {places.templates.map((tpl) => {
              const u = P.usable(tpl, memberHashes);
              return (
                <View key={tpl.label} style={styles.row}>
                  <View style={styles.grow}>
                    <Text variant="body">{tpl.label}</Text>
                    <Text variant="small" tone="secondary">
                      {t.templateLine(tpl.minutes, u.notify.length)}
                    </Text>
                  </View>
                  <SecondaryAction label={t.startThisOne} disabled={u.notify.length === 0} onPress={() => onStart(fromTemplate(tpl))} />
                </View>
              );
            })}
            <Gap />
          </>
        ) : null}
        <TextInput
          testID="where"
          value={where}
          onChangeText={setWhere}
          placeholder={t.where}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.where}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        {P.destinations(places).length > 0 ? (
          <>
            <Gap h={space.xs} />
            <Text variant="small" tone="secondary">
              {t.destinations}
            </Text>
            <View style={styles.wrap}>
              {P.destinations(places).map((d) => (
                <SecondaryAction key={d} label={d} onPress={() => setWhere(d)} />
              ))}
            </View>
          </>
        ) : null}
        <Gap h={space.s} />
        <TextInput
          testID="minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          placeholder={t.minutesFromNow}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.minutesFromNow}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        <Gap />
        <Text variant="title">{t.whoToTell}</Text>
        {C.members(circle).length === 0 ? (
          <Text variant="secondary" tone="secondary">
            {t.circleEmpty}
          </Text>
        ) : (
          C.members(circle).map((m) => {
            const on = notify.includes(m.with);
            return (
              <View key={m.with} style={styles.row}>
                <Text variant="body" style={styles.grow}>
                  {names[m.with] ?? m.with}
                </Text>
                <SecondaryAction label={on ? t.telling : t.notTelling} onPress={() => setNotify(on ? notify.filter((x) => x !== m.with) : [...notify, m.with])} />
              </View>
            );
          })
        )}
        <Gap />
        <Glass depth="low">
          <Text variant="title">{t.whatHappens}</Text>
          <Gap h={space.xs} />
          <Text variant="body" testID="plan">
            {t.planLine(plan.ask - nowMinutes, plan.escalate - nowMinutes)}
          </Text>
          <Gap h={space.xs} />
          <Text variant="small" tone="secondary">
            {t.serverEscalates}
          </Text>
          {battery ? (
            <>
              <Gap h={space.xs} />
              <Text variant="small" tone="attention" testID="battery">
                {t.batteryShort}
              </Text>
            </>
          ) : null}
        </Glass>
        <Gap />
        <PrimaryAction label={t.journeyGo} disabled={!ready} onPress={() => onStart(draft)} />
        {onKeep ? (
          <>
            <Gap h={space.s} />
            <SecondaryAction label={t.keepAsTemplate} disabled={!ready} onPress={() => onKeep({ label: where.trim(), minutes: Number(minutes), notify })} />
          </>
        ) : null}
        <Gap h={space.s} />
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
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  input: { borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.m, minHeight: target.standard },
});
