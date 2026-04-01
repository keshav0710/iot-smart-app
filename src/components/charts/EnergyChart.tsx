import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import type { EnergyReading } from '../../hooks/useEnergyHistory';

const SCREEN_W = Dimensions.get('window').width;

interface Props {
  history: EnergyReading[];
  isLoading: boolean;
  dataKey: 'power' | 'voltage' | 'current';
  label: string;
  color: string;
  unit: string;
}

export function EnergyChart({ history, isLoading, dataKey, label, color, unit }: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  if (isLoading || history.length < 2) {
    return (
      <GlassCard style={styles.card}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{label}</Text>
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            {isLoading ? 'Loading data...' : 'Not enough data yet'}
          </Text>
        </View>
      </GlassCard>
    );
  }

  const points = history.slice(-20);
  const data = points.map((r) => r[dataKey]);
  const labels = points
    .filter((_, i) => i % 4 === 0)
    .map((r) => {
      const d = new Date(r.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

  // Pad labels to match data length
  const fullLabels = points.map((_, i) => (i % 4 === 0 ? labels[Math.floor(i / 4)] : ''));

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.chartTitle, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.currentValue, { color }]}>
        {data[data.length - 1]?.toFixed(dataKey === 'current' ? 2 : 1)} {unit}
      </Text>
      <LineChart
        data={{ labels: fullLabels, datasets: [{ data, color: () => color, strokeWidth: 2 }] }}
        width={SCREEN_W - 64}
        height={160}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withHorizontalLabels={true}
        chartConfig={{
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: dataKey === 'current' ? 2 : 1,
          color: () => color,
          labelColor: () => colors.textFaint,
          propsForBackgroundLines: { stroke: colors.separator },
          style: { borderRadius: 12 },
        }}
        bezier
        style={styles.chart}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.md },
  chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  currentValue: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.sm },
  chart: { borderRadius: 12, marginLeft: -Spacing.md },
  placeholder: { height: 160, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 14 },
});
