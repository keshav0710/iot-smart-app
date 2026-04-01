import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../services/firebase/config';

export interface UserSettings {
  sensors: {
    flameSensorEnabled: boolean;
    motionSensorEnabled: boolean;
    waterSensorEnabled: boolean;
  };
  notifications: {
    masterEnabled: boolean;
    fireAlerts: boolean;
    motionAlerts: boolean;
    timerAlerts: boolean;
  };
  automation: {
    holidayMode: boolean;
    motionLightsEnabled: boolean;
    motionAutoOffMinutes: number;
  };
  energy: {
    unitPrice: number;
    billingCycleStartDay: number;
  };
}

const defaultSettings: UserSettings = {
  sensors: { flameSensorEnabled: true, motionSensorEnabled: true, waterSensorEnabled: true },
  notifications: { masterEnabled: true, fireAlerts: true, motionAlerts: true, timerAlerts: true },
  automation: { holidayMode: false, motionLightsEnabled: true, motionAutoOffMinutes: 5 },
  energy: { unitPrice: 8.5, billingCycleStartDay: 1 },
};

export function useSettings(userId: string | null) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const settingsRef = ref(database, `settings/${userId}`);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const d = snapshot.val();
        setSettings({
          sensors: { ...defaultSettings.sensors, ...d.sensors },
          notifications: { ...defaultSettings.notifications, ...d.notifications },
          automation: { ...defaultSettings.automation, ...d.automation },
          energy: { ...defaultSettings.energy, ...d.energy },
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  const updateSetting = <T extends keyof UserSettings>(
    category: T, key: keyof UserSettings[T], value: UserSettings[T][keyof UserSettings[T]]
  ) => {
    if (!userId) return;
    const newSettings = { ...settings, [category]: { ...settings[category], [key]: value } };
    setSettings(newSettings);
    set(ref(database, `settings/${userId}/${category}/${String(key)}`), value).catch(console.error);
  };

  return { settings, loading, updateSetting };
}
