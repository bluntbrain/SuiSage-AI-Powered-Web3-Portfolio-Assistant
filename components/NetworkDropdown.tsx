import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "./ThemedText";
import { SuiColors } from "@/constants/Colors";

interface NetworkDropdownProps {
  selectedNetwork: "mainnet" | "testnet" | "devnet" | "localnet";
  onNetworkChange: (
    network: "mainnet" | "testnet" | "devnet" | "localnet"
  ) => void;
}

const networks = [
  { id: "testnet", name: "Testnet", description: "Test network" },
  { id: "mainnet", name: "Mainnet", description: "Production network" },
  { id: "devnet", name: "Devnet", description: "Development network" },
  { id: "localnet", name: "Localnet", description: "Local network" },
] as const;

export function NetworkDropdown({
  selectedNetwork,
  onNetworkChange,
}: NetworkDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  const selectedNetworkInfo =
    networks.find((n) => n.id === selectedNetwork) || networks[0];

  const openDropdown = () => {
    setIsOpen(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  };

  const selectNetwork = (networkId: typeof selectedNetwork) => {
    onNetworkChange(networkId);
    closeDropdown();
  };

  const getNetworkColor = (networkId: string) => {
    switch (networkId) {
      case "mainnet":
        return "#4ECDC4";
      case "testnet":
        return SuiColors.sea;
      case "devnet":
        return "#FFE66D";
      case "localnet":
        return "#FF6B6B";
      default:
        return SuiColors.sea;
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.networkButton} onPress={openDropdown}>
        <BlurView intensity={25} style={styles.networkButtonBlur}>
          <LinearGradient
            colors={["rgba(77, 162, 255, 0.15)", "rgba(77, 162, 255, 0.08)"]}
            style={styles.networkButtonGradient}
          >
            <View style={styles.networkButtonContent}>
              <View
                style={[
                  styles.networkIndicator,
                  { backgroundColor: getNetworkColor(selectedNetwork) },
                ]}
              />
              <ThemedText style={styles.networkButtonText}>
                {selectedNetworkInfo.name}
              </ThemedText>
              <ThemedText style={styles.chevron}>▼</ThemedText>
            </View>
          </LinearGradient>
        </BlurView>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View style={styles.modalContent}>
            <Animated.View
              style={[
                styles.dropdownContainer,
                {
                  transform: [
                    {
                      scale: scaleAnim,
                    },
                  ],
                },
              ]}
            >
              <BlurView intensity={30} style={styles.dropdownBlur}>
                <LinearGradient
                  colors={[
                    "rgba(77, 162, 255, 0.15)",
                    "rgba(77, 162, 255, 0.05)",
                  ]}
                  style={styles.dropdownGradient}
                >
                  <View style={styles.dropdownHeader}>
                    <ThemedText style={styles.dropdownTitle}>
                      Select Network
                    </ThemedText>
                  </View>

                  {networks.map((network) => (
                    <TouchableOpacity
                      key={network.id}
                      style={[
                        styles.networkOption,
                        selectedNetwork === network.id && styles.selectedOption,
                      ]}
                      onPress={() => selectNetwork(network.id)}
                    >
                      <View style={styles.networkOptionContent}>
                        <View
                          style={[
                            styles.networkIndicator,
                            { backgroundColor: getNetworkColor(network.id) },
                          ]}
                        />
                        <View style={styles.networkInfo}>
                          <ThemedText style={styles.networkName}>
                            {network.name}
                          </ThemedText>
                          <ThemedText style={styles.networkDescription}>
                            {network.description}
                          </ThemedText>
                        </View>
                      </View>
                      {selectedNetwork === network.id && (
                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                      )}
                    </TouchableOpacity>
                  ))}
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  networkButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  networkButtonBlur: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.3)",
  },
  networkButtonGradient: {
    borderRadius: 11,
  },
  networkButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  networkIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  chevron: {
    fontSize: 10,
    color: SuiColors.aqua,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 300,
  },
  dropdownContainer: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: SuiColors.sea,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  dropdownBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 162, 255, 0.3)",
  },
  dropdownGradient: {
    borderRadius: 15,
    padding: 4,
  },
  dropdownHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.2)",
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: SuiColors.aqua,
    textAlign: "center",
  },
  networkOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 162, 255, 0.1)",
  },
  selectedOption: {
    backgroundColor: "rgba(77, 162, 255, 0.15)",
  },
  networkOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 15,
    fontWeight: "600",
    color: SuiColors.aqua,
  },
  networkDescription: {
    fontSize: 12,
    color: "rgba(192, 230, 255, 0.7)",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 16,
    color: SuiColors.sea,
    fontWeight: "bold",
  },
});
