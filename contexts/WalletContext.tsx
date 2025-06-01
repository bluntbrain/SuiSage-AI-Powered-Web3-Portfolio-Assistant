import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletData } from "@/services/suiService";
import { VoiceSettings, voiceService } from "@/services/voiceService";
import {
  ChatMode,
  ChainConfig,
  CHAIN_CONFIGS,
} from "@/services/trainingDataService";

interface AIProviderSettings {
  openai: boolean;
  gemini: boolean;
}

interface ChatSettings {
  mode: ChatMode;
  selectedChainConfig: ChainConfig | null;
  chainEnabled: boolean;
  showChainComparison: boolean;
}

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: WalletData | null) => void;
  suiPrice: number | null;
  setSuiPrice: (price: number | null) => void;
  aiProviderSettings: AIProviderSettings;
  setAIProviderSettings: (settings: AIProviderSettings) => void;
  toggleAIProvider: (provider: keyof AIProviderSettings) => void;
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  toggleVoiceMode: () => void;
  updateSelectedVoice: (voice: string) => void;
  chatSettings: ChatSettings;
  setChatMode: (mode: ChatMode) => void;
  setSelectedChainConfig: (config: ChainConfig | null) => void;
  toggleChainMode: () => void;
  setShowChainComparison: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [suiPrice, setSuiPrice] = useState<number | null>(null);
  const [aiProviderSettings, setAIProviderSettings] =
    useState<AIProviderSettings>({
      openai: true,
      gemini: true,
    });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: false,
    selectedVoice: voiceService.getDefaultVoice(),
  });
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    mode: "parallel",
    selectedChainConfig: null,
    chainEnabled: true,
    showChainComparison: true,
  });

  const toggleAIProvider = (provider: keyof AIProviderSettings) => {
    setAIProviderSettings((prevSettings) => {
      const newSettings = {
        ...prevSettings,
        [provider]: !prevSettings[provider],
      };

      // Ensure at least one provider is enabled
      const anyEnabled = Object.values(newSettings).some((enabled) => enabled);
      if (!anyEnabled) {
        return prevSettings; // Don't allow disabling all providers
      }

      return newSettings;
    });
  };

  const toggleVoiceMode = () => {
    setVoiceSettings((prevSettings) => ({
      ...prevSettings,
      enabled: !prevSettings.enabled,
    }));
  };

  const updateSelectedVoice = (voice: string) => {
    setVoiceSettings((prevSettings) => ({
      ...prevSettings,
      selectedVoice: voice,
    }));
  };

  const setChatMode = (mode: ChatMode) => {
    setChatSettings((prevSettings) => ({
      ...prevSettings,
      mode: mode,
    }));
  };

  const setSelectedChainConfig = (config: ChainConfig | null) => {
    setChatSettings((prevSettings) => ({
      ...prevSettings,
      selectedChainConfig: config,
    }));
  };

  const toggleChainMode = () => {
    setChatSettings((prevSettings) => ({
      ...prevSettings,
      chainEnabled: !prevSettings.chainEnabled,
    }));
  };

  const setShowChainComparison = (show: boolean) => {
    setChatSettings((prevSettings) => ({
      ...prevSettings,
      showChainComparison: show,
    }));
  };

  return (
    <WalletContext.Provider
      value={{
        walletData,
        setWalletData,
        suiPrice,
        setSuiPrice,
        aiProviderSettings,
        setAIProviderSettings,
        toggleAIProvider,
        voiceSettings,
        setVoiceSettings,
        toggleVoiceMode,
        updateSelectedVoice,
        chatSettings,
        setChatMode,
        setSelectedChainConfig,
        toggleChainMode,
        setShowChainComparison,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
