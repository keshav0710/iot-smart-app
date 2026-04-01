import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  voltage: number;
  current: number;
  power: number;
  totalEnergyKwh: number;
  unitPrice: number;
}

function MetricRow({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={[styles.metricRow, { backgroundColor: color + '14', borderColor: color + '30' }]}>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.metricRight}>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
        <Text style={[styles.metricUnit, { color: colors.textFaint }]}>{unit}</Text>
      </View>
    </View>
  );
}

export function ElectricityCard({ voltage, current, power, totalEnergyKwh, unitPrice }: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const estimatedCost = (totalEnergyKwh * unitPrice).toFixed(2);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>⚡</Text>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Electricity</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Live power metrics</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricRow label="Voltage" value={voltage.toFixed(1)} unit="V" color={colors.warning} />
        <MetricRow label="Current" value={current.toFixed(2)} unit="A" color={colors.secondary} />
        <MetricRow label="Power" value={power.toFixed(1)} unit="W" color={colors.primary} />
        <MetricRow label="Energy" value={totalEnergyKwh.toFixed(4)} unit="kWh" color={colors.success} />
      </View>

      <View style={[styles.costRow, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
        <Text style={[styles.costLabel, { color: colors.textMuted }]}>Estimated Cost</Text>
        <Text style={[styles.costValue, { color: colors.primary }]}>₹{estimatedCost}</Text>
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
  metrics: { gap: Spacing.xs },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  metricLabel: { fontSize: 13 },
  metricRight: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  metricValue: { fontSize: 18, fontWeight: '800' },
  metricUnit: { fontSize: 11 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  costLabel: { fontSize: 13 },
  costValue: { fontSize: 18, fontWeight: '800' },
});
