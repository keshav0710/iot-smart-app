import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface AlertBannerProps {
  message: string;
  type?: 'danger' | 'warning' | 'success';
  visible: boolean;
}

export function AlertBanner({ message, type = 'danger', visible }: AlertBannerProps) {
  const { theme } = useAppStore();
  const colors = Colors[theme];
  const slideAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: Boolean(visible) ? 0 : -80,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [Boolean(visible)]);

  const bgColor =
    type === 'danger' ? colors.dangerLight :
    type === 'warning' ? colors.warningLight :
    colors.successLight;

  const borderColor =
    type === 'danger' ? colors.danger :
    type === 'warning' ? colors.warning :
    colors.success;

  const textColor =
    type === 'danger' ? colors.danger :
    type === 'warning' ? colors.warning :
    colors.success;

  const icon = type === 'danger' ? '🔥' : type === 'warning' ? '⚠️' : '✅';

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, borderColor, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  icon: { fontSize: 16 },
  text: { fontSize: 14, fontWeight: '600', flex: 1 },
});
