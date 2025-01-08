import { View, Text } from "react-native";

export function ErrorScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "red" }}>{message}</Text>
    </View>
  );
}
