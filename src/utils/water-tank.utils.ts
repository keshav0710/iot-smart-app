import { WATER_TANK_THRESHOLDS } from './constants';
import type { WaterTankStatus } from '../types/sensor.types';

export function getWaterTankStatus(distance: number): WaterTankStatus {
  if (distance <= WATER_TANK_THRESHOLDS.OVERFLOW) {
    return { percentage: 95, status: 'overflow', color: '#FF4F6D' };
  } else if (distance <= WATER_TANK_THRESHOLDS.FULL) {
    return { percentage: 85, status: 'full', color: '#00C48C' };
  } else if (distance <= WATER_TANK_THRESHOLDS.NORMAL_HIGH) {
    return { percentage: 70, status: 'normal', color: '#00D4FF' };
  } else if (distance <= WATER_TANK_THRESHOLDS.NORMAL_LOW) {
    return { percentage: 45, status: 'normal', color: '#00D4FF' };
  } else if (distance <= WATER_TANK_THRESHOLDS.LOW) {
    return { percentage: 20, status: 'low', color: '#FFB347' };
  } else {
    return { percentage: 5, status: 'empty', color: '#FF4F6D' };
  }
}

export function getWaterTankMessage(distance: number): string {
  const s = getWaterTankStatus(distance);
  return `Water tank is ${s.status} (${s.percentage}% full, ${distance.toFixed(1)}cm from surface).`;
}
