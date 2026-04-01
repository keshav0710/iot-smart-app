import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';

export function LoginScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(
        e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
          ? 'Invalid email or password.'
          : e.message || 'Login failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // @ts-ignore - React 19 type mismatch
    <LinearGradient colors={['#0A0A12', '#1A0A2E', '#0A0A12']} style={styles.gradient}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoRing, { borderColor: colors.primary + '40' }]}>
                <View style={[styles.logoBg, { backgroundColor: colors.primaryLight }]}>
                  <Text style={styles.logoEmoji}>🏠</Text>
                </View>
              </View>
              <Text style={[styles.appName, { color: colors.text }]}>Smart Home</Text>
              <Text style={[styles.tagline, { color: colors.textMuted }]}>
                IoT Control Center
              </Text>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome back</Text>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fields}>
                <View>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textFaint}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textFaint}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.footer, { color: colors.textFaint }]}>
              Smart Home IoT • Firebase + Ollama AI
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logoRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  logoBg: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { fontSize: 14, marginTop: 4 },
  card: {
    borderRadius: Radius.xxl, borderWidth: 1,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: Spacing.md },
  errorBox: { padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  errorText: { fontSize: 13, fontWeight: '500' },
  fields: { gap: Spacing.md, marginBottom: Spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.xs },
  input: {
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    fontSize: 15,
  },
  loginBtn: { padding: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12 },
});
