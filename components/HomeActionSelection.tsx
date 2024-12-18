import { ACTION_CATEGORIES } from "@/constants/action";
import { ScrollView, Text, View } from "react-native";
import ActionButton from "@/components/ActionButton";

export default function HomeActionSelection() {
  return (
    <ScrollView>
      {Object.entries(ACTION_CATEGORIES).map(([category, actions]) => (
        <View
          key={category}
          className="py-5 border-b-[1.5px] border-neutral-200 last-of-type:border-b-0"
        >
          <Text className="text-[18px] mb-3 font-dm-bold text-enaleia-black w-full tracking-tight">
            {category}
          </Text>
          <View className="flex-row flex-wrap">
            {actions.map((action) => (
              <ActionButton key={action} title={action} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
