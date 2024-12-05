import {
  ACTION_CATEGORIES,
  ACTION_COLORS,
  ACTION_ICONS,
} from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

const ActionButton = ({ title }: { title: ActionTitle }) => {
  return (
    <Pressable
      className="items-center justify-center px-2 py-3 rounded-md w-[48%] mr-1 mb-1 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out"
      style={{ backgroundColor: ACTION_COLORS[title] }}
      // onPress={() => router.push(`/forms/${title.toLowerCase()}`)}
    >
      <Image source={ACTION_ICONS[title]} className="w-16 h-16" />
      <Text className="text-base font-dm-medium tracking-[-0.25px]">
        {title}
      </Text>
    </Pressable>
  );
};

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
