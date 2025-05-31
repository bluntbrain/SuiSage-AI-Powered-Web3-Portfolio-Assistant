interface CoinGeckoPrice {
  sui: {
    usd: number;
  };
}

interface PriceData {
  sui: number;
  lastUpdated: number;
}

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private cachedPrice: PriceData | null = null;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('CoinGecko: Service initialized');
  }

  async getSuiPrice(): Promise<number> {
    // Check if we have cached data that's still valid
    if (this.cachedPrice && Date.now() - this.cachedPrice.lastUpdated < this.cacheExpiry) {
      return this.cachedPrice.sui;
    }

    try {
      const url = `${this.baseUrl}/simple/price?ids=sui&vs_currencies=usd`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinGeckoPrice = await response.json();
      
      if (!data.sui || typeof data.sui.usd !== 'number') {
        throw new Error('Invalid price data received');
      }

      // Cache the price data
      this.cachedPrice = {
        sui: data.sui.usd,
        lastUpdated: Date.now(),
      };

      return data.sui.usd;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      
      // If API fails, return cached price if available, otherwise fallback price
      if (this.cachedPrice) {
        return this.cachedPrice.sui;
      }
      
      // Fallback to approximate price if API is down
      return 3.17; // Approximate SUI price as fallback
    }
  }

  convertSuiToUsd(suiAmount: number, suiPrice?: number): number {
    if (suiPrice) {
      return suiAmount * suiPrice;
    }
    
    // Use cached price if available
    if (this.cachedPrice) {
      return suiAmount * this.cachedPrice.sui;
    }
    
    // Fallback calculation
    return suiAmount * 3.17;
  }

  formatUsdValue(usdAmount: number): string {
    if (usdAmount < 0.01) {
      return '<$0.01';
    }
    
    if (usdAmount < 1) {
      return `$${usdAmount.toFixed(3)}`;
    }
    
    if (usdAmount < 1000) {
      return `$${usdAmount.toFixed(2)}`;
    }
    
    if (usdAmount < 1000000) {
      return `$${(usdAmount / 1000).toFixed(1)}K`;
    }
    
    return `$${(usdAmount / 1000000).toFixed(1)}M`;
  }

  formatSuiWithUsd(suiAmount: number, suiPrice?: number): string {
    const usdValue = this.convertSuiToUsd(suiAmount, suiPrice);
    return `${suiAmount.toFixed(4)} SUI (${this.formatUsdValue(usdValue)})`;
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cachedPrice = null;
  }

  // Get cache status for debugging
  getCacheStatus(): { cached: boolean; lastUpdated?: number; expiresIn?: number } {
    if (!this.cachedPrice) {
      return { cached: false };
    }

    const expiresIn = this.cacheExpiry - (Date.now() - this.cachedPrice.lastUpdated);
    return {
      cached: true,
      lastUpdated: this.cachedPrice.lastUpdated,
      expiresIn: Math.max(0, expiresIn),
    };
  }
}

export const coingeckoService = new CoinGeckoService(); 