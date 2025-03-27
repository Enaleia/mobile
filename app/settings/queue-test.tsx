import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, QueueItemStatus, ServiceStatus, MAX_RETRIES_PER_BATCH, MAX_RETRY_AGE, RETRY_COOLDOWN } from "@/types/queue";

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

  const handleSubmitTestForms = async (count: number, shouldBeFailed: boolean = false, easNetworkFailure: boolean = false, nearlyFailed: boolean = false) => {
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
        
        // Calculate dates for different scenarios
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
        
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

        const lastAttemptTime = new Date(sixDaysAgo);
        lastAttemptTime.setHours(lastAttemptTime.getHours() - 2); // Last attempt was 2 hours after initial creation
        
        if (nearlyFailed) {
          // Create an item that's almost at the complete failure state (2 minutes left)
          const almostSevenDays = new Date();
          // Set to 6 days, 23 hours, and 58 minutes ago
          almostSevenDays.setDate(almostSevenDays.getDate() - 6);
          almostSevenDays.setHours(almostSevenDays.getHours() - 23);
          almostSevenDays.setMinutes(almostSevenDays.getMinutes() - 58);

          const lastAttemptTime = new Date();
          lastAttemptTime.setMinutes(lastAttemptTime.getMinutes() - 21); // Last attempt was 21 minutes ago

          // Calculate remaining time until complete failure (should be ~2 minutes)
          const timeUntilFailure = MAX_RETRY_AGE - (Date.now() - almostSevenDays.getTime());
          const remainingMinutes = Math.floor(timeUntilFailure / (60 * 1000));

          return {
            localId: `nearly-failed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: QueueItemStatus.FAILED,
            retryCount: MAX_RETRIES_PER_BATCH + 15, // Had many slow mode retries
            date: almostSevenDays.toISOString(),
            actionId: action.actionId,
            actionName: `Nearly Failed (502) - ${action.name} - ${remainingMinutes}min left`,
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
              status: ServiceStatus.COMPLETED,
              eventId: Math.floor(Math.random() * 1000) + 1, // Simulate successful Directus event
              linked: false,
              lastAttempt: lastAttemptTime
            },
            eas: {
              status: ServiceStatus.FAILED,
              error: "Server Error: 502 Bad Gateway - Network error occurred while connecting to EAS service",
              lastAttempt: lastAttemptTime
            },
            lastAttempt: lastAttemptTime,
            enteredSlowModeAt: almostSevenDays, // Entered slow mode almost 7 days ago
            initialRetryCount: MAX_RETRIES_PER_BATCH, // Used all initial retries
            slowRetryCount: 15 // Had many slow mode retries
          };
        }
        
        if (easNetworkFailure) {
          // Create an item where Directus succeeds but EAS fails due to network
          return {
            localId: `eas-network-fail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: QueueItemStatus.FAILED,
            retryCount: 1,
            date: new Date().toISOString(),
            actionId: action.actionId,
            actionName: `EAS Network Fail - ${action.name}`,
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
              status: ServiceStatus.COMPLETED,
              eventId: Math.floor(Math.random() * 1000) + 1, // Simulate successful Directus event
              linked: false
            },
            eas: {
              status: ServiceStatus.FAILED,
              error: "Network error: Unable to reach EAS service",
              lastAttempt: new Date()
            },
            lastAttempt: new Date(),
            initialRetryCount: 1
          };
        }
        
        if (!shouldBeFailed) {
          return {
            localId: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: QueueItemStatus.PENDING,
            retryCount: 0,
            date: new Date().toISOString(),
            actionId: action.actionId,
            actionName: `${index + 1} - ${action.name}`,
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
            }
          };
        }
        // Create a completely failed item
        return {
          localId: `failed-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: QueueItemStatus.FAILED,
          retryCount: MAX_RETRIES_PER_BATCH,
          date: eightDaysAgo.toISOString(),
          actionId: action.actionId,
          actionName: `Failed - ${action.name}`,
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
            status: ServiceStatus.FAILED,
            error: "Test error: Service failed after all retries",
            lastAttempt: eightDaysAgo
          },
          eas: {
            status: ServiceStatus.FAILED,
            error: "Test error: Service failed after all retries",
            lastAttempt: eightDaysAgo
          },
          enteredSlowModeAt: eightDaysAgo,
          lastAttempt: eightDaysAgo,
          initialRetryCount: MAX_RETRIES_PER_BATCH,
          slowRetryCount: Math.floor(MAX_RETRY_AGE / RETRY_COOLDOWN)
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
    }
    setIsSubmitting(false);
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

          <Pressable
            onPress={() => handleSubmitTestForms(1, false, false, true)}
            disabled={isSubmitting}
            className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
              isSubmitting ? "bg-primary-dark-blue opacity-50" : "bg-red-600"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" className="mr-2" />
            ) : null}
            <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
              {isSubmitting ? "Preparing..." : "Create Nearly Failed Item (502)"}
            </Text>
            <Text className="text-xs font-dm-medium text-slate-50 ml-1">
              (2min left)
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