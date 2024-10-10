import urqlClient from "@/lib/urql";
import { Stack } from "expo-router";
import { Provider } from "urql";

export default function RootLayout() {
  return (
    <Provider value={urqlClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </Provider>
  );
}
