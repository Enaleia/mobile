import { View, Text } from "react-native";

export function NoDataScreen({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{message}</Text>
    </View>
  );
}
