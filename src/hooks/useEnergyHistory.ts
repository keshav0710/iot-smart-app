import { useState, useEffect, useRef } from 'react';
import { ref, push, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { database } from '../services/firebase/config';

export interface EnergyReading {
  timestamp: number;
  power: number;
  voltage: number;
  current: number;
  totalEnergyKwh: number;
}

const RECORD_INTERVAL_MS = 30_000;
const MAX_POINTS = 48;

export function useEnergyHistory(
  userId: string | null,
  livePower: number, liveVoltage: number, liveCurrent: number, liveTotalEnergy: number
) {
  const [history, setHistory] = useState<EnergyReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const latestValues = useRef({ livePower, liveVoltage, liveCurrent, liveTotalEnergy });

  useEffect(() => {
    latestValues.current = { livePower, liveVoltage, liveCurrent, liveTotalEnergy };
  }, [livePower, liveVoltage, liveCurrent, liveTotalEnergy]);

  useEffect(() => {
    if (!userId) return;
    const histRef = query(
      ref(database, `energyHistory/${userId}`),
      orderByChild('timestamp'),
      limitToLast(MAX_POINTS)
    );
    const unsubscribe = onValue(histRef, (snap) => {
      if (snap.exists()) {
        const raw = snap.val() as Record<string, EnergyReading>;
        setHistory(Object.values(raw).sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setHistory([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const record = async () => {
      const { livePower, liveVoltage, liveCurrent, liveTotalEnergy } = latestValues.current;
      if (livePower === 0 && liveVoltage === 0 && liveCurrent === 0) return;
      await push(ref(database, `energyHistory/${userId}`), {
        timestamp: Date.now(), power: livePower,
        voltage: liveVoltage, current: liveCurrent, totalEnergyKwh: liveTotalEnergy,
      }).catch(console.error);
    };
    const delay = setTimeout(record, 5_000);
    const interval = setInterval(record, RECORD_INTERVAL_MS);
    return () => { clearTimeout(delay); clearInterval(interval); };
  }, [userId]);

  return { history, isLoading };
}
