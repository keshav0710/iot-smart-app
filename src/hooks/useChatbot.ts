import { useState, useCallback } from 'react';
import type { ChatMessage, SensorData, RelayStates, RelayKey } from '../types/sensor.types';
import { UI_TEXT } from '../utils/constants';
import { useAppStore } from '../store/useAppStore';

// Relay key aliases so user can say "lights", "fan", etc.
const RELAY_ALIASES: Record<string, RelayKey> = {
  'relay1': 'relay1', 'light 1': 'relay1', 'light1': 'relay1', 'light one': 'relay1', 'first light': 'relay1',
  'relay2': 'relay2', 'light 2': 'relay2', 'light2': 'relay2', 'light two': 'relay2', 'second light': 'relay2',
  'lights': 'relay1', // default "lights" → relay1
  'relay3': 'relay3', 'fan': 'relay3',
  'relay4': 'relay4', 'extra': 'relay4', 'plug': 'relay4', 'socket': 'relay4',
};

interface RelayCommand {
  relayKey: RelayKey;
  action: 'on' | 'off';
}

function parseRelayCommands(text: string): RelayCommand[] {
  const commands: RelayCommand[] = [];

  // Try JSON block: {"command":"relay","relay":"relay1","action":"on"}
  const jsonMatches = text.match(/\{[^}]*"command"\s*:\s*"relay"[^}]*\}/g);
  if (jsonMatches) {
    for (const match of jsonMatches) {
      try {
        const parsed = JSON.parse(match);
        if (parsed.relay && (parsed.action === 'on' || parsed.action === 'off')) {
          const key = parsed.relay as RelayKey;
          commands.push({ relayKey: key, action: parsed.action });
        }
      } catch { /* ignore malformed JSON */ }
    }
  }

  // Fallback: natural language parsing on the user query directly
  return commands;
}

// Parse natural language commands from the user's own message (not AI response)
// This gives instant response without waiting for Ollama
function parseNaturalLanguage(userMessage: string): RelayCommand[] {
  const lower = userMessage.toLowerCase();
  const commands: RelayCommand[] = [];

  // Determine action
  let action: 'on' | 'off' | null = null;
  if (/\bturn\s+on\b|\bswitch\s+on\b|\benable\b|\bstart\b/.test(lower)) action = 'on';
  else if (/\bturn\s+off\b|\bswitch\s+off\b|\bdisable\b|\bstop\b|\bturnoff\b/.test(lower)) action = 'off';

  if (!action) return commands;

  // "all" → toggle all relays
  if (/\ball\b/.test(lower)) {
    (['relay1', 'relay2', 'relay3', 'relay4'] as RelayKey[]).forEach((k) =>
      commands.push({ relayKey: k, action: action! })
    );
    return commands;
  }

  // Match device aliases
  for (const [alias, relayKey] of Object.entries(RELAY_ALIASES)) {
    if (lower.includes(alias)) {
      if (!commands.find((c) => c.relayKey === relayKey)) {
        commands.push({ relayKey, action });
      }
    }
  }

  return commands;
}

async function sendMessageToBot(
  message: string,
  chatUrl: string,
  sensorData?: SensorData,
  relayStates?: RelayStates
): Promise<string> {
  let contextStr = 'No live sensor data available.\n';
  if (sensorData) {
    contextStr =
      `Live system status:\n` +
      `- Voltage: ${sensorData.voltage.toFixed(1)}V, Current: ${sensorData.current.toFixed(2)}A, Power: ${sensorData.power.toFixed(1)}W\n` +
      `- Flame sensor: ${sensorData.flameDetected ? '🔥 FIRE DETECTED' : 'Safe'}\n` +
      `- Motion sensor: ${sensorData.motionDetected ? 'Motion detected' : 'No motion'}\n` +
      `- Water level: ${sensorData.waterLevel.toFixed(1)}cm distance\n`;
  }
  if (relayStates) {
    contextStr +=
      `Device states:\n` +
      `- Light 1 (relay1): ${relayStates.relay1 ? 'ON' : 'OFF'}\n` +
      `- Light 2 (relay2): ${relayStates.relay2 ? 'ON' : 'OFF'}\n` +
      `- Fan (relay3): ${relayStates.relay3 ? 'ON' : 'OFF'}\n` +
      `- Socket/Plug (relay4): ${relayStates.relay4 ? 'ON' : 'OFF'}\n`;
  }

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content:
            `You are a concise smart home AI assistant. Here is the current state of the home:\n${contextStr}\n` +
            `If the user asks you to control a device, include a JSON command in your response EXACTLY like this (on its own line):\n` +
            `{"command":"relay","relay":"relay1","action":"on"}\n` +
            `Valid relay keys: relay1 (Light 1), relay2 (Light 2), relay3 (Fan), relay4 (Socket).\n` +
            `Valid actions: "on" or "off".\n` +
            `Also give a brief natural language confirmation. Be concise.`,
        },
        { role: 'user', content: message },
      ],
      stream: false,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error || `Ollama error: ${response.status}`);
  }
  const data = await response.json();
  return data.message?.content || 'No response from assistant.';
}

// Strip JSON command blocks from display text
function stripCommandBlocks(text: string): string {
  return text
    .replace(/\{[^}]*"command"\s*:\s*"relay"[^}]*\}/g, '')
    .trim();
}

interface SendMessageOptions {
  sensorData: SensorData;
  relayStates: RelayStates;
  toggleRelay: (key: RelayKey) => Promise<void>;
  currentRelayStates: RelayStates;
}

export function useChatbot(userId: string | null) {
  const { ollamaChatUrl } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', message: UI_TEXT.WELCOME_MESSAGE, isUser: false, timestamp: Date.now() },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (
      message: string,
      opts: SendMessageOptions
    ) => {
      if (!message.trim() || !userId) return;

      const userMsg: ChatMessage = { id: Date.now().toString(), message, isUser: true, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Instant local NLP relay control — no need to wait for Ollama
      const nlpCommands = parseNaturalLanguage(message);
      const executedCommands: RelayCommand[] = [];

      for (const cmd of nlpCommands) {
        const currentState = opts.currentRelayStates[cmd.relayKey];
        const shouldBeOn = cmd.action === 'on';
        if (currentState !== shouldBeOn) {
          await opts.toggleRelay(cmd.relayKey).catch(() => {});
          executedCommands.push(cmd);
        }
      }

      try {
        const botResponse = await sendMessageToBot(
          message, ollamaChatUrl,
          opts.sensorData, opts.relayStates
        );

        // Also execute any JSON commands the AI included
        const aiCommands = parseRelayCommands(botResponse);
        for (const cmd of aiCommands) {
          // Only execute if NLP didn't already handle it
          const alreadyDone = executedCommands.find((c) => c.relayKey === cmd.relayKey);
          if (!alreadyDone) {
            await opts.toggleRelay(cmd.relayKey).catch(() => {});
          }
        }

        const displayText = stripCommandBlocks(botResponse) || 'Done! ✅';
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(), message: displayText, isUser: false, timestamp: Date.now(),
        }]);
      } catch (e: any) {
        // If Ollama failed but NLP worked, show a local confirmation instead of error
        if (executedCommands.length > 0) {
          const confirmText = executedCommands
            .map((c) => `✅ ${c.relayKey === 'relay1' ? 'Light 1' : c.relayKey === 'relay2' ? 'Light 2' : c.relayKey === 'relay3' ? 'Fan' : 'Socket'} turned ${c.action.toUpperCase()}`)
            .join('\n');
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(), message: confirmText, isUser: false, timestamp: Date.now(),
          }]);
        } else {
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            message: `⚠️ Ollama not reachable: ${e.message}\n\n💡 Tip: Check URL in Settings. Ensure Ollama is running with OLLAMA_HOST=0.0.0.0`,
            isUser: false, timestamp: Date.now(),
          }]);
        }
      } finally {
        setIsTyping(false);
      }
    },
    [userId, ollamaChatUrl]
  );

  const clearMessages = useCallback(() => {
    setMessages([{ id: '1', message: UI_TEXT.WELCOME_MESSAGE, isUser: false, timestamp: Date.now() }]);
  }, []);

  return { messages, isTyping, sendMessage, clearMessages };
}
