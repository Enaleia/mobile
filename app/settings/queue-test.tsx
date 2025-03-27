import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, QueueItemStatus, ServiceStatus, MAX_RETRIES_PER_BATCH } from "@/types/queue";
import { useBatchData } from "@/hooks/data/useBatchData";
import { ActionTitle } from "@/types/action";
import { MaterialDetail } from "@/types/material";

interface TestAction {
  name: ActionTitle;
  incomingMaterials: MaterialDetail[];
  outgoingMaterials: MaterialDetail[];
  manufacturedProducts?: {
    productName: string;
    quantity: number;
    weightPerItem: number;
  }[];
}

const TEST_ACTIONS: TestAction[] = [
  {
    name: "Fishing for litter",
    incomingMaterials: [
      { id: 1, code: "TEST1", weight: 25 },
      { id: 1, code: "TEST1", weight: 52 },
    ],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 14 }],
  },
  {
    name: "Batch",
    incomingMaterials: [{ id: 2, code: "000002", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 36 }],
  },
  {
    name: "Sorting",
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
    incomingMaterials: [{ id: 1, code: "000020", weight: 58 }],
    outgoingMaterials: [{ id: 2, code: "000002", weight: 87 }],
  },
  {
    name: "Manufacturing",
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
  const { actions: actionsData } = useBatchData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmitTestForms = async (count: number, shouldBeFailed: boolean = false, easNetworkFailure: boolean = false) => {
    try {
      if (!actionsData?.length) {
        console.error("No actions data available");
        return;
      }

      const submissions: QueueItem[] = [];
      for (let i = 0; i < count; i++) {
        const testAction = TEST_ACTIONS[i % TEST_ACTIONS.length];
        const matchingAction = actionsData.find(action => action.name === testAction.name);
        
        if (!matchingAction) {
          console.warn(`No matching action found for ${testAction.name}`);
          continue;
        }

        submissions.push({
          localId: `test-${Date.now()}-${i}`,
          status: QueueItemStatus.PENDING,
          retryCount: 0,
          date: new Date().toISOString(),
          actionId: matchingAction.id,
          actionName: matchingAction.name,
          incomingMaterials: testAction.incomingMaterials,
          outgoingMaterials: testAction.outgoingMaterials,
          manufacturing: testAction.manufacturedProducts?.[0] ? {
            product: 1, // This should be a valid product ID from your database
            quantity: testAction.manufacturedProducts[0].quantity,
            weightInKg: testAction.manufacturedProducts[0].weightPerItem,
          } : undefined,
          directus: {
            status: shouldBeFailed ? ServiceStatus.FAILED : ServiceStatus.PENDING,
            error: shouldBeFailed ? 'Test failure' : undefined
          },
          eas: {
            status: easNetworkFailure ? ServiceStatus.OFFLINE : ServiceStatus.PENDING,
            error: easNetworkFailure ? 'Network failure' : undefined
          }
        });
      }

      if (submissions.length === 0) {
        console.error("No valid test items could be created");
        return;
      }

      await updateQueueItems(submissions);
      console.log(`Added ${submissions.length} test forms to queue`);
    } catch (error) {
      console.error('Failed to add test forms:', error);
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

          <View className="h-px bg-gray-200 my-3" />

          <Text className="text-base font-dm-bold text-gray-900 mb-2">
            Failed Items Testing
          </Text>
          <Text className="text-sm text-grey-6 mb-4">
            Create test items with different failure scenarios.
          </Text>

          <Pressable
            onPress={() => handleSubmitTestForms(1, true)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-rose-500"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Create Failed Test Item"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleSubmitTestForms(1, false, true)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-amber-500"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Simulate EAS Network Failure"}
            </Text>
          </Pressable>
        </View>

        {result && (
          <Text
            className={`mt-2 text-sm ${
              result.success ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {result.message}
          </Text>
        )}
      </View>
    </SafeAreaContent>
  );
} 