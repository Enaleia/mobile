import Chip from "@/components/generic/Chip";
import { ACTIVITY_ICONS } from "@/constants/ActivityAssets";
import { UIActivity } from "@/types/activity";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Image, Pressable, Text, View } from "react-native";

type CardContentProps = Omit<UIActivity, "asLink">;

export const STATUS_STYLES = {
  Pending: {
    chipClass: {
      bg: "bg-yellow-100",
      border: "border-yellow-400",
    },
    textColor: "text-yellow-800",
  },
  "In Progress": {
    chipClass: {
      bg: "bg-yellow-300",
      border: "border-yellow-500",
    },
    textColor: "text-yellow-800",
  },
  Complete: {
    chipClass: {
      bg: "bg-green-100",
      border: "border-green-400",
    },
    textColor: "text-green-800",
  },
} as const;

export const WRAPPER_CLASSES =
  "p-3 bg-white rounded-lg border-[1.5px] border-neutral-200 active:bg-neutral-100 active:scale-95 active:ring-blue-500 transition-transform duration-200 ease-out";

const CardContent = ({ title, date, status, location }: CardContentProps) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const icon = ACTIVITY_ICONS[title];
  const statusStyle = STATUS_STYLES[status];

  return (
    <>
      <View className="flex-row">
        <View className="flex-1 flex-col space-y-1.5">
          <Text className="font-dm-medium text-lg tracking-tighter leading-[22px]">
            {title}
          </Text>
          <Text className="text-xs font-dm-medium text-neutral-500 uppercase">
            {formattedDate}
          </Text>
        </View>
        <View className="flex-row items-center justify-center gap-1">
          <View className="w-[56px] h-[56px] bg-blue-50 rounded-xl flex items-center justify-center">
            <Image source={icon} className="w-[48px] h-[48px]" />
          </View>
        </View>
      </View>
      <View className="flex flex-row items-center space-x-2">
        <View className="mr-1">
          <Chip
            label={status}
            textColor={statusStyle.textColor}
            bgColor={statusStyle.chipClass.bg}
            borderColor={statusStyle.chipClass.border}
          />
        </View>
        <Chip
          label={location}
          icon={<Ionicons name="location" size={16} color="#24548b" />}
        />
      </View>
    </>
  );
};

function ActivityCard({
  id,
  title,
  date,
  status,
  location,
  asLink = true,
}: UIActivity) {
  if (asLink) {
    return (
      <Pressable
        className={WRAPPER_CLASSES}
        onPress={() => router.push(`/activities/${id}`)}
        key={id}
      >
        <CardContent
          title={title}
          date={date}
          status={status}
          location={location}
          id={id}
        />
      </Pressable>
    );
  }

  return (
    <View className={WRAPPER_CLASSES}>
      <CardContent
        title={title}
        date={date}
        status={status}
        location={location}
        id={id}
      />
    </View>
  );
}

function AnimatedActivityCardList({
  activities,
}: {
  activities: UIActivity[];
}) {
  return activities.map((activity, index) => (
    <MotiView
      key={`${activity.id}-${index}`}
      className="mb-2 last-of-type:mb-0"
      from={{
        opacity: 0,
        translateY: 20,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay: index * 100,
      }}
    >
      <ActivityCard {...activity} />
    </MotiView>
  ));
}

export { AnimatedActivityCardList, ActivityCard as default };
