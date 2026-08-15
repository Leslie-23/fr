import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SelectField } from './SelectField';
import { BUSINESS_TYPE_OPTIONS } from '../domain/businessOptions';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const PRESETS: readonly string[] = BUSINESS_TYPE_OPTIONS;

/** Business type as a dropdown of common types, with "Other" revealing a free-text box. */
export function BusinessTypeField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isCustom = value.length > 0 && !PRESETS.includes(value);
  const selectValue = isCustom ? 'Other' : value;

  return (
    <>
      <SelectField
        label="Business type"
        value={selectValue}
        placeholder="Select a business type"
        options={BUSINESS_TYPE_OPTIONS}
        onSelect={(option) => {
          if (option === 'Other') {
            // Keep an existing custom value when re-confirming "Other"; only clear when
            // switching away from a different preset.
            onChange(isCustom ? value : '');
          } else {
            onChange(option);
          }
        }}
      />
      {selectValue === 'Other' && (
        <TextInput
          style={styles.customInput}
          placeholder="Type your business type"
          placeholderTextColor={colors.inkSoft}
          value={isCustom ? value : ''}
          onChangeText={onChange}
        />
      )}
    </>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    customInput: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.lineStrong,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontFamily: fontFamily.body,
      fontSize: 14,
      color: colors.ink,
      backgroundColor: colors.paper,
    },
  });
