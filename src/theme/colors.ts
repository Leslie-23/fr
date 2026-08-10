/**
 * "Ledger" design tokens — shared with the sibling web app (see web/src/index.css).
 * A gara-cloth-dyeing-inspired palette: indigo ink + paper + gold accents.
 *
 * Light mode only. app.json sets userInterfaceStyle "light", so a single
 * palette is the primary target — this file is the one place to touch if
 * dark mode is ever added.
 */
export const colors = {
  // Surfaces
  paper: '#f2f1ea',
  surface: '#fdfcf9',

  // Text
  ink: '#1c2033',
  inkSoft: '#565b73',

  // Hairlines
  line: 'rgba(28, 32, 51, 0.14)',
  lineStrong: 'rgba(28, 32, 51, 0.26)',

  // Brand — indigo (primary actions, active states, wordmark)
  indigo: '#2a3868',

  // Accent — gold (tax / notice / stamp)
  gold: '#a9711f',
  goldSoft: '#f4e6c8',

  // Money in / sale
  sale: '#1f6d43',
  saleSoft: '#e1efe4',

  // Money out / expense
  expense: '#96351f',
  expenseSoft: '#f5e6df',

  // Fixed white-ish text on filled/dark surfaces (same in light & dark on web)
  onFill: '#fdfcf9',
} as const;

export type LedgerColors = typeof colors;
