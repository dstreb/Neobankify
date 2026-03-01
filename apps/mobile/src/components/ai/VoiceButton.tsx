import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import type { VoiceState } from '../../types/models';

// =====================================================
// Voice Recording Button with Animated Pulse
// =====================================================

interface VoiceButtonProps {
  voiceState: VoiceState;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function VoiceButton({ voiceState, onPressIn, onPressOut }: VoiceButtonProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (voiceState === 'listening') {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
    }
  }, [voiceState, pulseAnim, opacityAnim]);

  const isActive = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';

  const iconName: keyof typeof Ionicons.glyphMap = isActive
    ? 'mic'
    : isProcessing
      ? 'hourglass'
      : 'mic-outline';

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            backgroundColor: colors.error,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isActive ? colors.error : colors.surface,
            borderColor: isActive ? colors.error : colors.border,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isProcessing}
        activeOpacity={0.7}
      >
        <Ionicons
          name={iconName}
          size={22}
          color={isActive ? colors.textInverse : colors.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
