import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";
import Chip from "./generic/Chip";
import { MotiView } from "moti";
import actionIcons from "@/constants/ActionIcons";

type ActivityCardProps = {
  date: string;
  status: string;
  location: string;
  title: string;
};

// Helper function to create staggered animations for activity cards
function AnimatedActivityCardList({
  activities,
}: {
  activities: ActivityCardProps[];
}) {
  return activities.map((activity, index) => (
    <MotiView
      key={index}
      className="mb-2 last-of-type:mb-0"
      from={{
        opacity: 0,
        translateY: 20,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
      }}
      // Stagger the animation by delaying each card
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 100, // 100ms delay between each card
      }}
    >
      <ActivityCard
        title={activity.title}
        date={activity.date}
        status={activity.status}
        location={activity.location}
      />
    </MotiView>
  ));
}

const activityTitleIcons = {
  "Fishing for litter": actionIcons.FishingForLitterIcon,
  Manufacturing: actionIcons.ManufacturingIcon,
  Prevention: actionIcons.PreventionIcon,
  Shredding: actionIcons.ShreddingIcon,
  Sorting: actionIcons.SortingIcon,
  Washing: actionIcons.WashingIcon,
  Batch: actionIcons.BatchIcon,
  "Beach Cleanup": actionIcons.BeachCleanupIcon,
  "Ad-hoc": actionIcons.AdHocIcon,
  Pelletizing: actionIcons.PelletizingIcon,
};

/**
 * A card component that displays an activity with a date, status, location, and title
 * @param date - The date of the activity
 * @param status - The status of the activity
 * @param location - The location of the activity
 * @param title - The title of the activity
 */
function ActivityCard({ title, date, status, location }: ActivityCardProps) {
  const statusClasses = {
    Pending: "bg-neutral-100 border-neutral-300",
    "In Progress": "bg-yellow-300 border-yellow-500",
    Complete: "bg-green-600 border-green-600",
  } as const;

  return (
    <View className="p-3 bg-neutral-50 rounded-lg border-[1.5px] border-neutral-200">
      <View className="flex-row">
        <View className="flex-1 flex-col space-y-1.5">
          <Text className="font-dm-medium text-lg tracking-tighter leading-[22px]">
            {title}
          </Text>
          <Text className="text-xs font-dm-medium text-neutral-500">
            {new Date(date).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>
        <View className="flex-row items-center justify-center gap-1">
          <View className="w-[56px] h-[56px] bg-blue-50 rounded-xl flex items-center justify-center">
            <Image
              source={
                activityTitleIcons[title as keyof typeof activityTitleIcons]
              }
              className="w-[48px] h-[48px]"
            />
          </View>
        </View>
      </View>
      <View className="flex flex-row items-center space-x-2">
        <View className="mr-1">
          <Chip
            label={status}
            textColor={
              status === "Pending"
                ? "text-neutral-700"
                : status === "In Progress"
                ? "text-yellow-800"
                : "text-white"
            }
            extraClassName={statusClasses[status as keyof typeof statusClasses]}
          />
        </View>
        <Chip
          label={location}
          icon={<Ionicons name="location" size={16} color="#24548b" />}
        />
      </View>
    </View>
  );
}

export { ActivityCard as default, AnimatedActivityCardList };
