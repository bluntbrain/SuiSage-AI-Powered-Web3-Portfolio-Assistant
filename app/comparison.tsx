import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import {
  trainingDataService,
  TrainingDataEntry,
} from "@/services/trainingDataService";

interface PerformanceMetrics {
  totalResponses: number;
  openaiWins: number;
  geminiWins: number;
  openaiWinRate: number;
  geminiWinRate: number;
  recentTrend: "openai" | "gemini" | "tied";
  averageResponseTime?: number;
}

interface CategoryAnalysis {
  security: { openai: number; gemini: number };
  technical: { openai: number; gemini: number };
  general: { openai: number; gemini: number };
}

export default function ComparisonScreen() {
  const insets = useSafeAreaInsets();
  const [trainingData, setTrainingData] = useState<TrainingDataEntry[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalResponses: 0,
    openaiWins: 0,
    geminiWins: 0,
    openaiWinRate: 0,
    geminiWinRate: 0,
    recentTrend: "tied",
  });
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis>({
    security: { openai: 0, gemini: 0 },
    technical: { openai: 0, gemini: 0 },
    general: { openai: 0, gemini: 0 },
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const data = await trainingDataService.getAllTrainingData();
      const validData = data.filter((entry) => entry.selectedBetter !== null);

      setTrainingData(validData);

      // Calculate performance metrics
      const openaiWins = validData.filter(
        (entry) => entry.selectedBetter === "openai"
      ).length;
      const geminiWins = validData.filter(
        (entry) => entry.selectedBetter === "gemini"
      ).length;
      const total = validData.length;

      // Recent trend (last 10 selections)
      const recent = validData.slice(0, 10);
      const recentOpenaiWins = recent.filter(
        (entry) => entry.selectedBetter === "openai"
      ).length;
      const recentGeminiWins = recent.filter(
        (entry) => entry.selectedBetter === "gemini"
      ).length;

      let recentTrend: "openai" | "gemini" | "tied" = "tied";
      if (recentOpenaiWins > recentGeminiWins) recentTrend = "openai";
      else if (recentGeminiWins > recentOpenaiWins) recentTrend = "gemini";

      setMetrics({
        totalResponses: total,
        openaiWins,
        geminiWins,
        openaiWinRate: total > 0 ? (openaiWins / total) * 100 : 0,
        geminiWinRate: total > 0 ? (geminiWins / total) * 100 : 0,
        recentTrend,
      });

      // Analyze by category (simple keyword-based categorization)
      const categories = {
        security: { openai: 0, gemini: 0 },
        technical: { openai: 0, gemini: 0 },
        general: { openai: 0, gemini: 0 },
      };

      validData.forEach((entry) => {
        const question = entry.question.toLowerCase();
        let category: keyof CategoryAnalysis = "general";

        if (
          question.includes("security") ||
          question.includes("safe") ||
          question.includes("risk") ||
          question.includes("hack")
        ) {
          category = "security";
        } else if (
          question.includes("technical") ||
          question.includes("code") ||
          question.includes("develop") ||
          question.includes("smart contract")
        ) {
          category = "technical";
        }

        if (entry.selectedBetter) {
          categories[category][entry.selectedBetter]++;
        }
      });

      setCategoryAnalysis(categories);
    } catch (error) {
      console.error("[Comparison] Failed to load analytics:", error);
    }
  };

  const renderProgressBar = (
    percentage: number,
    color: string,
    label: string
  ) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <ThemedText style={styles.progressLabel}>{label}</ThemedText>
        <ThemedText style={styles.progressValue}>
          {percentage.toFixed(1)}%
        </ThemedText>
      </View>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "openai":
        return "📈 OpenAI Leading";
      case "gemini":
        return "📈 Gemini Leading";
      default:
        return "➖ Tied Performance";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="transparent"
      />

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
        {/* Header with Back Button */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <IconSymbol
                name="chevron.left"
                size={20}
                color={SuiColors.aqua}
              />
              <ThemedText style={styles.backText}>Settings</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadAnalyticsData}
            >
              <IconSymbol
                name="arrow.clockwise"
                size={20}
                color={SuiColors.aqua}
              />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.headerTitle}>
            AI Model Comparison
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Performance insights from {metrics.totalResponses} user selections
          </ThemedText>
        </View>

        {/* Overall Performance */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Overall Performance
          </ThemedText>

          <View style={styles.metricsCard}>
            {renderProgressBar(
              metrics.openaiWinRate,
              "#10B981",
              "OpenAI GPT-4o-mini"
            )}
            {renderProgressBar(
              metrics.geminiWinRate,
              "#3B82F6",
              "Google Gemini 2.0 Flash"
            )}

            <View style={styles.trendContainer}>
              <ThemedText style={styles.trendLabel}>
                Recent Trend (Last 10):
              </ThemedText>
              <ThemedText style={styles.trendValue}>
                {getTrendIcon(metrics.recentTrend)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Performance by Category
          </ThemedText>

          {Object.entries(categoryAnalysis).map(([category, data]) => {
            const total = data.openai + data.gemini;
            if (total === 0) return null;

            const openaiPercentage = (data.openai / total) * 100;
            const geminiPercentage = (data.gemini / total) * 100;

            return (
              <View key={category} style={styles.categoryCard}>
                <ThemedText style={styles.categoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                  Questions
                </ThemedText>
                <ThemedText style={styles.categorySubtitle}>
                  {total} total comparisons
                </ThemedText>

                <View style={styles.categoryStats}>
                  <View style={styles.categoryStat}>
                    <View
                      style={[
                        styles.categoryIndicator,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <ThemedText style={styles.categoryStatText}>
                      OpenAI: {data.openai} ({openaiPercentage.toFixed(0)}%)
                    </ThemedText>
                  </View>
                  <View style={styles.categoryStat}>
                    <View
                      style={[
                        styles.categoryIndicator,
                        { backgroundColor: "#3B82F6" },
                      ]}
                    />
                    <ThemedText style={styles.categoryStatText}>
                      Gemini: {data.gemini} ({geminiPercentage.toFixed(0)}%)
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Key Insights</ThemedText>

          <View style={styles.insightsCard}>
            {metrics.totalResponses === 0 ? (
              <ThemedText style={styles.insightText}>
                No comparison data available yet. Start chatting with AI
                assistants and select better responses to see insights.
              </ThemedText>
            ) : (
              <>
                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    🏆 Leading Model:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {metrics.openaiWins > metrics.geminiWins
                      ? "OpenAI GPT-4o-mini"
                      : metrics.geminiWins > metrics.openaiWins
                      ? "Google Gemini 2.0 Flash"
                      : "Tied Performance"}
                  </ThemedText>
                </View>

                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    📊 Win Margin:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {Math.abs(metrics.openaiWins - metrics.geminiWins)}{" "}
                    selections
                  </ThemedText>
                </View>

                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    💡 Best Category:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {Object.entries(categoryAnalysis)
                      .reduce((best, [category, data]) => {
                        const total = data.openai + data.gemini;
                        const bestTotal =
                          categoryAnalysis[best as keyof CategoryAnalysis]
                            .openai +
                          categoryAnalysis[best as keyof CategoryAnalysis]
                            .gemini;
                        return total > bestTotal ? category : best;
                      }, "general")
                      .charAt(0)
                      .toUpperCase() +
                      Object.entries(categoryAnalysis)
                        .reduce((best, [category, data]) => {
                          const total = data.openai + data.gemini;
                          const bestTotal =
                            categoryAnalysis[best as keyof CategoryAnalysis]
                              .openai +
                            categoryAnalysis[best as keyof CategoryAnalysis]
                              .gemini;
                          return total > bestTotal ? category : best;
                        }, "general")
                        .slice(1)}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    color: SuiColors.aqua,
    marginLeft: 4,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-end",
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
    marginBottom: 16,
  },
  metricsCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 162, 255, 0.1)",
  },
  trendLabel: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
  },
  trendValue: {
    fontSize: 13,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  categoryCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.6)",
    marginBottom: 12,
  },
  categoryStats: {
    gap: 8,
  },
  categoryStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryStatText: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.8)",
  },
  insightsCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 20,
  },
  insight: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
    flex: 1,
    textAlign: "right",
  },
  insightText: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
});
