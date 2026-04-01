import { useState, useEffect } from 'react';
import { listenToSensorData } from '../services/firebase/database.service';
import type { SensorData } from '../types/sensor.types';

export function useSensorData(userId: string | null) {
  const [sensorData, setSensorData] = useState<SensorData>({
    waterLevel: 0,
    voltage: 0,
    current: 0,
    power: 0,
    totalEnergyKwh: 0,
    flameDetected: false,
    motionDetected: false,
    lastUpdated: Date.now(),
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    if (!userId) {
      setConnectionStatus('Not authenticated');
      return;
    }
    setConnectionStatus('Connected');
    const cleanup = listenToSensorData(
      (data) => {
        setSensorData((prev) => ({ ...prev, ...data }));
        setConnectionStatus('Live');
      },
      () => setConnectionStatus('Error')
    );
    return cleanup;
  }, [userId]);

  return { sensorData, connectionStatus };
}
