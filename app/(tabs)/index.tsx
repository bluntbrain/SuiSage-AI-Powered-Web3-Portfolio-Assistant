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
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { NetworkDropdown } from "@/components/NetworkDropdown";
import { SuiColors } from "@/constants/Colors";
import { suiService } from "@/services/suiService";
import { aiService, AnalysisResult } from "@/services/aiService";
import { coingeckoService } from "@/services/coingeckoService";
import { useWallet } from "@/contexts/WalletContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const [walletAddress, setWalletAddress] = useState("");
  const { walletData, setWalletData, suiPrice, setSuiPrice } = useWallet();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<
    "mainnet" | "testnet" | "devnet" | "localnet"
  >("testnet");
  const router = useRouter();

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
      // Fetch wallet data and SUI price in parallel
      const [data, price] = await Promise.all([
        suiService.getWalletData(walletAddress),
        coingeckoService.getSuiPrice(),
      ]);

      setWalletData(data);
      setSuiPrice(price);

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

  const formatDate = (timestamp: number | string) => {
    try {
      // Convert string to number if needed
      const ts =
        typeof timestamp === "string" ? parseInt(timestamp) : timestamp;

      // Ensure we have a valid timestamp
      if (!ts || ts <= 0) {
        return "Unknown date";
      }

      const date = new Date(ts);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Date error";
    }
  };

  const formatGas = (gasUsed: number) => {
    if (!gasUsed || gasUsed <= 0) {
      return "0.000 MIST";
    }
    return `${(gasUsed / 1000000).toFixed(3)} MIST`;
  };

  const getTransactionIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case "programmabletransaction":
        return "⚡";
      case "transferobject":
        return "📤";
      case "publish":
        return "📋";
      case "call":
        return "🔗";
      default:
        return "📝";
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? "#4ECDC4" : "#FF6B6B";
  };

  const handleTransactionPress = (transaction: any) => {
    // Check if explorerUrl exists
    if (!transaction.explorerUrl) {
      Alert.alert("Error", "Explorer URL not available for this transaction");
      return;
    }

    Alert.alert(
      "Transaction Options",
      `Transaction: ${transaction.digest.slice(
        0,
        8
      )}...${transaction.digest.slice(-8)}`,
      [
        {
          text: "View in Explorer",
          onPress: () => {
            if (transaction.explorerUrl) {
              Linking.openURL(transaction.explorerUrl);
            } else {
              Alert.alert("Error", "Explorer URL not available");
            }
          },
        },
        {
          text: "Copy Digest",
          onPress: () => {
            // In a real app, you'd use Clipboard.setString
            Alert.alert("Copied", "Transaction digest copied to clipboard");
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleViewMoreTransactions = () => {
    router.push("/explore");
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
        {/* Clean header without card */}
        <View style={styles.headerSection}>
          <View style={styles.titleArea}>
            <ThemedText style={styles.mainTitle}>SuiSage</ThemedText>
            <ThemedText style={styles.mainSubtitle}>
              AI Web3 Portfolio Assistant
            </ThemedText>
          </View>
          <View style={styles.networkArea}>
            <NetworkDropdown
              selectedNetwork={selectedNetwork}
              onNetworkChange={handleNetworkChange}
            />
          </View>
        </View>

        {/* Input section with minimal card styling */}
        <View style={styles.inputSection}>
          <ThemedText style={styles.sectionLabel}>
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
        </View>

        {/* Portfolio overview without heavy card styling */}
        {walletData && (
          <View style={styles.portfolioSection}>
            <ThemedText style={styles.sectionLabel}>
              Portfolio Overview
            </ThemedText>
            <View style={styles.balanceDisplay}>
              <ThemedText style={styles.balanceLabel}>SUI Balance</ThemedText>
              <ThemedText style={styles.balanceValue}>
                {walletData.balance.toFixed(4)} SUI
              </ThemedText>
              {suiPrice && (
                <ThemedText style={styles.balanceUsd}>
                  {coingeckoService.formatUsdValue(
                    coingeckoService.convertSuiToUsd(
                      walletData.balance,
                      suiPrice
                    )
                  )}
                </ThemedText>
              )}
            </View>
          </View>
        )}

        {/* Transactions with minimal card styling */}
        {walletData && walletData.transactions.length > 0 && (
          <View style={styles.transactionsSection}>
            <ThemedText style={styles.sectionLabel}>
              Recent Transactions
            </ThemedText>
            <View style={styles.transactionsList}>
              {walletData.transactions.slice(0, 3).map((tx, index) => (
                <TouchableOpacity
                  key={tx.digest}
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(tx)}
                >
                  <View style={styles.transactionCard}>
                    {/* Single row with icon, type, and status */}
                    <View style={styles.transactionMainRow}>
                      <View style={styles.leftSection}>
                        <ThemedText style={styles.transactionIcon}>
                          {getTransactionIcon(tx.kind)}
                        </ThemedText>
                        <View style={styles.transactionInfo}>
                          <ThemedText style={styles.transactionType}>
                            {tx.kind === "ProgrammableTransaction"
                              ? "Contract Call"
                              : tx.kind}
                          </ThemedText>
                          <ThemedText style={styles.transactionTime}>
                            {formatDate(tx.timestamp)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.rightSection}>
                        <View style={styles.statusContainer}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(tx.success) },
                            ]}
                          />
                          <ThemedText
                            style={[
                              styles.statusLabel,
                              { color: getStatusColor(tx.success) },
                            ]}
                          >
                            {tx.success ? "Success" : "Failed"}
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Compact info row */}
                    <View style={styles.infoRow}>
                      <View style={styles.gasInfo}>
                        <ThemedText style={styles.infoLabel}>Gas: </ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {formatGas(tx.gasUsed)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.explorerHint}>
                        🔗 View on Explorer
                      </ThemedText>
                    </View>

                    {/* Transaction ID - compact */}
                    <View style={styles.idRow}>
                      <ThemedText style={styles.idPrefix}>ID: </ThemedText>
                      <ThemedText style={styles.idValue} numberOfLines={1}>
                        {tx.digest}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {walletData.transactions.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={handleViewMoreTransactions}
              >
                <ThemedText style={styles.viewMoreText}>
                  View all {walletData.transactions.length} transactions →
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
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
                <ThemedText type="subtitle" style={styles.sectionLabel}>
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
              <ThemedText type="subtitle" style={styles.sectionLabel}>
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
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleArea: {
    flex: 1,
    alignItems: "flex-start",
    marginBottom: 0,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginTop: 8,
    textAlign: "left",
  },
  mainSubtitle: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
    textAlign: "left",
  },
  networkArea: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  inputSection: {
    marginBottom: 30,
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
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
  portfolioSection: {
    marginBottom: 2,
  },
  balanceDisplay: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(77, 162, 255, 0.03)",
    borderRadius: 16,
    padding: 20,
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
    lineHeight: 32,
  },
  balanceUsd: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.8)",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderRadius: 12,
    padding: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
  },
  statNumber: {
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
  transactionsSection: {
    marginBottom: 20,
  },
  transactionsList: {
    backgroundColor: "rgba(77, 162, 255, 0.02)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
  },
  transactionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.2)",
  },
  transactionCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.2)",
    borderRadius: 12,
    gap: 8,
  },
  transactionMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  transactionInfo: {
    flexDirection: "column",
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  transactionTime: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.8)",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gasInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.8)",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.sea,
  },
  explorerHint: {
    fontSize: 12,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  idPrefix: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.8)",
  },
  idValue: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.8)",
    flex: 1,
  },
  viewMoreButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 162, 255, 0.2)",
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
});
