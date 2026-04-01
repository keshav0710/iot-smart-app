// Ollama — users configure the PC's LAN IP in Settings
export const DEFAULT_OLLAMA_CHAT_URL = 'http://192.168.1.100:5001/ollama/chat';

// Firebase RTDB paths (identical to web project)
export const FIREBASE_PATHS = {
  SENSORS: 'sensors',
  RELAYS: 'relays',
  SENSOR_DISTANCE: 'sensors/distance',
  SENSOR_VOLTAGE: 'sensors/voltage',
  SENSOR_CURRENT: 'sensors/current',
  SENSOR_POWER: 'sensors/power',
  SENSOR_FLAME: 'sensors/flame',
  SENSOR_MOTION: 'sensors/motion',
} as const;

// Relay Configuration (active low — false = ON, true = OFF)
export const RELAY_CONFIG = {
  ACTIVE_LOW: true,
} as const;

// Water Tank Distance Thresholds (cm from sensor to water surface)
export const WATER_TANK_THRESHOLDS = {
  OVERFLOW: 5,
  FULL: 10,
  NORMAL_HIGH: 20,
  NORMAL_LOW: 35,
  LOW: 45,
} as const;

export const UI_TEXT = {
  WELCOME_MESSAGE: "Hello! I'm your AI-powered smart home assistant. Ask me about your home.",
  CHATBOT_PLACEHOLDER: 'Ask me anything about your home...',
} as const;

export const DEVICE_NAMES: Record<string, string> = {
  relay1: 'Light 1',
  relay2: 'Light 2',
  relay3: 'Fan',
  relay4: 'Extra Device',
};
