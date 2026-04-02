import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function LoginScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animated logo float
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ),
    ]).start();
  }, []);

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
    // Fix: use View as root (not LinearGradient) so KeyboardAvoidingView works correctly
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0A12', '#1A0A2E', '#0D1B3E', '#0A0A12']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glowing orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: floatAnim }] }]}>
            <View style={[styles.logoRing, { borderColor: colors.primary + '50' }]}>
              <View style={[styles.logoRing2, { borderColor: colors.secondary + '30' }]}>
                <LinearGradient
                  colors={[colors.primary + '40', colors.secondary + '30']}
                  style={styles.logoBg}
                >
                  <Text style={styles.logoEmoji}>🏠</Text>
                </LinearGradient>
              </View>
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>Smart Home</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>IoT Control Center</Text>
          </Animated.View>

          {/* Glass Card */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.card, { backgroundColor: 'rgba(26,26,46,0.85)', borderColor: 'rgba(108,99,255,0.25)' }]}>
              {/* Card inner glow */}
              <LinearGradient
                colors={['rgba(108,99,255,0.06)', 'transparent']}
                style={styles.cardInnerGlow}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome back</Text>
              <Text style={[styles.cardSub, { color: colors.textMuted }]}>Sign in to control your home</Text>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '50' }]}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.fields}>
                <View>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Email address</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(108,99,255,0.25)', color: colors.text }]}
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
                    style={[styles.input, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(108,99,255,0.25)', color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textFaint}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.loginBtnWrapper}
              >
                <LinearGradient
                  colors={loading ? ['#44405a', '#44405a'] : [colors.primary, '#9B5DE5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginBtnText}>Sign In →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Text style={[styles.footer, { color: colors.textFaint }]}>
            Smart Home IoT • Firebase + Ollama AI
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A12' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  orb: { position: 'absolute', borderRadius: 300 },
  orb1: { width: 250, height: 250, backgroundColor: 'rgba(108,99,255,0.08)', top: -60, right: -80 },
  orb2: { width: 200, height: 200, backgroundColor: 'rgba(0,212,255,0.06)', bottom: 100, left: -60 },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl + 8 },
  logoRing: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  logoRing2: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  logoBg: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { fontSize: 14, marginTop: 4, letterSpacing: 0.3 },
  card: {
    borderRadius: Radius.xxl, borderWidth: 1,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  cardInnerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, marginBottom: Spacing.lg },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  errorIcon: { fontSize: 14 },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  fields: { gap: Spacing.md, marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
    fontSize: 15,
  },
  loginBtnWrapper: { borderRadius: Radius.lg, overflow: 'hidden' },
  loginBtn: { padding: Spacing.md + 2, alignItems: 'center', borderRadius: Radius.lg },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: Spacing.md },
});
