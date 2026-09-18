/**
 * All member-facing wording that was agreed in writing lives here, so a copy change
 * never means hunting through screens. See docs/결정사항_및_다음작업.md §2.
 *
 * Paywall variant A = support framing, B = feature framing. Switch in theme.ts.
 * Nothing here may imply a co-op, a non-profit, or a tax-deductible donation.
 */
import { config } from './theme';

const P = config.price;

export const paywallA = {
  title: `Your prayers are free. Keeping it that way costs ${P} a month.`,
  body:
    'No ads, no investors, no account. Members are the only thing keeping this app running — ' +
    "and keeps it free for everyone who can't pay.",
  cta: `Become a member · ${P}/month`,
  fine: 'Unlimited requests and answered-prayer history included. Cancel any time.',
};

export const paywallB = {
  title: `Your prayers are free. The notebook is ${P}.`,
  body:
    `Today's verse, the 3-minute prayer, ${config.freePrayerLimit} requests and the YouTube link stay free — always. ` +
    'Membership adds unlimited requests and keeps your answered-prayer history.',
  cta: `Start free trial · then ${config.priceLabel}`,
  fine: `${config.trialDays}-day free trial. Cancel any time.`,
};

export const paywall = config.paywallVariant === 'A' ? paywallA : paywallB;

export const thankYou = {
  title: 'Thank you.',
  body:
    'This app has no ads, no investors, and one person making it. ' +
    'Members like you are the reason it exists and stays free for everyone else.',
  back: 'Back to today',
};

/** Settings → "How this app is run". Plain facts only — no numbers we cannot stand behind. */
export const howItsRun = {
  title: 'How this app is run',
  facts: [
    ['No ads', 'Not now, not later. Nothing in this app gets sold to anyone else.'],
    ['No investors', "Nobody's waiting on this app to grow. It only has to pay for itself."],
    ['The store keeps 15%', `Of every ${P}, Google or Apple takes 15% before it reaches the maker.`],
    ['One person', 'One person writes the code, picks the verses and answers support mail.'],
  ] as [string, string][],
  useOfMoney:
    "What's left covers the store accounts, the developer fees and the hours that go into the next update.",
  pledgeTitle: "Four things that won't change",
  pledge: [
    "What's free today stays free. The free list won't get smaller later.",
    'Ads will never be added to this app.',
    "Your prayers aren't sold, shared or uploaded. They stay on this phone.",
    "Cancelling takes three taps, and you'll never be asked why.",
  ],
};

/**
 * Settings → "A note from the maker". Replace this text with each release.
 * `members` is shown only to members — it is a thank-you, never extra content.
 */
export const makerNote = {
  title: 'A note from the maker',
  public:
    'This is version 1.0. It does four things and nothing else: one verse, a list of what you want to pray for, ' +
    'three minutes, and a link to worship on YouTube. If something is broken or a verse reads wrong, write to me — ' +
    'the address is above, and I read every message myself.',
  members:
    'To the members: the reason there is no login screen and no ad in this app is that you pay for it. Thank you.',
};

/** Growing-tree captions. The tree never wilts and never dies — free users included. */
export const tree = {
  connect: 'Stay connected. Keep growing.', // John 15
  memberBadge: (since: Date) => `Member since ${since.toLocaleDateString()}`,
};

/**
 * Moving a list to a new phone.
 *
 * Every word here has to be true, because the privacy line elsewhere in the app
 * makes a promise and this is the one place the app leaves the phone. So: the
 * person starts it, the contents are sealed before they go, and the server
 * keeps nothing past a day.
 */
export const transfer = {
  title: 'Move to a new phone',
  lede:
    'Your prayers live on this phone and nowhere else. To carry them to another one, ' +
    'this phone seals them with a code and holds them for a day. Only the code opens them.',

  sendTitle: 'This is my old phone',
  sendBody: 'Seal this list and get a code to type into the new phone.',
  receiveTitle: 'This is my new phone',
  receiveBody: 'I have a code from my old phone.',

  sendHint: (hours: number) =>
    `Type this into the new phone within ${hours} hours. It works once, then it's gone. ` +
    'Keep this phone as it is until the new one has everything.',
  copied: 'The code is on your clipboard.',

  entryLabel: 'Transfer code from your old phone',
  receiveHint: "Ten characters. Dashes and capitals don't matter.",

  doneTitle: 'They made it.',
  doneBody: (prayers: number, days: number) =>
    `${prayers} ${prayers === 1 ? 'prayer' : 'prayers'} and ${days} ${days === 1 ? 'day' : 'days'} of your streak are on this phone now. ` +
    'Nothing that was already here got removed.',

  failTitle: "That didn't work",
  notFoundBody:
    "No sealed list is waiting on that code. It's either expired, or it's already been brought over to another phone. " +
    'Start again on the old phone for a fresh code.',
  badCodeBody: 'Check the code on the old phone and type it again.',
  networkBody: "Couldn't reach the transfer service. Check the connection and try again.",
  // Not the person's problem — the build is misconfigured. Say so, so nobody
  // spends the evening restarting their router.
  setupBody:
    'The transfer service turned this phone away. This is a setup problem in the app, not something ' +
    'you did — the database functions may not be installed, or the key in this build is wrong. ' +
    'Settings has a file export that works with no server at all.',

  emptyTitle: 'Nothing to carry yet',
  emptyBody: 'This phone has no prayers on it. The code still works, it just has nothing in it.',

  privacy: (hours: number) =>
    `What crosses is locked before it leaves this phone, and the key never leaves it — the code is the key. ` +
    `Nobody running the service can read it. It's deleted the moment the new phone takes it, and after ${hours} hours either way. ` +
    'Prefer no server at all? Settings has a file export that does the same job by hand.',

  /** Settings row. */
  rowTitle: 'Move to a new phone',
  rowBody: 'Carry your prayers across with a code',

  importTitle: 'Import from a file',
  importBody: 'Load a JSON export back in',
  importConfirm: (prayers: number, days: number) =>
    `This file holds ${prayers} ${prayers === 1 ? 'prayer' : 'prayers'} and ${days} ${days === 1 ? 'day' : 'days'} of streak. ` +
    "They'll be added to what's already on this phone. Nothing gets removed.",
  importDone: 'Added.',
  importBad: 'That file is not a Selah Daily export.',
};

/**
 * The three minutes.
 *
 * The routine used to be one countdown from 3:00 with the prayer list sitting
 * under it, which is a stopwatch with a Bible verse on the front page. The app
 * does one thing, so that one thing has to actually lead: three named minutes
 * that arrive on their own. Same three minutes, same single feature.
 *
 * Nothing here scolds and nothing here counts. A minute that is missed is just
 * a minute.
 */
export const pray = {
  eyebrow: 'PRAY',

  /** Shown before the timer starts, so the three minutes are known in advance. */
  introTitle: 'Three minutes, in three parts.',
  introNote: 'Each one arrives on its own. A short buzz when it does.',
  start: 'Start 3 minutes',
  skip: 'Amen',

  phases: [
    {
      key: 'still',
      title: 'Be still.',
      line: 'Nothing to do for a minute. Let your shoulders down.',
      quote: '“Be still and know that I am God.”',
      ref: 'Psalm 46:10',
    },
    {
      key: 'people',
      title: 'Bring your people.',
      line: 'Tap the ones you carried in here.',
      empty: 'Nothing on your list yet. Say their names anyway.',
    },
    {
      key: 'thanks',
      title: 'Give thanks.',
      line: "One thing from today. It doesn't have to be a big one.",
      empty: 'Nothing marked answered yet. Thank Him for today anyway.',
    },
  ] as { key: string; title: string; line: string; quote?: string; ref?: string; empty?: string }[],

  /** Heading over the answered requests shown in the third minute. */
  answered: 'Already answered',

  pause: 'Pause',
  resume: 'Resume',
  amen: 'Amen',
  /** Once the three minutes are up and the timer has stopped. */
  over: "That's the three minutes. Stay as long as you like.",
  quiet: 'Vibration only. Nothing leaves your phone.',
};
