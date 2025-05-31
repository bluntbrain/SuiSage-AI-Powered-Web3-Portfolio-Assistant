import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SuiColors } from "@/constants/Colors";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation values
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale1 = useRef(new Animated.Value(0.5)).current;
  const rippleScale2 = useRef(new Animated.Value(0.5)).current;
  const rippleScale3 = useRef(new Animated.Value(0.5)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Start ripple animations
    startRippleAnimations();

    // Sequence of animations
    Animated.sequence([
      // 1. Initial flash effect (200ms)
      Animated.timing(flashOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),

      // 2. Flash fade and logo entrance (400ms)
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0.6,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),

      // 3. Particles animation (800ms)
      Animated.timing(particleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // 4. Hold for a moment (600ms)
      Animated.delay(600),

      // 5. Final flash and fade out (500ms)
      Animated.parallel([
        Animated.timing(flashOpacity, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  };

  const startRippleAnimations = () => {
    const createRippleAnimation = (
      scaleValue: Animated.Value,
      delay: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(scaleValue, {
            toValue: 1.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createRippleAnimation(rippleScale1, 0).start();
    createRippleAnimation(rippleScale2, 500).start();
    createRippleAnimation(rippleScale3, 1000).start();
  };

  // Glow scale interpolation
  const glowScaleInterpolate = glowScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#ffffff", "#f0f9ff", "#e0f2fe"]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Particles Background */}
      <Animated.View
        style={[styles.particlesContainer, { opacity: particleOpacity }]}
      >
        {[...Array(20)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: `${Math.random() * 2}s`,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Glow Effect Behind Logo */}
      <Animated.View
        style={[
          styles.glowContainer,
          {
            transform: [{ scale: glowScaleInterpolate }],
            opacity: logoOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(77, 162, 255, 0.4)",
            "rgba(77, 162, 255, 0.2)",
            "rgba(77, 162, 255, 0.1)",
            "transparent",
          ]}
          style={styles.glow}
        />
      </Animated.View>

      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Flash Overlay */}
      <Animated.View style={[styles.flashOverlay, { opacity: flashOpacity }]}>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.9)", "rgba(240, 249, 255, 0.8)"]}
          style={styles.flashGradient}
        />
      </Animated.View>

      {/* Ripple Effects */}
      <Animated.View
        style={[
          styles.ripple,
          styles.ripple1,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ripple,
          styles.ripple2,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ripple,
          styles.ripple3,
          {
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale3 }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particlesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: "absolute",
    width: 3,
    height: 3,
    backgroundColor: SuiColors.aqua,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  glowContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    width: 240,
    height: 240,
  },
  flashOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  flashGradient: {
    flex: 1,
  },
  ripple: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(77, 162, 255, 0.3)",
    borderRadius: 100,
    zIndex: 5,
  },
  ripple1: {
    width: 200,
    height: 200,
  },
  ripple2: {
    width: 160,
    height: 160,
  },
  ripple3: {
    width: 120,
    height: 120,
  },
});
