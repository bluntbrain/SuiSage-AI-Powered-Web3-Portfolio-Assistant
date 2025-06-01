import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletData } from './suiService';

// Extensible AI model system
export interface AIModel {
  id: string;
  name: string;
  enabled: boolean;
  capabilities: string[];
  priority?: number;
}

export const AI_MODELS: Record<string, AIModel> = {
  openai: {
    id: 'openai',
    name: 'OpenAI GPT',
    enabled: true,
    capabilities: ['chat', 'analysis', 'voice-compatible'],
    priority: 1
  },
  gemini: {
    id: 'gemini', 
    name: 'Google Gemini',
    enabled: true,
    capabilities: ['chat', 'analysis', 'fast-response'],
    priority: 2
  }
};

export type ChatMode = 'parallel' | 'chain' | 'universal';

export interface ChainConfig {
  models: string[];
  name: string;
  description?: string;
}

export const CHAIN_CONFIGS: ChainConfig[] = [
  {
    models: ['openai', 'gemini'],
    name: 'OpenAI → Gemini',
    description: 'Deep analysis followed by practical insights'
  },
  {
    models: ['gemini', 'openai'], 
    name: 'Gemini → OpenAI',
    description: 'Quick overview followed by detailed analysis'
  }
];

export interface ModelResponse {
  modelId: string;
  content: string;
  timestamp: number;
  metadata?: {
    tokens?: number;
    processingTime?: number;
    confidence?: number;
  };
}

export interface ChainStep {
  stepIndex: number;
  modelId: string;
  prompt: string;
  response: ModelResponse;
  enhancedPrompt?: string;
}

export interface TrainingDataEntry {
  id: string;
  timestamp: number;
  question: string;
  walletData: WalletData | null;
  
  // Mode information
  chatMode: ChatMode;
  chainConfig?: ChainConfig;
  
  // Flexible responses for any number of models
  responses: Record<string, ModelResponse>;
  
  // Chain-specific data
  chainData?: {
    steps: ChainStep[];
    finalModelId: string;
    totalProcessingTime: number;
  };
  
  // For universal mode: multiple chain responses
  chainResponses?: {
    [chainId: string]: {
      chainConfig: ChainConfig;
      responses: Record<string, ModelResponse>;
      chainData: {
        steps: ChainStep[];
        finalModelId: string;
        totalProcessingTime: number;
      };
    };
  };
  
  // Flexible selection system
  selectedOption: string | null; // Could be modelId or chainConfigId
  
  // Optional granular feedback
  modelRatings?: Record<string, number>;
  chainRating?: number;
  
  userFeedback?: string;
}

export interface ComparisonSession {
  id: string;
  timestamp: number;
  question: string;
  walletData: WalletData | null;
  chatMode: ChatMode;
  chainConfig?: ChainConfig;
  responses: Record<string, ModelResponse>;
  chainData?: {
    steps: ChainStep[];
    finalModelId: string;
    totalProcessingTime: number;
  };
  // For chain mode: multiple chain responses
  chainResponses?: {
    [chainId: string]: {
      chainConfig: ChainConfig;
      responses: Record<string, ModelResponse>;
      chainData: {
        steps: ChainStep[];
        finalModelId: string;
        totalProcessingTime: number;
      };
    };
  };
  selectedOption: string | null;
}

export type SelectionOption = 
  | { type: 'model'; modelId: string; name: string }
  | { type: 'chain'; chainId: string; name: string; models: string[] };

export function getAvailableSelectionOptions(
  chatMode: ChatMode,
  enabledModels: string[]
): SelectionOption[] {
  const options: SelectionOption[] = [];
  
  if (chatMode === 'parallel') {
    enabledModels.forEach(modelId => {
      const model = AI_MODELS[modelId];
      if (model?.enabled) {
        options.push({
          type: 'model',
          modelId,
          name: model.name
        });
      }
    });
  } else if (chatMode === 'chain') {
    CHAIN_CONFIGS.forEach((config, index) => {
      const allModelsEnabled = config.models.every(modelId => 
        enabledModels.includes(modelId) && AI_MODELS[modelId]?.enabled
      );
      
      if (allModelsEnabled) {
        options.push({
          type: 'chain',
          chainId: `chain_${index}`,
          name: config.name,
          models: config.models
        });
      }
    });
  } else if (chatMode === 'universal') {
    // Add individual models
    enabledModels.forEach(modelId => {
      const model = AI_MODELS[modelId];
      if (model?.enabled) {
        options.push({
          type: 'model',
          modelId,
          name: model.name
        });
      }
    });
    
    // Add chain combinations
    CHAIN_CONFIGS.forEach((config, index) => {
      const allModelsEnabled = config.models.every(modelId => 
        enabledModels.includes(modelId) && AI_MODELS[modelId]?.enabled
      );
      
      if (allModelsEnabled) {
        options.push({
          type: 'chain',
          chainId: `chain_${index}`,
          name: config.name,
          models: config.models
        });
      }
    });
  }
  
  return options;
}

interface ModelStats {
  modelId: string;
  totalSessions: number;
  wins: number;
  averageRating?: number;
}

interface ChainStats {
  chainConfig: ChainConfig;
  totalSessions: number;
  wins: number;
  averageRating?: number;
}

class TrainingDataService {
  private readonly STORAGE_KEY = 'suisage_training_data';
  private readonly MAX_ENTRIES = 1000;

  async saveComparisonData(session: ComparisonSession): Promise<void> {
    try {
      const existingData = await this.getAllTrainingData();
      
      const trainingEntry: TrainingDataEntry = {
        id: session.id,
        timestamp: session.timestamp,
        question: session.question,
        walletData: session.walletData,
        chatMode: session.chatMode,
        chainConfig: session.chainConfig,
        responses: session.responses,
        chainData: session.chainData,
        selectedOption: session.selectedOption,
      };

      const updatedData = [trainingEntry, ...existingData].slice(0, this.MAX_ENTRIES);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData));
      console.log('[TrainingData] Saved comparison data:', session.id);
    } catch (error) {
      console.error('[TrainingData] Failed to save data:', error);
    }
  }

  async getAllTrainingData(): Promise<TrainingDataEntry[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[TrainingData] Failed to load data:', error);
      return [];
    }
  }

  async getTrainingDataForExport(): Promise<string> {
    try {
      const data = await this.getAllTrainingData();
      
      const trainingData = data
        .filter(entry => entry.selectedOption !== null)
        .map(entry => ({
          prompt: entry.question,
          context: entry.walletData ? {
            balance: entry.walletData.balance,
            assets: entry.walletData.assets.length,
            transactions: entry.walletData.transactions.length,
          } : null,
          chatMode: entry.chatMode,
          chainConfig: entry.chainConfig,
          responses: entry.responses,
          chainData: entry.chainData,
          selected: entry.selectedOption,
          timestamp: entry.timestamp,
        }));

      return JSON.stringify(trainingData, null, 2);
    } catch (error) {
      console.error('[TrainingData] Failed to export data:', error);
      return '[]';
    }
  }

  async getExtensibleStats(): Promise<{
    totalSessions: number;
    withSelections: number;
    modelStats: ModelStats[];
    chainStats: ChainStats[];
    parallelSessions: number;
    chainSessions: number;
    universalSessions: number;
  }> {
    try {
      const data = await this.getAllTrainingData();
      const withSelections = data.filter(entry => entry.selectedOption !== null);
      
      // Calculate model stats
      const modelStats: ModelStats[] = Object.keys(AI_MODELS).map(modelId => {
        const modelSessions = withSelections.filter(entry => 
          (entry.chatMode === 'parallel' || entry.chatMode === 'universal') && entry.selectedOption === modelId
        );
        
        return {
          modelId,
          totalSessions: data.filter(entry => 
            entry.responses[modelId] !== undefined
          ).length,
          wins: modelSessions.length,
        };
      });

      // Calculate chain stats
      const chainStats: ChainStats[] = CHAIN_CONFIGS.map((config, index) => {
        const chainId = `chain_${index}`;
        const chainSessions = withSelections.filter(entry => 
          (entry.chatMode === 'chain' || entry.chatMode === 'universal') && entry.selectedOption === chainId
        );
        
        return {
          chainConfig: config,
          totalSessions: data.filter(entry => 
            entry.chainConfig?.models.join(',') === config.models.join(',') ||
            (entry.chainResponses && entry.chainResponses[chainId])
          ).length,
          wins: chainSessions.length,
        };
      });

      return {
        totalSessions: data.length,
        withSelections: withSelections.length,
        modelStats,
        chainStats,
        parallelSessions: data.filter(entry => entry.chatMode === 'parallel').length,
        chainSessions: data.filter(entry => entry.chatMode === 'chain').length,
        universalSessions: data.filter(entry => entry.chatMode === 'universal').length,
      };
    } catch (error) {
      console.error('[TrainingData] Failed to get stats:', error);
      return { 
        totalSessions: 0, 
        withSelections: 0, 
        modelStats: [], 
        chainStats: [],
        parallelSessions: 0,
        chainSessions: 0,
        universalSessions: 0,
      };
    }
  }

  // Legacy method for backward compatibility
  async getStats(): Promise<{
    total: number;
    withSelections: number;
    openaiWins: number;
    geminiWins: number;
  }> {
    const extStats = await this.getExtensibleStats();
    const openaiStats = extStats.modelStats.find(s => s.modelId === 'openai');
    const geminiStats = extStats.modelStats.find(s => s.modelId === 'gemini');
    
    return {
      total: extStats.totalSessions,
      withSelections: extStats.withSelections,
      openaiWins: openaiStats?.wins || 0,
      geminiWins: geminiStats?.wins || 0,
    };
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('[TrainingData] Cleared all training data');
    } catch (error) {
      console.error('[TrainingData] Failed to clear data:', error);
    }
  }
}

export const trainingDataService = new TrainingDataService(); 