import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useAppStore } from '../store/useAppStore';
import { GlassCard } from '../components/ui/GlassCard';
import { Colors, Spacing, Radius } from '../theme';

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={[styles.row, { borderBottomColor: colors.separator }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        {sub && <Text style={[styles.rowSub, { color: colors.textMuted }]}>{sub}</Text>}
      </View>
      {children}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      <GlassCard padding={0}>{children}</GlassCard>
    </View>
  );
}

export function SettingsScreen() {
  const { theme, toggleTheme, ollamaChatUrl, setOllamaUrl, resetOllamaUrl } = useAppStore();
  const colors = Colors[theme];
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings(user?.uid || null);

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
        setTestStatus({ type: 'success', msg: 'Connected successfully!' });
      } else {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        setTestStatus({ type: 'error', msg: `Server error: ${err.error || resp.status}` });
      }
    } catch (e: any) {
      setTestStatus({ type: 'error', msg: `Connection failed: ${e.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Section title="ACCOUNT">
          <Row label="Signed in as">
            <Text style={[styles.emailText, { color: colors.textMuted }]}>{user?.email}</Text>
          </Row>
        </Section>
        <Section title="APPEARANCE">
          <Row label="Dark Mode" sub="Switch between dark and light theme">
            <Switch value={theme === 'dark'} onValueChange={toggleTheme}
              trackColor={{ false: colors.separator, true: colors.primary }} thumbColor="#fff" />
          </Row>
        </Section>
        <Section title="ENERGY">
          <Row label="Unit Price (₹/kWh)" sub="Used for cost calculations">
            <TextInput
              style={[styles.numInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              value={String(settings.energy.unitPrice)} keyboardType="decimal-pad"
              onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) updateSetting('energy', 'unitPrice', n); }}
            />
          </Row>
        </Section>
        <Section title="AUTOMATION">
          <Row label="Holiday Mode" sub="Pause automations while away">
            <Switch value={settings.automation.holidayMode}
              onValueChange={(v) => updateSetting('automation', 'holidayMode', v)}
              trackColor={{ false: colors.separator, true: colors.warning }} thumbColor="#fff" />
          </Row>
          <Row label="Motion-Activated Lights" sub="Auto-on when motion detected">
            <Switch value={settings.automation.motionLightsEnabled}
              onValueChange={(v) => updateSetting('automation', 'motionLightsEnabled', v)}
              trackColor={{ false: colors.separator, true: colors.primary }} thumbColor="#fff" />
          </Row>
          <Row label={`Auto-Off: ${settings.automation.motionAutoOffMinutes} min`}>
            <View style={styles.stepperRow}>
              {[1, 5, 10, 15, 30].map((v) => (
                <TouchableOpacity key={v}
                  style={[styles.stepBtn, { backgroundColor: settings.automation.motionAutoOffMinutes === v ? colors.primaryLight : colors.surface, borderColor: settings.automation.motionAutoOffMinutes === v ? colors.primary + '50' : colors.cardBorder }]}
                  onPress={() => updateSetting('automation', 'motionAutoOffMinutes', v)}>
                  <Text style={{ color: settings.automation.motionAutoOffMinutes === v ? colors.primary : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
        </Section>
        <Section title="SENSORS">
          {([
            { key: 'flameSensorEnabled' as const, label: 'Flame Sensor' },
            { key: 'motionSensorEnabled' as const, label: 'Motion Sensor' },
            { key: 'waterSensorEnabled' as const, label: 'Water Sensor' },
          ]).map((sensor) => (
            <Row key={sensor.key} label={sensor.label}>
              <Switch value={settings.sensors[sensor.key]}
                onValueChange={(v) => updateSetting('sensors', sensor.key, v)}
                trackColor={{ false: colors.separator, true: colors.primary }} thumbColor="#fff" />
            </Row>
          ))}
        </Section>
        <Section title="NOTIFICATIONS">
          <Row label="Master Toggle">
            <Switch value={settings.notifications.masterEnabled}
              onValueChange={(v) => updateSetting('notifications', 'masterEnabled', v)}
              trackColor={{ false: colors.separator, true: colors.primary }} thumbColor="#fff" />
          </Row>
          {(['fireAlerts', 'motionAlerts', 'timerAlerts'] as const).map((k) => (
            <Row key={k} label={k.replace('Alerts', ' Alerts').replace(/^./, (c) => c.toUpperCase())}>
              <Switch value={settings.notifications[k]}
                onValueChange={(v) => updateSetting('notifications', k, v)}
                disabled={!settings.notifications.masterEnabled}
                trackColor={{ false: colors.separator, true: colors.primary }} thumbColor="#fff" />
            </Row>
          ))}
        </Section>
        <Section title="AI ASSISTANT">
          <View style={{ padding: Spacing.md }}>
            <Text style={[styles.rowSub, { color: colors.textMuted, marginBottom: Spacing.sm }]}>Ollama server URL (your PC's LAN IP)</Text>
            <TextInput
              style={[styles.urlInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
              value={ollamaChatUrl} onChangeText={setOllamaUrl}
              placeholder="http://172.16.20.19:11434/api/chat"
              placeholderTextColor={colors.textFaint} autoCapitalize="none" autoCorrect={false}
            />
            
            <View style={styles.testRow}>
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={{ color: colors.primary, fontWeight: '700' }}>Test Connection</Text>}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resetBtn, { borderColor: colors.separator }]}
                onPress={resetOllamaUrl}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Reset to Default</Text>
              </TouchableOpacity>
            </View>

            {testStatus.type !== 'none' && (
              <View style={[styles.statusBox, { backgroundColor: testStatus.type === 'success' ? colors.successLight : colors.dangerLight, borderColor: testStatus.type === 'success' ? colors.success + '40' : colors.danger + '40' }]}>
                <Text style={{ color: testStatus.type === 'success' ? colors.success : colors.danger, fontSize: 12 }}>{testStatus.msg}</Text>
              </View>
            )}
          </View>
        </Section>
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '40' }]} onPress={logout}>
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.md, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, gap: Spacing.md },
  section: { gap: Spacing.xs },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginLeft: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flex: 1, marginRight: Spacing.sm },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  emailText: { fontSize: 13, maxWidth: 160 },
  numInput: { padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, width: 80, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', gap: 6 },
  stepBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  urlInput: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, fontSize: 13 },
  testRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  testBtn: { flex: 2, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { flex: 1, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusBox: { marginTop: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1 },
  logoutBtn: { padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700' },
});
