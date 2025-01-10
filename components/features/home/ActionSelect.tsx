import { LoadingScreen } from "@/components/LoadingScreen";
import ActionButton from "@/components/features/home/ActionButton";
import { GroupedActions } from "@/types/action";
import { Action } from "@/types/action";
import { ScrollView, Text, View } from "react-native";

interface ActionSelectionProps {
  actions: GroupedActions | undefined;
  isLoading: boolean;
}

export default function ActionSelection({
  actions,
  isLoading,
}: ActionSelectionProps) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!actions || Object.keys(actions).length === 0) {
    return <Text>No actions found</Text>;
  }

  return (
    <ScrollView>
      {Object.entries(actions).map(([category, categoryActions]) => (
        <View
          key={category}
          className="py-5 border-b-[1.5px] border-neutral-200 last-of-type:border-b-0"
        >
          <Text className="text-[18px] mb-3 font-dm-bold text-enaleia-black w-full tracking-tight">
            {category}
          </Text>
          <View className="flex-row flex-wrap">
            {categoryActions.map((action: Action) => (
              <ActionButton
                key={action.id}
                name={action.name}
                color={action.color}
                icon={action.icon}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
