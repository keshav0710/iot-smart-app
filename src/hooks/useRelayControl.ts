import { useState, useEffect, useCallback } from 'react';
import { listenToRelayStates } from '../services/firebase/database.service';
import { toggleRelay as toggleRelayService } from '../services/firebase/relay.service';
import type { RelayStates, RelayKey } from '../types/sensor.types';

export function useRelayControl(userId: string | null) {
  const [relayStates, setRelayStates] = useState<RelayStates>({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  useEffect(() => {
    if (!userId) return;
    const cleanup = listenToRelayStates(
      (states) => setRelayStates(states),
      (err) => console.error('Relay listen error:', err)
    );
    return cleanup;
  }, [userId]);

  const toggleRelay = useCallback(
    async (relayKey: RelayKey) => {
      if (!userId) return;
      try {
        await toggleRelayService(relayKey, !relayStates[relayKey]);
      } catch (err) {
        console.error('Toggle error:', err);
      }
    },
    [userId, relayStates]
  );

  return { relayStates, toggleRelay };
}
