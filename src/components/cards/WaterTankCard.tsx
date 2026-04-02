import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../ui/GlassCard';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import type { WaterTankStatus } from '../../types/sensor.types';

interface Props {
  waterLevel: number;
  status: WaterTankStatus;
  sensorEnabled: boolean;
}

export function WaterTankCard({ waterLevel, status, sensorEnabled }: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const statusLabel = status.status.charAt(0).toUpperCase() + status.status.slice(1);
  const fillHeight = `${status.percentage}%` as `${number}%`;

  return (
    <GlassCard style={styles.card} glowColor={status.color}>
      <View style={styles.header}>
        <Text style={styles.icon}>💧</Text>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Water Tank</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {sensorEnabled ? 'Monitoring active' : 'Sensor disabled'}
          </Text>
        </View>
      </View>

      {sensorEnabled ? (
        <>
          <View style={styles.tankContainer}>
            {/* Tank outline */}
            <View style={[styles.tank, { borderColor: colors.cardBorder }]}>
              {/* Water fill */}
              <View style={styles.fillWrapper}>
                <LinearGradient
                  colors={[status.color + '99', status.color] as [string, string]}
                  style={[styles.fill, { height: fillHeight } as ViewStyle]}
                />
              </View>
              {/* Percentage text */}
              <Text style={[styles.percentage, { color: colors.text }]}>
                {status.percentage}%
              </Text>
            </View>
          </View>

          <View style={[styles.statusRow, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{statusLabel}</Text>
            <Text style={[styles.distanceText, { color: colors.textMuted }]}>
              {waterLevel.toFixed(1)} cm
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.disabled}>
          <Text style={[styles.disabledText, { color: colors.textMuted }]}>Water sensor is off</Text>
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
  tankContainer: { alignItems: 'center', marginVertical: Spacing.md },
  tank: {
    width: 80,
    height: 120,
    borderWidth: 2,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fillWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  fill: { width: '100%', borderRadius: Radius.sm },
  percentage: { fontSize: 18, fontWeight: '800', zIndex: 1 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', flex: 1 },
  distanceText: { fontSize: 12 },
  disabled: { alignItems: 'center', paddingVertical: Spacing.xl },
  disabledText: { fontSize: 14 },
});
