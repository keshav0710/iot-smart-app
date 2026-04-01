export interface SensorData {
  waterLevel: number;
  voltage: number;
  current: number;
  power: number;
  totalEnergyKwh: number;
  flameDetected: boolean;
  motionDetected: boolean;
  lastUpdated: number;
}

export interface RelayStates {
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: number;
}

export interface WaterTankStatus {
  percentage: number;
  status: 'overflow' | 'full' | 'normal' | 'low' | 'empty';
  color: string;
}

export type RelayKey = keyof RelayStates;
