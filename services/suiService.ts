import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { MIST_PER_SUI } from '@mysten/sui/utils';

export interface WalletData {
  address: string;
  balance: number;
  assets: Asset[];
  transactions: Transaction[];
}

export interface Asset {
  coinType: string;
  balance: number;
  symbol: string;
}

export interface Transaction {
  digest: string;
  timestamp: number;
  sender: string;
  effects: any;
  gasUsed: number;
  success: boolean;
  kind: string;
  explorerUrl: string;
}

class SuiService {
  private client!: SuiClient;
  private network: 'devnet' | 'testnet' | 'mainnet';
  private rpcUrl!: string;

  constructor() {
    const envNetwork = process.env.EXPO_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet';
    this.network = envNetwork || 'testnet';
    this.initializeClient();
  }

  private initializeClient() {
    this.rpcUrl = getFullnodeUrl(this.network);
    this.client = new SuiClient({ url: this.rpcUrl });
  }

  switchNetwork(network: 'devnet' | 'testnet' | 'mainnet' | 'localnet') {
    if (network === 'localnet') {
      this.network = 'testnet';
      this.rpcUrl = 'http://127.0.0.1:9000';
    } else {
      this.network = network;
      this.rpcUrl = getFullnodeUrl(this.network);
    }
    
    this.client = new SuiClient({ url: this.rpcUrl });
  }

  private getExplorerUrl(digest: string): string {
    const baseUrls = {
      mainnet: 'https://suiscan.xyz/mainnet/tx',
      testnet: 'https://suiscan.xyz/testnet/tx',
      devnet: 'https://suiscan.xyz/devnet/tx'
    };
    
    return `${baseUrls[this.network] || baseUrls.testnet}/${digest}`;
  }

  async getWalletData(address: string): Promise<WalletData> {
    try {
      // Fetch balance
      const balance = await this.client.getBalance({ owner: address });
      const suiBalance = Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI);

      // Fetch coins/assets
      const coins = await this.client.getAllCoins({ owner: address });
      const assets: Asset[] = this.processCoins(coins.data);

      // Fetch transactions with detailed options
      const transactions = await this.client.queryTransactionBlocks({
        filter: {
          FromAddress: address,
        },
        limit: 10,
        order: 'descending',
        options: {
          showEffects: true,
          showInput: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      if (!transactions.data || transactions.data.length === 0) {
        // Try fetching transactions where the address is the recipient
        const incomingTransactions = await this.client.queryTransactionBlocks({
          filter: {
            ToAddress: address,
          },
          limit: 5,
          order: 'descending',
          options: {
            showEffects: true,
            showInput: true,
            showEvents: true,
            showObjectChanges: true,
          },
        });
        
        // Combine both sets of transactions
        const allTransactions = [
          ...(transactions.data || []),
          ...(incomingTransactions.data || [])
        ];
        
        const processedTransactions = await this.processTransactions(allTransactions);

        const walletData = {
          address,
          balance: suiBalance,
          assets,
          transactions: processedTransactions,
        };

        return walletData;
      }

      const processedTransactions = await this.processTransactions(transactions.data);

      const walletData = {
        address,
        balance: suiBalance,
        assets,
        transactions: processedTransactions,
      };

      return walletData;
    } catch (error) {
      throw new Error(`Failed to fetch wallet data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private processCoins(coins: any[]): Asset[] {
    const assetMap = new Map<string, number>();
    
    coins.forEach((coin) => {
      const coinType = coin.coinType;
      const balance = Number.parseInt(coin.balance);
      
      if (assetMap.has(coinType)) {
        assetMap.set(coinType, assetMap.get(coinType)! + balance);
      } else {
        assetMap.set(coinType, balance);
      }
    });

    const assets = Array.from(assetMap.entries()).map(([coinType, balance]) => ({
      coinType,
      balance: coinType.includes('sui::SUI') ? balance / Number(MIST_PER_SUI) : balance,
      symbol: this.getCoinSymbol(coinType),
    }));

    return assets;
  }

  private async processTransactions(transactions: any[]): Promise<Transaction[]> {
    const processedTransactions = transactions.map((tx) => {
      // Extract gas used more carefully
      const gasUsed = tx.effects?.gasUsed?.computationCost || 
                     tx.effects?.gasUsed?.storageCost || 
                     tx.effects?.gasUsed?.storageRebate || 
                     0;
      
      const success = tx.effects?.status?.status === 'success';
      
      // Better transaction kind extraction
      let kind = 'Unknown';
      if (tx.transaction?.data?.transaction?.kind) {
        kind = tx.transaction.data.transaction.kind;
      } else if (tx.transaction?.data?.transaction?.ProgrammableTransaction) {
        kind = 'ProgrammableTransaction';
      } else if (tx.transaction?.data?.transaction?.TransferObject) {
        kind = 'TransferObject';
      }
      
      // Use checkpoint timestamp if available, otherwise current time
      const timestamp = tx.timestampMs || tx.checkpoint || Date.now();
      
      const processedTx = {
        digest: tx.digest,
        timestamp,
        sender: tx.transaction?.data?.sender || '',
        effects: tx.effects,
        gasUsed,
        success,
        kind,
        explorerUrl: this.getExplorerUrl(tx.digest),
      };
      
      return processedTx;
    });

    return processedTransactions;
  }

  private getCoinSymbol(coinType: string): string {
    if (coinType.includes('sui::SUI')) return 'SUI';
    if (coinType.includes('usdc')) return 'USDC';
    if (coinType.includes('usdt')) return 'USDT';
    
    const parts = coinType.split('::');
    return parts[parts.length - 1] || 'Unknown';
  }

  async getTransactionDetails(digest: string) {
    try {
      const details = await this.client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showInput: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
      
      return details;
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getNetworkInfo() {
    const info = {
      network: this.network,
      rpcUrl: this.rpcUrl
    };
    return info;
  }
}

export const suiService = new SuiService(); 