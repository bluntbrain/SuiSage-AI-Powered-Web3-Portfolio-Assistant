import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
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
  AI_MODELS,
  CHAIN_CONFIGS,
} from "@/services/trainingDataService";

interface ExtendedPerformanceMetrics {
  totalSessions: number;
  withSelections: number;

  // Individual model stats
  modelStats: {
    modelId: string;
    name: string;
    totalSessions: number;
    wins: number;
    winRate: number;
  }[];

  // Chain combination stats
  chainStats: {
    chainId: string;
    name: string;
    models: string[];
    totalSessions: number;
    wins: number;
    winRate: number;
  }[];

  // Mode breakdown
  parallelSessions: number;
  chainSessions: number;
  universalSessions: number;

  // Recent trends
  recentTrend: {
    type: "model" | "chain" | "tied";
    id: string;
    name: string;
  };
}

interface CategoryAnalysis {
  security: { [optionId: string]: number };
  technical: { [optionId: string]: number };
  general: { [optionId: string]: number };
}

export default function ComparisonScreen() {
  const insets = useSafeAreaInsets();
  const [trainingData, setTrainingData] = useState<TrainingDataEntry[]>([]);
  const [metrics, setMetrics] = useState<ExtendedPerformanceMetrics>({
    totalSessions: 0,
    withSelections: 0,
    modelStats: [],
    chainStats: [],
    parallelSessions: 0,
    chainSessions: 0,
    universalSessions: 0,
    recentTrend: { type: "tied", id: "", name: "No trend available" },
  });
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis>({
    security: {},
    technical: {},
    general: {},
  });
  const [totalSelections, setTotalSelections] = useState<number>(0);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const extStats = await trainingDataService.getExtensibleStats();
      const data = await trainingDataService.getAllTrainingData();
      const validData = data.filter((entry) => entry.selectedOption !== null);

      setTrainingData(validData);

      // Calculate total selections for win rate calculation
      const totalSelections = validData.length;
      setTotalSelections(totalSelections);

      // Transform stats into extended metrics
      const modelStats = extStats.modelStats.map((stat) => ({
        modelId: stat.modelId,
        name: AI_MODELS[stat.modelId]?.name || stat.modelId,
        totalSessions: stat.totalSessions,
        wins: stat.wins,
        winRate: totalSelections > 0 ? (stat.wins / totalSelections) * 100 : 0,
      }));

      const chainStats = extStats.chainStats.map((stat, index) => ({
        chainId: `chain_${index}`,
        name: stat.chainConfig.name,
        models: stat.chainConfig.models,
        totalSessions: stat.totalSessions,
        wins: stat.wins,
        winRate: totalSelections > 0 ? (stat.wins / totalSelections) * 100 : 0,
      }));

      // Calculate recent trend (last 10 selections)
      const recent = validData.slice(0, 10);
      const recentSelections: { [optionId: string]: number } = {};

      recent.forEach((entry) => {
        if (entry.selectedOption) {
          recentSelections[entry.selectedOption] =
            (recentSelections[entry.selectedOption] || 0) + 1;
        }
      });

      let recentTrend: {
        type: "model" | "chain" | "tied";
        id: string;
        name: string;
      } = { type: "tied", id: "", name: "No clear trend" };
      let maxCount = 0;

      Object.entries(recentSelections).forEach(([optionId, count]) => {
        if (count > maxCount) {
          maxCount = count;

          // Determine if it's a model or chain
          if (optionId.startsWith("chain_")) {
            const chainIndex = parseInt(optionId.replace("chain_", ""));
            const chainConfig = CHAIN_CONFIGS[chainIndex];
            recentTrend = {
              type: "chain",
              id: optionId,
              name: chainConfig?.name || `Chain ${chainIndex + 1}`,
            };
          } else {
            const model = AI_MODELS[optionId];
            recentTrend = {
              type: "model",
              id: optionId,
              name: model?.name || optionId,
            };
          }
        }
      });

      setMetrics({
        totalSessions: extStats.totalSessions,
        withSelections: extStats.withSelections,
        modelStats,
        chainStats,
        parallelSessions: extStats.parallelSessions,
        chainSessions: extStats.chainSessions,
        universalSessions: extStats.universalSessions,
        recentTrend,
      });

      console.log("[Comparison] Progress bar data:");
      console.log("  Total selections:", totalSelections);
      console.log(
        "  Model stats:",
        modelStats.map((s) => ({
          name: s.name,
          wins: s.wins,
          winRate: s.winRate,
        }))
      );
      console.log(
        "  Chain stats:",
        chainStats.map((s) => ({
          name: s.name,
          wins: s.wins,
          winRate: s.winRate,
        }))
      );

      // Analyze by category with support for both models and chains
      const categories: CategoryAnalysis = {
        security: {},
        technical: {},
        general: {},
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

        if (entry.selectedOption) {
          categories[category][entry.selectedOption] =
            (categories[category][entry.selectedOption] || 0) + 1;
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
    label: string,
    subtitle?: string,
    modelId?: string
  ) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <View style={styles.progressLabelContainer}>
          {modelId ? (
            renderModelHeader(modelId, label)
          ) : (
            <ThemedText style={styles.progressLabel}>{label}</ThemedText>
          )}
          {subtitle && (
            <ThemedText style={styles.progressSubtitle}>{subtitle}</ThemedText>
          )}
        </View>
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

  const getOptionName = (optionId: string): string => {
    if (optionId.startsWith("chain_")) {
      const chainIndex = parseInt(optionId.replace("chain_", ""));
      return CHAIN_CONFIGS[chainIndex]?.name || `Chain ${chainIndex + 1}`;
    }
    return AI_MODELS[optionId]?.name || optionId;
  };

  const getOptionColor = (optionId: string): string => {
    if (optionId.startsWith("chain_")) {
      const chainIndex = parseInt(optionId.replace("chain_", ""));
      return chainIndex === 0 ? "#8B5CF6" : "#F59E0B";
    }
    switch (optionId) {
      case "openai":
        return "#10B981";
      case "gemini":
        return "#3B82F6";
      default:
        return SuiColors.aqua;
    }
  };

  const getAILogo = (modelId: string) => {
    switch (modelId) {
      case "openai":
        return require("@/assets/images/chatgpt.png");
      case "gemini":
        return require("@/assets/images/gemini.png");
      default:
        return null;
    }
  };

  const renderModelHeader = (modelId: string, name: string) => {
    const logo = getAILogo(modelId);

    return (
      <View style={styles.modelHeaderContainer}>
        {logo ? (
          <Image source={logo} style={styles.modelLogo} resizeMode="contain" />
        ) : (
          <View
            style={[
              styles.modelIndicator,
              { backgroundColor: getOptionColor(modelId) },
            ]}
          />
        )}
        <ThemedText style={styles.progressLabel}>{name}</ThemedText>
      </View>
    );
  };

  const renderChainIndicator = (models: string[]) => (
    <View style={styles.chainFlowIndicator}>
      {models.map((modelId, index) => (
        <View key={index} style={styles.chainStep}>
          {index > 0 && (
            <IconSymbol
              name="arrow.right"
              size={8}
              color="rgba(192, 230, 255, 0.6)"
              style={styles.chainArrow}
            />
          )}
          <View style={styles.chainStepContainer}>
            {getAILogo(modelId) ? (
              <Image
                source={getAILogo(modelId)!}
                style={styles.chainStepLogo}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.chainStepBadge,
                  {
                    backgroundColor:
                      modelId === "openai" ? "#10B981" : "#3B82F6",
                  },
                ]}
              >
                <ThemedText style={styles.chainStepText}>
                  {modelId === "openai" ? "GPT" : "GEM"}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const getTrendIcon = (trend: ExtendedPerformanceMetrics["recentTrend"]) => {
    if (trend.type === "tied") return "➖";
    return trend.type === "chain" ? "🔗" : "🤖";
  };

  // Get the leading option overall
  const getLeadingOption = () => {
    const allOptions = [
      ...metrics.modelStats.map((s) => ({ ...s, type: "model" as const })),
      ...metrics.chainStats.map((s) => ({ ...s, type: "chain" as const })),
    ];

    return allOptions.reduce(
      (leader, current) => (current.wins > leader.wins ? current : leader),
      {
        wins: 0,
        name: "No data",
        type: "model" as const,
        modelId: "",
        totalSessions: 0,
        winRate: 0,
      }
    );
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
            AI Model & Chain Comparison
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Performance insights from {metrics.withSelections} user selections (
            {metrics.totalSessions} total sessions)
          </ThemedText>
        </View>

        {/* Mode Overview */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Usage Overview</ThemedText>
          <View style={styles.modeCard}>
            <View style={styles.modeItem}>
              <ThemedText style={styles.modeLabel}>Parallel Mode</ThemedText>
              <ThemedText style={styles.modeValue}>
                {metrics.parallelSessions} sessions
              </ThemedText>
            </View>
            <View style={styles.modeItem}>
              <ThemedText style={styles.modeLabel}>Chain Mode</ThemedText>
              <ThemedText style={styles.modeValue}>
                {metrics.chainSessions} sessions
              </ThemedText>
            </View>
            <View style={styles.modeItem}>
              <ThemedText style={styles.modeLabel}>Universal Mode</ThemedText>
              <ThemedText style={styles.modeValue}>
                {metrics.universalSessions} sessions
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Individual Model Performance */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Individual Models</ThemedText>
          <View style={styles.metricsCard}>
            {metrics.modelStats.map((stat) =>
              renderProgressBar(
                stat.winRate,
                getOptionColor(stat.modelId),
                stat.name,
                `${stat.wins} selections out of ${totalSelections} comparisons`,
                stat.modelId
              )
            )}
          </View>
        </View>

        {/* Chain Combination Performance */}
        {metrics.chainStats.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Chain Combinations
            </ThemedText>
            <View style={styles.metricsCard}>
              {metrics.chainStats.map((stat) => (
                <View key={stat.chainId} style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelContainer}>
                      <View style={styles.chainLabelRow}>
                        <ThemedText style={styles.progressLabel}>
                          {stat.name}
                        </ThemedText>
                        {renderChainIndicator(stat.models)}
                      </View>
                      <ThemedText style={styles.progressSubtitle}>
                        {stat.wins} selections out of {totalSelections}{" "}
                        comparisons
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.progressValue}>
                      {stat.winRate.toFixed(1)}%
                    </ThemedText>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stat.winRate}%`,
                          backgroundColor: getOptionColor(stat.chainId),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Performance by Category
          </ThemedText>

          {Object.entries(categoryAnalysis).map(([category, data]) => {
            const dataEntries = Object.entries(data) as [string, number][];
            const total = dataEntries.reduce(
              (sum, [, count]) => sum + count,
              0
            );
            if (total === 0) return null;

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
                  {dataEntries
                    .sort(([, a], [, b]) => b - a)
                    .map(([optionId, count]) => {
                      const percentage = (count / total) * 100;
                      return (
                        <View key={optionId} style={styles.categoryStat}>
                          <View
                            style={[
                              styles.categoryIndicator,
                              { backgroundColor: getOptionColor(optionId) },
                            ]}
                          />
                          <ThemedText style={styles.categoryStatText}>
                            {getOptionName(optionId)}: {count} (
                            {percentage.toFixed(0)}%)
                          </ThemedText>
                          {optionId.startsWith("chain_") && (
                            <View style={styles.categoryChainIndicator}>
                              {renderChainIndicator(
                                CHAIN_CONFIGS[
                                  parseInt(optionId.replace("chain_", ""))
                                ]?.models || []
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              </View>
            );
          })}
        </View>

        {/* Key Insights */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Key Insights</ThemedText>

          <View style={styles.insightsCard}>
            {metrics.withSelections === 0 ? (
              <ThemedText style={styles.insightText}>
                No comparison data available yet. Start chatting with AI
                assistants and select better responses to see insights.
              </ThemedText>
            ) : (
              <>
                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    🏆 Overall Leader:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {getLeadingOption().name} ({getLeadingOption().type})
                  </ThemedText>
                </View>

                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    📊 Selection Rate:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {(
                      (metrics.withSelections / metrics.totalSessions) *
                      100
                    ).toFixed(1)}
                    % of sessions have user selections
                  </ThemedText>
                </View>

                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    🔄 Recent Trend:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {getTrendIcon(metrics.recentTrend)}{" "}
                    {metrics.recentTrend.name}
                  </ThemedText>
                </View>

                <View style={styles.insight}>
                  <ThemedText style={styles.insightLabel}>
                    🎯 Preferred Mode:
                  </ThemedText>
                  <ThemedText style={styles.insightValue}>
                    {metrics.universalSessions > metrics.parallelSessions &&
                    metrics.universalSessions > metrics.chainSessions
                      ? "Universal (Complete Comparison)"
                      : metrics.parallelSessions > metrics.chainSessions
                      ? "Parallel (Individual Models)"
                      : metrics.chainSessions > metrics.parallelSessions
                      ? "Chain (Sequential Processing)"
                      : "Balanced Usage"}
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
  modeCard: {
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modeItem: {
    alignItems: "center",
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 4,
  },
  modeValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgba(192, 230, 255, 0.9)",
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  progressLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  progressSubtitle: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.6)",
    marginTop: 2,
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
  chainLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  chainFlowIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  chainStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  chainStepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  chainStepLogo: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  chainStepBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  chainStepText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  chainArrow: {
    marginRight: 4,
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
    flex: 1,
  },
  categoryChainIndicator: {
    marginLeft: 8,
  },
  trendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 162, 255, 0.1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
  },
  trendValue: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
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
    fontWeight: "600",
    color: "rgba(192, 230, 255, 0.8)",
    flex: 1,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
    textAlign: "right",
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  modelHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modelLogo: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  modelIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
});
