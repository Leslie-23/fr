import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from '@expo-google-fonts/ibm-plex-mono';

/**
 * "Ledger" type system — mirrors web/src/index.css's --font-display / --font-body / --font-mono
 * stack: Fraunces for headings/display, IBM Plex Sans for body/labels, IBM Plex Mono for
 * currency and other numeric values.
 *
 * Font files ship bundled inside the @expo-google-fonts/* npm packages, so loading them via
 * expo-font's useFonts hook stays fully offline (no network request at runtime).
 */
export const fontFamily = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemiBold: 'IBMPlexSans_600SemiBold',
  bodyBold: 'IBMPlexSans_700Bold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
} as const;

/**
 * Loads every Ledger typeface weight used across the app. Returns the same tuple shape as
 * expo-font's useFonts: [loaded, error]. Callers should render a lightweight loading state
 * until `loaded || error` is true (falling back to the system font if loading ever errors,
 * rather than blocking the app).
 */
export function useLedgerFonts() {
  return useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
}
