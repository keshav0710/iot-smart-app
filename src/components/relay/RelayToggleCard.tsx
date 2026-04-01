import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import type { RelayKey } from '../../types/sensor.types';
import type { RelayTimer } from '../../hooks/useRelayTimers';

interface Props {
  relayKey: RelayKey;
  name: string;
  isOn: boolean;
  onToggle: () => Promise<void>;
  timer?: RelayTimer;
  remainingTime: number;
  onTimerPress: () => void;
  onCancelTimer: () => void;
  formatTime: (s: number) => string;
}

export function RelayToggleCard({
  relayKey, name, isOn, onToggle, timer, remainingTime, onTimerPress, onCancelTimer, formatTime,
}: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const [loading, setLoading] = React.useState(false);

  const icons: Record<RelayKey, string> = {
    relay1: '💡', relay2: '💡', relay3: '🌀', relay4: '🔌',
  };

  const handleToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try { await onToggle(); } finally { setLoading(false); }
  };

  return (
    <GlassCard style={[styles.card, isOn && { borderColor: colors.primary + '50' }]}>
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.icon}>{icons[relayKey]}</Text>
          <View>
            <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.state, { color: isOn ? colors.success : colors.textMuted }]}>
              {isOn ? '● ON' : '○ OFF'}
            </Text>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch
            value={Boolean(isOn)}
            onValueChange={handleToggle}
            trackColor={{ false: colors.separator, true: colors.primary }}
            thumbColor={isOn ? '#fff' : colors.textMuted}
          />
        )}
      </View>

      {/* Timer row */}
      {timer && remainingTime > 0 ? (
        <View style={[styles.timerRow, { backgroundColor: colors.warningLight, borderColor: colors.warning + '30' }]}>
          <Text style={[styles.timerText, { color: colors.warning }]}>
            ⏱ {formatTime(remainingTime)} → Turn {timer.action.toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCancelTimer(); }}
          >
            <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.setTimerBtn, { borderColor: colors.cardBorder }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onTimerPress(); }}
        >
          <Text style={[styles.setTimerText, { color: colors.textMuted }]}>⏱ Set Timer</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  icon: { fontSize: 28 },
  name: { fontSize: 15, fontWeight: '700' },
  state: { fontSize: 12, marginTop: 2 },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  timerText: { fontSize: 13, fontWeight: '600' },
  cancelText: { fontSize: 13, fontWeight: '700' },
  setTimerBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  setTimerText: { fontSize: 13 },
});
