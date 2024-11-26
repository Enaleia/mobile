import SafeAreaContent from "@/components/SafeAreaContent";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

const App = () => {
  return (
    <SafeAreaContent>
      <View className="justify-between h-full pb-5 font-dm-regular">
        <View className="mb-4">
          <Text
            className="text-3xl font-dm-bold"
            style={{ letterSpacing: -1.5 }}
          >
            Enaleia
          </Text>
          <Text className="text-base" style={{ lineHeight: 24 }}>
            Removing plastic from the ocean, one fisherman's boat at a time.
          </Text>
        </View>
        <Link href="/login">Login</Link>
      </View>
      <StatusBar style="dark" />
    </SafeAreaContent>
  );
};

export default App;
