/**
 * "Ledger" design tokens — shared with the sibling web app (see web/src/index.css).
 * A gara-cloth-dyeing-inspired palette: indigo ink + paper + gold accents.
 *
 * Light and dark palettes share the same key names so call sites never need to know
 * which is active — read `colors` from `useTheme()` (src/theme/ThemeContext.tsx)
 * rather than importing either palette directly.
 */
export interface LedgerColors {
  paper: string;
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  lineStrong: string;
  indigo: string;
  gold: string;
  goldSoft: string;
  sale: string;
  saleSoft: string;
  expense: string;
  expenseSoft: string;
  onFill: string;
}

export const lightColors: LedgerColors = {
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

  // Fixed white-ish text on filled/dark surfaces (same in both palettes)
  onFill: '#fdfcf9',
};

export const darkColors: LedgerColors = {
  // Surfaces
  paper: '#1c2033',
  surface: '#12141f',

  // Text
  ink: '#f2f1ea',
  inkSoft: '#9aa0c4',

  // Hairlines
  line: 'rgba(242, 241, 234, 0.12)',
  lineStrong: 'rgba(242, 241, 234, 0.24)',

  // Brand — indigo, brightened so it still pops against a dark surface
  indigo: '#6d7fc4',

  // Accent — gold
  gold: '#d0a24a',
  goldSoft: 'rgba(208, 162, 74, 0.18)',

  // Money in / sale
  sale: '#4bab7c',
  saleSoft: 'rgba(75, 171, 124, 0.16)',

  // Money out / expense
  expense: '#d3714c',
  expenseSoft: 'rgba(211, 113, 76, 0.16)',

  // Fixed white-ish text on filled/dark surfaces (same in both palettes)
  onFill: '#fdfcf9',
};
