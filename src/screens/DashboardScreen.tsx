import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

// Animated pulsing dot for live status
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 14, height: 14, borderRadius: 7,
        backgroundColor: color, opacity,
        transform: [{ scale }],
      }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

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
  const isLive = connectionStatus === 'Live';

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const relayOnCount = Object.values(relayStates).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(108,99,255,0.12)', 'transparent']
          : ['rgba(90,82,224,0.07)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Smart Home 🏠</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              {isLive ? (
                <PulseDot color={colors.success} />
              ) : (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textFaint }} />
              )}
              <Text style={[styles.statusText, { color: isLive ? colors.success : colors.textMuted }]}>
                {isLive ? 'Live' : connectionStatus}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '30' }]}
            onPress={logout}
          >
            <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Quick stats — glowing cards */}
      <View style={[styles.statsRow, { borderBottomColor: colors.separator }]}>
        {/* Devices ON */}
        <View style={styles.statItem}>
          <LinearGradient
            colors={[colors.primary + '22', colors.primary + '08']}
            style={[styles.statGlow, { borderColor: colors.primary + '30' }]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>{relayOnCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Devices On</Text>
          </LinearGradient>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
        {/* Power */}
        <View style={styles.statItem}>
          <LinearGradient
            colors={[colors.warning + '22', colors.warning + '08']}
            style={[styles.statGlow, { borderColor: colors.warning + '30' }]}
          >
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {sensorData.power.toFixed(0)}W
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Power</Text>
          </LinearGradient>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
        {/* Water */}
        <View style={styles.statItem}>
          <LinearGradient
            colors={[waterStatus.color + '22', waterStatus.color + '08']}
            style={[styles.statGlow, { borderColor: waterStatus.color + '30' }]}
          >
            <Text style={[styles.statValue, { color: waterStatus.color }]}>
              {waterStatus.percentage}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Water</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Alerts INSIDE scroll — prevents overlap with stats bar */}
        {flameAlert && (
          <AlertBanner
            message="🔥 Flame Detected! Check your home immediately."
            type="danger"
            visible
          />
        )}
        {waterAlert && !flameAlert && (
          <AlertBanner
            message="💧 Water tank is empty!"
            type="warning"
            visible
          />
        )}

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
  headerGradient: {},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  greeting: { fontSize: 20, fontWeight: '800' },
  statusText: { fontSize: 12, fontWeight: '600' },
  logoutBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: 20, borderWidth: 1,
  },
  logoutText: { fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  statItem: { flex: 1, alignItems: 'center', padding: Spacing.xs },
  statGlow: {
    width: '100%', alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: 12, borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, marginVertical: Spacing.xs },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingTop: Spacing.sm },
});
