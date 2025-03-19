import QueueSection from "@/components/features/queue/QueueSection";
// import NetworkStatus from "@/components/shared/NetworkStatus";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useQueue } from "@/contexts/QueueContext";
import { QueueEvents, queueEventEmitter } from "@/services/events";
import { filterQueueItems, getAttentionCount } from "@/utils/queue";
import { useEventListener } from "expo";
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Image, ScrollView, Text, View, Pressable, Linking } from "react-native";

const QueueScreen = () => {
  const { queueItems, loadQueueItems, retryItems } = useQueue();
  const { user } = useAuth();
  const navigation = useNavigation();

  const items = queueItems.length > 0 ? queueItems : [];
  const { processingItems, pendingItems, failedItems, completedItems } =
    filterQueueItems(items);
  const attentionCount = getAttentionCount(items);

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
    const unsubscribe = navigation.addListener("focus", loadQueueItems);
    return unsubscribe;
  }, [navigation]);

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

              {(pendingItems.length > 0 || failedItems.length > 0) && (
                <View className="mb-4 p-3 bg-[#FF453A1A] rounded-xl border border-[#FFAEA9]">
                  <Text className="text-left text-sm text-enaleia-black">
                    <Text className="font-dm-bold">You have {pendingItems.length > 0 ? `${pendingItems.length} pending` : ""}{pendingItems.length > 0 && failedItems.length > 0 ? " and " : ""}{failedItems.length > 0 ? `${failedItems.length} failed` : ""} {(pendingItems.length + failedItems.length) === 1 ? "item" : "items"}.</Text> Make sure you are connected to the internet and retry submitting these attestations. If the issue persists, please{" "}
                    <Text className="text-blue-ocean underline" onPress={contactSupport}>
                      contact support
                    </Text>.
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
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default QueueScreen;
