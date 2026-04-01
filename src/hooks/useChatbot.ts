import { useState, useCallback } from 'react';
import type { ChatMessage, SensorData, RelayStates } from '../types/sensor.types';
import { UI_TEXT } from '../utils/constants';
import { useAppStore } from '../store/useAppStore';

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
      `- Extra Device (relay4): ${relayStates.relay4 ? 'ON' : 'OFF'}\n`;
  }

  const response = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content: `You are a concise smart home AI assistant. Here is the current state of the home:\n${contextStr}\nAnswer helpfully and briefly.`,
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

export function useChatbot(userId: string | null) {
  const { ollamaChatUrl } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', message: UI_TEXT.WELCOME_MESSAGE, isUser: false, timestamp: Date.now() },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (
      message: string,
      systemState?: { sensorData: SensorData; relayStates: RelayStates }
    ) => {
      if (!message.trim() || !userId) return;
      const userMsg: ChatMessage = { id: Date.now().toString(), message, isUser: true, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      try {
        const botResponse = await sendMessageToBot(
          message, ollamaChatUrl,
          systemState?.sensorData, systemState?.relayStates
        );
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(), message: botResponse, isUser: false, timestamp: Date.now(),
        }]);
      } catch (e: any) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          message: `Ollama connection failed: ${e.message}. Check your URL in Settings and ensure Ollama is running with OLLAMA_HOST=0.0.0.0`,
          isUser: false, timestamp: Date.now(),
        }]);
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
