import SafeAreaContent from "@/components/SafeAreaContent";
import { useCreateAccountKeys } from "@/hooks/useCreateAccountKeys";
import { Pressable, Text } from "react-native";

export default function Attestations() {
  const { accountKeys, generateKeys } = useCreateAccountKeys();
  return (
    <SafeAreaContent>
      <Text>Attestations</Text>
      <Pressable onPress={generateKeys}>
        <Text>Generate Keys</Text>
      </Pressable>
      {accountKeys && <Text>{accountKeys.mnemonic.join(" ")}</Text>}
    </SafeAreaContent>
  );
}
