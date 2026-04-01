import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useSensorData } from '../hooks/useSensorData';
import { useRelayControl } from '../hooks/useRelayControl';
import { useSettings } from '../hooks/useSettings';
import { useMotionAutomation } from '../hooks/useMotionAutomation';
import { useScheduledAutomations } from '../hooks/useScheduledAutomations';
import { getWaterTankStatus } from '../utils/water-tank.utils';
import { AlertBanner } from '../components/ui/AlertBanner';
import { WaterTankCard } from '../components/cards/WaterTankCard';
import { ElectricityCard } from '../components/cards/ElectricityCard';
import { SecurityCard } from '../components/cards/SecurityCard';
import { CameraCard } from '../components/cards/CameraCard';
import { Colors, Spacing } from '../theme';
import { useAppStore } from '../store/useAppStore';

export function DashboardScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user, logout } = useAuth();
  const { sensorData, connectionStatus } = useSensorData(user?.uid || null);
  const { relayStates } = useRelayControl(user?.uid || null);
  const { settings } = useSettings(user?.uid || null);
  const [refreshing, setRefreshing] = useState(false);

  // Keep background automations running
  useScheduledAutomations(user?.uid || null);
  useMotionAutomation({
    sensorData,
    motionSensorEnabled: settings.sensors.motionSensorEnabled,
    motionAutoEnabled: settings.automation.motionLightsEnabled,
    autoOffMinutes: settings.automation.motionAutoOffMinutes,
    holidayMode: settings.automation.holidayMode,
  });

  const waterStatus = getWaterTankStatus(sensorData.waterLevel);
  const flameAlert = settings.sensors.flameSensorEnabled && sensorData.flameDetected;
  const waterAlert = settings.sensors.waterSensorEnabled && waterStatus.status === 'empty';

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const relayOnCount = Object.values(relayStates).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Smart Home 🏠</Text>
          <Text style={[styles.sub, { color: connectionStatus === 'Live' ? colors.success : colors.textMuted }]}>
            {connectionStatus === 'Live' ? '● Live' : connectionStatus}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.dangerLight }]}
          onPress={logout}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Alerts */}
      <AlertBanner
        message="🔥 Flame Detected! Check your home immediately."
        type="danger"
        visible={Boolean(flameAlert)}
      />
      <AlertBanner
        message="💧 Water tank is empty!"
        type="warning"
        visible={Boolean(waterAlert && !flameAlert)}
      />

      {/* Quick stats */}
      <View style={[styles.statsRow, { borderBottomColor: colors.separator }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{relayOnCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Devices On</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {sensorData.power.toFixed(0)}W
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Power</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: waterStatus.color }]}>
            {waterStatus.percentage}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Water</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <WaterTankCard
          waterLevel={sensorData.waterLevel}
          status={waterStatus}
          sensorEnabled={settings.sensors.waterSensorEnabled}
        />
        <ElectricityCard
          voltage={sensorData.voltage}
          current={sensorData.current}
          power={sensorData.power}
          totalEnergyKwh={sensorData.totalEnergyKwh}
          unitPrice={settings.energy.unitPrice}
        />
        <SecurityCard
          flameDetected={sensorData.flameDetected}
          motionDetected={sensorData.motionDetected}
          lastUpdated={sensorData.lastUpdated}
          flameSensorEnabled={settings.sensors.flameSensorEnabled}
          motionSensorEnabled={settings.sensors.motionSensorEnabled}
        />
        <CameraCard
          isConnected={false}
          motionTriggered={sensorData.motionDetected}
          fireTriggered={sensorData.flameDetected}
        />
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  greeting: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  logoutBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20 },
  logoutText: { fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', padding: Spacing.md, borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingTop: Spacing.sm },
});
