import CollectionForm from "@/components/forms/CollectionForm";
import SafeAreaContent from "@/components/SafeAreaContent";
import { View } from "react-native";

export default function NewCollection() {
  return (
    <SafeAreaContent>
      <View className="flex-1 p-4">
        <CollectionForm />
      </View>
    </SafeAreaContent>
  );
}
