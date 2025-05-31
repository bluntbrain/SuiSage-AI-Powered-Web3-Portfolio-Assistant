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

  async getWalletData(address: string): Promise<WalletData> {
    try {
      const balance = await this.client.getBalance({ owner: address });
      const suiBalance = Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI);

      const coins = await this.client.getAllCoins({ owner: address });
      const assets: Asset[] = this.processCoins(coins.data);

      const transactions = await this.client.queryTransactionBlocks({
        filter: {
          FromAddress: address,
        },
        limit: 10,
        order: 'descending',
      });

      const processedTransactions = await this.processTransactions(transactions.data);

      return {
        address,
        balance: suiBalance,
        assets,
        transactions: processedTransactions,
      };
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

    return Array.from(assetMap.entries()).map(([coinType, balance]) => ({
      coinType,
      balance: coinType.includes('sui::SUI') ? balance / Number(MIST_PER_SUI) : balance,
      symbol: this.getCoinSymbol(coinType),
    }));
  }

  private async processTransactions(transactions: any[]): Promise<Transaction[]> {
    return transactions.map((tx) => {
      const gasUsed = tx.effects?.gasUsed?.computationCost || 0;
      const success = tx.effects?.status?.status === 'success';
      const kind = tx.transaction?.data?.transaction?.kind || 'Unknown';
      
      return {
        digest: tx.digest,
        timestamp: tx.timestampMs || Date.now(),
        sender: tx.transaction?.data?.sender || '',
        effects: tx.effects,
        gasUsed,
        success,
        kind,
      };
    });
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
      return await this.client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showInput: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch transaction details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getNetworkInfo() {
    return {
      network: this.network,
      rpcUrl: this.rpcUrl
    };
  }
}

export const suiService = new SuiService(); 