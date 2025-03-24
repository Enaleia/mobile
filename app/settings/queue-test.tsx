import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";

const TEST_ACTIONS = [
  {
    name: "Fishing for litter",
    actionId: 1,
    incomingMaterials: [
      { id: 1, code: "TEST1", weight: 25 },
      { id: 1, code: "TEST1", weight: 52 },
    ],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 14 }],
  },
  {
    name: "Batch",
    actionId: 2,
    incomingMaterials: [{ id: 2, code: "000002", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 36 }],
  },
  {
    name: "Sorting",
    actionId: 3,
    incomingMaterials: [
      { id: 1, code: "000020", weight: 25 },
      { id: 2, code: "000002", weight: 87 },
    ],
    outgoingMaterials: [
      { id: 2, code: "000002", weight: 85 },
      { id: 1, code: "000020", weight: 79 },
    ],
  },
  {
    name: "Shredding",
    actionId: 4,
    incomingMaterials: [{ id: 1, code: "000020", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 87 }],
  },
  {
    name: "Manufacturing",
    actionId: 5,
    incomingMaterials: [{ id: 1, code: "000020", weight: 24 }],
    outgoingMaterials: [],
    manufacturedProducts: [
      {
        productName: "Nelo 400 Kayak",
        quantity: 45,
        weightPerItem: 17,
      },
    ],
  },
];

export default function QueueTestScreen() {
  const { updateQueueItems } = useQueue();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmitTestForms = async (count: number) => {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Create the specified number of items by duplicating the test actions
      const submissions: QueueItem[] = Array(count).fill(null).map((_, index) => {
        const action = TEST_ACTIONS[index % TEST_ACTIONS.length];
        // Generate random data for each submission
        const randomWeight = Math.floor(Math.random() * 100) + 1;
        const randomQuantity = Math.floor(Math.random() * 50) + 1;
        const randomCode = Math.floor(Math.random() * 1000).toString().padStart(6, '0');
        
        return {
          localId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: QueueItemStatus.PENDING,
          retryCount: 0,
          date: new Date().toISOString(),
          actionId: action.actionId,
          actionName: `${index + 1} - ${action.name}`, // Add count prefix
          incomingMaterials: action.incomingMaterials.map(material => ({
            ...material,
            weight: randomWeight,
            code: randomCode,
          })),
          outgoingMaterials: action.outgoingMaterials.map(material => ({
            ...material,
            weight: randomWeight,
            code: randomCode,
          })),
          manufacturedProducts: action.manufacturedProducts?.map(product => ({
            ...product,
            quantity: randomQuantity,
            weightPerItem: randomWeight,
          })),
          directus: {
            status: ServiceStatus.PENDING,
          },
          eas: {
            status: ServiceStatus.PENDING,
          },
        };
      });

      await updateQueueItems(submissions);

      setResult({
        success: true,
        message: `Successfully added ${submissions.length} test form${submissions.length === 1 ? '' : 's'} to the queue`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to submit test forms",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaContent>
      <View className="flex-row items-center justify-start pb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
          <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
            Settings
          </Text>
        </Pressable>
      </View>

      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        Queue Testing
      </Text>

      <View className="mt-6">
        <Text className="text-base font-dm-bold text-gray-900 mb-2">
          Test Actions
        </Text>
        <Text className="text-sm text-grey-6 mb-4">
          Submit test forms with different actions to the queue for testing purposes.
        </Text>

        <View className="space-y-3">
          <Pressable
            onPress={() => handleSubmitTestForms(1)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-blue-ocean"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Submit 1 Test Form"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSubmitTestForms(3)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-blue-ocean"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Submit 3 Test Forms"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSubmitTestForms(5)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-blue-ocean"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Submit 5 Test Forms"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSubmitTestForms(10)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-blue-ocean"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Submit 10 Test Forms"}
            </Text>
          </Pressable>
        </View>

        {result && (
          <Text
            className={`mt-2 text-sm ${
              result.success ? "text-green-500" : "text-red-500"
            }`}
          >
            {result.message}
          </Text>
        )}
      </View>
    </SafeAreaContent>
  );
} 