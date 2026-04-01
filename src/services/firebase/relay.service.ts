import { ref, set, get } from 'firebase/database';
import { database } from './config';
import { RELAY_CONFIG } from '../../utils/constants';
import type { RelayKey } from '../../types/sensor.types';

export async function toggleRelay(relayKey: RelayKey, state?: boolean): Promise<void> {
  const relayRef = ref(database, `relays/${relayKey}`);
  let newState: boolean;
  if (state !== undefined) {
    newState = state;
  } else {
    const snapshot = await get(relayRef);
    const currentVal = snapshot.exists() ? snapshot.val() : true;
    newState = RELAY_CONFIG.ACTIVE_LOW ? currentVal : !currentVal;
  }
  const firebaseValue = RELAY_CONFIG.ACTIVE_LOW ? !newState : newState;
  await set(relayRef, firebaseValue);
}

export async function getRelayStatus(relayKey: RelayKey): Promise<'on' | 'off' | 'unknown'> {
  try {
    const snapshot = await get(ref(database, `relays/${relayKey}`));
    if (!snapshot.exists()) return 'unknown';
    const v = snapshot.val();
    const isOn = RELAY_CONFIG.ACTIVE_LOW ? v === false || v === 0 : v === true || v === 1;
    return isOn ? 'on' : 'off';
  } catch {
    return 'unknown';
  }
}

export async function turnOffAllRelays(): Promise<void> {
  const offValue = RELAY_CONFIG.ACTIVE_LOW ? true : false;
  await Promise.all([
    set(ref(database, 'relays/relay1'), offValue),
    set(ref(database, 'relays/relay2'), offValue),
    set(ref(database, 'relays/relay3'), offValue),
    set(ref(database, 'relays/relay4'), offValue),
  ]);
}

export async function turnOnAllRelays(): Promise<void> {
  const onValue = RELAY_CONFIG.ACTIVE_LOW ? false : true;
  await Promise.all([
    set(ref(database, 'relays/relay1'), onValue),
    set(ref(database, 'relays/relay2'), onValue),
    set(ref(database, 'relays/relay3'), onValue),
    set(ref(database, 'relays/relay4'), onValue),
  ]);
}
