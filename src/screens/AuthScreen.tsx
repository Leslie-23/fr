import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BusinessTypeField } from "../components/BusinessTypeField";
import { SelectField } from "../components/SelectField";
import { GOOGLE_AUTH_CONFIGURED } from "../config";
import {
  getOrCreateDefaultBusiness,
  updateBusinessProfile,
} from "../db/businessRepository";
import { SIERRA_LEONE_DISTRICTS } from "../domain/businessOptions";
import { login, loginWithGoogle, register } from "../services/authClient";
import { ApiError } from "../services/apiClient";
import type { AuthUser } from "../services/authClient";
import { signInWithGoogle } from "../services/googleAuth";
import { LedgerColors } from "../theme/colors";
import { useTheme } from "../theme/ThemeContext";
import { fontFamily } from "../theme/typography";

// The native Google sign-in module can't run on web (no browser build exists for it) — the
// button is hidden there entirely rather than shown disabled.
const GOOGLE_SIGNIN_SUPPORTED = Platform.OS !== "web";

type Mode = "login" | "register";

// Signup is two steps: credentials first (creates the real account), then this — asked only
// once the account already exists, so skipping it never blocks getting into the app.
type Step = "credentials" | "business";

type BusinessFieldKey =
  | "businessName"
  | "ownerName"
  | "businessType"
  | "district"
  | "nraTin";

// Every field below is optional — the welcome copy already says so, so individual labels
// don't repeat it (see businessRepository.ts's getOrCreateDefaultBusiness: this app never
// gates use on a completed profile).
const BUSINESS_NAME_FIELD = {
  key: "businessName" as const,
  label: "Business name",
  placeholder: "e.g. Kamara Provisions",
};
const OWNER_NAME_FIELD = {
  key: "ownerName" as const,
  label: "Owner name",
  placeholder: "Your name",
};
const NRA_TIN_FIELD = {
  key: "nraTin" as const,
  label: "NRA TIN",
  placeholder: "Taxpayer ID number",
};

interface Props {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Holds the account once step one succeeds — we don't hand it to onAuthenticated (which
  // enters the main app) until the business-details step is finished or skipped.
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [businessFields, setBusinessFields] = useState<
    Record<BusinessFieldKey, string>
  >({
    businessName: "",
    ownerName: "",
    businessType: "",
    district: "",
    nraTin: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function selectMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function setBusinessField(key: BusinessFieldKey, value: string) {
    setBusinessFields((prev) => ({ ...prev, [key]: value }));
  }

  /** Applies the signup form's business fields to the device's local profile, if any were filled in. */
  async function saveBusinessDetailsFromSignup() {
    const hasAnyDetails = Object.values(businessFields).some(
      (value) => value.trim().length > 0,
    );
    if (!hasAnyDetails) return;

    const business = await getOrCreateDefaultBusiness();
    await updateBusinessProfile(business.id, {
      businessName: businessFields.businessName.trim() || undefined,
      ownerName: businessFields.ownerName.trim() || undefined,
      businessType: businessFields.businessType.trim() || undefined,
      district: businessFields.district.trim() || undefined,
      nraTin: businessFields.nraTin.trim() || undefined,
    });
  }

  async function handleSubmitCredentials() {
    if (!email.trim() || !password) {
      setError("Enter an email and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        onAuthenticated(await login(email.trim(), password));
        return;
      }
      const user = await register(email.trim(), password);
      setPendingUser(user);
      setStep("business");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Check your connection.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinishSetup() {
    if (!pendingUser) return;
    setSubmitting(true);
    try {
      await saveBusinessDetailsFromSignup();
    } catch {
      // Best-effort — the profile is never required, and Account > Edit profile can finish
      // it later, so a save hiccup here shouldn't strand someone outside the app.
    } finally {
      setSubmitting(false);
      onAuthenticated(pendingUser);
    }
  }

  function handleSkipSetup() {
    if (!pendingUser) return;
    onAuthenticated(pendingUser);
  }

  async function handleGoogleSignIn() {
    if (!GOOGLE_AUTH_CONFIGURED) {
      Alert.alert(
        "Not set up yet",
        "Google sign-in needs API credentials before it can be used.",
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) return; // user cancelled
      const user = await loginWithGoogle(idToken);
      onAuthenticated(user);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not sign in with Google.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === "register" && step === "business") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.eyebrow}>You're in</Text>
          <Text style={styles.heading}>Tell us about your business</Text>
          <Text style={styles.welcomeText}>
            A few quick details help us tailor your tax estimates to Sierra
            Leone's rules — and get your dashboard feeling like yours. Takes
            less than a minute, and you can always finish it later from
            Account.
          </Text>

          <View>
            <Text style={styles.fieldLabel}>{BUSINESS_NAME_FIELD.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={BUSINESS_NAME_FIELD.placeholder}
              placeholderTextColor={colors.inkSoft}
              value={businessFields.businessName}
              onChangeText={(text) => setBusinessField("businessName", text)}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>{OWNER_NAME_FIELD.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={OWNER_NAME_FIELD.placeholder}
              placeholderTextColor={colors.inkSoft}
              value={businessFields.ownerName}
              onChangeText={(text) => setBusinessField("ownerName", text)}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>Business type</Text>
            <BusinessTypeField
              value={businessFields.businessType}
              onChange={(text) => setBusinessField("businessType", text)}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>District</Text>
            <SelectField
              label="District"
              value={businessFields.district}
              placeholder="Select a district"
              options={SIERRA_LEONE_DISTRICTS}
              onSelect={(text) => setBusinessField("district", text)}
            />
          </View>

          <View>
            <Text style={styles.fieldLabel}>{NRA_TIN_FIELD.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={NRA_TIN_FIELD.placeholder}
              placeholderTextColor={colors.inkSoft}
              value={businessFields.nraTin}
              onChangeText={(text) => setBusinessField("nraTin", text)}
            />
          </View>

          <Pressable
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleFinishSetup}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? "Saving…" : "Finish setup"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.skipButton}
            onPress={handleSkipSetup}
            disabled={submitting}
          >
            <Text style={styles.skipButtonText}>I'll do this later</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>
          Sierra Leone · Small &amp; Micro Traders
        </Text>
        <Text style={styles.heading}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </Text>

        <View style={styles.segmented}>
          <Pressable
            style={[
              styles.segmentOption,
              mode === "login" && styles.segmentOptionActive,
            ]}
            onPress={() => selectMode("login")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "login" && styles.segmentTextActive,
              ]}
            >
              Log in
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.segmentOption,
              mode === "register" && styles.segmentOptionActive,
            ]}
            onPress={() => selectMode("register")}
          >
            <Text
              style={[
                styles.segmentText,
                mode === "register" && styles.segmentTextActive,
              ]}
            >
              Sign up
            </Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.inkSoft}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder={
            mode === "register" ? "At least 8 characters" : "Your password"
          }
          placeholderTextColor={colors.inkSoft}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitCredentials}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Log in"
                : "Continue"}
          </Text>
        </Pressable>

        {GOOGLE_SIGNIN_SUPPORTED && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[
                styles.googleButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={submitting}
            >
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: LedgerColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 22, gap: 14, flexGrow: 1, justifyContent: "center" },
    eyebrow: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: colors.gold,
      marginBottom: -6,
    },
    heading: {
      fontFamily: fontFamily.display,
      fontSize: 24,
      color: colors.ink,
      letterSpacing: -0.2,
      marginBottom: 6,
    },
    welcomeText: {
      fontFamily: fontFamily.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.inkSoft,
      marginBottom: 6,
    },
    segmented: {
      flexDirection: "row",
      gap: 4,
      padding: 4,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
    },
    segmentOption: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 9,
      alignItems: "center",
    },
    segmentOptionActive: { backgroundColor: colors.indigo },
    segmentText: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 14.5,
      color: colors.inkSoft,
    },
    segmentTextActive: { color: colors.onFill },
    fieldLabel: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 12.5,
      color: colors.inkSoft,
      marginTop: 4,
      marginBottom: 3,
    },
    input: {
      borderWidth: 1.5,
      borderColor: colors.lineStrong,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.paper,
      fontFamily: fontFamily.body,
      fontSize: 15,
      color: colors.ink,
    },
    errorText: {
      fontFamily: fontFamily.body,
      color: colors.expense,
      fontSize: 12.5,
      marginTop: -6,
    },
    submitButton: {
      marginTop: 6,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.indigo,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 15,
      color: colors.onFill,
    },
    skipButton: {
      paddingVertical: 10,
      alignItems: "center",
    },
    skipButtonText: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 13.5,
      color: colors.inkSoft,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
    dividerText: {
      fontFamily: fontFamily.body,
      fontSize: 12,
      color: colors.inkSoft,
    },
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.lineStrong,
      backgroundColor: colors.surface,
    },
    googleIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.4,
      borderColor: colors.inkSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    googleIconText: {
      fontFamily: fontFamily.bodyBold,
      fontSize: 12,
      color: colors.inkSoft,
    },
    googleButtonText: {
      fontFamily: fontFamily.bodySemiBold,
      fontSize: 14.5,
      color: colors.ink,
    },
  });
