import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useAppStore } from '../store/useAppStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, Spacing, Radius } from '../theme';

function Row({ label, sub, children, disabled }: { label: string; sub?: string; children: React.ReactNode; disabled?: boolean }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={[styles.row, { borderBottomColor: colors.separator, opacity: disabled ? 0.45 : 1 }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sub}</Text>}
      </View>
      {children}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.primary + '30' }]} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <GlassCard padding={0}>{children}</GlassCard>
    </View>
  );
}

export function SettingsScreen() {
  const { theme, toggleTheme, ollamaChatUrl, setOllamaUrl, resetOllamaUrl } = useAppStore();
  const colors = Colors[theme];
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings(user?.uid || null);

  // LOCAL STATE for unit price to avoid clearing mid-typing
  const [unitPriceStr, setUnitPriceStr] = useState(String(settings.energy.unitPrice));

  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | 'none'; msg: string }>({ type: 'none', msg: '' });
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus({ type: 'none', msg: '' });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const resp = await fetch(ollamaChatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', messages: [{ role: 'user', content: 'test' }], stream: false }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        setTestStatus({ type: 'success', msg: '✓ Connected successfully to Ollama!' });
      } else {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        setTestStatus({ type: 'error', msg: `Server error: ${err.error || resp.status}` });
      }
    } catch (e: any) {
      const isTimeout = e.name === 'AbortError';
      setTestStatus({ type: 'error', msg: isTimeout ? 'Timeout after 6s — check your IP/port.' : `Connection failed: ${e.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const notifMasterOn = settings.notifications.masterEnabled;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(108,99,255,0.12)', 'transparent']
          : ['rgba(90,82,224,0.07)', 'transparent']}
      >
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings ⚙️</Text>
          <Text style={[styles.titleSub, { color: colors.textMuted }]}>Manage your preferences</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Account */}
          <Section title="ACCOUNT">
            <Row label="Signed in as" sub={user?.email || ''}>
              <View style={[styles.badge, { backgroundColor: colors.successLight, borderColor: colors.success + '40' }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>Active</Text>
              </View>
            </Row>
          </Section>

          {/* Appearance */}
          <Section title="APPEARANCE">
            <Row label="Dark Mode" sub="Switch between dark and light theme">
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#fff"
              />
            </Row>
          </Section>

          {/* Energy */}
          <Section title="ENERGY">
            <Row label="Unit Price (₹/kWh)" sub="Used for electricity cost calculations">
              <TextInput
                style={[styles.numInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={unitPriceStr}
                keyboardType="decimal-pad"
                onChangeText={(v) => setUnitPriceStr(v)}
                onBlur={() => {
                  const n = parseFloat(unitPriceStr);
                  if (!isNaN(n) && n > 0) {
                    updateSetting('energy', 'unitPrice', n);
                  } else {
                    setUnitPriceStr(String(settings.energy.unitPrice));
                  }
                }}
              />
            </Row>
          </Section>

          {/* Automation */}
          <Section title="AUTOMATION">
            <Row label="Holiday Mode" sub="Pause all automations while away">
              <Switch
                value={settings.automation.holidayMode}
                onValueChange={(v) => updateSetting('automation', 'holidayMode', v)}
                trackColor={{ false: colors.separator, true: colors.warning }}
                thumbColor="#fff"
              />
            </Row>
            <Row label="Motion-Activated Lights" sub="Auto-on when motion detected">
              <Switch
                value={settings.automation.motionLightsEnabled}
                onValueChange={(v) => updateSetting('automation', 'motionLightsEnabled', v)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#fff"
              />
            </Row>
            <Row label={`Auto-Off Delay`} sub={`Lights off after ${settings.automation.motionAutoOffMinutes} min of no motion`}>
              <View style={styles.stepperRow}>
                {[1, 5, 10, 15, 30].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.stepBtn, {
                      backgroundColor: settings.automation.motionAutoOffMinutes === v ? colors.primaryLight : colors.surface,
                      borderColor: settings.automation.motionAutoOffMinutes === v ? colors.primary + '60' : colors.cardBorder,
                    }]}
                    onPress={() => updateSetting('automation', 'motionAutoOffMinutes', v)}
                  >
                    <Text style={{ color: settings.automation.motionAutoOffMinutes === v ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Row>
          </Section>

          {/* Sensors */}
          <Section title="SENSORS">
            {([
              { key: 'flameSensorEnabled' as const, label: 'Flame Sensor', icon: '🔥', sub: 'Fire detection alerts' },
              { key: 'motionSensorEnabled' as const, label: 'Motion Sensor', icon: '🚶', sub: 'Motion detection & automation' },
              { key: 'waterSensorEnabled' as const, label: 'Water Sensor', icon: '💧', sub: 'Water level monitoring' },
            ]).map((sensor) => (
              <Row key={sensor.key} label={`${sensor.icon} ${sensor.label}`} sub={sensor.sub}>
                <Switch
                  value={settings.sensors[sensor.key]}
                  onValueChange={(v) => updateSetting('sensors', sensor.key, v)}
                  trackColor={{ false: colors.separator, true: colors.primary }}
                  thumbColor="#fff"
                />
              </Row>
            ))}
          </Section>

          {/* Notifications */}
          <Section title="NOTIFICATIONS">
            <Row label="Master Toggle" sub="Enable or disable all notifications">
              <Switch
                value={notifMasterOn}
                onValueChange={(v) => updateSetting('notifications', 'masterEnabled', v)}
                trackColor={{ false: colors.separator, true: colors.primary }}
                thumbColor="#fff"
              />
            </Row>
            {/* Sub-rows dim when master is OFF */}
            {(['fireAlerts', 'motionAlerts', 'timerAlerts'] as const).map((k) => (
              <Row
                key={k}
                label={k === 'fireAlerts' ? '🔥 Fire Alerts' : k === 'motionAlerts' ? '🚶 Motion Alerts' : '⏱ Timer Alerts'}
                sub={!notifMasterOn ? 'Enable master toggle first' : undefined}
                disabled={!notifMasterOn}
              >
                <Switch
                  value={settings.notifications[k]}
                  onValueChange={(v) => updateSetting('notifications', k, v)}
                  disabled={!notifMasterOn}
                  trackColor={{ false: colors.separator, true: colors.primary }}
                  thumbColor="#fff"
                />
              </Row>
            ))}
          </Section>

          {/* AI Assistant */}
          <Section title="AI ASSISTANT">
            <View style={{ padding: Spacing.md }}>
              <Text style={[styles.rowSub, { color: colors.textMuted, marginBottom: 4 }]}>
                Ollama server URL
              </Text>
              <Text style={[styles.rowSub, { color: colors.textFaint, marginBottom: Spacing.sm, fontSize: 11 }]}>
                Use your PC's LAN IP (e.g. http://192.168.x.x:11434/api/chat)
              </Text>
              <TextInput
                style={[styles.urlInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
                value={ollamaChatUrl}
                onChangeText={setOllamaUrl}
                placeholder="http://192.168.x.x:11434/api/chat"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.testRow}>
                <TouchableOpacity
                  style={[styles.testBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
                  onPress={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text style={{ color: colors.primary, fontWeight: '700' }}>Test Connection</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resetBtn, { borderColor: colors.separator, backgroundColor: colors.surface }]}
                  onPress={() => { resetOllamaUrl(); }}
                >
                  <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Reset</Text>
                </TouchableOpacity>
              </View>

              {testStatus.type !== 'none' && (
                <View style={[styles.statusBox, {
                  backgroundColor: testStatus.type === 'success' ? colors.successLight : colors.dangerLight,
                  borderColor: testStatus.type === 'success' ? colors.success + '40' : colors.danger + '40',
                }]}>
                  <Text style={{ color: testStatus.type === 'success' ? colors.success : colors.danger, fontSize: 13 }}>
                    {testStatus.msg}
                  </Text>
                </View>
              )}
            </View>
          </Section>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  titleSub: { fontSize: 13, marginTop: 3 },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  section: { gap: 6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionLine: { flex: 1, height: 1 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, marginRight: Spacing.sm },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  numInput: {
    padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1,
    width: 88, textAlign: 'center', fontSize: 15, fontWeight: '600',
  },
  stepperRow: { flexDirection: 'row', gap: 5 },
  stepBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  urlInput: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, fontSize: 13 },
  testRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  testBtn: { flex: 2, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  resetBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  statusBox: { marginTop: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  logoutBtn: { padding: Spacing.md + 2, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700' },
});
