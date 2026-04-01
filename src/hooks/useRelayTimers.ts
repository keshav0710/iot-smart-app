import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../services/firebase/config';
import { toggleRelay } from '../services/firebase/relay.service';
import type { RelayKey } from '../types/sensor.types';

export interface RelayTimer {
  relayKey: RelayKey;
  endTime: number;
  duration: number;
  action: 'on' | 'off';
  createdAt: number;
}

export interface ActiveTimers {
  relay1?: RelayTimer;
  relay2?: RelayTimer;
  relay3?: RelayTimer;
  relay4?: RelayTimer;
}

export function useRelayTimers(userId: string | null) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimers>({});
  const [remainingTimes, setRemainingTimes] = useState<Record<RelayKey, number>>({
    relay1: 0, relay2: 0, relay3: 0, relay4: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const timersRef = ref(database, 'timers');
    const unsubscribe = onValue(timersRef, (snapshot) => {
      setActiveTimers(snapshot.exists() ? snapshot.val() : {});
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const newRemaining: Record<RelayKey, number> = { relay1: 0, relay2: 0, relay3: 0, relay4: 0 };
      (Object.keys(activeTimers) as RelayKey[]).forEach((key) => {
        const timer = activeTimers[key];
        if (timer) {
          const remaining = Math.max(0, Math.floor((timer.endTime - now) / 1000));
          newRemaining[key] = remaining;
          if (remaining === 0 && timer.endTime <= now) {
            toggleRelay(key, timer.action === 'on').catch(console.error);
            remove(ref(database, `timers/${key}`)).catch(console.error);
          }
        }
      });
      setRemainingTimes(newRemaining);
    };
    update();
    intervalRef.current = setInterval(update, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTimers]);

  const setTimer = useCallback(
    async (relayKey: RelayKey, hours: number, minutes: number, seconds: number, action: 'on' | 'off') => {
      if (!userId) return;
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds <= 0) return;
      const now = Date.now();
      await set(ref(database, `timers/${relayKey}`), {
        relayKey, endTime: now + totalSeconds * 1000,
        duration: totalSeconds, action, createdAt: now,
      });
    },
    [userId]
  );

  const cancelTimer = useCallback(async (relayKey: RelayKey) => {
    await remove(ref(database, `timers/${relayKey}`));
  }, []);

  const formatTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  return { activeTimers, remainingTimes, setTimer, cancelTimer, formatTime };
}
