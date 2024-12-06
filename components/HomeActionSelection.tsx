import { ACTION_CATEGORIES } from "@/constants/action";
import { ScrollView, Text, View } from "react-native";
import ActionButton from "@/components/ActionButton";

export default function HomeActionSelection() {
  return (
    <ScrollView>
      {Object.entries(ACTION_CATEGORIES).map(([category, actions]) => (
        <View
          key={category}
          className="pb-2 mb-3 border-b-[1.5px] border-neutral-200 last-of-type:border-b-0"
        >
          <View className="flex-row items-center justify-between mb-2 w-full">
            <Text className="text-sm font-dm-medium text-neutral-600 w-full tracking-tight">
              {category}
            </Text>
          </View>
          <View className="flex-row flex-wrap px-0.5">
            {actions.map((action) => (
              <ActionButton key={action} title={action} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
