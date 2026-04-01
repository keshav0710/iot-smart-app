import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useSensorData } from '../hooks/useSensorData';
import { useEnergyHistory } from '../hooks/useEnergyHistory';
import { EnergyChart } from '../components/charts/EnergyChart';
import { Colors, Spacing } from '../theme';
import { useAppStore } from '../store/useAppStore';

export function AnalyticsScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { sensorData } = useSensorData(user?.uid || null);
  const { history, isLoading } = useEnergyHistory(
    user?.uid || null,
    sensorData.power, sensorData.voltage, sensorData.current, sensorData.totalEnergyKwh
  );

  const totalCost = (sensorData.totalEnergyKwh * 8.5).toFixed(2);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.text }]}>Energy Analytics</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>Last 24 min of readings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary row */}
        <View style={styles.summaryRow}>
          {[
            { label: 'Total Energy', value: sensorData.totalEnergyKwh.toFixed(4), unit: 'kWh', color: colors.success },
            { label: 'Est. Cost', value: `₹${totalCost}`, unit: '', color: colors.primary },
          ].map((item) => (
            <View key={item.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
              {item.unit ? <Text style={[styles.summaryUnit, { color: colors.textFaint }]}>{item.unit}</Text> : null}
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading history...</Text>
          </View>
        ) : (
          <>
            <EnergyChart
              history={history} isLoading={isLoading}
              dataKey="power" label="Power" color={colors.primary} unit="W"
            />
            <EnergyChart
              history={history} isLoading={isLoading}
              dataKey="voltage" label="Voltage" color={colors.warning} unit="V"
            />
            <EnergyChart
              history={history} isLoading={isLoading}
              dataKey="current" label="Current" color={colors.secondary} unit="A"
            />
          </>
        )}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  summaryCard: { flex: 1, padding: Spacing.md, borderRadius: 16, borderWidth: 1 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryUnit: { fontSize: 12, marginTop: 1 },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  loading: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.md },
  loadingText: { fontSize: 14 },
});
