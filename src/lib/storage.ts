import * as SecureStore from 'expo-secure-store';
import { PremiumStatus } from '@/types';

const KEYS = {
  PREMIUM_STATUS: 'premium_status',
  PREMIUM_ANALYSIS_COUNT: 'premium_analysis_count',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

class StorageService {
  // Premium Status Management
  async setPremiumStatus(status: PremiumStatus): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.PREMIUM_STATUS, JSON.stringify(status));
    } catch (error) {
      console.error('Failed to save premium status:', error);
    }
  }

  async getPremiumStatus(): Promise<PremiumStatus> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.PREMIUM_STATUS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get premium status:', error);
    }
    
    return { isPremium: false };
  }

  // Premium Analysis Tracking (per-report billing)
  async getPremiumAnalysisCount(): Promise<number> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.PREMIUM_ANALYSIS_COUNT);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Failed to get premium analysis count:', error);
      return 0;
    }
  }

  async incrementPremiumAnalysis(): Promise<void> {
    try {
      const current = await this.getPremiumAnalysisCount();
      await SecureStore.setItemAsync(KEYS.PREMIUM_ANALYSIS_COUNT, (current + 1).toString());
    } catch (error) {
      console.error('Failed to increment premium analysis count:', error);
    }
  }

  // Basic analysis is always free and unlimited
  async checkCanAnalyze(): Promise<boolean> {
    return true; // Basic analysis is always available
  }

  async incrementAnalysisCount(): Promise<void> {
    // No-op: Basic analysis is unlimited
    return;
  }

  // Season tracking for premium reports
  async getCurrentSeason(): Promise<string> {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  async getLastPremiumReportSeason(): Promise<string | null> {
    try {
      const data = await SecureStore.getItemAsync('last_premium_season');
      return data;
    } catch (error) {
      console.error('Failed to get last premium season:', error);
      return null;
    }
  }

  async setLastPremiumReportSeason(season: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('last_premium_season', season);
    } catch (error) {
      console.error('Failed to save last premium season:', error);
    }
  }

  async shouldShowSeasonalRenewal(): Promise<boolean> {
    const currentSeason = await this.getCurrentSeason();
    const lastSeason = await this.getLastPremiumReportSeason();
    return lastSeason !== null && lastSeason !== currentSeason;
  }

  // Onboarding
  async setOnboardingComplete(): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.ONBOARDING_COMPLETE, 'true');
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  }

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.ONBOARDING_COMPLETE);
      return data === 'true';
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return false;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.PREMIUM_STATUS),
        SecureStore.deleteItemAsync(KEYS.PREMIUM_ANALYSIS_COUNT),
        SecureStore.deleteItemAsync(KEYS.ONBOARDING_COMPLETE),
        SecureStore.deleteItemAsync('last_premium_season'),
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Legacy support for existing code
  async getUsageLimit(): Promise<{ monthlyAnalysisCount: number; canAnalyze: boolean }> {
    return {
      monthlyAnalysisCount: 0,
      canAnalyze: true,
    };
  }
}

export const storage = new StorageService(); 