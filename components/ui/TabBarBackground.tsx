import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SuiColors } from "@/constants/Colors";

export default function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={30} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[
            "rgba(1, 24, 41, 0.85)",
            "rgba(3, 15, 28, 0.9)",
            "rgba(1, 24, 41, 0.95)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <LinearGradient
          colors={[
            "rgba(77, 162, 255, 0.1)",
            "transparent",
            "rgba(77, 162, 255, 0.05)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>

      <View style={styles.topBorder} />
      <View style={styles.leftGlow} />
      <View style={styles.rightGlow} />
    </View>
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(77, 162, 255, 0.4)",
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  leftGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(192, 230, 255, 0.1)",
  },
  rightGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(192, 230, 255, 0.1)",
  },
});
