import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  glowColor?: string;
}

export function GlassCard({ children, style, padding = Spacing.md, glowColor }: GlassCardProps) {
  const { theme } = useAppStore();
  const colors = Colors[theme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: glowColor ? glowColor + '40' : colors.cardBorder,
          shadowColor: glowColor || (theme === 'dark' ? '#6C63FF' : '#000'),
          padding,
        },
        style,
      ]}
    >
      {/* Subtle gradient inner glow at top */}
      <LinearGradient
        colors={theme === 'dark'
          ? ['rgba(255,255,255,0.03)', 'transparent']
          : ['rgba(255,255,255,0.8)', 'transparent']}
        style={styles.innerGlow}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
    zIndex: 0,
  },
});
