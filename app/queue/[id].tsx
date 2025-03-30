import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, ServiceStatus, QueueItemStatus, MAX_RETRIES, LIST_RETRY_INTERVAL } from "@/types/queue";
import { useBatchData } from "@/hooks/data/useBatchData";
import { MaterialDetail } from "@/types/material";
import { EAS_CONSTANTS } from "@/services/eas";
import { removeFromActiveQueue, removeFromAllQueues, getCompletedQueue } from "@/utils/queueStorage";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClearConfirmationModal } from "@/components/features/queue/ClearConfirmationModal";
import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import { ServiceStatusIndicator } from "@/components/features/queue/ServiceStatusIndicator";
import QueueStatusIndicator from "@/components/features/queue/QueueStatusIndicator";
import { formatDate } from "@/utils/date";

export default function QueueItemDetails() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const { queueItems, loadQueueItems, retryItem } = useQueue();
  const { materials: materialsData, products: productsData, actions: actionsData, collectors } = useBatchData();
  const { user } = useAuth();
  const [item, setItem] = useState<QueueItem | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [hasEmailedSupport, setHasEmailedSupport] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Find collector info if available
  const collectorInfo = useMemo(() => {
    if (!item?.collectorId || !collectors) return null;
    return collectors.find(c => c.collector_identity === item.collectorId);
  }, [item?.collectorId, collectors]);

  // Effect to handle delayed showing of clear button after email
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (hasEmailedSupport) {
      timeoutId = setTimeout(() => {
        setShowClearButton(true);
      }, 300);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [hasEmailedSupport]);

  useEffect(() => {
    const loadQueueItemDetails = async () => {
      try {
        setIsLoading(true);
        console.log("Loading queue item details:", {
          id,
          queueItemsCount: queueItems.length,
          availableIds: queueItems.map(i => i.localId)
        });

        // First check active queue
        let foundItem = queueItems.find(i => i.localId === id);
        
        // If not found in active queue, check completed queue
        if (!foundItem) {
          console.log("Item not found in active queue, checking completed queue...");
          const completedItems = await getCompletedQueue();
          foundItem = completedItems.find(i => i.localId === id);
        }

        console.log("Found item:", foundItem);
        setItem(foundItem || null);
      } catch (error) {
        console.error("Error loading queue item details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQueueItemDetails();
  }, [id, queueItems]);

  const handleRetry = async () => {
    if (!item) return;
    try {
      await retryItem(item.localId);
      navigation.goBack();
    } catch (error) {
      console.error("Error retrying item:", error);
      Alert.alert("Error", "Failed to retry item. Please try again.");
    }
  };

  const handleContactSupport = async () => {
    const url = "mailto:app-support@enaleia.com,enaleia@pollenlabs.org";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-grey-9 mb-2">Item not found</Text>
        <Text className="text-sm text-grey-6 text-center mb-4">
          The requested item could not be found. It may have been deleted or moved.
        </Text>
        <Pressable
          onPress={handleContactSupport}
          className="bg-enaleia-blue px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">Contact Support</Text>
        </Pressable>
      </View>
    );
  }

  const currentAction = actionsData?.find(action => action.id === item.actionId);
  if (!currentAction) {
    console.log('Action not found:', { actionId: item.actionId, availableActions: actionsData?.map(a => a.id) });
    return (
      <SafeAreaContent>
        <View className="flex-1 items-center justify-center">
          <Text>Action type not found</Text>
        </View>
      </SafeAreaContent>
    );
  }

  const timestamp = item.lastAttempt || item.date;
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  }).format(new Date(timestamp))
    .replace(/(\d+)(?=(,))/, (match) => {
      const num = parseInt(match);
      const suffix = ["th", "st", "nd", "rd"][(num % 10 > 3 || num % 100 - num % 10 == 10) ? 0 : num % 10];
      return num + suffix;
    });

  const getStatusSummary = () => {
    if (!item) return "";
    
    const hasDirectusFailed = item.directus?.status === ServiceStatus.FAILED;
    const hasEasFailed = item.eas?.status === ServiceStatus.FAILED;
    const hasLinkingFailed = item.directus?.status === ServiceStatus.COMPLETED && !item.directus?.linked;
    
    if (hasDirectusFailed || hasEasFailed || hasLinkingFailed) {
      const failures = [];
      if (hasDirectusFailed) failures.push("Database failed");
      if (hasEasFailed) failures.push("Blockchain failed");
      if (hasLinkingFailed) failures.push("Linking failed");
      return `: ${failures.join(", ")}`;
    }
    
    if (item.directus?.status === ServiceStatus.COMPLETED && 
        item.eas?.status === ServiceStatus.COMPLETED && 
        item.directus?.linked) {
      return ": Completed successfully";
    }
    
    return "";
  };

  const getStatusEmoji = (status: ServiceStatus | undefined, isLinked?: boolean) => {
    if (status === ServiceStatus.COMPLETED && isLinked) return "✅";
    if (status === ServiceStatus.FAILED) return "❌";
    if (status === ServiceStatus.PROCESSING) return "⏳";
    return "⏳";
  };

  const formatEmailBody = () => {
    if (!item || !currentAction) return "";

    const sections = [
      `Action Type: ${currentAction.name}`,
      `Status Summary:
  Database: ${item.directus?.status || "N/A"} ${getStatusEmoji(item.directus?.status)}
  Blockchain: ${item.eas?.status || "N/A"} ${getStatusEmoji(item.eas?.status)}
  Linking: ${item.directus?.linked ? "Completed" : "Pending"} ${getStatusEmoji(item.directus?.status, item.directus?.linked)}`,
      item.collectorId ? `
Collector Information:
  - ID: ${item.collectorId}
  - Name: ${collectorInfo?.collector_name || "N/A"}` : null,
      item.incomingMaterials?.length ? `
Incoming Materials:
${item.incomingMaterials.map((material, index) => {
  const materialData = materialsData?.find(m => m.material_id === material.id);
  return `
Material #${index + 1}:
  - Name: ${materialData?.material_name || "Unknown Material"}
  - Code: ${material.code || "N/A"}
  - Weight: ${material.weight} Kg`;
}).join("\n")}` : null,
      item.outgoingMaterials?.length ? `
Outgoing Materials:
${item.outgoingMaterials.map((material, index) => {
  const materialData = materialsData?.find(m => m.material_id === material.id);
  return `
Material #${index + 1}:
  - Name: ${materialData?.material_name || "Unknown Material"}
  - Code: ${material.code || "N/A"}
  - Weight: ${material.weight} Kg`;
}).join("\n")}` : null,
      item.manufacturing ? `
Manufacturing Details:
  - Product: ${productsData?.find(p => p.product_id === item.manufacturing?.product)?.product_name || "N/A"}
  - Batch Quantity: ${item.manufacturing.quantity || "N/A"} Unit
  - Weight per item: ${item.manufacturing.weightInKg || "N/A"} Kg` : null,
      `
Other Details:
  - Created Date: ${formattedTime}
  - Location: ${item.location?.coords ? `${item.location.coords.latitude}, ${item.location.coords.longitude}` : "N/A"}
  - Attestation UID: ${item.eas?.txHash || "N/A"}`,
      (item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) ? `
Error:
${[
  item.directus?.error ? `  - Database: ${item.directus.error}` : null,
  item.eas?.error ? `  - Blockchain: ${item.eas.error}` : null,
  item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked ? `  - Linking: Failed to link attestation with database` : null
].filter(Boolean).join("\n")}` : null
    ].filter(Boolean).join("\n\n");

    return sections;
  };

  const handleEmail = async () => {
    const emailBody = formatEmailBody();
    const subject = `Attestation Details - ${currentAction?.name}${getStatusSummary()}`;
    const url = `mailto:app-support@enaleia.com,enaleia@pollenlabs.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setHasEmailedSupport(true);
      } else {
        Alert.alert(
          "Error", 
          "Could not open email client. Please make sure you have an email app installed."
        );
      }
    } catch (error) {
      console.error('Error opening email client:', error);
      Alert.alert(
        "Error",
        "Failed to open email client. Please try again later."
      );
    }
  };

  const handleClear = async () => {
    setShowClearModal(true);
  };

  const confirmClear = async () => {
    try {
      await removeFromAllQueues(item.localId);
      await loadQueueItems(); // Refresh the queue items
      setShowClearModal(false);
      router.back();
    } catch (error) {
      console.error("Error clearing item:", error);
      Alert.alert(
        "Error",
        "Failed to clear the item. Please try again."
      );
    }
  };

  const canClear = item.status === QueueItemStatus.FAILED && 
                   item.directus?.status === ServiceStatus.FAILED && 
                   item.eas?.status === ServiceStatus.FAILED;

  const isCompleted = item.status === QueueItemStatus.COMPLETED;
  const hasFailed = item.status === QueueItemStatus.FAILED || item.totalRetryCount >= MAX_RETRIES;
  const canRetry = !isCompleted && !hasFailed;

  return (
    <SafeAreaContent>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Queue Item Details
          </Text>
        </View>

        {item && (
          <View className="flex-1 py-4">
            <View className="flex-row items-center justify-between pt-2 pb-4">
              <Pressable className="flex-row items-center space-x-1"
                onPress={() => router.back()}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color="#0D0D0D" />
                <Text className="text-base font-dm-regular text-enaleia-black">
                  Attestation detail
                </Text>
              </Pressable>
            </View>

            <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4 mt-4">
              {currentAction?.name || 'Unknown Action'}
            </Text>

            {/* Collector Section */}
            {collectorInfo && (
              <View className="mb-8">
                <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                  Collector
                </Text>
                <View className="border border-grey-3 rounded-2xl">
                  <View className="p-4 py-3 border-b border-grey-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Collector ID
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {item.collectorId || 'N/A'}
                    </Text>
                  </View>
                  <View className="p-4 py-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Name
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {collectorInfo.collector_name || "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Incoming Materials Section */}
            {item.incomingMaterials && item.incomingMaterials.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-2">
                  <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter">
                    Incoming
                  </Text>
                  <View style={{ transform: [{ rotateZ: '-45deg' }] }}>
                    <Ionicons 
                      name="arrow-down" 
                      size={24} 
                      color="#8E8E93" 
                    />
                  </View>
                </View>
                
                {item.incomingMaterials.map((material, index) => {
                  const materialData = materialsData?.find(m => m.material_id === material.id);
                  return (
                    <View key={index} className="mb-4">
                      <Text className="text-xl font-dm-bold text-enaleia-black mb-2">
                        {materialData?.material_name || "Unknown Material"}
                      </Text>
                      <View className="border border-grey-3 rounded-2xl">
                        <View className="flex-row">
                          <View className="flex-1 p-4 py-3 border-r border-grey-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Code
                            </Text>
                            <Text className="text-xl font-dm-bold text-enaleia-black">
                              {material.code || "N/A"}
                            </Text>
                          </View>
                          <View className="flex-1 p-4 py-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Weight
                            </Text>
                            <View className="flex-row items-baseline">
                              <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                                {material.weight || "-"}
                              </Text>
                              <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                                Kg
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Outgoing Materials Section */}
            {item.outgoingMaterials && item.outgoingMaterials.length > 0 && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-2">
                  <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter">
                    Outgoing
                  </Text>
                  <View style={{ transform: [{ rotateZ: '45deg' }] }}>
                    <Ionicons 
                      name="arrow-up" 
                      size={24} 
                      color="#8E8E93" 
                    />
                  </View>
                </View>
                
                {item.outgoingMaterials.map((material, index) => {
                  const materialData = materialsData?.find(m => m.material_id === material.id);
                  return (
                    <View key={index} className="mb-4">
                      <Text className="text-xl font-dm-bold text-enaleia-black mb-2">
                        {materialData?.material_name || "Unknown Material"}
                      </Text>
                      <View className="border border-grey-3 rounded-2xl">
                        <View className="flex-row">
                          <View className="flex-1 p-4 py-3 border-r border-grey-3">
                            <Text className="text-sm font-dm-bold text-grey-6">
                              Code
                            </Text>
                            <Text className="text-xl font-dm-bold text-enaleia-black">
                              {material.code || "N/A"}
                            </Text>
                          </View>
                          <View className="flex-1 p-4 py-3">
                            <Text className="text-sm font-dm-bold text-grey-6 flex-1">
                              Weight
                            </Text>
                            <View className="flex-row items-baseline">
                              <Text className="text-xl font-dm-bold text-enaleia-black">
                                {material.weight || "-"}
                              </Text>
                              <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                                Kg
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Manufacturing Section */}
            {currentAction?.name === "Manufacturing" && (
              <View className="mb-8">
                <View className="flex-row items-center gap-1 mb-4">
                  <Text className="text-[20px] font-dm-light text-enaleia-black tracking-tighter">
                    Manufacturing
                  </Text>
                  <Ionicons name="cube-outline" size={24} color="#8E8E93" />
                </View>
                
                <View className="border border-grey-3 rounded-2xl">
                  <View className="p-4 py-3 border-b border-grey-3">
                    <Text className="text-sm font-dm-bold text-grey-6">
                      Product
                    </Text>
                    <Text className="text-xl font-dm-bold text-enaleia-black">
                      {productsData?.find(p => p.product_id === item.manufacturing?.product)?.product_name || "No product selected"}
                    </Text>
                  </View>
                  <View className="flex-row">
                    <View className="flex-1 p-4 py-3 border-r border-grey-3">
                      <Text className="text-sm font-dm-bold text-grey-6">
                        Batch Quantity
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                          {item.manufacturing?.quantity || "0"}
                        </Text>
                        <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                          Unit
                        </Text>
                      </View>
                    </View>
                    <View className="flex-1 p-4 py-3">
                      <Text className="text-sm font-dm-bold text-grey-6">
                        Weight per item
                      </Text>
                      <View className="flex-row items-baseline">
                        <Text className="text-xl font-dm-bold text-enaleia-black flex-1">
                          {item.manufacturing?.weightInKg || "0"}
                        </Text>
                        <Text className="text-sm text-right font-dm-bold text-grey-6 ml-2">
                          Kg
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Details Section */}
            <View className="mb-8">
              <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                    Other details
                  </Text>
              <View className="border border-grey-3 rounded-2xl">
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Attested by
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {user?.email || "N/A"}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Created date
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {formattedTime}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Action coordinates
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {item.location?.coords?.latitude && item.location?.coords?.longitude 
                      ? `${item.location.coords.latitude}, ${item.location.coords.longitude}`
                      : "N/A"}
                  </Text>
                </View>
                <View className="p-4 py-3 border-b border-grey-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Attestation UID
                  </Text>
                  {item.eas?.txHash ? (
                    <View className="flex-row items-center">
                      <Text className="text-base font-dm-bold text-enaleia-black flex-1">
                        {item.eas.txHash}
                      </Text>
                      <Pressable
                        onPress={() => {
                          const txHash = item.eas.txHash;
                          if (txHash) {
                            const url = EAS_CONSTANTS.getAttestationUrl(txHash);
                            Linking.openURL(url);
                          }
                        }}
                        hitSlop={8}
                        className="ml-2"
                      >
                        <Ionicons name="open-outline" size={20} color="#0D0D0D" />
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="text-base font-dm-bold text-enaleia-black">
                      N/A
                    </Text>
                  )}
                </View>
                <View className="p-4 py-3">
                  <Text className="text-sm font-dm-bold text-grey-6">
                    Database event ID
                  </Text>
                  <Text className="text-base font-dm-bold text-enaleia-black">
                    {item.directus?.eventId || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Section */}
            <View className="mb-12">
              <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter mb-2">
                Attestation status
              </Text>
              <View className="border border-grey-3 rounded-2xl">
                <View className="flex-row justify-between">
                  <View className="flex-1 p-4 py-3 border-r border-grey-3">
                    <ServiceStatusIndicator 
                      status={item.directus?.status || ServiceStatus.PENDING}
                      type="directus"
                    />
                  </View>
                  <View className="flex-1 p-4 py-3 border-r border-grey-3">
                    <ServiceStatusIndicator
                      status={item.eas?.status || ServiceStatus.PENDING}
                      type="eas"
                    />
                  </View>
                  <View className="flex-1 p-4 py-3">
                    <ServiceStatusIndicator
                      status={item.linking?.status || ServiceStatus.PENDING}
                      type="linking"
                    />
                  </View>
                </View>
                {((item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) || 
                  (item.retryCount > 0 || (item.slowRetryCount ?? 0) > 0)) && (
                  <View className="border-t border-grey-3 p-4">
                    {(item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) && (
                      <>
                        <Text className="text-base font-dm-bold text-rose-500 mb-2">
                          Error:
                        </Text>
                        {item.directus?.error && (
                          <Text className="text-sm text-rose-500 font-dm-regular mb-1">
                            Database: {item.directus.error}
                          </Text>
                        )}
                        {item.eas?.error && (
                          <Text className="text-sm text-rose-500 font-dm-regular mb-1">
                            Blockchain: {item.eas.error}
                          </Text>
                        )}
                        {item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked && (
                          <Text className="text-sm text-rose-500 font-dm-regular">
                            Linking: Failed to link attestation with database
                          </Text>
                        )}
                      </>
                    )}
                    {(item.retryCount > 0 || (item.slowRetryCount ?? 0) > 0) && (
                      <View className={`${(item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) ? "mt-4" : ""}`}>
                        <Text className="text-base font-dm-bold text-grey-6 mb-2">
                          Retry Information:
                        </Text>
                        {item.retryCount > 0 && (
                          <Text className="text-sm text-grey-6 font-dm-regular mb-1">
                            Initial Retries: {item.retryCount} of {MAX_RETRIES}
                          </Text>
                        )}
                        {(item.slowRetryCount ?? 0) > 0 && (
                          <Text className="text-sm text-grey-6 font-dm-regular">
                            Slow Mode Retries: {item.slowRetryCount}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View className="mt-6 space-y-3">
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Delete Item",
                    "Are you sure you want to delete this item? This action cannot be undone.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel"
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            // Directly remove from all queues without marking as deleted
                            await removeFromAllQueues(item.localId);
                            await loadQueueItems();
                            router.back();
                          } catch (error) {
                            console.error("Error deleting item:", error);
                            Alert.alert(
                              "Error",
                              "Failed to delete the item. Please try again."
                            );
                          }
                        }
                      }
                    ]
                  );
                }}
                className="border border-red-500 py-4 rounded-full"
              >
                <Text className="text-red-500 text-center font-dm-bold">
                  Delete Item
                </Text>
              </Pressable>

              <Pressable
                onPress={handleEmail}
                className="border border-grey-3 py-4 rounded-full"
              >
                <Text className="text-enaleia-black text-center font-dm-bold">
                  Email to Enaleia
                </Text>
              </Pressable>

              {canClear && hasEmailedSupport && showClearButton && (
                <Pressable
                  onPress={handleClear}
                  className="border border-grey-3 py-4 rounded-full"
                >
                  <Text className="text-enaleia-black text-center font-dm-bold">
                    Clear it from device
                  </Text>
                </Pressable>
              )}

              {canRetry && (
                <Pressable
                  onPress={handleRetry}
                  className="border border-grey-3 py-4 rounded-full"
                >
                  <Text className="text-enaleia-black text-center font-dm-bold">
                    Retry Item
                  </Text>
                </Pressable>
              )}

              {hasFailed && (
                <Pressable
                  onPress={handleContactSupport}
                  className="border border-grey-3 py-4 rounded-full"
                >
                  <Text className="text-enaleia-black text-center font-dm-bold">
                    Contact Support
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <ClearConfirmationModal
        isVisible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClear}
      />
    </SafeAreaContent>
  );
} 