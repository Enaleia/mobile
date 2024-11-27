import Chip from "@/components/generic/Chip";
import actionIcons from "@/constants/ActionIcons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Image, Pressable, Text, View } from "react-native";

/**
 * Represents an activity in the UI
 * @interface UIActivity
 * @property {string} date - The date of the activity in ISO format (YYYY-MM-DD)
 * @property {"Pending" | "In Progress" | "Complete"} status - The current status of the activity
 * @property {string} location - The location where the activity takes place
 * @property {string} title - The name/title of the activity
 * @property {string} id - Unique identifier for the activity
 * @property {boolean} [asLink] - Optional flag to indicate if the activity should be rendered as a link
 */
export interface UIActivity {
  date: string;
  status: "Pending" | "In Progress" | "Complete";
  location: string;
  title: string;
  id: string;
  asLink?: boolean;
}

/**
 * A list of animated activity cards
 * @param activities - The activities to display
 */
function AnimatedActivityCardList({
  activities,
}: {
  activities: UIActivity[];
}) {
  return activities.map((activity, index) => {
    console.log(
      `Rendering activity: ${activity.title}, asLink: ${
        activity.asLink
      }, link: ${activity.asLink && `/activities/${activity.id}`}`
    );
    return (
      <MotiView
        key={activity.status + index}
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
          id={activity.id}
          title={activity.title}
          date={activity.date}
          status={activity.status}
          location={activity.location}
          asLink={activity.asLink}
        />
      </MotiView>
    );
  });
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
 * @param id - The id of the activity
 * @param date - The date of the activity
 * @param status - The status of the activity
 * @param location - The location of the activity
 * @param title - The title of the activity
 * @param asLink - Whether the activity is a link, defaults to true
 */
function ActivityCard({
  id,
  title,
  date,
  status,
  location,
  asLink = true,
}: UIActivity) {
  console.log(`Activity ${title} (${status}): asLink = ${asLink}`);
  const chipClassesByStatus = {
    Pending: "bg-neutral-100 border-neutral-300",
    "In Progress": "bg-yellow-300 border-yellow-500",
    Complete: "bg-green-600 border-green-600",
  } as const;

  const Wrapper = ({
    children,
    pressFn,
    classes,
  }: {
    children: React.ReactNode;
    pressFn?: () => void;
    classes?: string;
  }) => {
    if (asLink) {
      console.log(`Wrapper: Pressable`);
      return (
        <Pressable className={classes} onPress={pressFn} key={id}>
          {children}
        </Pressable>
      );
    }
    return <View className={classes}>{children}</View>;
  };

  return (
    <Wrapper
      classes="p-3 bg-neutral-50 rounded-lg border-[1.5px] border-neutral-200 active:bg-neutral-100 active:scale-95 transition-all duration-150"
      pressFn={() => asLink && router.push(`/activities/${id}`)}
    >
      <View className="flex-row">
        <View className="flex-1 flex-col space-y-1.5">
          <Text className="font-dm-medium text-lg tracking-tighter leading-[22px]">
            {title}
          </Text>
          <Text className="text-xs font-dm-medium text-neutral-500 uppercase">
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
            extraClassName={
              chipClassesByStatus[status as keyof typeof chipClassesByStatus]
            }
          />
        </View>
        <Chip
          label={location}
          icon={<Ionicons name="location" size={16} color="#24548b" />}
        />
      </View>
    </Wrapper>
  );
}

export { AnimatedActivityCardList, ActivityCard as default };
