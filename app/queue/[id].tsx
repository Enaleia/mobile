import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem } from "@/types/queue";
import { useBatchData } from "@/hooks/data/useBatchData";
import { MaterialDetail, processMaterials } from "@/types/material";
import MaterialSection from "@/components/features/attest/MaterialSection";
import SelectField from "@/components/shared/SelectField";
import DecimalInput from "@/components/shared/DecimalInput";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import { useMemo } from "react";

export default function QueueItemDetails() {
  const { id } = useLocalSearchParams();
  const { queueItems } = useQueue();
  const [item, setItem] = useState<QueueItem | null>(null);
  const { materials: materialsData, products: productsData, actions: actionsData } = useBatchData();

  const processedMaterials = useMemo(() => {
    if (!materialsData) return undefined;
    return processMaterials(materialsData);
  }, [materialsData]);

  useEffect(() => {
    const foundItem = queueItems.find(i => i.localId === id);
    if (foundItem) {
      setItem(foundItem);
    }
  }, [id, queueItems]);

  if (!item) {
    return (
      <SafeAreaContent>
        <View className="flex-1 items-center justify-center">
          <Text>Item not found</Text>
        </View>
      </SafeAreaContent>
    );
  }

  const currentAction = actionsData?.find(action => action.id === item.actionId);

  return (
    <SafeAreaContent>
      <View className="flex-row items-center justify-between pb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
          <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
            Back
          </Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 0,
            paddingBottom: 100,
          }}
        >
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            {currentAction?.name}
          </Text>

          <View className="flex-1">
            {currentAction?.category === "Collection" && (
              <View className="mb-12">
                <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                  Collector
                </Text>
                <View className="border-[1.5px] border-grey-3 rounded-2xl p-3 bg-white opacity-50">
                  <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                    Collector ID
                  </Text>
                  <Text className="text-xl font-dm-bold tracking-tighter text-enaleia-black">
                    {item.collectorId || "No collector ID"}
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-8">
              <MaterialSection
                materials={processedMaterials}
                category="incoming"
                isModalVisible={false}
                setModalVisible={() => {}}
                selectedMaterials={item.incomingMaterials || []}
                setSelectedMaterials={() => {}}
                hideCodeInput={currentAction?.category === "Collection"}
                disabled={true}
              />
            </View>

            {currentAction?.name !== "Manufacturing" && (
              <View className="mb-8 mt-8">
                <MaterialSection
                  materials={processedMaterials}
                  category="outgoing"
                  isModalVisible={false}
                  setModalVisible={() => {}}
                  selectedMaterials={item.outgoingMaterials || []}
                  setSelectedMaterials={() => {}}
                  hideCodeInput={false}
                  disabled={true}
                />
              </View>
            )}

            {currentAction?.name === "Manufacturing" && (
              <View className="mt-4">
                <View className="flex-row items-center mb-4">
                  <Text className="text-xl font-dm-regular text-enaleia-black tracking-tighter">
                    Manufacturing information
                  </Text>
                  <View className="ml-2">
                    <Ionicons name="cube-outline" size={24} color="#0D0D0D" />
                  </View>
                </View>

                <View className="space-y-2">
                  <View className="border-[1.5px] border-grey-3 rounded-2xl p-3 bg-white opacity-50">
                    <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                      Product
                    </Text>
                    <Text className="text-xl font-dm-bold tracking-tighter text-enaleia-black">
                      {productsData?.find(p => p.product_id === item.manufacturing?.product)?.product_name || "No product selected"}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1">
                      <View className="border-[1.5px] border-grey-3 rounded-2xl p-3 bg-white opacity-50">
                        <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                          Batch Quantity
                        </Text>
                        <Text className="text-xl font-dm-bold tracking-tighter text-enaleia-black">
                          {item.manufacturing?.quantity || "0"} Unit
                        </Text>
                      </View>
                    </View>

                    <View className="flex-1">
                      <View className="border-[1.5px] border-grey-3 rounded-2xl p-3 bg-white opacity-50">
                        <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                          Weight per item
                        </Text>
                        <Text className="text-xl font-dm-bold tracking-tighter text-enaleia-black">
                          {item.manufacturing?.weightInKg || "0"} kg
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaContent>
  );
} 