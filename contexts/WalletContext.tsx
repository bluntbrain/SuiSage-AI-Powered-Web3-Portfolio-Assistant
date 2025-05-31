import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletData } from "@/services/suiService";

interface WalletContextType {
  walletData: WalletData | null;
  setWalletData: (data: WalletData | null) => void;
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

  return (
    <WalletContext.Provider value={{ walletData, setWalletData }}>
      {children}
    </WalletContext.Provider>
  );
};
