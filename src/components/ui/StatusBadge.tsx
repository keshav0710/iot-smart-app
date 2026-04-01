import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface StatusBadgeProps {
  label: string;
  type?: 'success' | 'danger' | 'warning' | 'info' | 'muted';
  dot?: boolean;
}

export function StatusBadge({ label, type = 'info', dot = true }: StatusBadgeProps) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const colorMap = {
    success: { bg: colors.successLight, text: colors.success, dot: colors.success },
    danger: { bg: colors.dangerLight, text: colors.danger, dot: colors.danger },
    warning: { bg: colors.warningLight, text: colors.warning, dot: colors.warning },
    info: { bg: colors.primaryLight, text: colors.primary, dot: colors.primary },
    muted: { bg: colors.separator, text: colors.textMuted, dot: colors.textFaint },
  };

  const c = colorMap[type];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.dot }]} />}
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});
