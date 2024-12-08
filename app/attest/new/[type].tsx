import ActionButton from "@/components/ActionButton";
import MaterialPickerModal from "@/components/MaterialPickerModal";
import SafeAreaContent from "@/components/SafeAreaContent";
import AddMaterialModal from "@/components/forms/AddMaterialModal";
import MaterialsSelect from "@/components/forms/MaterialsSelect";
import QRTextInput from "@/components/forms/QRTextInput";
import { ACTION_SLUGS } from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function NewActionScreen() {
  const { type } = useLocalSearchParams(); // slug format

  const title = Object.keys(ACTION_SLUGS).find(
    (key) => ACTION_SLUGS[key as ActionTitle] === type
  ) as ActionTitle;

  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);
  const [selectedMaterialDetails, setSelectedMaterialDetails] = useState<{
    materialId: number;
    weight: number;
  } | null>(null);

  const handleUpdateMaterialDetails = (
    materialId: number,
    weight: number = 0
  ) => {
    setSelectedMaterials((prev) => [...prev, materialId]);
    setSelectedMaterialDetails({ materialId, weight });
  };

  const [
    isIncomingMaterialsPickerVisible,
    setIsIncomingMaterialsPickerVisible,
  ] = useState(false);

  return (
    <SafeAreaContent>
      <Link href="/home" asChild>
        <Pressable className="flex-row items-center gap-0.5 mb-4 justify-start active:translate-x-1 transition-transform duration-200 ease-out">
          <Ionicons name="chevron-back" size={16} color="#24548b" />
          <Text className="text-sm font-dm-medium text-neutral-600">Home</Text>
        </Pressable>
      </Link>
      <ActionButton title={title} presentation="banner" />

      <View className="mt-6">
        <Text className="text-lg font-dm-medium text-neutral-600 tracking-tighter mb-2">
          Incoming materials
        </Text>
        <View className="bg-neutral-50 p-1">
          <Text className="text-sm font-dm-medium text-neutral-600 mb-1">
            Mixed Materials
          </Text>
          <View className="flex-row gap-1">
            <View className="flex-1 min-w-[100px] h-40">
              <QRTextInput value="" onChangeText={() => {}} />
            </View>
            <View className="min-w-[100px]">
              <TextInput
                inputMode="numeric"
                placeholder="Weight in kg"
                className="border-[1.5px] border-neutral-300 rounded-md"
              />
            </View>
          </View>
        </View>
        <AddMaterialModal
          isVisible={isIncomingMaterialsPickerVisible}
          onClose={() => setIsIncomingMaterialsPickerVisible(false)}
          selectedMaterials={selectedMaterials}
          setSelectedMaterials={setSelectedMaterials}
          type="incoming"
        />
        <Pressable
          className="flex-row items-center justify-center mt-2 bg-slate-300 p-3 rounded-md"
          onPress={() => setIsIncomingMaterialsPickerVisible(true)}
        >
          <Text className="text-sm font-dm-medium text-neutral-600">
            {selectedMaterials?.length > 0
              ? "Update materials"
              : "Add materials"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-6">
        <Text className="text-lg font-dm-medium text-neutral-600 tracking-tighter">
          Outgoing materials
        </Text>
        <View className="flex-row flex-wrap px-0.5 bg-slate-500">
          <View className="w-[48%] mr-1 mb-1 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out">
            <Text>Material 1</Text>
          </View>
        </View>
      </View>
    </SafeAreaContent>
  );
}
