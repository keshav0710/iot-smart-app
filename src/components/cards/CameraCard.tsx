import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  isConnected: boolean;
  motionTriggered: boolean;
  fireTriggered: boolean;
  onOpenFull?: () => void;
}

export function CameraCard({ isConnected, motionTriggered, fireTriggered, onOpenFull }: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const alertActive = motionTriggered || fireTriggered;
  const alertMsg = fireTriggered ? '🔥 Fire Alert — Recording!' : motionTriggered ? '🚶 Motion — Recording' : '';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📷</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Security Camera</Text>
          <Text style={[styles.sub, { color: isConnected ? colors.success : colors.textMuted }]}>
            {isConnected ? '● Live' : '○ Not connected'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        onPress={onOpenFull}
        activeOpacity={0.8}
      >
        {isConnected ? (
          <Text style={styles.previewText}>Tap to view live feed</Text>
        ) : (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineIcon}>📹</Text>
            <Text style={[styles.offlineText, { color: colors.textMuted }]}>No camera stream</Text>
            <Text style={[styles.offlineSub, { color: colors.textFaint }]}>Configure stream URL in Settings</Text>
          </View>
        )}
      </TouchableOpacity>

      {alertActive && (
        <View style={[styles.alertRow, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}>
          <Text style={[styles.alertText, { color: colors.danger }]}>{alertMsg}</Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  icon: { fontSize: 28 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  preview: {
    height: 140,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewText: { color: '#fff', fontSize: 14 },
  offlineContainer: { alignItems: 'center', gap: Spacing.xs },
  offlineIcon: { fontSize: 32 },
  offlineText: { fontSize: 13, fontWeight: '600' },
  offlineSub: { fontSize: 11 },
  alertRow: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  alertText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
