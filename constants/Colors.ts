/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * SuiSage App Colors - Based on Sui Official Branding
 * Sea: #4DA2FF - Buttons, highlights, accents
 * Ocean: #011829 - Backgrounds, secondary elements  
 * Aqua: #C0E6FF - Card backgrounds, hover states
 * Deep Ocean: #030F1C - Text, dark backgrounds
 */

const suiSea = '#4DA2FF';
const suiOcean = '#011829';
const suiAqua = '#C0E6FF';
const suiDeepOcean = '#030F1C';

export const Colors = {
  light: {
    text: suiDeepOcean,
    background: suiAqua,
    tint: suiSea,
    icon: suiOcean,
    tabIconDefault: suiOcean,
    tabIconSelected: suiSea,
    primary: suiSea,
    secondary: suiOcean,
    surface: suiAqua,
    card: '#ffffff',
  },
  dark: {
    text: suiAqua,
    background: suiOcean,
    tint: suiSea,
    icon: suiAqua,
    tabIconDefault: '#687076',
    tabIconSelected: suiSea,
    primary: suiSea,
    secondary: suiDeepOcean,
    surface: suiDeepOcean,
    card: 'rgba(77, 162, 255, 0.1)',
  },
};

// Sui Brand Colors
export const SuiColors = {
  sea: suiSea,        // #4DA2FF
  ocean: suiOcean,    // #011829
  aqua: suiAqua,      // #C0E6FF
  deepOcean: suiDeepOcean, // #030F1C
  
  // Glass effect colors
  glassBackground: 'rgba(77, 162, 255, 0.08)',
  glassBorder: 'rgba(77, 162, 255, 0.2)',
  glassGlow: 'rgba(77, 162, 255, 0.4)',
  
  // Gradient colors
  gradientStart: 'rgba(1, 24, 41, 0.9)',
  gradientEnd: 'rgba(3, 15, 28, 0.95)',
};
