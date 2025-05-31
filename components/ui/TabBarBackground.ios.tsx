import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SuiColors } from "@/constants/Colors";

export default function BlurTabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Glass blur effect */}
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Glass gradient overlay */}
      <LinearGradient
        colors={["rgba(1, 24, 41, 0.8)", "rgba(3, 15, 28, 0.9)"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top border glow */}
      <View style={styles.topBorder} />
    </View>
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}

const styles = StyleSheet.create({
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(77, 162, 255, 0.3)",
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
