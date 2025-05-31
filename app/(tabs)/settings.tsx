import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import { useWallet } from "@/contexts/WalletContext";
import { aiService } from "@/services/aiService";
import { trainingDataService } from "@/services/trainingDataService";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { aiProviderSettings, toggleAIProvider } = useWallet();
  const availableProviders = aiService.getAvailableProviders();
  const [trainingStats, setTrainingStats] = useState({
    total: 0,
    withSelections: 0,
    openaiWins: 0,
    geminiWins: 0,
  });

  useEffect(() => {
    loadTrainingStats();
  }, []);

  const loadTrainingStats = async () => {
    const stats = await trainingDataService.getStats();
    setTrainingStats(stats);
  };

  const exportTrainingData = async () => {
    try {
      const data = await trainingDataService.getTrainingDataForExport();

      // In a real app, you'd save this to a file or send to a server
      console.log("[Settings] Training data exported:", data);

      Alert.alert(
        "Training Data Exported",
        `Exported ${trainingStats.withSelections} training samples. Check console for data.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Export Failed", "Could not export training data.");
    }
  };

  const clearTrainingData = async () => {
    Alert.alert(
      "Clear Training Data",
      "This will permanently delete all collected training data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await trainingDataService.clearAllData();
            await loadTrainingStats();
            Alert.alert("Data Cleared", "All training data has been removed.");
          },
        },
      ]
    );
  };

  const getProviderInfo = (providerId: "openai" | "gemini") => {
    const provider = availableProviders.find((p) => p.id === providerId);
    return {
      name: provider?.name || providerId,
      available: provider?.enabled || false,
    };
  };

  const canDisable = (provider: "openai" | "gemini") => {
    const otherProvider = provider === "openai" ? "gemini" : "openai";
    return aiProviderSettings[otherProvider] === true;
  };

  useFocusEffect(() => {
    loadTrainingStats();
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[SuiColors.ocean, SuiColors.deepOcean]}
        style={styles.backgroundGradient}
      />

      <View style={[styles.glowEffect, styles.glowTop]} />
      <View style={[styles.glowEffect, styles.glowBottom]} />

      <ScrollView
        style={[styles.scrollContainer, { paddingTop: insets.top }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Configure your AI assistants
          </ThemedText>
        </View>

        {/* AI Providers Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>AI Assistants</ThemedText>
          <ThemedText style={styles.sectionDescription}>
            Choose which AI models respond to your questions. At least one must
            be enabled.
          </ThemedText>

          {/* OpenAI GPT */}
          <View style={styles.providerCard}>
            <View style={styles.providerInfo}>
              <View style={styles.providerHeader}>
                <View
                  style={[
                    styles.providerIndicator,
                    { backgroundColor: "#10B981" },
                  ]}
                />
                <ThemedText style={styles.providerName}>
                  {getProviderInfo("openai").name}
                </ThemedText>
              </View>
              <ThemedText style={styles.providerDescription}>
                Advanced reasoning and comprehensive security analysis
              </ThemedText>
              {!getProviderInfo("openai").available && (
                <ThemedText style={styles.unavailableText}>
                  API key not configured
                </ThemedText>
              )}
            </View>
            <Switch
              value={aiProviderSettings.openai}
              onValueChange={() => {
                if (canDisable("openai") || !aiProviderSettings.openai) {
                  toggleAIProvider("openai");
                }
              }}
              disabled={
                !getProviderInfo("openai").available ||
                (!canDisable("openai") && aiProviderSettings.openai)
              }
              trackColor={{
                false: "rgba(77, 162, 255, 0.2)",
                true: SuiColors.sea,
              }}
              thumbColor={aiProviderSettings.openai ? "white" : "#f4f3f4"}
            />
          </View>

          {/* Google Gemini */}
          <View style={styles.providerCard}>
            <View style={styles.providerInfo}>
              <View style={styles.providerHeader}>
                <View
                  style={[
                    styles.providerIndicator,
                    { backgroundColor: "#3B82F6" },
                  ]}
                />
                <ThemedText style={styles.providerName}>
                  {getProviderInfo("gemini").name}
                </ThemedText>
              </View>
              <ThemedText style={styles.providerDescription}>
                Fast responses and practical security recommendations
              </ThemedText>
              {!getProviderInfo("gemini").available && (
                <ThemedText style={styles.unavailableText}>
                  API key not configured
                </ThemedText>
              )}
            </View>
            <Switch
              value={aiProviderSettings.gemini}
              onValueChange={() => {
                if (canDisable("gemini") || !aiProviderSettings.gemini) {
                  toggleAIProvider("gemini");
                }
              }}
              disabled={
                !getProviderInfo("gemini").available ||
                (!canDisable("gemini") && aiProviderSettings.gemini)
              }
              trackColor={{
                false: "rgba(77, 162, 255, 0.2)",
                true: SuiColors.sea,
              }}
              thumbColor={aiProviderSettings.gemini ? "white" : "#f4f3f4"}
            />
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <ThemedText style={styles.infoText}>
              💡 Enabled assistants will respond simultaneously in the chat. At
              least one assistant must remain enabled.
            </ThemedText>
          </View>
        </View>

        {/* Training Data Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Training Data</ThemedText>
          <ThemedText style={styles.sectionDescription}>
            User feedback helps improve AI responses. Data is stored locally.
          </ThemedText>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <ThemedText style={styles.statsTitle}>Collection Stats</ThemedText>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {trainingStats.total}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {trainingStats.withSelections}
                </ThemedText>
                <ThemedText style={styles.statLabel}>With Feedback</ThemedText>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {trainingStats.openaiWins}
                </ThemedText>
                <ThemedText style={styles.statLabel}>OpenAI Wins</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>
                  {trainingStats.geminiWins}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Gemini Wins</ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={exportTrainingData}
            >
              <ThemedText style={styles.actionButtonText}>
                Export Data
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={clearTrainingData}
            >
              <ThemedText style={styles.actionButtonText}>
                Clear Data
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Comparison Dashboard Button */}
          {trainingStats.withSelections > 0 && (
            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={() => router.push("/comparison")}
            >
              <View style={styles.dashboardButtonContent}>
                <IconSymbol
                  name="chart.bar.fill"
                  size={20}
                  color={SuiColors.aqua}
                />
                <View style={styles.dashboardButtonText}>
                  <ThemedText style={styles.dashboardButtonTitle}>
                    View AI Comparison Dashboard
                  </ThemedText>
                  <ThemedText style={styles.dashboardButtonSubtitle}>
                    Analyze model performance and trends
                  </ThemedText>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color="rgba(192, 230, 255, 0.6)"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SuiColors.deepOcean,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowEffect: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: SuiColors.sea,
    opacity: 0.05,
  },
  glowTop: {
    top: -100,
    right: -100,
  },
  glowBottom: {
    bottom: -100,
    left: -100,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
    marginBottom: 20,
    lineHeight: 20,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
    marginRight: 16,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  providerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  providerDescription: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
    lineHeight: 18,
  },
  unavailableText: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 4,
    fontStyle: "italic",
  },
  infoNote: {
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.8)",
    lineHeight: 18,
  },
  apiCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
  },
  apiTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  apiDescription: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
    lineHeight: 18,
  },
  statsCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 8,
    padding: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  dangerButton: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.2)",
  },
  dashboardButton: {
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  dashboardButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dashboardButtonText: {
    flex: 1,
    marginHorizontal: 12,
  },
  dashboardButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 4,
  },
  dashboardButtonSubtitle: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
  },
});
