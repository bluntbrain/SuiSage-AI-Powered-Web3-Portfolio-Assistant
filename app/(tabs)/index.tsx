import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { NetworkDropdown } from "@/components/NetworkDropdown";
import { SuiColors } from "@/constants/Colors";
import { suiService, WalletData } from "@/services/suiService";
import { aiService, AnalysisResult } from "@/services/aiService";

export default function HomeScreen() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<
    "mainnet" | "testnet" | "devnet" | "localnet"
  >("testnet");

  const handleNetworkChange = (
    network: "mainnet" | "testnet" | "devnet" | "localnet"
  ) => {
    setSelectedNetwork(network);
    suiService.switchNetwork(network);

    setWalletData(null);
    setAnalysis(null);

    Alert.alert(
      "Network Switched",
      `Now connected to ${network.charAt(0).toUpperCase() + network.slice(1)}`,
      [{ text: "OK" }]
    );
  };

  const handleAnalyzeWallet = async () => {
    if (!walletAddress.trim()) {
      Alert.alert("Error", "Please enter a valid Sui wallet address");
      return;
    }

    if (!walletAddress.startsWith("0x") || walletAddress.length !== 66) {
      Alert.alert(
        "Error",
        "Please enter a valid Sui address (0x... format, 66 characters)"
      );
      return;
    }

    setLoading(true);
    try {
      const data = await suiService.getWalletData(walletAddress);
      setWalletData(data);

      // Start AI analysis
      setAnalysisLoading(true);
      const aiResult = await aiService.analyzeWallet(data);
      setAnalysis(aiResult);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to fetch wallet data"
      );
    } finally {
      setLoading(false);
      setAnalysisLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#FF6B6B";
      case "medium":
        return "#FFE66D";
      case "low":
        return "#4ECDC4";
      default:
        return SuiColors.sea;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "#4ECDC4";
      case "good":
        return "#95E1D3";
      case "fair":
        return "#FFE66D";
      case "poor":
        return "#FF6B6B";
      default:
        return SuiColors.sea;
    }
  };

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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard
          style={styles.headerCard}
          glowIntensity="high"
          intensity={30}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ThemedText type="title" style={styles.title}>
                SuiSage
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                AI-Powered Web3 Portfolio Assistant
              </ThemedText>
            </View>
            <View style={styles.headerRight}>
              <NetworkDropdown
                selectedNetwork={selectedNetwork}
                onNetworkChange={handleNetworkChange}
              />
            </View>
          </View>
        </GlassCard>

        <GlassCard
          style={styles.inputCard}
          intensity={25}
          glowIntensity="medium"
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Enter Sui Wallet Address
          </ThemedText>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor="rgba(192, 230, 255, 0.6)"
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.analyzeButton, loading && styles.disabledButton]}
              onPress={handleAnalyzeWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>Analyze</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {walletData && (
          <GlassCard
            style={styles.portfolioCard}
            intensity={25}
            glowIntensity="medium"
          >
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Portfolio Overview
            </ThemedText>
            <View style={styles.balanceContainer}>
              <ThemedText style={styles.balanceLabel}>SUI Balance</ThemedText>
              <ThemedText style={styles.balanceValue}>
                {walletData.balance.toFixed(4)} SUI
              </ThemedText>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {walletData.assets.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Assets</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {walletData.transactions.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Recent Txs</ThemedText>
              </View>
            </View>
          </GlassCard>
        )}

        {analysisLoading && (
          <GlassCard
            style={styles.loadingCard}
            intensity={30}
            glowIntensity="high"
          >
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={SuiColors.sea} size="large" />
              <ThemedText style={styles.loadingText}>
                AI is analyzing your portfolio...
              </ThemedText>
            </View>
          </GlassCard>
        )}

        {analysis && (
          <>
            <GlassCard
              style={styles.healthCard}
              intensity={25}
              glowIntensity="medium"
            >
              <View style={styles.healthHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Portfolio Health
                </ThemedText>
                <View
                  style={[
                    styles.healthBadge,
                    {
                      backgroundColor: getHealthColor(analysis.portfolioHealth),
                    },
                  ]}
                >
                  <ThemedText style={styles.healthText}>
                    {analysis.portfolioHealth.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.summary}>{analysis.summary}</ThemedText>
              <View style={styles.riskContainer}>
                <ThemedText style={styles.riskLabel}>Risk Score</ThemedText>
                <ThemedText
                  style={[
                    styles.riskScore,
                    {
                      color:
                        analysis.riskScore > 7
                          ? "#FF6B6B"
                          : analysis.riskScore > 4
                          ? "#FFE66D"
                          : "#4ECDC4",
                    },
                  ]}
                >
                  {analysis.riskScore}/10
                </ThemedText>
              </View>
            </GlassCard>

            <GlassCard
              style={styles.adviceCard}
              intensity={25}
              glowIntensity="medium"
            >
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                AI Recommendations
              </ThemedText>
              {analysis.advice.map((advice, index) => (
                <View key={index} style={styles.adviceItem}>
                  <View style={styles.adviceHeader}>
                    <ThemedText style={styles.adviceTitle}>
                      {advice.title}
                    </ThemedText>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(advice.priority) },
                      ]}
                    >
                      <ThemedText style={styles.priorityText}>
                        {advice.priority.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.adviceDescription}>
                    {advice.description}
                  </ThemedText>
                  {advice.estimatedSavings && (
                    <ThemedText style={styles.savingsText}>
                      💰 Potential savings: {advice.estimatedSavings}
                    </ThemedText>
                  )}
                </View>
              ))}
            </GlassCard>
          </>
        )}

        <View style={styles.bottomSpace} />
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: SuiColors.sea,
    opacity: 0.1,
  },
  glowTop: {
    top: -150,
    right: -100,
  },
  glowBottom: {
    bottom: -150,
    left: -100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  headerCard: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
    textAlign: "center",
  },
  inputCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: "rgba(77, 162, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: SuiColors.aqua,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.3)",
  },
  analyzeButton: {
    backgroundColor: SuiColors.sea,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  portfolioCard: {
    marginBottom: 20,
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: SuiColors.sea,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: SuiColors.aqua,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
    marginTop: 4,
  },
  loadingCard: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: SuiColors.aqua,
    marginTop: 12,
    fontSize: 16,
  },
  healthCard: {
    marginBottom: 20,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  summary: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.9)",
    lineHeight: 24,
    marginBottom: 16,
  },
  riskContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riskLabel: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
  },
  riskScore: {
    fontSize: 18,
    fontWeight: "bold",
  },
  adviceCard: {
    marginBottom: 20,
  },
  adviceItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.2)",
  },
  adviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
  },
  adviceDescription: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.8)",
    lineHeight: 20,
    marginBottom: 8,
  },
  savingsText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  bottomSpace: {
    height: 40,
  },
});
