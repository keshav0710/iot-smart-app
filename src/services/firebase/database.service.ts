import { ref, get, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from './config';
import { FIREBASE_PATHS } from '../../utils/constants';
import type { SensorData, RelayStates } from '../../types/sensor.types';

export async function getSensorData(): Promise<Partial<SensorData> | null> {
  try {
    const snapshot = await get(ref(database, FIREBASE_PATHS.SENSORS));
    if (!snapshot.exists()) return null;
    const d = snapshot.val();
    return {
      waterLevel: d.distance || 0,
      voltage: d.voltage || 0,
      current: d.current || 0,
      power: d.power || 0,
      totalEnergyKwh: d.totalEnergyKwh || 0,
      flameDetected: Boolean(d.flame),
      motionDetected: Boolean(d.motion),
      lastUpdated: d.timestamp || Date.now(),
    };
  } catch {
    return null;
  }
}

export async function getAllSensorDataString(): Promise<string> {
  try {
    const snapshot = await get(ref(database, FIREBASE_PATHS.SENSORS));
    if (!snapshot.exists()) return 'Sensor data unavailable.';
    const d = snapshot.val();
    return (
      `Current system status:\n` +
      `* Voltage: ${d.voltage?.toFixed(1) || 'N/A'}V\n` +
      `* Current: ${d.current?.toFixed(2) || 'N/A'}A\n` +
      `* Power: ${d.power?.toFixed(1) || 'N/A'}W\n` +
      `* Total Energy: ${d.totalEnergyKwh?.toFixed(4) || 'N/A'} kWh\n` +
      `* Flame: ${d.flame ? 'FIRE DETECTED!' : 'Safe'}\n` +
      `* Motion: ${d.motion ? 'Motion detected' : 'No motion'}\n` +
      `* Water distance: ${d.distance?.toFixed(1) || 'N/A'}cm`
    );
  } catch {
    return 'Unable to fetch sensor data.';
  }
}

export function listenToSensorData(
  callback: (data: Partial<SensorData>) => void,
  onError?: (error: Error) => void
): () => void {
  const sensorsRef = ref(database, FIREBASE_PATHS.SENSORS);
  const listener = onValue(
    sensorsRef,
    (snapshot: DataSnapshot) => {
      const d = snapshot.val();
      if (d) {
        callback({
          waterLevel: d.distance || 0,
          voltage: d.voltage || 0,
          current: d.current || 0,
          power: d.power || 0,
          totalEnergyKwh: d.totalEnergyKwh || 0,
          flameDetected: Boolean(d.flame),
          motionDetected: Boolean(d.motion),
          lastUpdated: d.timestamp || Date.now(),
        });
      }
    },
    (error) => onError?.(error as Error)
  );
  return () => off(sensorsRef, 'value', listener);
}

export function listenToRelayStates(
  callback: (states: RelayStates) => void,
  onError?: (error: Error) => void
): () => void {
  const relaysRef = ref(database, FIREBASE_PATHS.RELAYS);
  const listener = onValue(
    relaysRef,
    (snapshot: DataSnapshot) => {
      const d = snapshot.val();
      if (d) {
        // Invert for active-low relays
        callback({
          relay1: !Boolean(d.relay1),
          relay2: !Boolean(d.relay2),
          relay3: !Boolean(d.relay3),
          relay4: !Boolean(d.relay4),
        });
      }
    },
    (error) => onError?.(error as Error)
  );
  return () => off(relaysRef, 'value', listener);
}
