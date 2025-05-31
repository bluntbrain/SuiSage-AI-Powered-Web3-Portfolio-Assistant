import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { SuiColors } from "@/constants/Colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  showGlow?: boolean;
  glowIntensity?: "low" | "medium" | "high";
}

export function GlassCard({
  children,
  style,
  intensity = 20,
  showGlow = true,
  glowIntensity = "medium",
}: GlassCardProps) {
  const getGlowStyle = () => {
    const glowStyles = {
      low: {
        shadowRadius: 8,
        shadowOpacity: 0.2,
        elevation: 4,
      },
      medium: {
        shadowRadius: 15,
        shadowOpacity: 0.3,
        elevation: 8,
      },
      high: {
        shadowRadius: 25,
        shadowOpacity: 0.5,
        elevation: 12,
      },
    };
    return glowStyles[glowIntensity];
  };

  const getBorderOpacity = () => {
    return Math.min(0.4, intensity / 50);
  };

  const getBackgroundOpacity = () => {
    return Math.min(0.15, intensity / 150);
  };

  return (
    <View style={[styles.container, style]}>
      {showGlow && (
        <View
          style={[
            styles.glowContainer,
            {
              shadowColor: SuiColors.sea,
              ...getGlowStyle(),
            },
          ]}
        />
      )}

      <BlurView intensity={intensity} style={styles.blurContainer}>
        <LinearGradient
          colors={[
            `rgba(77, 162, 255, ${getBackgroundOpacity()})`,
            `rgba(77, 162, 255, ${getBackgroundOpacity() * 0.5})`,
            `rgba(192, 230, 255, ${getBackgroundOpacity() * 0.3})`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        >
          <View
            style={[
              styles.innerBorder,
              {
                borderColor: `rgba(255, 255, 255, ${getBorderOpacity()})`,
                backgroundColor: `rgba(77, 162, 255, ${
                  getBackgroundOpacity() * 0.3
                })`,
              },
            ]}
          >
            {children}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  glowContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SuiColors.sea,
    borderRadius: 16,
    opacity: 0.2,
  },
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(1, 24, 41, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.3)",
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradientOverlay: {
    flex: 1,
    borderRadius: 15,
  },
  innerBorder: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: SuiColors.aqua,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
