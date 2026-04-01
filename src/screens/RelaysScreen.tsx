import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../hooks/useAuth';
import { useRelayControl } from '../hooks/useRelayControl';
import { useRelayTimers } from '../hooks/useRelayTimers';
import { turnOnAllRelays, turnOffAllRelays } from '../services/firebase/relay.service';
import { RelayToggleCard } from '../components/relay/RelayToggleCard';
import { TimerModal } from '../components/relay/TimerModal';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { DEVICE_NAMES } from '../utils/constants';
import type { RelayKey } from '../types/sensor.types';

const RELAY_KEYS: RelayKey[] = ['relay1', 'relay2', 'relay3', 'relay4'];

export function RelaysScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { relayStates, toggleRelay } = useRelayControl(user?.uid || null);
  const { activeTimers, remainingTimes, setTimer, cancelTimer, formatTime } = useRelayTimers(user?.uid || null);

  const [timerModalRelay, setTimerModalRelay] = useState<RelayKey | null>(null);

  const handleAllOn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await turnOnAllRelays();
  };

  const handleAllOff = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await turnOffAllRelays();
  };

  const activeCount = Object.values(relayStates).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Device Control</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {activeCount} of 4 devices on
          </Text>
        </View>
      </View>

      {/* Global Controls */}
      <View style={[styles.globalRow, { borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={[styles.globalBtn, { backgroundColor: colors.successLight, borderColor: colors.success + '40' }]}
          onPress={handleAllOn}
          activeOpacity={0.8}
        >
          <Text style={[styles.globalBtnText, { color: colors.success }]}>⚡ All ON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.globalBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}
          onPress={handleAllOff}
          activeOpacity={0.8}
        >
          <Text style={[styles.globalBtnText, { color: colors.danger }]}>⏹ All OFF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {RELAY_KEYS.map((key) => (
          <RelayToggleCard
            key={key}
            relayKey={key}
            name={DEVICE_NAMES[key]}
            isOn={relayStates[key]}
            onToggle={() => toggleRelay(key)}
            timer={activeTimers[key]}
            remainingTime={remainingTimes[key]}
            onTimerPress={() => setTimerModalRelay(key)}
            onCancelTimer={() => cancelTimer(key)}
            formatTime={formatTime}
          />
        ))}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {timerModalRelay && (
        <TimerModal
          visible={!!timerModalRelay}
          relayKey={timerModalRelay}
          relayName={DEVICE_NAMES[timerModalRelay]}
          onClose={() => setTimerModalRelay(null)}
          onSetTimer={(h, m, s, action) => setTimer(timerModalRelay, h, m, s, action)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  globalRow: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.md, borderBottomWidth: 1,
  },
  globalBtn: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, alignItems: 'center',
  },
  globalBtnText: { fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
});
