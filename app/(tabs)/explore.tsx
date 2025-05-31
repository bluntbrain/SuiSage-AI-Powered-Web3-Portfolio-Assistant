import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { SuiColors } from "@/constants/Colors";
import { Transaction } from "@/services/suiService";

export default function TransactionHistoryScreen() {
  // This will be populated when a wallet is analyzed from the dashboard
  const [transactions] = useState<Transaction[]>([]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatGas = (gasUsed: number) => {
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
        {/* Header */}
        <GlassCard style={styles.headerCard} glowIntensity="high">
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Transaction History
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Recent blockchain activities
            </ThemedText>
          </View>
        </GlassCard>

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <GlassCard style={styles.transactionsCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Transactions
            </ThemedText>
            {transactions.map((tx, index) => (
              <TouchableOpacity
                key={tx.digest}
                style={[
                  styles.transactionItem,
                  index === transactions.length - 1 && styles.lastTransaction,
                ]}
                onPress={() => {
                  Alert.alert(
                    "Transaction Details",
                    `Digest: ${tx.digest}\nGas Used: ${formatGas(
                      tx.gasUsed
                    )}\nStatus: ${tx.success ? "Success" : "Failed"}`,
                    [{ text: "OK" }]
                  );
                }}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionTitleRow}>
                      <ThemedText style={styles.transactionIcon}>
                        {getTransactionIcon(tx.kind)}
                      </ThemedText>
                      <ThemedText style={styles.transactionType}>
                        {tx.kind}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.transactionTime}>
                      {formatDate(tx.timestamp)}
                    </ThemedText>
                  </View>
                  <View style={styles.transactionStatus}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(tx.success) },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(tx.success) },
                      ]}
                    >
                      {tx.success ? "Success" : "Failed"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>
                      Gas Used:
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {formatGas(tx.gasUsed)}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Digest:</ThemedText>
                    <ThemedText style={styles.digestValue} numberOfLines={1}>
                      {tx.digest}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </GlassCard>
        ) : (
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyIcon}>📊</ThemedText>
              <ThemedText style={styles.emptyTitle}>No Transactions</ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Enter a wallet address on the Dashboard to view transaction
                history
              </ThemedText>
            </View>
          </GlassCard>
        )}

        {/* Stats Card */}
        {transactions.length > 0 && (
          <GlassCard style={styles.statsCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Statistics
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statNumber}>
                  {transactions.length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Total Txs</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statNumber}>
                  {transactions.filter((tx) => tx.success).length}
                </ThemedText>
                <ThemedText style={styles.statLabel}>Successful</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statNumber}>
                  {(
                    transactions.reduce((sum, tx) => sum + tx.gasUsed, 0) /
                    1000000
                  ).toFixed(1)}
                </ThemedText>
                <ThemedText style={styles.statLabel}>MIST Used</ThemedText>
              </View>
              <View style={styles.statBox}>
                <ThemedText style={styles.statNumber}>
                  {(
                    (transactions.filter((tx) => tx.success).length /
                      transactions.length) *
                    100
                  ).toFixed(0)}
                  %
                </ThemedText>
                <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
              </View>
            </View>
          </GlassCard>
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
  headerCard: {
    marginBottom: 20,
  },
  header: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: SuiColors.aqua,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(192, 230, 255, 0.8)",
    textAlign: "center",
  },
  transactionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: SuiColors.aqua,
    marginBottom: 16,
  },
  transactionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.1)",
  },
  lastTransaction: {
    borderBottomWidth: 0,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  transactionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: SuiColors.aqua,
    flex: 1,
  },
  transactionTime: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.7)",
  },
  transactionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  transactionDetails: {
    paddingLeft: 26,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(192, 230, 255, 0.6)",
  },
  detailValue: {
    fontSize: 14,
    color: SuiColors.aqua,
    fontWeight: "500",
  },
  digestValue: {
    fontSize: 14,
    color: SuiColors.sea,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  emptyCard: {
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
  statsCard: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statBox: {
    width: "48%",
    alignItems: "center",
    backgroundColor: "rgba(77, 162, 255, 0.05)",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.1)",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: SuiColors.sea,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.7)",
    textAlign: "center",
  },
  bottomSpace: {
    height: 40,
  },
});
