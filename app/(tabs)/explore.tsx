import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { SuiColors } from "@/constants/Colors";
import { Transaction } from "@/services/suiService";
import { useWallet } from "@/contexts/WalletContext";

export default function TransactionHistoryScreen() {
  const { walletData } = useWallet();
  const transactions = walletData?.transactions || [];

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

  const handleTransactionPress = (transaction: Transaction) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={[SuiColors.ocean, SuiColors.deepOcean]}
        style={styles.backgroundGradient}
      />

      {/* Background Glow Effects */}
      <View style={[styles.glowEffect, styles.glowLeft]} />
      <View style={[styles.glowEffect, styles.glowRight]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean header without card */}
        <View style={styles.headerSection}>
          <View style={styles.titleArea}>
            <ThemedText style={styles.mainTitle}>
              Transaction History
            </ThemedText>
            <ThemedText style={styles.mainSubtitle}>
              {walletData?.address
                ? `for ${walletData.address.slice(
                    0,
                    8
                  )}...${walletData.address.slice(-8)}`
                : "Recent blockchain activities"}
            </ThemedText>
          </View>
        </View>

        {/* Stats section in one line above transactions */}
        {transactions.length > 0 && (
          <View style={styles.statsSection}>
            <ThemedText style={styles.sectionLabel}>Statistics</ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {transactions.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Total Txs</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {transactions.filter((tx) => tx.success).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Successful</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {(
                    transactions.reduce((sum, tx) => sum + tx.gasUsed, 0) /
                    1000000
                  ).toFixed(1)}
                </ThemedText>
                <ThemedText style={styles.statLabel}>MIST Used</ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText style={styles.statNumber}>
                  {transactions.length > 0
                    ? (
                        (transactions.filter((tx) => tx.success).length /
                          transactions.length) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </ThemedText>
                <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <View style={styles.transactionsSection}>
            <ThemedText style={styles.sectionLabel}>
              All Transactions ({transactions.length})
            </ThemedText>
            <View style={styles.transactionsList}>
              {transactions.map((tx, index) => (
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
          </View>
        ) : (
          <View style={styles.emptySection}>
            <ThemedText style={styles.emptyIcon}>📊</ThemedText>
            <ThemedText style={styles.emptyTitle}>No Transactions</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              {walletData
                ? "This wallet has no recent transactions"
                : "Enter a wallet address on the Dashboard to view transaction history"}
            </ThemedText>
          </View>
        )}
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
    opacity: 0.08,
  },
  glowLeft: {
    top: 100,
    left: -100,
  },
  glowRight: {
    bottom: 200,
    right: -100,
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
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  titleArea: {
    flex: 1,
    alignItems: "flex-start",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginBottom: 8,
    textAlign: "left",
  },
  mainSubtitle: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
    textAlign: "left",
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  transactionsList: {
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.1)",
  },
  transactionCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
    borderRadius: 12,
  },
  transactionMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    fontSize: 18,
  },
  transactionInfo: {
    flexDirection: "column",
    marginLeft: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  transactionTime: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
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
    marginBottom: 4,
  },
  gasInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.6)",
  },
  infoValue: {
    fontSize: 14,
    color: SuiColors.aqua,
    fontWeight: "500",
  },
  explorerHint: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  idRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  idPrefix: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.6)",
  },
  idValue: {
    fontSize: 14,
    color: SuiColors.sea,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: SuiColors.sea,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(192, 230, 255, 0.7)",
    textAlign: "center",
    fontWeight: "500",
  },
});
