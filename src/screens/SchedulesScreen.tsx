import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import {
  useScheduledAutomations,
  type NewRelaySchedule, type ScheduleDays, type RelaySchedule,
} from '../hooks/useScheduledAutomations';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';
import { DEVICE_NAMES } from '../utils/constants';
import type { RelayKey } from '../types/sensor.types';

const RELAY_KEYS: RelayKey[] = ['relay1', 'relay2', 'relay3', 'relay4'];
const DAY_DEFS: { key: keyof ScheduleDays; label: string }[] = [
  { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'S' }, { key: 'sun', label: 'S' },
];

const DEFAULT_DAYS: ScheduleDays = { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };

function pad(n: number) { return n.toString().padStart(2, '0'); }
function formatTime(h: number, m: number) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${pad(h % 12 || 12)}:${pad(m)} ${ampm}`;
}
function dayLabel(days: ScheduleDays) {
  const active = DAY_DEFS.filter((d) => days[d.key]);
  if (active.length === 7) return 'Every day';
  if (active.length === 5 && !days.sat && !days.sun) return 'Weekdays';
  if (active.length === 2 && days.sat && days.sun) return 'Weekends';
  return active.map((d) => d.label).join('');
}

interface FormState { relayKey: RelayKey; action: 'on' | 'off'; hour: number; minute: number; days: ScheduleDays; label: string; enabled: boolean; }
const defaultForm = (): FormState => ({ relayKey: 'relay1', action: 'on', hour: 8, minute: 0, days: { ...DEFAULT_DAYS }, label: '', enabled: true });

export function SchedulesScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { schedules, isLoading, addSchedule, updateSchedule, deleteSchedule, toggleScheduleEnabled } =
    useScheduledAutomations(user?.uid || null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());

  const openAdd = () => { setForm(defaultForm()); setEditingId(null); setShowModal(true); };
  const openEdit = (s: RelaySchedule) => {
    setForm({ relayKey: s.relayKey, action: s.action, hour: s.hour, minute: s.minute, days: { ...s.days }, label: s.label, enabled: s.enabled });
    setEditingId(s.id); setShowModal(true);
  };

  const handleSave = async () => {
    const payload: NewRelaySchedule = {
      relayKey: form.relayKey, action: form.action, hour: form.hour, minute: form.minute,
      days: form.days, enabled: form.enabled,
      label: form.label.trim() || `${DEVICE_NAMES[form.relayKey]} ${form.action} at ${formatTime(form.hour, form.minute)}`,
    };
    if (editingId) await updateSchedule(editingId, payload);
    else await addSchedule(payload);
    setShowModal(false);
  };

  const setF = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (k: keyof ScheduleDays) => setF('days', { ...form.days, [k]: !form.days[k] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(108,99,255,0.12)', 'transparent']
          : ['rgba(90,82,224,0.07)', 'transparent']}
      >
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Schedules ⏰</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {schedules.length === 0 ? 'No automations yet' : `${schedules.length} automation${schedules.length !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAdd}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>＋ Add</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {schedules.length === 0 && !isLoading && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No schedules yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Tap + Add to create your first automation schedule</Text>
          </View>
        )}
        {schedules.map((s) => (
          <GlassCard key={s.id} style={[styles.schedCard, !s.enabled ? { opacity: 0.55 } : undefined]}>
            <View style={styles.schedTop}>
              <View style={[styles.timeBadge, {
                backgroundColor: s.action === 'on' ? colors.successLight : colors.dangerLight,
                borderColor: s.action === 'on' ? colors.success + '40' : colors.danger + '40',
              }]}>
                <Text style={[styles.timeText, { color: s.action === 'on' ? colors.success : colors.danger }]}>
                  {formatTime(s.hour, s.minute)}
                </Text>
                <Text style={[styles.actionText, { color: s.action === 'on' ? colors.success : colors.danger }]}>
                  {s.action === 'on' ? 'TURN ON' : 'TURN OFF'}
                </Text>
              </View>
              <View style={styles.schedInfo}>
                <Text style={[styles.schedLabel, { color: colors.text }]}>{s.label}</Text>
                <Text style={[styles.schedDevice, { color: colors.textMuted }]}>⚡ {DEVICE_NAMES[s.relayKey]}</Text>
                <View style={styles.dayPills}>
                  {DAY_DEFS.map((d) => (
                    <View key={d.key} style={[styles.dayPill, { backgroundColor: s.days[d.key] ? colors.primaryLight : colors.separator }]}>
                      <Text style={[styles.dayPillText, { color: s.days[d.key] ? colors.primary : colors.textFaint }]}>{d.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={[styles.schedActions, { borderTopColor: colors.separator }]}>
              <Switch
                value={Boolean(s.enabled)}
                onValueChange={(v) => toggleScheduleEnabled(s.id, v)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor={s.enabled ? '#fff' : colors.textMuted}
              />
              <TouchableOpacity onPress={() => openEdit(s)} style={styles.actionIcon}>
                <Text style={{ color: colors.primary, fontSize: 20 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteSchedule(s.id)} style={styles.actionIcon}>
                <Text style={{ color: colors.danger, fontSize: 20 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={Boolean(showModal)} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Schedule' : 'New Schedule'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Label */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Label</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                placeholder="e.g. Morning Lights" placeholderTextColor={colors.textFaint}
                value={form.label} onChangeText={(v) => setF('label', v)}
              />

              {/* Relay */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Device</Text>
              <View style={styles.chipRow}>
                {RELAY_KEYS.map((k) => (
                  <TouchableOpacity key={k}
                    style={[styles.chip, { backgroundColor: form.relayKey === k ? colors.primaryLight : colors.surface, borderColor: form.relayKey === k ? colors.primary + '50' : colors.cardBorder }]}
                    onPress={() => setF('relayKey', k)}>
                    <Text style={{ color: form.relayKey === k ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '600' }}>{DEVICE_NAMES[k]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Action</Text>
              <View style={styles.chipRow}>
                {(['on', 'off'] as const).map((a) => (
                  <TouchableOpacity key={a}
                    style={[styles.chip, { backgroundColor: form.action === a ? (a === 'on' ? colors.successLight : colors.dangerLight) : colors.surface, borderColor: form.action === a ? (a === 'on' ? colors.success : colors.danger) + '50' : colors.cardBorder, flex: 1 }]}
                    onPress={() => setF('action', a)}>
                    <Text style={{ color: form.action === a ? (a === 'on' ? colors.success : colors.danger) : colors.textMuted, fontWeight: '700' }}>{a === 'on' ? '⚡ Turn ON' : '⏹ Turn OFF'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Time */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Time (HH:MM)</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={[styles.timeInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  value={pad(form.hour)} keyboardType="number-pad" maxLength={2}
                  onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n) && n >= 0 && n <= 23) setF('hour', n); }}
                />
                <Text style={[styles.timeSep, { color: colors.textMuted }]}>:</Text>
                <TextInput
                  style={[styles.timeInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                  value={pad(form.minute)} keyboardType="number-pad" maxLength={2}
                  onChangeText={(v) => { const n = parseInt(v); if (!isNaN(n) && n >= 0 && n <= 59) setF('minute', n); }}
                />
              </View>

              {/* Days */}
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Repeat on</Text>
              <View style={styles.dayRow}>
                {DAY_DEFS.map((d) => (
                  <TouchableOpacity key={d.key}
                    style={[styles.dayBtn, { backgroundColor: form.days[d.key] ? colors.primaryLight : colors.surface, borderColor: form.days[d.key] ? colors.primary + '50' : colors.cardBorder }]}
                    onPress={() => toggleDay(d.key)}>
                    <Text style={{ color: form.days[d.key] ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: Spacing.md }} />
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update Schedule' : 'Create Schedule'}</Text>
              </TouchableOpacity>
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.round },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 260 },
  schedCard: { marginBottom: Spacing.md },
  schedTop: { flexDirection: 'row', gap: Spacing.md },
  timeBadge: { alignItems: 'center', justifyContent: 'center', padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, minWidth: 80 },
  timeText: { fontSize: 16, fontWeight: '800' },
  actionText: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  schedInfo: { flex: 1, gap: 4 },
  schedLabel: { fontSize: 14, fontWeight: '700' },
  schedDevice: { fontSize: 12 },
  dayPills: { flexDirection: 'row', gap: 3, marginTop: 4 },
  dayPill: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dayPillText: { fontSize: 9, fontWeight: '700' },
  schedActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.sm, paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1 },
  actionIcon: { padding: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, borderWidth: 1, padding: Spacing.lg, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.sm },
  fieldInput: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, fontSize: 15 },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.round, borderWidth: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeInput: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, fontSize: 28, fontWeight: '700', textAlign: 'center' },
  timeSep: { fontSize: 28, fontWeight: '700' },
  dayRow: { flexDirection: 'row', gap: Spacing.sm },
  dayBtn: { flex: 1, aspectRatio: 1, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { padding: Spacing.md, borderRadius: Radius.lg, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
