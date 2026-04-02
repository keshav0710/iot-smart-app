import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useAuth } from '../hooks/useAuth';
import { useChatbot } from '../hooks/useChatbot';
import { useSensorData } from '../hooks/useSensorData';
import { useRelayControl } from '../hooks/useRelayControl';
import { Colors, Spacing, Radius } from '../theme';
import { useAppStore } from '../store/useAppStore';
import type { ChatMessage } from '../types/sensor.types';

// Animated typing dots
function TypingDots() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a = Animated.parallel([anim(d1, 0), anim(d2, 200), anim(d3, 400)]);
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: colors.primary,
            transform: [{ translateY: d }],
          }}
        />
      ))}
    </View>
  );
}

export function ChatbotScreen() {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { sensorData } = useSensorData(user?.uid || null);
  const { relayStates, toggleRelay } = useRelayControl(user?.uid || null);
  const { messages, isTyping, sendMessage, clearMessages } = useChatbot(user?.uid || null);
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);
  const sendBtnScale = useRef(new Animated.Value(1)).current;

  // Animate send button when input has text
  useEffect(() => {
    Animated.spring(sendBtnScale, {
      toValue: input.trim() ? 1.08 : 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg, {
      sensorData,
      relayStates,
      toggleRelay,
      currentRelayStates: relayStates,
    });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, { rate: 0.95, pitch: 1.0 });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgRow, item.isUser && styles.msgRowUser]}>
      {!item.isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.bubble,
          item.isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderBottomLeftRadius: 4 },
        ]}
        onLongPress={() => !item.isUser && handleSpeak(item.message)}
        activeOpacity={0.9}
      >
        <Text style={[styles.msgText, { color: item.isUser ? '#fff' : colors.text }]}>{item.message}</Text>
        <Text style={[styles.timestamp, { color: item.isUser ? 'rgba(255,255,255,0.55)' : colors.textFaint }]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!item.isUser && '  · Long press to speak'}
        </Text>
      </TouchableOpacity>
      {item.isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      )}
    </View>
  );

  return (
    // Fix: KeyboardAvoidingView wraps the ENTIRE screen
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Gradient Header */}
        <LinearGradient
          colors={theme === 'dark'
            ? ['rgba(108,99,255,0.15)', 'transparent']
            : ['rgba(90,82,224,0.08)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={[styles.header, { borderBottomColor: colors.separator }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerAvatarBg, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}>
                <Text style={styles.headerAvatar}>🤖</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>AI Assistant</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.headerSub, { color: colors.success }]}>Powered by Ollama</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={clearMessages}
              style={[styles.clearBtn, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '30' }]}
            >
              <Text style={[styles.clearText, { color: colors.danger }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Message list */}
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
              <View style={styles.typingRow}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '30' }]}>
                  <Text style={styles.avatarEmoji}>🤖</Text>
                </View>
                <View style={[styles.bubble, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                  <TypingDots />
                </View>
              </View>
            ) : null
          }
        />

        {/* Input bar (inside KeyboardAvoidingView – this is what gets pushed up) */}
        <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.separator }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}
            placeholder="Ask or say: turn on lights..."
            placeholderTextColor={colors.textFaint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={300}
          />
          <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.separator }]}
              onPress={handleSend}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  headerGradient: { paddingTop: 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatarBg: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerAvatar: { fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.round, borderWidth: 1 },
  clearText: { fontSize: 12, fontWeight: '600' },
  list: { padding: Spacing.md, gap: Spacing.xs, paddingBottom: Spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: Spacing.sm },
  msgRowUser: { flexDirection: 'row-reverse' },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 17 },
  bubble: { maxWidth: '75%', padding: Spacing.md, borderRadius: Radius.xl, gap: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
  },
  input: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.xl,
    borderWidth: 1, fontSize: 15, maxHeight: 100,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
