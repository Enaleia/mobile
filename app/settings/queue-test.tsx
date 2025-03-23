import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { useState } from "react";
import { useBatchData } from "@/hooks/data/useBatchData";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { LocationData } from "@/services/locationService";
import { MaterialDetail } from "@/types/material";
import { v4 as uuidv4 } from "uuid";

const QueueTestScreen = () => {
  const { updateQueueItems } = useQueue();
  const { data: userData } = useUserInfo();
  const { data: locationData } = useCurrentLocation();
  const { actions: actionsData } = useBatchData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const generateQRCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateWeight = () => {
    return Math.floor(1000 + Math.random() * 14000) / 1000; // Random weight between 1-15 kg
  };

  const generateTestSubmission = (actionName: string): QueueItem => {
    const action = actionsData?.find(a => a.name === actionName);
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    const queueItem: QueueItem = {
      localId: uuidv4(),
      date: new Date().toISOString(),
      status: QueueItemStatus.PENDING,
      retryCount: 0,
      actionId: action.id,
      actionName: action.name,
      directus: {
        status: ServiceStatus.PENDING,
      },
      eas: {
        status: ServiceStatus.PENDING,
        verified: false,
      },
      company: typeof userData?.Company === "number" ? undefined : userData?.Company?.id,
      location: locationData as LocationData,
      incomingMaterials: [],
      outgoingMaterials: [],
    };

    // Add materials based on action type
    switch (actionName) {
      case "Fishing for litter":
        queueItem.incomingMaterials = [{
          id: 1,
          weight: generateWeight(),
          code: "TEST1",
        }];
        break;

      case "Manufacturing":
        const quantity = Math.floor(5 + Math.random() * 95);
        const weightPerItem = Math.floor(1 + Math.random() * 49) / 10;
        queueItem.incomingMaterials = [{
          id: 2,
          weight: quantity * weightPerItem,
          code: generateQRCode(),
        }];
        queueItem.outgoingMaterials = [{
          id: 3,
          weight: quantity * weightPerItem,
          code: generateQRCode(),
        }];
        queueItem.manufacturing = {
          quantity: quantity,
          weightInKg: weightPerItem,
          product: 1, // Default to first product
        };
        break;

      case "Shredding":
        const inputWeight = generateWeight();
        queueItem.incomingMaterials = [{
          id: 4,
          weight: inputWeight,
          code: generateQRCode(),
        }];
        queueItem.outgoingMaterials = [{
          id: 5,
          weight: inputWeight * 0.95, // 5% loss in shredding
          code: generateQRCode(),
        }];
        break;

      case "Sorting":
        const totalWeight = generateWeight();
        queueItem.incomingMaterials = [{
          id: 6,
          weight: totalWeight,
          code: generateQRCode(),
        }];
        queueItem.outgoingMaterials = [
          {
            id: 7,
            weight: Math.floor(totalWeight * 0.4 * 100) / 100, // 40% recyclable
            code: generateQRCode(),
          },
          {
            id: 8,
            weight: Math.floor(totalWeight * 0.6 * 100) / 100, // 60% non-recyclable
            code: generateQRCode(),
          },
        ];
        break;

      case "Batch":
        const batchWeight = generateWeight();
        queueItem.incomingMaterials = [{
          id: 9,
          weight: batchWeight,
          code: generateQRCode(),
        }];
        queueItem.outgoingMaterials = [{
          id: 10,
          weight: Math.floor(batchWeight * 0.98 * 100) / 100, // 2% loss in batching
          code: generateQRCode(),
        }];
        break;

      default:
        // For other actions, add random materials
        queueItem.incomingMaterials = [{
          id: 11,
          weight: generateWeight(),
          code: generateQRCode(),
        }];
        queueItem.outgoingMaterials = [{
          id: 12,
          weight: generateWeight(),
          code: generateQRCode(),
        }];
    }

    return queueItem;
  };

  const generateAllTestSubmissions = async () => {
    setIsGenerating(true);
    setTestResults(null);

    try {
      if (!actionsData?.length) {
        throw new Error("No actions found");
      }

      const testItems: QueueItem[] = [];
      const actionNames = [
        "Fishing for litter",
        "Manufacturing",
        "Shredding",
        "Sorting",
        "Batch",
      ];

      // Generate 2 items for each action type
      for (const actionName of actionNames) {
        for (let i = 0; i < 2; i++) {
          const item = generateTestSubmission(actionName);
          testItems.push(item);
        }
      }

      // Update queue with all test items at once
      await updateQueueItems(testItems);

      setTestResults({
        success: true,
        message: `Successfully generated ${testItems.length} test items`,
      });
    } catch (error) {
      console.error("Error generating test submissions:", error);
      setTestResults({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate test submissions",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaContent>
      <ScrollView>
        <View className="p-4">
          <Text className="text-2xl font-dm-bold text-enaleia-black mb-4">
            Queue Testing
          </Text>

          <Pressable
            onPress={generateAllTestSubmissions}
            disabled={isGenerating}
            className={`flex-row items-center justify-center p-4 rounded-full ${
              isGenerating ? "bg-grey-6" : "bg-blue-ocean"
            }`}
          >
            {isGenerating ? (
              <Text className="text-white font-dm-medium">Generating...</Text>
            ) : (
              <Text className="text-white font-dm-medium">
                Generate Test Submissions
              </Text>
            )}
          </Pressable>

          {testResults && (
            <View
              className={`mt-4 p-4 rounded-xl ${
                testResults.success ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Text
                className={`font-dm-medium ${
                  testResults.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {testResults.message}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default QueueTestScreen; 