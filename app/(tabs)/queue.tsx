import QueueSection from "@/components/features/queue/QueueSection";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { filterQueueItems, getAttentionCount } from "@/utils/queue";
import { clearOldCache, cleanupExpiredItems } from "@/utils/queueStorage";
import { Ionicons } from "@expo/vector-icons";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View, ScrollView, Pressable, Image } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { UserProfile } from "@/components/shared/UserProfile";


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
    try {
      await Promise.all([
        clearOldCache(),
        cleanupExpiredItems()
      ]);
      await loadQueueItems();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

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
                There is no items here...
              </Text>
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

              {pendingItems.length > 0 && (
                <View className="mb-4 p-3 bg-red-50 rounded-xl border border-red-300">
                  <Text className="text-left text-sm text-enaleia-black">
                    You have items awaiting to submit on blockchain. Get connected whenever possible and retry submitting these attestations.
                  </Text>
                </View>
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
