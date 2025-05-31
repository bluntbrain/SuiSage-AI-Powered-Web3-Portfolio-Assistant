import OpenAI from 'openai';
import { WalletData } from './suiService';

export interface AIAdvice {
  category: 'gas' | 'staking' | 'diversification' | 'risk' | 'general';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings?: string;
}

export interface AnalysisResult {
  summary: string;
  advice: AIAdvice[];
  riskScore: number;
  portfolioHealth: 'poor' | 'fair' | 'good' | 'excellent';
}

class AIService {
  private openai: OpenAI | null = null;
  private apiKeyAvailable: boolean = false;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_openai_api_key_here')) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });
      this.apiKeyAvailable = true;
    }
  }

  async analyzeWallet(walletData: WalletData): Promise<AnalysisResult> {
    if (!this.openai || !this.apiKeyAvailable) {
      return this.fallbackAnalysis(walletData);
    }

    try {
      const result = await this.tryOpenAIAnalysis(walletData);
      return result;
    } catch (error) {
      return this.fallbackAnalysis(walletData);
    }
  }

  private async tryOpenAIAnalysis(walletData: WalletData): Promise<AnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = this.createAnalysisPrompt(walletData);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a Web3 portfolio advisor specializing in the Sui blockchain. Analyze the provided wallet data and give actionable advice for gas optimization, staking opportunities, portfolio diversification, and risk management. Respond ONLY with valid JSON format, no additional text or formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        const cleanedResponse = response.trim();
        
        let jsonString = cleanedResponse;
        const jsonStart = cleanedResponse.indexOf('{');
        const jsonEnd = cleanedResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonString = cleanedResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        const parsed = JSON.parse(jsonString);
        
        if (parsed && parsed.summary && parsed.advice && Array.isArray(parsed.advice)) {
          return parsed;
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (parseError) {
        throw parseError;
      }
    }
    
    throw new Error('Empty response from OpenAI');
  }

  private createAnalysisPrompt(walletData: WalletData): string {
    const { balance, assets, transactions } = walletData;
    
    const recentTxs = transactions.slice(0, 5);
    const totalGasUsed = transactions.reduce((sum, tx) => sum + tx.gasUsed, 0);
    const successRate = transactions.length > 0 ? transactions.filter(tx => tx.success).length / transactions.length * 100 : 100;

    return `Analyze this Sui wallet and respond with ONLY valid JSON:

Wallet Data:
- Address: ${walletData.address}
- SUI Balance: ${balance.toFixed(4)} SUI
- Total Assets: ${assets.length}
- Recent Transactions: ${recentTxs.length}
- Total Gas Used: ${totalGasUsed} MIST
- Success Rate: ${successRate.toFixed(1)}%

Assets:
${assets.map(asset => `- ${asset.symbol}: ${asset.balance}`).join('\n')}

Recent Transactions:
${recentTxs.map(tx => `- ${tx.kind} (Gas: ${tx.gasUsed} MIST, Success: ${tx.success})`).join('\n')}

Respond with this exact JSON structure:
{
  "summary": "Brief portfolio overview in one sentence",
  "advice": [
    {
      "category": "gas",
      "title": "Short advice title",
      "description": "Detailed explanation",
      "actionable": true,
      "priority": "medium",
      "estimatedSavings": "Optional savings estimate"
    }
  ],
  "riskScore": 5,
  "portfolioHealth": "fair"
}

Focus on gas optimization, staking opportunities, diversification, and risk assessment. Use categories: gas, staking, diversification, risk, general. Use priorities: low, medium, high. Use portfolio health: poor, fair, good, excellent.`;
  }

  private fallbackAnalysis(walletData: WalletData): AnalysisResult {
    const { balance, assets, transactions } = walletData;
    const advice: AIAdvice[] = [];

    const avgGasUsed = transactions.length > 0 ? 
      transactions.reduce((sum, tx) => sum + tx.gasUsed, 0) / transactions.length : 0;

    if (avgGasUsed > 1000000) {
      advice.push({
        category: 'gas',
        title: 'Optimize Gas Usage',
        description: 'Your transactions are using high gas. Consider batching operations or using more efficient transaction patterns.',
        actionable: true,
        priority: 'medium',
        estimatedSavings: '0.01-0.05 SUI per transaction'
      });
    }

    if (balance > 1 && balance < 100) {
      advice.push({
        category: 'staking',
        title: 'Consider Staking SUI',
        description: 'With your current SUI balance, staking could provide steady returns. Look into validator staking for approximately 3-7% APY.',
        actionable: true,
        priority: 'high',
        estimatedSavings: `${(balance * 0.05).toFixed(2)} SUI annually`
      });
    }

    const suiAssets = assets.filter(asset => asset.symbol === 'SUI');
    const otherAssets = assets.filter(asset => asset.symbol !== 'SUI');
    
    if (suiAssets.length > 0 && otherAssets.length === 0) {
      advice.push({
        category: 'diversification',
        title: 'Diversify Your Portfolio',
        description: 'Your portfolio is concentrated in SUI. Consider diversifying with other Sui ecosystem tokens or DeFi positions.',
        actionable: true,
        priority: 'medium'
      });
    }

    const failedTxs = transactions.filter(tx => !tx.success).length;
    const failureRate = transactions.length > 0 ? (failedTxs / transactions.length) * 100 : 0;

    if (failureRate > 10) {
      advice.push({
        category: 'risk',
        title: 'High Transaction Failure Rate',
        description: `${failureRate.toFixed(1)}% of your transactions are failing. Review transaction parameters and gas settings.`,
        actionable: true,
        priority: 'high'
      });
    }

    if (balance < 0.1) {
      advice.push({
        category: 'general',
        title: 'Low SUI Balance',
        description: 'Your SUI balance is low. Consider adding more SUI to cover transaction fees and participate in DeFi activities.',
        actionable: true,
        priority: 'medium'
      });
    }

    let riskScore = 5;
    if (balance < 1) riskScore += 2;
    if (failureRate > 10) riskScore += 2;
    if (otherAssets.length === 0) riskScore += 1;
    
    riskScore = Math.min(10, Math.max(1, riskScore));

    const portfolioHealth: 'poor' | 'fair' | 'good' | 'excellent' = 
      balance > 10 && failureRate < 5 && otherAssets.length > 0 ? 'excellent' :
      balance > 5 && failureRate < 10 ? 'good' :
      balance > 1 ? 'fair' : 'poor';

    return {
      summary: `Portfolio contains ${balance.toFixed(2)} SUI across ${assets.length} assets with ${transactions.length} recent transactions.`,
      advice,
      riskScore,
      portfolioHealth
    };
  }
}

export const aiService = new AIService(); 