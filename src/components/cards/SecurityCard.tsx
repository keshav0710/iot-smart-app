import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  flameDetected: boolean;
  motionDetected: boolean;
  lastUpdated: number;
  flameSensorEnabled: boolean;
  motionSensorEnabled: boolean;
}

function SensorRow({
  icon, label, active, enabled, activeColor, inactiveLabel,
}: {
  icon: string; label: string; active: boolean; enabled: boolean;
  activeColor: string; inactiveLabel: string;
}) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const bg = !enabled ? colors.separator : active ? activeColor + '20' : colors.successLight;
  const border = !enabled ? colors.cardBorder : active ? activeColor + '40' : colors.success + '30';

  return (
    <View style={[styles.sensorRow, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.sensorIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sensorLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sensorStatus, { color: !enabled ? colors.textFaint : active ? activeColor : colors.success }]}>
          {!enabled ? 'Disabled' : active ? label.split(' ')[0] + ' Detected!' : inactiveLabel}
        </Text>
      </View>
      <View style={[styles.dot, { backgroundColor: !enabled ? colors.textFaint : active ? activeColor : colors.success }]} />
    </View>
  );
}

export function SecurityCard({
  flameDetected, motionDetected, lastUpdated, flameSensorEnabled, motionSensorEnabled,
}: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const lastUpdatedStr = new Date(lastUpdated).toLocaleTimeString();

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>🛡️</Text>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Security</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Updated: {lastUpdatedStr}</Text>
        </View>
      </View>

      <View style={styles.sensors}>
        <SensorRow
          icon="🔥" label="Flame Sensor" active={flameDetected}
          enabled={flameSensorEnabled} activeColor={colors.danger} inactiveLabel="Safe"
        />
        <SensorRow
          icon="🚶" label="Motion Sensor" active={motionDetected}
          enabled={motionSensorEnabled} activeColor={colors.warning} inactiveLabel="No Motion"
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  icon: { fontSize: 28 },
  title: { fontSize: 16, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  sensors: { gap: Spacing.sm },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sensorIcon: { fontSize: 20 },
  sensorLabel: { fontSize: 13, fontWeight: '600' },
  sensorStatus: { fontSize: 11, marginTop: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
