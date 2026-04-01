import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useAuth } from '../hooks/useAuth';
import { useChatbot } from '../hooks/useChatbot';
import { useSensorData } from '../hooks/useSensorData';
import { useRelayControl } from '../hooks/useRelayControl';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../types/sensor.types';

export function ChatbotScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { sensorData } = useSensorData(user?.uid || null);
  const { relayStates } = useRelayControl(user?.uid || null);
  const { messages, isTyping, sendMessage, clearMessages } = useChatbot(user?.uid || null);
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg, { sensorData, relayStates });
    flatRef.current?.scrollToEnd({ animated: true });
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, { rate: 0.95, pitch: 1.0 });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgRow, item.isUser && styles.msgRowUser]}>
      {!item.isUser && <Text style={styles.avatar}>🤖</Text>}
      <TouchableOpacity
        style={[
          styles.bubble,
          item.isUser
            ? [styles.bubbleUser, { backgroundColor: colors.primary }]
            : [styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.cardBorder }],
        ]}
        onLongPress={() => !item.isUser && handleSpeak(item.message)}
        activeOpacity={0.9}
      >
        <Text style={[styles.msgText, { color: item.isUser ? '#fff' : colors.text }]}>{item.message}</Text>
        <Text style={[styles.timestamp, { color: item.isUser ? 'rgba(255,255,255,0.6)' : colors.textFaint }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!item.isUser && '  · Long press to speak'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerAvatar}>🤖</Text>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>AI Assistant</Text>
            <Text style={[styles.headerSub, { color: colors.success }]}>● Powered by Ollama</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearMessages}>
          <Text style={[styles.clearText, { color: colors.textMuted }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.typingRow]}>
              <Text style={styles.avatar}>🤖</Text>
              <View style={[styles.bubble, styles.bubbleBot, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputRow, { borderTopColor: colors.separator, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder={`Ask about your home...`}
            placeholderTextColor={colors.textFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.separator }]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: { fontSize: 32 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  clearText: { fontSize: 14 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: { fontSize: 24 },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: Radius.xl, gap: 4 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleBot: { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, padding: Spacing.md, borderTopWidth: 1 },
  input: { flex: 1, padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
