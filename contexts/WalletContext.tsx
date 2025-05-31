import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletData } from "@/services/suiService";
import { VoiceSettings, voiceService } from "@/services/voiceService";

interface AIProviderSettings {
  openai: boolean;
  gemini: boolean;
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
