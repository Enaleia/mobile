import QueueSection from "@/components/features/queue/QueueSection";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { QueueItemStatus, isCompletelyFailed } from "@/types/queue";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, View, Pressable, Linking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCompletedQueueCacheKey } from "@/utils/storage";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems, refreshQueueStatus } = useQueue();
  const { user } = useAuth();
  const navigation = useNavigation();

  const items = queueItems.length > 0 ? queueItems : [];
  
  // Split items into active, critical, and completed
  const activeItems = items.filter(item => {
    const nonCompletedStates = [
      QueueItemStatus.PENDING,
      QueueItemStatus.PROCESSING,
      QueueItemStatus.FAILED,
      QueueItemStatus.OFFLINE,
      QueueItemStatus.SLOW_RETRY
    ];
    return nonCompletedStates.includes(item.status) && !isCompletelyFailed(item);
  });

  // Critical items are those that have completely failed
  const criticalItems = items.filter(item => isCompletelyFailed(item));
  
  const completedItems = items.filter(item => item.status === QueueItemStatus.COMPLETED);
  
  // Count items needing attention (all active items)
  const attentionCount = activeItems.length + criticalItems.length;

  const handleClearAllCompleted = async () => {
    try {
      // Clear completed items from AsyncStorage
      await AsyncStorage.setItem(getCompletedQueueCacheKey(), JSON.stringify([]));
      // Reload queue items to update the UI
      await loadQueueItems();
    } catch (error) {
      console.error("Error clearing completed items:", error);
      Alert.alert(
        "Error",
        "Failed to clear completed items. Please try again."
      );
    }
  };

  const contactSupport = async () => {
    const url = "mailto:app-support@enaleia.com,enaleia@pollenlabs.org";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      tabBarBadge: attentionCount > 0 ? attentionCount : undefined,
    });
  }, [attentionCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      // Only load queue items without refreshing status
      await loadQueueItems();
    });
    return unsubscribe;
  }, [navigation, loadQueueItems]);

  useEventListener(queueEventEmitter, QueueEvents.UPDATED, loadQueueItems);

  const hasNoItems = items.length === 0;

  return (
    <SafeAreaContent>
      <UserProfile />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-4">
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Queue
          </Text>
        </View>

        <View>
          {hasNoItems ? (
            <View className="flex-1 items-center justify-center mt-4">
              <Image
                source={require("@/assets/images/animals/CrabBubble.png")}
                className="w-[294px] h-[250px] mt-4"
                accessibilityLabel="Decorative crab illustration"
                accessibilityRole="image"
              />
              <Text className="text-base text-center mt-1 font-regular">
                There are no items here...
              </Text>
            </View>
          ) : (
            <View className="flex-1 py-4">
              {/* Active Items Section */}
              <QueueSection
                title="Active"
                items={activeItems}
                onRetry={retryItems}
                showRetry={true}
                alwaysShow={true}
              />

              {/* Critical Items Section */}
              <QueueSection
                title="Critical"
                items={criticalItems}
                onRetry={retryItems}
                showRetry={false}
                alwaysShow={false}
              />

              {/* Completed Items Section */}
              <QueueSection
                title="Completed"
                items={completedItems}
                onRetry={retryItems}
                showRetry={false}
                onClearAll={handleClearAllCompleted}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default QueueScreen;
