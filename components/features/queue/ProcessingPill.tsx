import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
  cancelAnimation,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

const ProcessingPill = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Start the animation with faster timing (500ms instead of 1000ms)
    opacity.value = withRepeat(
      withSequence(
        withDelay(250, withTiming(0.5, { duration: 500 })),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    // Cleanup function to cancel the animation when component unmounts
    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center bg-stone-100 rounded-full px-2 py-1 border border-stone-500"
    >
      <Ionicons name="sync-circle" size={12} color="#f59e0b" />
      <Text className="text-stone-600 text-xs font-dm-medium ml-1">
        Processing
      </Text>
    </Animated.View>
  );
};

export default ProcessingPill;
