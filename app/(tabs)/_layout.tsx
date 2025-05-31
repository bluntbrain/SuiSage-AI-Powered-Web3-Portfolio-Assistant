import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { SuiColors } from "@/constants/Colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SuiColors.sea,
        tabBarInactiveTintColor: "rgba(192, 230, 255, 0.5)",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            height: 88,
            paddingTop: 8,
            paddingBottom: 34,
          },
          default: {
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            paddingTop: 8,
            paddingBottom: 8,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="chart.pie.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="list.bullet"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
