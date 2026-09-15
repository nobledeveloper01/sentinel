/**
 * Every word the app says, in one place, so `make copy-check` can read them
 * and so the circle's languages (ADR-0006 #12) have somewhere to go. The
 * calm rules from DESIGN.md: plain words, no exclamation, the official
 * numbers first.
 */
export const t = {
  appName: 'Sentinel',
  tagline: 'Your circle, told. Nobody else.',
  home: 'Tonight',
  officialFirst: 'If you are in danger now, call',
  notASubstitute: 'Sentinel is not a substitute for the emergency services.',
  panic: 'Alert my circle',
  panicHint: 'Sends your position to the people you chose, now. Nothing to strangers.',
  panicSilent: 'Held silently',
  journeyStart: 'Start a journey',
  journeyHint: 'Say where and when. If you do not confirm arriving, your circle is told with your last position.',
  circle: 'My circle',
  circleEmpty: 'Nobody yet. Add someone who would want to know.',
  circleHint: 'They accept first. Either of you can end it at any time, without saying why.',
  whoCanSeeMe: 'Who can see where I am, right now',
  onlyDuringAlert: 'only during an alert',
  thisJourneyUntil: 'this journey, until',
  alertInProgress: 'alert in progress',
  alertSentTo: 'Your circle has been told.',
  delivering: 'Reaching your circle.',
  notDelivered: 'Your circle could not be reached. Call the number above.',
  acknowledgedBy: 'acknowledged',
  notYetAcknowledged: 'not yet',
  cancelAlert: 'I am safe — end the alert',
  cancelHow: 'Hold with two fingers for two seconds, then your PIN.',
  drill: 'This is a drill',
  arrived: 'I have arrived',
  areYouHome: 'Are you there?',
  settings: 'Settings',
  plainSurfaces: 'Plain surfaces',
  lessMotion: 'Less motion',
  largeControls: 'Large controls',
} as const;
