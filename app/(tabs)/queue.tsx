import QueueSection from "@/components/features/queue/QueueSection";
import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { filterQueueItems, getAttentionCount } from "@/utils/queue";
import { clearOldCache } from "@/utils/queueStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View, ScrollView, Pressable } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems } = useQueue();
  const { user } = useAuth();
  const navigation = useNavigation();

  const items = queueItems.length > 0 ? queueItems : [];
  const { processingItems, pendingItems, failedItems, completedItems } =
    filterQueueItems(items);
  const attentionCount = getAttentionCount(items);

  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: attentionCount > 0 ? attentionCount : undefined,
    });
  }, [attentionCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const handleClearOldCache = async () => {
    await clearOldCache();
    await loadQueueItems();
  };

  const hasNoItems = items.length === 0;

  return (
    <SafeAreaContent>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between pb-2 font-dm-regular">
          <View className="flex-row items-center justify-center gap-0.5">
            <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
            <Text className="text-sm font-bold text-enaleia-black">
              {user?.first_name || "User"}
            </Text>
          </View>
          <NetworkStatus />
        </View>

        <View className="mt-4">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Queue
          </Text>
        </View>

        <View className="">
          {hasNoItems ? (
            <View className="flex-1 items-center justify-center py-8">
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color="#4CAF50"
              />
              <Text className="text-lg text-center mt-4 font-medium">
                Queue is Empty
              </Text>
              <Text className="text-sm text-center text-gray-600 mt-2">
                All actions have been processed successfully. Create a new
                action to see it here.
              </Text>
              <Pressable
                onPress={handleClearOldCache}
                className="mt-8 border border-gray-200 px-4 py-2 rounded-xl"
              >
                <Text className="text-sm text-gray-600">
                  Clear old cache data
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 py-4">
              {processingItems.length > 0 && (
                <QueueSection
                  title="Processing"
                  items={processingItems}
                  onRetry={retryItems}
                  showRetry={false}
                />
              )}

              <QueueSection
                title="Pending"
                items={pendingItems}
                onRetry={retryItems}
                showRetry={true}
                alwaysShow={true}
              />

              {failedItems.length > 0 && (
                <QueueSection
                  title="Failed"
                  items={failedItems}
                  onRetry={retryItems}
                  showRetry={true}
                />
              )}

              <QueueSection
                title="Completed"
                items={completedItems}
                onRetry={retryItems}
                showRetry={false}
                isCollapsible={true}
                alwaysShow={true}
              />

              <Pressable
                onPress={handleClearOldCache}
                className="mt-8 border border-gray-200 px-4 py-2 rounded-xl self-center"
              >
                <Text className="text-sm text-gray-600">
                  Clear old cache data
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default QueueScreen;
