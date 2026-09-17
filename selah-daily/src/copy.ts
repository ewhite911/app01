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
    'No ads, no investors, no account. Members are the only thing that keeps this app running — ' +
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
    ['No ads', 'Not now, not later. Nothing in this app is sold to anyone else.'],
    ['No investors', 'Nobody is waiting on this app to grow. It only has to pay for itself.'],
    ['The store keeps 15%', `Of every ${P}, Google or Apple takes 15% before it reaches the maker.`],
    ['One person', 'One person writes the code, picks the verses and answers support mail.'],
  ] as [string, string][],
  useOfMoney:
    'What is left covers the store accounts, the developer fees and the hours that go into the next update.',
  pledgeTitle: 'Four things that will not change',
  pledge: [
    'What is free today stays free. The free list will not be made smaller later.',
    'No ads will be added to this app.',
    'Your prayers are not sold, shared or uploaded. They stay on this phone.',
    'Cancelling takes three taps, and you will never be asked why.',
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
