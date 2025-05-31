import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletData } from './suiService';

export interface TrainingDataEntry {
  id: string;
  timestamp: number;
  question: string;
  walletData: WalletData | null;
  responses: {
    openai?: string;
    gemini?: string;
  };
  selectedBetter: 'openai' | 'gemini' | null;
  userFeedback?: string;
}

export interface ComparisonSession {
  id: string;
  timestamp: number;
  question: string;
  walletData: WalletData | null;
  responses: {
    openai?: string;
    gemini?: string;
  };
  selectedBetter: 'openai' | 'gemini' | null;
}

class TrainingDataService {
  private readonly STORAGE_KEY = 'suisage_training_data';
  private readonly MAX_ENTRIES = 1000; // Limit storage size

  async saveComparisonData(session: ComparisonSession): Promise<void> {
    try {
      const existingData = await this.getAllTrainingData();
      
      const trainingEntry: TrainingDataEntry = {
        id: session.id,
        timestamp: session.timestamp,
        question: session.question,
        walletData: session.walletData,
        responses: session.responses,
        selectedBetter: session.selectedBetter,
      };

      // Add new entry and maintain size limit
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
      
      // Format for training: only include entries with selections
      const trainingData = data
        .filter(entry => entry.selectedBetter !== null)
        .map(entry => ({
          prompt: entry.question,
          context: entry.walletData ? {
            balance: entry.walletData.balance,
            assets: entry.walletData.assets.length,
            transactions: entry.walletData.transactions.length,
          } : null,
          responses: entry.responses,
          preferred: entry.selectedBetter,
          timestamp: entry.timestamp,
        }));

      return JSON.stringify(trainingData, null, 2);
    } catch (error) {
      console.error('[TrainingData] Failed to export data:', error);
      return '[]';
    }
  }

  async getStats(): Promise<{
    total: number;
    withSelections: number;
    openaiWins: number;
    geminiWins: number;
  }> {
    try {
      const data = await this.getAllTrainingData();
      const withSelections = data.filter(entry => entry.selectedBetter !== null);
      
      return {
        total: data.length,
        withSelections: withSelections.length,
        openaiWins: withSelections.filter(entry => entry.selectedBetter === 'openai').length,
        geminiWins: withSelections.filter(entry => entry.selectedBetter === 'gemini').length,
      };
    } catch (error) {
      console.error('[TrainingData] Failed to get stats:', error);
      return { total: 0, withSelections: 0, openaiWins: 0, geminiWins: 0 };
    }
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