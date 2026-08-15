import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import successAnimation from '../../assets/success.json';
import errorAnimation from '../../assets/Errorfailure.json';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

export type FeedbackVariant = 'success' | 'error';

interface Props {
  visible: boolean;
  variant: FeedbackVariant;
  message: string;
  onDone: () => void;
}

const AUTO_DISMISS_MS = 1400;

/**
 * Brief, non-blocking one-shot animation for confirming an action succeeded or failed —
 * saving an entry, a bulk import, a profile update. Plays once and auto-dismisses; not
 * meant for background/silent events like auto-sync, which would make it too noisy.
 */
export function FeedbackOverlay({ visible, variant, message, onDone }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!visible) return;
    lottieRef.current?.play();
    const timer = setTimeout(onDone, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LottieView
            ref={lottieRef}
            source={variant === 'success' ? successAnimation : errorAnimation}
            autoPlay
            loop={false}
            style={styles.animation}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 26,
      paddingHorizontal: 30,
      alignItems: 'center',
      gap: 6,
      minWidth: 200,
    },
    animation: { width: 110, height: 110 },
    message: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 15,
      color: colors.ink,
      textAlign: 'center',
    },
  });
