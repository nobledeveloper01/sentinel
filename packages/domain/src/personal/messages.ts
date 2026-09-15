/**
 * The SMS a circle member receives when the phone has no data (ADR-0006
 * #12), in the language she chose when she accepted the circle. Plain, no
 * exclamation, the official number in it, and the position as a link she
 * can open on any phone. Every table has every key; the test says so.
 */
import type { Language } from './circle.ts';

export type Key = 'alert' | 'drill' | 'escalated' | 'cancelled' | 'cancelledDuress' | 'arrived';

const TABLES: Readonly<Record<Language, Readonly<Record<Key, string>>>> = {
  en: {
    alert: '{name} sent an alert from Sentinel. Last position: {link}. Call them, then 112 if they do not answer.',
    drill: 'This is a drill from {name} on Sentinel. Nothing is wrong. Last position: {link}.',
    escalated: '{name} did not confirm arriving by {time} on Sentinel. Last position: {link}. Call them, then 112.',
    cancelled: '{name} cancelled their Sentinel alert. They say they are fine.',
    cancelledDuress: '{name} cancelled their Sentinel alert. Call 112 and do not call them back.',
    arrived: '{name} arrived. Sentinel.',
  },
  pcm: {
    alert: '{name} send alert from Sentinel. Where dem dey last: {link}. Call am, then call 112 if e no answer.',
    drill: 'Na practice from {name} for Sentinel. Nothing happen. Where dem dey last: {link}.',
    escalated: '{name} never confirm say dem reach by {time} for Sentinel. Where dem dey last: {link}. Call am, then 112.',
    cancelled: '{name} don cancel im Sentinel alert. E talk say e dey okay.',
    cancelledDuress: '{name} don cancel im Sentinel alert. Call 112, no call am back.',
    arrived: '{name} don reach. Sentinel.',
  },
  yo: {
    alert: '{name} fi ìkìlọ̀ ránṣẹ́ láti Sentinel. Ibi tí wọ́n wà kẹ́yìn: {link}. Pè wọ́n, lẹ́yìn náà pe 112 tí wọn kò bá dáhùn.',
    drill: 'Ìdánrawò ni láti ọ̀dọ̀ {name} lórí Sentinel. Kò sí ohun tó ṣẹlẹ̀. Ibi tí wọ́n wà kẹ́yìn: {link}.',
    escalated: '{name} kò jẹ́rìí pé wọ́n dé ní {time} lórí Sentinel. Ibi tí wọ́n wà kẹ́yìn: {link}. Pè wọ́n, lẹ́yìn náà pe 112.',
    cancelled: '{name} ti fagilé ìkìlọ̀ Sentinel wọn. Wọ́n ní wọ́n wà dáadáa.',
    cancelledDuress: '{name} ti fagilé ìkìlọ̀ Sentinel wọn. Pe 112, má sì pè wọ́n padà.',
    arrived: '{name} ti dé. Sentinel.',
  },
  ha: {
    alert: '{name} ya aika faɗakarwa daga Sentinel. Inda yake a ƙarshe: {link}. Kira shi, sannan 112 idan bai amsa ba.',
    drill: 'Wannan atisaye ne daga {name} a Sentinel. Babu abin da ya faru. Inda yake a ƙarshe: {link}.',
    escalated: '{name} bai tabbatar da isowa ba nan da {time} a Sentinel. Inda yake a ƙarshe: {link}. Kira shi, sannan 112.',
    cancelled: '{name} ya soke faɗakarwarsa ta Sentinel. Ya ce yana lafiya.',
    cancelledDuress: '{name} ya soke faɗakarwarsa ta Sentinel. Kira 112, kada ka sake kiran sa.',
    arrived: '{name} ya isa. Sentinel.',
  },
  ig: {
    alert: '{name} zitere ọkwa site na Sentinel. Ebe ọ nọ ikpeazụ: {link}. Kpọọ ya, wee kpọọ 112 ma ọ bụrụ na ọ zaghị.',
    drill: 'Nke a bụ omume site na {name} na Sentinel. Ọ dịghị ihe mere. Ebe ọ nọ ikpeazụ: {link}.',
    escalated: '{name} akwadoghị na o rutere n\'oge {time} na Sentinel. Ebe ọ nọ ikpeazụ: {link}. Kpọọ ya, wee kpọọ 112.',
    cancelled: '{name} akagbuola ọkwa Sentinel ya. Ọ sịrị na ọ dị mma.',
    cancelledDuress: '{name} akagbuola ọkwa Sentinel ya. Kpọọ 112, akpọghachila ya.',
    arrived: '{name} erutela. Sentinel.',
  },
};

export const LANGUAGES: ReadonlyArray<Language> = ['en', 'pcm', 'yo', 'ha', 'ig'];

export function sms(key: Key, language: Language, fill: { name: string; link?: string; time?: string }): string {
  return TABLES[language][key]
    .replace('{name}', fill.name)
    .replace('{link}', fill.link ?? '')
    .replace('{time}', fill.time ?? '');
}

export function keysOf(language: Language): ReadonlyArray<Key> {
  return Object.keys(TABLES[language]) as Key[];
}
