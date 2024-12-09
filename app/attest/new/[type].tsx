import ActionButton from "@/components/ActionButton";
import SafeAreaContent from "@/components/SafeAreaContent";
import AddMaterialModal from "@/components/forms/AddMaterialModal";
import { ACTION_SLUGS } from "@/constants/action";
import { MATERIAL_ID_TO_NAME } from "@/constants/material";
import { ActionTitle } from "@/types/action";
import { MaterialDetails } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NewActionScreen() {
  const { type } = useLocalSearchParams(); // slug format

  const title = Object.keys(ACTION_SLUGS).find(
    (key) => ACTION_SLUGS[key as ActionTitle] === type
  ) as ActionTitle;

  const [selectedIncomingMaterialDetails, setSelectedIncomingMaterialDetails] =
    useState<MaterialDetails>({});

  const [selectedOutgoingMaterialDetails, setSelectedOutgoingMaterialDetails] =
    useState<MaterialDetails>({});

  const [
    isIncomingMaterialsPickerVisible,
    setIsIncomingMaterialsPickerVisible,
  ] = useState(false);

  const [
    isOutgoingMaterialsPickerVisible,
    setIsOutgoingMaterialsPickerVisible,
  ] = useState(false);

  // TODO: Add a button to save the action
  // TODO: Refactor incoming and outgoing materials to be the same component
  return (
    <SafeAreaContent>
      <Link href="/home" asChild>
        <Pressable className="flex-row items-center gap-0.5 mb-4 justify-start active:translate-x-1 transition-transform duration-200 ease-out">
          <Ionicons name="chevron-back" size={16} color="#24548b" />
          <Text className="text-sm font-dm-medium text-neutral-600">Home</Text>
        </Pressable>
      </Link>
      <ActionButton title={title} presentation="banner" />
      <View className="flex-1 py-1 shadow-inner">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 0, paddingBottom: 20 }}
        >
          <View className="mt-6">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-base font-dm-medium text-slate-600 tracking-tighter mb-2">
                Incoming materials
              </Text>
              <Text className="text-sm font-dm-medium text-slate-600 tracking-tighter bg-slate-200 px-1 py-0.5 rounded-full min-w-6 min-h-6 flex-row items-center justify-center">
                {Object.keys(selectedIncomingMaterialDetails).length}
              </Text>
            </View>
            <View className="flex-col items-center justify-center max-h-[300px]">
              {Object.keys(selectedIncomingMaterialDetails).length > 0 ? (
                <ScrollView className="w-full rounded-lg overflow-clip border-[1.5px] border-slate-200">
                  {Object.entries(selectedIncomingMaterialDetails).map(
                    ([materialId, { weight, code }]) => (
                      <View
                        key={materialId}
                        className="border-b-[1.5px] last-of-type:border-b-0 border-slate-200"
                      >
                        <View className="bg-slate-50 w-full">
                          <Text className="text-base font-dm-bold tracking-tight text-slate-950 bg-slate-50 px-3 py-2">
                            {MATERIAL_ID_TO_NAME[materialId]}
                          </Text>
                          <View className="flex-row justify-between px-3 pb-2">
                            {weight && (
                              <View className="flex-row items-center justify-center space-x-1">
                                <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                                  <Ionicons
                                    name="scale-outline"
                                    size={14}
                                    color="#24548b"
                                  />
                                </View>
                                <View className="flex-row items-baseline gap-1">
                                  <Text className="text-sm font-dm-medium text-slate-500">
                                    {weight}
                                  </Text>
                                  <Text className="text-xs font-dm-medium text-slate-500">
                                    kg
                                  </Text>
                                </View>
                              </View>
                            )}
                            {code && (
                              <View className="flex-row items-center justify-center gap-1">
                                <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                                  <Ionicons
                                    name="barcode-outline"
                                    size={14}
                                    color="#24548b"
                                  />
                                </View>
                                <Text className="font-mono text-sm text-slate-500 bg-slate-200 px-1 py-0.5 rounded-md">
                                  {code}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="py-1 bg-slate-50" />
                      </View>
                    )
                  )}
                </ScrollView>
              ) : null}
            </View>
            <AddMaterialModal
              isVisible={isIncomingMaterialsPickerVisible}
              onClose={() => setIsIncomingMaterialsPickerVisible(false)}
              selectedMaterials={selectedIncomingMaterialDetails}
              setSelectedMaterials={setSelectedIncomingMaterialDetails}
              type="incoming"
            />
            <Pressable
              className="flex-row items-center justify-center mt-2 bg-slate-200 px-3 py-2 rounded-md"
              onPress={() => setIsIncomingMaterialsPickerVisible(true)}
            >
              <Text className="text-base font-dm-medium text-slate-700 tracking-tight">
                {Object.keys(selectedIncomingMaterialDetails).length > 0
                  ? "Update incoming materials"
                  : "Add incoming materials"}
              </Text>
            </Pressable>
          </View>

          <View className="h-px bg-slate-300 my-8" />

          <View className="">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-base font-dm-medium text-slate-600 tracking-tighter mb-2">
                Outgoing materials
              </Text>
              <Text className="text-sm font-dm-medium text-slate-600 tracking-tighter bg-slate-200 px-1 py-0.5 rounded-full min-w-6 min-h-6 flex-row items-center justify-center">
                {Object.keys(selectedOutgoingMaterialDetails).length}
              </Text>
            </View>
            <View className="flex-col items-center justify-center max-h-[300px]">
              {Object.keys(selectedOutgoingMaterialDetails).length > 0 ? (
                <ScrollView className="w-full rounded-lg overflow-clip border-[1.5px] border-slate-200">
                  {Object.entries(selectedOutgoingMaterialDetails).map(
                    ([materialId, { weight, code }]) => (
                      <View
                        key={materialId}
                        className="border-b-[1.5px] last-of-type:border-b-0 border-slate-200"
                      >
                        <View className="bg-slate-50 w-full">
                          <Text className="text-base font-dm-bold tracking-tight text-slate-950 bg-slate-50 px-3 py-2">
                            {MATERIAL_ID_TO_NAME[materialId]}
                          </Text>
                          <View className="flex-row justify-between px-3 pb-2">
                            {weight && (
                              <View className="flex-row items-center justify-center space-x-1">
                                <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                                  <Ionicons
                                    name="scale-outline"
                                    size={14}
                                    color="#24548b"
                                  />
                                </View>
                                <View className="flex-row items-baseline gap-1">
                                  <Text className="text-sm font-dm-medium text-slate-500">
                                    {weight}
                                  </Text>
                                  <Text className="text-xs font-dm-medium text-slate-500">
                                    kg
                                  </Text>
                                </View>
                              </View>
                            )}
                            {code && (
                              <View className="flex-row items-center justify-center gap-1">
                                <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                                  <Ionicons
                                    name="barcode-outline"
                                    size={14}
                                    color="#24548b"
                                  />
                                </View>
                                <Text className="font-mono text-sm text-slate-500 bg-slate-200 px-1 py-0.5 rounded-md">
                                  {code}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View className="py-1 bg-slate-50" />
                      </View>
                    )
                  )}
                </ScrollView>
              ) : null}
            </View>
            <AddMaterialModal
              isVisible={isOutgoingMaterialsPickerVisible}
              onClose={() => setIsOutgoingMaterialsPickerVisible(false)}
              selectedMaterials={selectedOutgoingMaterialDetails}
              setSelectedMaterials={setSelectedOutgoingMaterialDetails}
              type="outgoing"
            />
            <Pressable
              className="flex-row items-center justify-center mt-2 bg-slate-200 px-3 py-2 rounded-md"
              onPress={() => setIsOutgoingMaterialsPickerVisible(true)}
            >
              <Text className="text-base font-dm-medium text-slate-700 tracking-tight">
                {Object.keys(selectedOutgoingMaterialDetails).length > 0
                  ? "Update outgoing materials"
                  : "Add outgoing materials"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaContent>
  );
}
