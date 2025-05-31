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
  portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskScore: number;
  advice: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedSavings?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'openai' | 'gemini';
  timestamp: number;
  isLoading?: boolean;
}

export interface AIProvider {
  name: string;
  id: 'openai' | 'gemini';
  enabled: boolean;
}

class AIService {
  private openai: OpenAI | null = null;
  private apiKeyAvailable: boolean = false;
  private openaiApiKey: string | null = null;
  private geminiApiKey: string | null = null;

  constructor() {
    this.openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
    
    console.log('[AIService] Initialization:');
    console.log('  OpenAI API Key:', this.openaiApiKey ? `${this.openaiApiKey.substring(0, 10)}...` : 'Not configured');
    console.log('  Gemini API Key:', this.geminiApiKey ? `${this.geminiApiKey.substring(0, 10)}...` : 'Not configured');
    
    if (this.openaiApiKey && this.openaiApiKey.trim() !== '' && !this.openaiApiKey.includes('your_openai_api_key_here')) {
      this.openai = new OpenAI({
        apiKey: this.openaiApiKey,
        dangerouslyAllowBrowser: true,
      });
      this.apiKeyAvailable = true;
      console.log('[AIService] OpenAI client initialized successfully');
    } else {
      console.log('[AIService] OpenAI not configured or using placeholder');
    }
  }

  private getSecurityPrompt(walletData: WalletData | null): string {
    const walletInfo = walletData ? `
Wallet: ${walletData.address}
SUI Balance: ${walletData.balance.toFixed(4)} SUI
Assets: ${walletData.assets.length}
Recent Transactions: ${walletData.transactions.length}
Transaction Details: ${JSON.stringify(walletData.transactions.slice(0, 5), null, 2)}
Asset Details: ${JSON.stringify(walletData.assets, null, 2)}
` : 'No wallet data available';

    return `you're a security-focused web3 assistant. help users understand their sui wallet and spot potential risks.

WALLET DATA:
${walletInfo}

RESPONSE STYLE:
- write like you're talking to a friend
- use simple words and short sentences
- be direct. no fluff or marketing speak
- start with 'and' or 'but' if it feels natural
- avoid phrases like "dive into" or "unleash potential"
- keep it honest. say "i don't know" if you're unsure
- max 2-3 sentences per response
- lowercase "i" is fine

FOCUS ON:
- wallet security basics
- transaction patterns that look weird  
- simple ways to stay safe
- practical next steps

answer the user's question directly. no intro paragraphs.`;
  }

  async askMultipleAIs(question: string, walletData: WalletData | null, enabledProviders?: { openai: boolean; gemini: boolean }): Promise<ChatMessage[]> {
    console.log('[AIService] askMultipleAIs called:');
    console.log('  Question:', question.substring(0, 100) + '...');
    console.log('  Enabled providers filter:', enabledProviders);
    
    const responses: ChatMessage[] = [];
    const providers = this.getAvailableProviders();

    console.log('  Available providers:', providers.map(p => ({ id: p.id, name: p.name, enabled: p.enabled })));

    const promises = providers
      .filter(provider => {
        // If enabledProviders filter is provided, respect it
        if (enabledProviders) {
          const shouldInclude = provider.enabled && enabledProviders[provider.id];
          console.log(`  Provider ${provider.id}: available=${provider.enabled}, user_enabled=${enabledProviders[provider.id]}, included=${shouldInclude}`);
          return shouldInclude;
        }
        // Otherwise, include all available providers
        console.log(`  Provider ${provider.id}: available=${provider.enabled}, included=${provider.enabled}`);
        return provider.enabled;
      })
      .map(async (provider) => {
        console.log(`[AIService] Starting request for provider: ${provider.id}`);
        try {
          let response: string;
          
          if (provider.id === 'openai' && this.openaiApiKey) {
            console.log(`[AIService] Calling OpenAI...`);
            response = await this.askOpenAI(question, walletData);
          } else if (provider.id === 'gemini' && this.geminiApiKey) {
            console.log(`[AIService] Calling Gemini...`);
            response = await this.askGemini(question, walletData);
          } else {
            console.log(`[AIService] Provider ${provider.id} not configured`);
            response = `${provider.name} is not configured. Please add the API key.`;
          }

          console.log(`[AIService] ${provider.id} response:`, response.substring(0, 200) + '...');
          return {
            id: `${provider.id}-${Date.now()}`,
            text: response,
            sender: provider.id,
            timestamp: Date.now(),
          } as ChatMessage;
        } catch (error) {
          console.error(`[AIService] Error from ${provider.id}:`, error);
          return {
            id: `${provider.id}-error-${Date.now()}`,
            text: `${provider.name} encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sender: provider.id,
            timestamp: Date.now(),
          } as ChatMessage;
        }
      });

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`[AIService] Promise ${index} fulfilled:`, result.value.sender);
        responses.push(result.value);
      } else {
        console.error(`[AIService] Promise ${index} rejected:`, result.reason);
      }
    });

    console.log(`[AIService] Final responses count: ${responses.length}`);
    return responses;
  }

  private async askOpenAI(question: string, walletData: WalletData | null): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: this.getSecurityPrompt(walletData),
          },
          {
            role: 'user',
            content: question,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
  }

  private async askGemini(question: string, walletData: WalletData | null): Promise<string> {
    console.log('[AIService] askGemini called');
    
    if (!this.geminiApiKey) {
      console.error('[AIService] Gemini API key not configured');
      throw new Error('Gemini API key not configured');
    }

    console.log('[AIService] Gemini API key available:', this.geminiApiKey.substring(0, 10) + '...');

    const prompt = `${this.getSecurityPrompt(walletData)}\n\nUser Question: ${question}`;
    console.log('[AIService] Gemini prompt length:', prompt.length);
    console.log('[AIService] Gemini prompt preview:', prompt.substring(0, 300) + '...');

    const requestPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`;
    console.log('[AIService] Gemini API URL (without key):', apiUrl.replace(this.geminiApiKey, '[API_KEY]'));
    console.log('[AIService] Gemini request payload:', JSON.stringify(requestPayload, null, 2));

    try {
      console.log('[AIService] Making Gemini API request...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('[AIService] Gemini response status:', response.status);
      console.log('[AIService] Gemini response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIService] Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('[AIService] Gemini raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[AIService] Gemini parsed response:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('[AIService] Failed to parse Gemini response as JSON:', parseError);
        throw new Error(`Failed to parse Gemini response: ${parseError}`);
      }

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('[AIService] Gemini extracted text:', generatedText);

      if (!generatedText) {
        console.error('[AIService] No text found in Gemini response structure');
        console.error('[AIService] Response structure:', JSON.stringify(data, null, 2));
        throw new Error('No response generated from Gemini');
      }

      return generatedText;
    } catch (error) {
      console.error('[AIService] Gemini request failed:', error);
      if (error instanceof Error) {
        console.error('[AIService] Error message:', error.message);
        console.error('[AIService] Error stack:', error.stack);
      }
      throw error;
    }
  }

  getAvailableProviders(): AIProvider[] {
    const providers = [
      {
        name: 'OpenAI GPT',
        id: 'openai' as const,
        enabled: !!this.openaiApiKey,
      },
      {
        name: 'Google Gemini',
        id: 'gemini' as const,
        enabled: !!this.geminiApiKey,
      },
    ];
    
    console.log('[AIService] getAvailableProviders:', providers);
    return providers;
  }

  async analyzeWallet(walletData: WalletData): Promise<AnalysisResult> {
    const analysis = `Please analyze this Sui wallet and provide insights:

Wallet: ${walletData.address}
Balance: ${walletData.balance} SUI
Assets: ${walletData.assets.length} different types
Recent Transactions: ${walletData.transactions.length}

Transaction Details:
${walletData.transactions.map(tx => 
  `- ${tx.kind} (${tx.success ? 'Success' : 'Failed'}) - Gas: ${tx.gasUsed} - ${new Date(tx.timestamp).toLocaleDateString()}`
).join('\n')}

Asset Breakdown:
${walletData.assets.map(asset => 
  `- ${asset.symbol}: ${asset.balance} (${asset.coinType})`
).join('\n')}

Please provide:
1. Overall portfolio health assessment
2. Risk score (1-10, where 10 is highest risk)
3. Specific recommendations for improvement
4. Any security concerns or opportunities

Format your response as JSON with the structure:
{
  "summary": "Brief overall assessment",
  "portfolioHealth": "excellent|good|fair|poor",
  "riskScore": number,
  "advice": [
    {
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "priority": "high|medium|low",
      "estimatedSavings": "Optional estimated savings"
    }
  ]
}`;

    if (!this.openaiApiKey) {
      return this.getRuleBasedAnalysis(walletData);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Web3 portfolio analyst. Respond only with valid JSON.',
            },
            {
              role: 'user',
              content: analysis,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      try {
        content = content.replace(/```json\n?|\n?```/g, '').trim();
        
        if (content.includes('```')) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            content = jsonMatch[0];
          }
        }

        const parsed = JSON.parse(content);
        return parsed;
      } catch (parseError) {
        return this.getRuleBasedAnalysis(walletData);
      }
    } catch (error) {
      return this.getRuleBasedAnalysis(walletData);
    }
  }

  private getRuleBasedAnalysis(walletData: WalletData): AnalysisResult {
    const balance = walletData.balance;
    const transactionCount = walletData.transactions.length;
    const successfulTxs = walletData.transactions.filter(tx => tx.success).length;
    const failureRate = transactionCount > 0 ? (transactionCount - successfulTxs) / transactionCount : 0;
    
    let portfolioHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    let riskScore = 8;
    
    if (balance > 100 && failureRate < 0.1) {
      portfolioHealth = 'excellent';
      riskScore = 2;
    } else if (balance > 10 && failureRate < 0.2) {
      portfolioHealth = 'good';
      riskScore = 4;
    } else if (balance > 1) {
      portfolioHealth = 'fair';
      riskScore = 6;
    }

    const advice: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }> = [
      {
        title: 'Diversify Holdings',
        description: 'Consider holding different types of assets to reduce risk.',
        priority: 'medium',
      },
      {
        title: 'Monitor Gas Usage',
        description: 'Review transaction patterns to optimize gas spending.',
        priority: 'low',
      },
    ];

    if (failureRate > 0.2) {
      advice.unshift({
        title: 'Investigate Failed Transactions',
        description: 'High failure rate detected. Review transaction parameters.',
        priority: 'high',
      });
    }

    return {
      summary: `Portfolio shows ${portfolioHealth} health with ${balance.toFixed(2)} SUI balance and ${transactionCount} recent transactions.`,
      portfolioHealth,
      riskScore,
      advice,
    };
  }
}

export const aiService = new AIService();

// Debug logging
console.log('[AIService] Service instantiated');
console.log('[AIService] Available providers at startup:', aiService.getAvailableProviders()); 