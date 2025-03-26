import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueItem, ServiceStatus, QueueItemStatus, MAX_RETRIES_PER_BATCH, RETRY_INTERVALS } from "@/types/queue";
import { useBatchData } from "@/hooks/data/useBatchData";
import { MaterialDetail } from "@/types/material";
import { EAS_CONSTANTS } from "@/services/eas";
import { removeFromActiveQueue, removeFromAllQueues } from "@/utils/queueStorage";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClearConfirmationModal } from "@/components/features/queue/ClearConfirmationModal";
import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import { ServiceStatusIndicator } from "@/components/features/queue/ServiceStatusIndicator";


export default function QueueItemDetails() {
  const { id } = useLocalSearchParams();
  const { queueItems, loadQueueItems, retryItems } = useQueue();
  const [item, setItem] = useState<QueueItem | null>(null);
  const { materials: materialsData, products: productsData, actions: actionsData, collectors } = useBatchData();
  const { user } = useAuth();
  const [showClearModal, setShowClearModal] = useState(false);

  // Find collector info if available
  const collectorInfo = useMemo(() => {
    if (!item?.collectorId || !collectors) return null;
    return collectors.find(c => c.collector_identity === item.collectorId);
  }, [item?.collectorId, collectors]);

  useEffect(() => {
    console.log('Loading queue item details:', {
      id,
      queueItemsCount: queueItems?.length || 0,
      availableIds: queueItems?.map(i => i.localId) || []
    });

    if (!id) {
      console.log('No ID provided');
      return;
    }

    const foundItem = queueItems?.find(i => i.localId === id);
    console.log('Found item:', foundItem ? {
      localId: foundItem.localId,
      status: foundItem.status,
      directusStatus: foundItem.directus?.status,
      easStatus: foundItem.eas?.status
    } : 'null');

    if (foundItem) {
      setItem(foundItem);
    }
  }, [id, queueItems]);

  if (!item || !id) {
    console.log('Rendering not found state:', { item: !!item, id: !!id });
    return (
      <SafeAreaContent>
        <View className="flex-1 items-center justify-center">
          <Text>Item not found</Text>
        </View>
      </SafeAreaContent>
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
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp))
    .replace(/(\d+)(?=(,))/, (match) => {
      const num = parseInt(match);
      const suffix = ["th", "st", "nd", "rd"][(num % 10 > 3 || num % 100 - num % 10 == 10) ? 0 : num % 10];
      return num + suffix;
    });

  const formatEmailBody = () => {
    if (!item || !currentAction) return "";

    const sections = [
      `Action Type: ${currentAction.name}`,
      `Status:
  - Database: ${item.directus?.status || "N/A"}
  - Blockchain: ${item.eas?.status || "N/A"}
  - Linking: ${item.directus?.linked ? "Completed" : "Pending"}`,
      item.collectorId ? `Collector Information:
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
    const subject = `Attestation Details - ${currentAction?.name || "Unknown Action"}`;
    const url = `mailto:app-support@enaleia.com,enaleia@pollenlabs.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Could not open email client");
    }
  };

  const handleClear = async () => {
    if (canClear) {
      setShowClearModal(true);
    }
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

  const canClear = item.directus?.status === ServiceStatus.COMPLETED && 
                   item.eas?.status === ServiceStatus.COMPLETED;

  const formatTimeRemaining = (nextRetryTime: Date): string => {
    const diff = nextRetryTime.getTime() - Date.now();
    if (diff < 60000) return 'less than a minute';
    const minutes = Math.floor(diff / 60000);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };

  const canRetry = (item: QueueItem): boolean => {
    if (item.status === QueueItemStatus.PROCESSING) return false;
    
    const isInInitialRetryPhase = item.retryCount < MAX_RETRIES_PER_BATCH;
    if (isInInitialRetryPhase) return true;

    const nextRetryTime = item.lastAttempt ? 
      new Date(new Date(item.lastAttempt).getTime() + 
        RETRY_INTERVALS[Math.min(item.retryCount - MAX_RETRIES_PER_BATCH, 
          RETRY_INTERVALS.length - 1)]) : 
      null;

    return !nextRetryTime || new Date() >= nextRetryTime;
  };

  const getRetryMessage = (item: QueueItem): string => {
    if (item.status === QueueItemStatus.PROCESSING) {
      return 'Auto-retrying...';
    }

    const isInInitialRetryPhase = item.retryCount < MAX_RETRIES_PER_BATCH;
    if (!isInInitialRetryPhase && item.lastAttempt) {
      const nextRetryTime = new Date(new Date(item.lastAttempt).getTime() + 
        RETRY_INTERVALS[Math.min(item.retryCount - MAX_RETRIES_PER_BATCH, 
          RETRY_INTERVALS.length - 1)]);
      
      if (new Date() < nextRetryTime) {
        return `Retry available in ${formatTimeRemaining(nextRetryTime)}`;
      }
    }

    return 'Retry';
  };

  const handleRetry = async () => {
    if (!item) return;
    try {
      await retryItems([item]);
      await loadQueueItems();
    } catch (error) {
      console.error("Error retrying item:", error);
    }
  };

  return (
    <SafeAreaContent>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 0,
          paddingBottom: 100,
        }}
      >
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
                  status={item.directus?.linked ? ServiceStatus.COMPLETED : ServiceStatus.PENDING}
                  type="linking"
                />
              </View>
            </View>
            {(item.directus?.error || item.eas?.error || (item.directus?.status === ServiceStatus.FAILED && !item.directus?.linked)) && (
              <View className="border-t border-grey-3 p-4">
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
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <Pressable
            onPress={handleEmail}
            className="border border-grey-3 py-4 rounded-full"
          >
            <Text className="text-enaleia-black text-center font-dm-bold">
              Email to Enaleia
            </Text>
          </Pressable>
          
          {canClear && (
            <Pressable
              onPress={handleClear}
              className="border border-grey-3 py-4 rounded-full"
            >
              <Text className="text-enaleia-black text-center font-dm-bold">
                Clear it from device
              </Text>
            </Pressable>
          )}

          {!canClear && (
            <Pressable
              onPress={handleRetry}
              disabled={!canRetry(item)}
              className={`border border-grey-3 py-4 rounded-full ${
                !canRetry(item) ? 'opacity-50' : ''
              }`}
            >
              <Text className="text-enaleia-black text-center font-dm-bold">
                {getRetryMessage(item)}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <ClearConfirmationModal 
        isVisible={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClear}
      />
    </SafeAreaContent>
  );
} 