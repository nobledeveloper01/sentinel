import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { places as P } from '@sentinel/domain';

import { Gap, SecondaryAction } from '../components/Actions';
import { Glass } from '../components/Glass';
import { Text } from '../components/Text';
import { useColours } from '../design/theme';
import { radius, space, target, typeScale } from '../design/tokens';
import { t } from '../phrases';

/**
 * My places (ADR-0010): the journeys taken often and the places the person
 * would go. Two lists the phone keeps and never sends; nothing here is
 * ranked, suggested or shared. A template is kept from a journey screen,
 * not typed here — the fields are the journey's, and this page only forgets.
 */
export function PlacesScreen({
  places,
  names,
  members,
  onStartTemplate,
  onForgetTemplate,
  onAddSafePlace,
  onForgetSafePlace,
  onBack,
}: {
  places: P.Places;
  names: Readonly<Record<string, string>>;
  members: ReadonlyArray<string>;
  onStartTemplate: (template: P.Template) => void;
  onForgetTemplate: (label: string) => void;
  onAddSafePlace: (label: string) => void;
  onForgetSafePlace: (label: string) => void;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const c = useColours();
  const [place, setPlace] = useState('');
  return (
    <View style={[styles.fill, { paddingTop: insets.top + space.l, paddingBottom: insets.bottom + space.l }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t.places}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.placesHint}
        </Text>
        <Gap />
        <Text variant="title">{t.templates}</Text>
        <Gap h={space.xs} />
        {places.templates.length === 0 ? (
          <Text variant="secondary" tone="secondary">
            {t.templatesNone}
          </Text>
        ) : (
          places.templates.map((tpl) => {
            const usable = P.usable(tpl, members);
            return (
              <Glass key={tpl.label} depth="low" testID={`template-${tpl.label}`}>
                <Text variant="body">{tpl.label}</Text>
                <Text variant="small" tone="secondary">
                  {t.templateLine(tpl.minutes, usable.notify.length) + (usable.notify.length > 0 ? ` · ${usable.notify.map((h) => names[h] ?? h).join(', ')}` : '')}
                </Text>
                {usable.notify.length === 0 ? (
                  <Text variant="small" tone="attention">
                    {t.templateNobody}
                  </Text>
                ) : null}
                <Gap h={space.xs} />
                <View style={styles.row}>
                  <View style={styles.grow}>
                    <SecondaryAction label={t.startThisOne} disabled={usable.notify.length === 0} onPress={() => onStartTemplate(usable)} />
                  </View>
                  <View style={styles.grow}>
                    <SecondaryAction label={t.forget} onPress={() => onForgetTemplate(tpl.label)} />
                  </View>
                </View>
              </Glass>
            );
          })
        )}
        <Gap />
        <Text variant="title">{t.safePlaces}</Text>
        <Gap h={space.xs} />
        <Text variant="secondary" tone="secondary">
          {t.safePlacesHint}
        </Text>
        <Gap h={space.s} />
        {places.safe.length === 0 ? (
          <Text variant="secondary" tone="secondary">
            {t.safePlacesNone}
          </Text>
        ) : (
          places.safe.map((sp) => (
            <View key={sp.label} style={styles.row}>
              <Text variant="body" style={styles.grow}>
                {sp.label}
              </Text>
              <SecondaryAction label={t.forget} onPress={() => onForgetSafePlace(sp.label)} />
            </View>
          ))
        )}
        <Gap h={space.s} />
        <TextInput
          testID="placeName"
          value={place}
          onChangeText={setPlace}
          placeholder={t.placeName}
          placeholderTextColor={c.textSecondary}
          accessibilityLabel={t.placeName}
          style={[styles.input, typeScale.body, { color: c.textPrimary, borderColor: c.hairline, backgroundColor: c.glassMid }]}
        />
        <Gap h={space.s} />
        <SecondaryAction
          label={t.addSafePlace}
          disabled={place.trim().length === 0 || places.safe.length >= P.MAX_SAFE_PLACES}
          onPress={() => {
            onAddSafePlace(place);
            setPlace('');
          }}
        />
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
  input: { borderWidth: 1, borderRadius: radius.input, paddingHorizontal: space.m, minHeight: target.standard },
});
