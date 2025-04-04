import { View, Text, Pressable, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, QueueItemStatus, ServiceStatus, MAX_RETRIES } from "@/types/queue";
import { getActiveQueue, updateActiveQueue } from "@/utils/queueStorage"; // Import storage functions

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
  const [isClearingActive, setIsClearingActive] = useState(false);
  const [isClearingFailed, setIsClearingFailed] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [testFormCount, setTestFormCount] = useState(0);
  const [failedItemCount, setFailedItemCount] = useState(0);

  const handleSubmitTestForms = async (count: number, shouldBeFailed: boolean = false) => {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Create the specified number of items with random actions
      const submissions: QueueItem[] = Array(count).fill(null).map((_, index) => {
        // Randomly select an action from TEST_ACTIONS
        const randomActionIndex = Math.floor(Math.random() * TEST_ACTIONS.length);
        const action = TEST_ACTIONS[randomActionIndex];
        
        // Generate random data for each submission
        const randomWeight = Math.floor(Math.random() * 100) + 1;
        const randomQuantity = Math.floor(Math.random() * 50) + 1;
        const randomCode = Math.floor(Math.random() * 1000).toString().padStart(6, '0');
        
        // Calculate a date 8 days ago for failed items (exceeding 7 day retry window)
        const eightDaysAgo = new Date();
        eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
        
        if (!shouldBeFailed) {
          return {
            localId: `test-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            status: QueueItemStatus.PENDING,
            totalRetryCount: 0,
            date: new Date().toISOString(),
            actionId: action.actionId,
            actionName: `${action.name} #${index + 1}`,
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
              status: ServiceStatus.INCOMPLETE,
            },
            eas: {
              status: ServiceStatus.INCOMPLETE,
            },
            linking: {
              status: ServiceStatus.INCOMPLETE,
            }
          };
        } else {
          // Create a completely failed item
          return {
            localId: `failed-test-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            status: QueueItemStatus.FAILED,
            totalRetryCount: MAX_RETRIES,
            date: eightDaysAgo.toISOString(),
            lastAttempt: eightDaysAgo.toISOString(),
            actionId: action.actionId,
            actionName: `Failed ${action.name} #${index + 1}`,
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
              status: ServiceStatus.INCOMPLETE,
              error: "Test error: Service failed after all retries",
              lastAttempt: eightDaysAgo
            },
            eas: {
              status: ServiceStatus.INCOMPLETE,
              error: "Test error: Service failed after all retries",
              lastAttempt: eightDaysAgo
            },
            linking: {
              status: ServiceStatus.INCOMPLETE,
              error: "Test error: Service failed after all retries",
              lastAttempt: eightDaysAgo
            }
          };
        }
      });

      await updateQueueItems(submissions);

      if (shouldBeFailed) {
        setFailedItemCount(prev => prev + count);
      } else {
        setTestFormCount(prev => prev + count);
      }

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

  const handleClearActive = async () => {
    setIsClearingActive(true);
    setResult(null);
    try {
      const activeQueue = await getActiveQueue();
      const itemsToKeep = activeQueue.filter(
        item => item.status !== QueueItemStatus.PENDING && item.status !== QueueItemStatus.PROCESSING
      );
      await updateActiveQueue(itemsToKeep);
      setResult({ success: true, message: "Cleared all PENDING and PROCESSING items from the active queue." });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Failed to clear active items" });
    } finally {
      setIsClearingActive(false);
    }
  };

  const handleClearFailed = async () => {
    setIsClearingFailed(true);
    setResult(null);
    try {
      const activeQueue = await getActiveQueue();
      const itemsToKeep = activeQueue.filter(item => item.status !== QueueItemStatus.FAILED);
      await updateActiveQueue(itemsToKeep);
      setResult({ success: true, message: "Cleared all FAILED items from the active queue." });
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Failed to clear failed items" });
    } finally {
      setIsClearingFailed(false);
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
            className="bg-blue-500 p-4 rounded-full"
          >
            <Text className="text-white text-center font-dm-bold">
              Submit Test Form ({testFormCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              const submissions: QueueItem[] = [{
                localId: `test-${Date.now()}-0-${Math.random().toString(36).substr(2, 9)}`,
                status: QueueItemStatus.FAILED,
                totalRetryCount: MAX_RETRIES + 1,
                date: new Date().toISOString(),
                actionId: TEST_ACTIONS[0].actionId,
                incomingMaterials: TEST_ACTIONS[0].incomingMaterials.map(material => ({
                  ...material,
                  weight: 100,
                  code: "TEST123",
                })),
                outgoingMaterials: TEST_ACTIONS[0].outgoingMaterials.map(material => ({
                  ...material,
                  weight: 100,
                  code: "TEST123",
                })),
                directus: {
                  status: ServiceStatus.INCOMPLETE,
                  error: "Max retries exceeded"
                },
                eas: {
                  status: ServiceStatus.INCOMPLETE,
                  error: "Max retries exceeded"
                },
                linking: {
                  status: ServiceStatus.INCOMPLETE,
                  error: "Max retries exceeded"
                }
              }];
              updateQueueItems(submissions);
              setFailedItemCount(prev => prev + 1);
              setResult({
                success: true,
                message: "Successfully added 1 failed item to the queue",
              });
            }}
            className="bg-red-500 p-4 rounded-full"
          >
            <Text className="text-white text-center font-dm-bold">
              Generate Failed Item ({failedItemCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClearActive}
            disabled={isClearingActive || isSubmitting || isClearingFailed}
            className={`p-4 rounded-full ${isClearingActive ? 'bg-yellow-300' : 'bg-yellow-500'} ${ (isClearingActive || isSubmitting || isClearingFailed) ? 'opacity-50' : ''}`}
          >
            {isClearingActive ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-dm-bold">
                Clear Active (Pending/Processing)
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleClearFailed}
            disabled={isClearingFailed || isSubmitting || isClearingActive}
            className={`p-4 rounded-full ${isClearingFailed ? 'bg-red-300' : 'bg-red-500'} ${(isClearingFailed || isSubmitting || isClearingActive) ? 'opacity-50' : ''}`}
          >
            {isClearingFailed ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-center font-dm-bold">
                Clear Failed Items
              </Text>
            )}
          </Pressable>

          {result && (
            <View className={`p-4 rounded-full ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-center ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </Text>
            </View>
          )}

          <View className="mt-8 pt-4 border-t border-gray-200">
            <Text className="text-base font-dm-bold text-gray-900 mb-2">
              Health Check URLs
            </Text>
            <View className="space-y-2">
              <Text className="text-sm text-grey-6">
                Directus: {process.env.EXPO_PUBLIC_API_URL}/server/health
              </Text>
              <Text className="text-sm text-grey-6">
                EAS Provider (RPC): {process.env.EXPO_PUBLIC_NETWORK_PROVIDER}
              </Text>
              <Text className="text-sm text-grey-6">
                EAS Scan Service: {process.env.EXPO_PUBLIC_NETWORK_SCAN}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaContent>
  );
}