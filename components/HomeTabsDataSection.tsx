import {
  AnimatedActivityCardList,
  UIActivity,
} from "@/components/ActivityCard";
import Tabs from "@/components/generic/Tabs";
import { mockActivities } from "@/data/mockActivities";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { ScrollView, Text, View, ViewStyle } from "react-native";

const EmptyState = ({
  style,
  activeTab,
}: {
  style: ViewStyle;
  activeTab: string;
}) => (
  <MotiView
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
    }}
    className="bg-neutral-50 p-3 flex-1 items-center rounded-lg border border-neutral-200 justify-center"
    style={style}
  >
    <Text className="text-neutral-500">
      No activities {activeTab.replace("-", " ")}
    </Text>
  </MotiView>
);

interface TabContentProps {
  activities: UIActivity[];
  isActive: boolean;
  activeTab: string;
}

const TabContent = ({ activities, isActive, activeTab }: TabContentProps) => {
  if (activities.length === 0) {
    return (
      <EmptyState
        style={{ display: isActive ? "flex" : "none" }}
        activeTab={activeTab}
      />
    );
  }

  return (
    <MotiView
      animate={{
        opacity: isActive ? 1 : 0,
      }}
      transition={{
        type: "timing",
        duration: 200,
      }}
      style={{
        flex: 1,
        position: "absolute",
        width: "100%",
        height: "100%",
      }}
    >
      {isActive && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <AnimatedActivityCardList activities={activities} />
        </ScrollView>
      )}
    </MotiView>
  );
};

function HomeTabsDataSection() {
  const [activeTab, setActiveTab] = useState("pending");

  const activitiesByStatus = useMemo(() => {
    //! TODO: Replace with actual data
    return mockActivities.reduce((acc, activity) => {
      const key = activity.status.toLowerCase().replace(" ", "-");
      acc[key] = acc[key] || [];
      acc[key].push(activity);
      return acc;
    }, {} as Record<string, UIActivity[]>);
  }, []);

  const tabs = [
    {
      label: "Pending",
      value: "pending",
      count: activitiesByStatus.pending?.length || 0,
    },
    {
      label: "In Progress",
      value: "in-progress",
      count: activitiesByStatus["in-progress"]?.length || 0,
    },
    {
      label: "Complete",
      value: "complete",
      count: activitiesByStatus.complete?.length || 0,
    },
  ];

  return (
    <View className="flex-1">
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <View className="flex-1">
        {tabs.map((tab) => (
          <TabContent
            key={tab.value}
            activities={activitiesByStatus[tab.value] || []}
            isActive={activeTab === tab.value}
            activeTab={activeTab}
          />
        ))}
      </View>
    </View>
  );
}

export default HomeTabsDataSection;
