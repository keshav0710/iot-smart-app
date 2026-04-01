import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.logo}>🏠</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 56 },
  text: { marginTop: 16, fontSize: 15 },
});
