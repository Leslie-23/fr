import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessTypeField } from '../components/BusinessTypeField';
import { FeedbackOverlay, FeedbackVariant } from '../components/FeedbackOverlay';
import { ProfileProgress } from '../components/ProfileProgress';
import { SelectField } from '../components/SelectField';
import { BusinessProfile, getOrCreateDefaultBusiness, updateBusinessProfile } from '../db/businessRepository';
import { SIERRA_LEONE_DISTRICTS } from '../domain/businessOptions';
import { getProfileCompleteness } from '../domain/profileCompleteness';
import { LedgerColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { fontFamily } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a successful save so the Account screen's summary can refresh. */
  onSaved: (profile: BusinessProfile) => void;
}

type FieldKey = keyof Pick<BusinessProfile, 'businessName' | 'ownerName' | 'businessType' | 'district' | 'nraTin'>;

const TEXT_FIELDS: { key: 'businessName' | 'ownerName' | 'nraTin'; label: string; placeholder: string }[] = [
  { key: 'businessName', label: 'Business name', placeholder: 'e.g. Kamara Provisions' },
  { key: 'ownerName', label: 'Owner name', placeholder: 'Your name' },
  { key: 'nraTin', label: 'NRA TIN', placeholder: 'Taxpayer ID number' },
];

export function EditProfileScreen({ visible, onClose, onSaved }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    businessName: '',
    ownerName: '',
    businessType: '',
    district: '',
    nraTin: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: FeedbackVariant; message: string } | null>(null);
  const completeness = useMemo(() => getProfileCompleteness(fields), [fields]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const business = await getOrCreateDefaultBusiness();
      setProfile(business);
      setFields({
        businessName: business.businessName ?? '',
        ownerName: business.ownerName ?? '',
        businessType: business.businessType ?? '',
        district: business.district ?? '',
        nraTin: business.nraTin ?? '',
      });
    })();
  }, [visible]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateBusinessProfile(profile.id, {
        businessName: fields.businessName || undefined,
        ownerName: fields.ownerName || undefined,
        businessType: fields.businessType || undefined,
        district: fields.district || undefined,
        nraTin: fields.nraTin || undefined,
      });
      const updated = await getOrCreateDefaultBusiness();
      setProfile(updated);
      setFeedback({ variant: 'success', message: 'Profile saved' });
      onSaved(updated);
    } catch {
      setFeedback({ variant: 'error', message: 'Could not save profile' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 40 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Edit profile</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <ProfileProgress completeness={completeness} />

        {TEXT_FIELDS.slice(0, 2).map((field) => (
          <View key={field.key}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={colors.inkSoft}
              value={fields[field.key]}
              onChangeText={(text) => setFields((prev) => ({ ...prev, [field.key]: text }))}
            />
          </View>
        ))}

        <View>
          <Text style={styles.fieldLabel}>Business type</Text>
          <BusinessTypeField
            value={fields.businessType}
            onChange={(text) => setFields((prev) => ({ ...prev, businessType: text }))}
          />
        </View>

        <View>
          <Text style={styles.fieldLabel}>District</Text>
          <SelectField
            label="District"
            value={fields.district}
            placeholder="Select a district"
            options={SIERRA_LEONE_DISTRICTS}
            onSelect={(text) => setFields((prev) => ({ ...prev, district: text }))}
          />
        </View>

        {TEXT_FIELDS.slice(2).map((field) => (
          <View key={field.key}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={colors.inkSoft}
              value={fields[field.key]}
              onChangeText={(text) => setFields((prev) => ({ ...prev, [field.key]: text }))}
            />
          </View>
        ))}

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>
      </ScrollView>

      <FeedbackOverlay
        visible={feedback !== null}
        variant={feedback?.variant ?? 'success'}
        message={feedback?.message ?? ''}
        onDone={() => setFeedback(null)}
      />
    </Modal>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 22, gap: 4, paddingBottom: 40 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    heading: { fontFamily: fontFamily.display, fontSize: 21, color: colors.ink },
    closeText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.indigo },
    fieldLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 12.5,
      color: colors.inkSoft,
      marginTop: 10,
      marginBottom: 6,
    },
    input: {
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
    saveButton: {
      marginTop: 20,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.indigo,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.onFill },
  });
