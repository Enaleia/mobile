import { AnimatedActivityCardList } from "@/components/ActivityCard";
import Tabs from "@/components/generic/Tabs";
import { useState } from "react";
import { ScrollView, View } from "react-native";

const mockActivities = [
  {
    title: "Fishing for litter",
    date: "2024-11-26",
    status: "In Progress",
    location: "Paris, France",
  },
  {
    title: "Manufacturing",
    date: "2024-12-15",
    status: "Pending",
    location: "London, UK",
  },
  {
    title: "Prevention",
    date: "2024-11-26",
    status: "Complete",
    location: "Santa Monica, California",
  },
  {
    title: "Shredding",
    date: "2024-12-01",
    status: "Complete",
    location: "Miami, Florida",
  },
  {
    title: "Washing",
    date: "2024-12-10",
    status: "In Progress",
    location: "Seattle, WA",
  },
  {
    title: "Batch",
    date: "2024-12-20",
    status: "Pending",
    location: "Austin, Texas",
  },
];

function HomeTabsDataSection() {
  const [activeTab, setActiveTab] = useState("recent");

  return (
    <View className="flex-1">
      <Tabs
        tabs={[
          { label: "Recent", value: "recent", count: mockActivities.length },
          {
            label: "Pending",
            value: "pending",
            count: mockActivities.filter(
              (activity) => activity.status === "Pending"
            ).length,
          },
          {
            label: "In Progress",
            value: "in-progress",
            count: mockActivities.filter(
              (activity) => activity.status === "In Progress"
            ).length,
          },
          {
            label: "Complete",
            value: "complete",
            count: mockActivities.filter(
              (activity) => activity.status === "Complete"
            ).length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <View className="flex-1">
        {activeTab === "recent" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ display: activeTab === "recent" ? "flex" : "none" }}
          >
            <AnimatedActivityCardList activities={mockActivities} />
          </ScrollView>
        )}
        {activeTab === "pending" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ display: activeTab === "pending" ? "flex" : "none" }}
          >
            <AnimatedActivityCardList
              activities={mockActivities.filter(
                (activity) => activity.status === "Pending"
              )}
            />
          </ScrollView>
        )}
        {activeTab === "in-progress" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ display: activeTab === "in-progress" ? "flex" : "none" }}
          >
            <AnimatedActivityCardList
              activities={mockActivities.filter(
                (activity) => activity.status === "In Progress"
              )}
            />
          </ScrollView>
        )}
        {activeTab === "complete" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ display: activeTab === "complete" ? "flex" : "none" }}
          >
            <AnimatedActivityCardList
              activities={mockActivities.filter(
                (activity) => activity.status === "Complete"
              )}
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

export default HomeTabsDataSection;
