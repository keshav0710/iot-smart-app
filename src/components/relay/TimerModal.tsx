import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';
import type { RelayKey } from '../../types/sensor.types';

interface Props {
  visible: boolean;
  relayName: string;
  relayKey: RelayKey;
  onClose: () => void;
  onSetTimer: (hours: number, minutes: number, seconds: number, action: 'on' | 'off') => void;
}

export function TimerModal({ visible, relayName, relayKey, onClose, onSetTimer }: Props) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('5');
  const [secs, setSecs] = useState('0');
  const [action, setAction] = useState<'on' | 'off'>('on');

  const handleSet = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(secs) || 0;
    if (h + m + s === 0) return;
    onSetTimer(h, m, s, action);
    onClose();
  };

  return (
    <Modal visible={Boolean(visible)} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />
          <Text style={[styles.title, { color: colors.text }]}>Set Timer — {relayName}</Text>

          {/* Action selector */}
          <View style={styles.actionRow}>
            {(['on', 'off'] as const).map((a) => (
              <TouchableOpacity
                key={a}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: action === a
                      ? (a === 'on' ? colors.successLight : colors.dangerLight)
                      : colors.surface,
                    borderColor: action === a
                      ? (a === 'on' ? colors.success : colors.danger) + '60'
                      : colors.cardBorder,
                  },
                ]}
                onPress={() => setAction(a)}
              >
                <Text style={{ color: action === a ? (a === 'on' ? colors.success : colors.danger) : colors.textMuted, fontWeight: '700' }}>
                  {a === 'on' ? '⚡ Turn ON' : '⏹ Turn OFF'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time inputs */}
          <Text style={[styles.label, { color: colors.textMuted }]}>Duration</Text>
          <View style={styles.timeRow}>
            {[
              { label: 'HH', value: hours, set: setHours },
              { label: 'MM', value: minutes, set: setMinutes },
              { label: 'SS', value: secs, set: setSecs },
            ].map((item, idx) => (
              <View key={idx} style={styles.timeField}>
                <TextInput
                  style={[styles.timeInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.inputBorder }]}
                  value={item.value}
                  onChangeText={item.set}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleSet}
            >
              <Text style={styles.btnText}>Start Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.md },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center' },
  label: { fontSize: 13, marginBottom: Spacing.sm },
  timeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  timeField: { flex: 1, alignItems: 'center' },
  timeInput: {
    width: '100%',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeLabel: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  btnRow: { gap: Spacing.sm },
  btn: { padding: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
