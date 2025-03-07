import { View, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

const ProcessingPill = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(0.5, { duration: 1000 })),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center bg-stone-100 rounded-full px-2 py-1 border border-stone-500"
    >
      <Ionicons name="sync" size={12} color="black" />
      <Text className="text-stone-600 text-xs font-dm-medium ml-1">
        Processing
      </Text>
    </Animated.View>
  );
};

export default ProcessingPill;
