export const colors = {
  bg: '#FFFDF9',
  ink: '#1B2233',
  muted: '#5E6577',
  line: '#E6E2DA',
  navy: '#1E2A44',
  navyDeep: '#141C30',
  amber: '#E9A84B',
  green: '#2E8B57',
  yt: '#FF0000',
  white: '#FFFFFF',
  soft: '#EDE9E1',
};

export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 36 };
export const radius = { sm: 8, md: 12, lg: 18 };

export const type = {
  h1: { fontSize: 26, fontWeight: '800' as const, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
  verse: { fontSize: 20, lineHeight: 30, color: colors.white, fontStyle: 'italic' as const },
};

export const config = {
  appName: 'Selah Daily',
  // Replace with the real playlist ID from the YouTube channel. Only a link is used — nothing plays in-app.
  youtubePlaylistId: 'PLxxxxxxxxxxxxxxxxxxxx',
  price: '$3.99',
  priceLabel: '$3.99 / month',
  trialDays: 7,
  /** Free active requests. Raised 10 → 30: what is given free is never taken back later. */
  freePrayerLimit: 30,
  /** Paywall wording: 'A' = support framing (default), 'B' = feature framing. See src/copy.ts. */
  paywallVariant: 'A' as 'A' | 'B',
  supportEmail: 'support@example.com',
  // Served by GitHub Pages from /docs on main. Enable Pages in the repo settings to make these live.
  privacyUrl: 'https://ewhite911.github.io/app01/privacy.html',
  termsUrl: 'https://ewhite911.github.io/app01/terms.html',
};
