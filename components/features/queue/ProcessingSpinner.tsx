import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ProcessingSpinnerProps {
  size?: number;
  color?: string;
}

export const ProcessingSpinner = ({ size = 12, color = '#A4C6E1' }: ProcessingSpinnerProps) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const createSpinnerPart = (rotation: string, color: string) => (
    <Animated.View
      style={[
        styles.spinnerPart,
        {
          width: size * 0.5,
          height: size * 1.5,
          backgroundColor: color,
          transform: [{ rotate: rotation }],
          position: 'absolute',
          top: 0,
          left: size * 2.25,
          borderRadius: size * 0.2,
          shadowColor: color,
          shadowOffset: { width: 0, height: size * 3.5 },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
      ]}
    />
  );

  return (
    <View style={[styles.container, { width: size * 5, height: size * 5 }]}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        {createSpinnerPart('0deg', color)}
        {createSpinnerPart('-45deg', color)}
        {createSpinnerPart('-90deg', color)}
        {createSpinnerPart('-135deg', color)}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  spinner: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  spinnerPart: {
    transformOrigin: '50% 2.5em',
  },
}); 