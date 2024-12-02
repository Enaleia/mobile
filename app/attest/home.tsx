import SafeAreaContent from "@/components/SafeAreaContent";
import { ACTIVITY_ICONS, ActivityTitle } from "@/constants/ActivityAssets";
import { ACTIVITY_URI_BY_TITLE } from "@/types/activity";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AttestHome = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Use useMemo instead of useState for searchResults
  const searchResults = useMemo(() => {
    if (!searchTerm) return Object.entries(ACTIVITY_URI_BY_TITLE);

    return Object.entries(ACTIVITY_URI_BY_TITLE).filter(([title]) =>
      title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleActivityPress = useCallback((uri: string) => {
    router.push(`/attest/new/${uri}`);
  }, []);

  const renderActivityItem = useCallback(
    ([title, uri]: [string, string]) => (
      <Pressable
        key={uri}
        className="p-4 bg-white rounded-lg border border-neutral-200 active:bg-neutral-100 mb-2"
        onPress={() => handleActivityPress(uri)}
      >
        <View className="flex-row items-center justify-between w-full">
          <Text className="text-lg font-dm-medium text-neutral-800 tracking-[-0.5px]">
            {title}
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="w-[48px] h-[48px] bg-blue-50 rounded-xl flex items-center justify-center">
              <Image
                source={ACTIVITY_ICONS[title as ActivityTitle]}
                className="w-[40px] h-[40px]"
              />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </Pressable>
    ),
    []
  );

  return (
    <SafeAreaContent>
      <View className="flex-1">
        {/* Header */}
        <Link href="/(tabs)/home" asChild>
          <Pressable className="flex-row items-center mb-4">
            <Ionicons name="chevron-back" size={24} color="#24548b" />
            <Text className="ml-1 text-[#24548b] font-dm-medium">Home</Text>
          </Pressable>
        </Link>

        <Text className="text-3xl font-dm-medium text-neutral-800 tracking-[-1px] mb-3">
          Which activity are you recording?
        </Text>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="flex-row items-center bg-white border-[1.5px] border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search activities..."
              placeholderTextColor="#9CA3AF"
              className="flex-1"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        {/* Results */}
        {searchResults.length > 0 ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {searchResults.map(renderActivityItem)}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg font-dm-medium text-neutral-400 tracking-[-0.5px]">
              No activities found
            </Text>
          </View>
        )}
      </View>
    </SafeAreaContent>
  );
};

export default AttestHome;
