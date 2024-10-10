import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-xl font-bold mb-3">
          Seems you got lost in our ocean
        </Text>
        <Link href="/" className="text-blue-500 underline">
          <Text>Go back to home</Text>
        </Link>
      </View>
    </>
  );
}
