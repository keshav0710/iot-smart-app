import { useEffect, useRef } from 'react';
import { turnOnAllRelays, turnOffAllRelays } from '../services/firebase/relay.service';
import type { SensorData } from '../types/sensor.types';

interface Props {
  sensorData: SensorData;
  motionSensorEnabled: boolean;
  motionAutoEnabled: boolean;
  autoOffMinutes: number;
  holidayMode: boolean;
}

export function useMotionAutomation({
  sensorData, motionSensorEnabled, motionAutoEnabled, autoOffMinutes, holidayMode,
}: Props) {
  const autoOffRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lightsOnRef = useRef(false);

  useEffect(() => {
    if (!motionSensorEnabled || !motionAutoEnabled || holidayMode) return;
    const { motionDetected } = sensorData;

    if (motionDetected) {
      if (autoOffRef.current) { clearTimeout(autoOffRef.current); autoOffRef.current = null; }
      if (!lightsOnRef.current) {
        turnOnAllRelays().then(() => { lightsOnRef.current = true; }).catch(console.error);
      }
    } else {
      if (lightsOnRef.current && !autoOffRef.current) {
        autoOffRef.current = setTimeout(() => {
          turnOffAllRelays().then(() => { lightsOnRef.current = false; }).catch(console.error);
          autoOffRef.current = null;
        }, autoOffMinutes * 60 * 1000);
      }
    }
    return () => { if (autoOffRef.current) clearTimeout(autoOffRef.current); };
  }, [sensorData.motionDetected, motionSensorEnabled, motionAutoEnabled, autoOffMinutes, holidayMode]);
}
