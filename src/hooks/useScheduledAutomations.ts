import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { database } from '../services/firebase/config';
import { toggleRelay } from '../services/firebase/relay.service';
import type { RelayKey } from '../types/sensor.types';

export type ScheduleDays = {
  mon: boolean; tue: boolean; wed: boolean;
  thu: boolean; fri: boolean; sat: boolean; sun: boolean;
};

export interface RelaySchedule {
  id: string;
  relayKey: RelayKey;
  action: 'on' | 'off';
  hour: number;
  minute: number;
  enabled: boolean;
  days: ScheduleDays;
  label: string;
  createdAt: number;
}

export type NewRelaySchedule = Omit<RelaySchedule, 'id' | 'createdAt'>;

const DAY_KEYS: (keyof ScheduleDays)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function shouldFireNow(schedule: RelaySchedule, now: Date): boolean {
  if (!schedule.enabled) return false;
  const dayKey = DAY_KEYS[now.getDay()];
  if (!schedule.days[dayKey]) return false;
  return now.getHours() === schedule.hour && now.getMinutes() === schedule.minute;
}

export function useScheduledAutomations(userId: string | null) {
  const [schedules, setSchedules] = useState<RelaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const firedRef = useRef<Set<string>>(new Set());
  const lastMinuteRef = useRef<number>(-1);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    const schedRef = ref(database, `schedules/${userId}`);
    const unsubscribe = onValue(schedRef, (snap) => {
      if (snap.exists()) {
        const raw = snap.val() as Record<string, Omit<RelaySchedule, 'id'>>;
        setSchedules(Object.entries(raw).map(([id, v]) => ({ ...v, id })));
      } else {
        setSchedules([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const tick = () => {
      const now = new Date();
      const currentMinute = now.getHours() * 60 + now.getMinutes();
      if (currentMinute !== lastMinuteRef.current) {
        firedRef.current.clear();
        lastMinuteRef.current = currentMinute;
      }
      schedules.forEach((sched) => {
        if (firedRef.current.has(sched.id)) return;
        if (shouldFireNow(sched, now)) {
          firedRef.current.add(sched.id);
          toggleRelay(sched.relayKey, sched.action === 'on').catch(console.error);
        }
      });
    };
    tick();
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [userId, schedules]);

  const addSchedule = useCallback(async (schedule: NewRelaySchedule) => {
    if (!userId) return;
    await push(ref(database, `schedules/${userId}`), { ...schedule, createdAt: Date.now() });
  }, [userId]);

  const updateSchedule = useCallback(async (id: string, updates: Partial<NewRelaySchedule>) => {
    if (!userId) return;
    const existing = schedules.find((s) => s.id === id);
    if (!existing) return;
    await set(ref(database, `schedules/${userId}/${id}`), { ...existing, ...updates });
  }, [userId, schedules]);

  const deleteSchedule = useCallback(async (id: string) => {
    if (!userId) return;
    await remove(ref(database, `schedules/${userId}/${id}`));
  }, [userId]);

  const toggleScheduleEnabled = useCallback(async (id: string, enabled: boolean) => {
    if (!userId) return;
    await set(ref(database, `schedules/${userId}/${id}/enabled`), enabled);
  }, [userId]);

  return { schedules, isLoading, addSchedule, updateSchedule, deleteSchedule, toggleScheduleEnabled };
}
