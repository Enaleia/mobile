import LoginForm from "@/components/LoginForm";
import SafeAreaContent from "@/components/SafeAreaContent";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

const App = () => {
  return (
    <SafeAreaContent>
      <View className="justify-between h-full pb-5">
        <View className="mb-4">
          <Text className="text-xl font-bold mb-2">ENALEIA</Text>
          <Text className="text-base">
            Removing plastic from the ocean, one fisherman's boat at a time.
          </Text>
        </View>
        <LoginForm />
      </View>
      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
