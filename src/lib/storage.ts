import * as SecureStore from 'expo-secure-store';
import { PremiumStatus } from '@/types';

const KEYS = {
  PREMIUM_STATUS: 'premium_status',
  PREMIUM_ANALYSIS_COUNT: 'premium_analysis_count',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FREE_ANALYSIS_COUNT: 'free_analysis_count',
  FREE_ANALYSIS_MONTH: 'free_analysis_month',
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

  // Free Analysis Tracking (monthly limit)
  async getFreeAnalysisCount(): Promise<number> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.FREE_ANALYSIS_COUNT);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error('Failed to get free analysis count:', error);
      return 0;
    }
  }

  async getFreeAnalysisMonth(): Promise<string> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.FREE_ANALYSIS_MONTH);
      return data || '';
    } catch (error) {
      console.error('Failed to get free analysis month:', error);
      return '';
    }
  }

  async incrementFreeAnalysis(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const storedMonth = await this.getFreeAnalysisMonth();
      
      // If it's a new month, reset the count
      if (storedMonth !== currentMonth) {
        await SecureStore.setItemAsync(KEYS.FREE_ANALYSIS_COUNT, '1');
        await SecureStore.setItemAsync(KEYS.FREE_ANALYSIS_MONTH, currentMonth);
      } else {
        // Same month, increment count
        const current = await this.getFreeAnalysisCount();
        await SecureStore.setItemAsync(KEYS.FREE_ANALYSIS_COUNT, (current + 1).toString());
      }
    } catch (error) {
      console.error('Failed to increment free analysis count:', error);
    }
  }

  async resetFreeAnalysisCount(): Promise<void> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await SecureStore.setItemAsync(KEYS.FREE_ANALYSIS_COUNT, '0');
      await SecureStore.setItemAsync(KEYS.FREE_ANALYSIS_MONTH, currentMonth);
    } catch (error) {
      console.error('Failed to reset free analysis count:', error);
    }
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

  // Analysis permission check
  async checkCanAnalyze(): Promise<boolean> {
    try {
      const premiumStatus = await this.getPremiumStatus();
      
      // Premium users have unlimited analyses
      if (premiumStatus.isPremium) {
        return true;
      }
      
      // Free users have 1 analysis per month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const storedMonth = await this.getFreeAnalysisMonth();
      const analysisCount = await this.getFreeAnalysisCount();
      
      // If it's a new month, reset and allow
      if (storedMonth !== currentMonth) {
        await this.resetFreeAnalysisCount();
        return true;
      }
      
      // Same month, check if under limit
      return analysisCount < 1;
    } catch (error) {
      console.error('Failed to check analysis permission:', error);
      return false;
    }
  }

  async incrementAnalysisCount(): Promise<void> {
    try {
      const premiumStatus = await this.getPremiumStatus();
      
      if (premiumStatus.isPremium) {
        // Premium users don't have monthly limits
        return;
      } else {
        // Free users increment monthly count
        await this.incrementFreeAnalysis();
      }
    } catch (error) {
      console.error('Failed to increment analysis count:', error);
    }
  }

  // Get usage information for UI
  async getUsageLimit(): Promise<{ monthlyAnalysisCount: number; canAnalyze: boolean; nextResetDate?: string }> {
    try {
      const premiumStatus = await this.getPremiumStatus();
      
      if (premiumStatus.isPremium) {
        return {
          monthlyAnalysisCount: 0,
          canAnalyze: true,
        };
      }
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const storedMonth = await this.getFreeAnalysisMonth();
      const analysisCount = await this.getFreeAnalysisCount();
      
      // Calculate next reset date
      let nextResetDate: string | undefined;
      if (storedMonth === currentMonth) {
        const currentDate = new Date();
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        nextResetDate = nextMonth.toISOString().slice(0, 10); // YYYY-MM-DD format
      }
      
      return {
        monthlyAnalysisCount: analysisCount,
        canAnalyze: analysisCount < 1,
        nextResetDate,
      };
    } catch (error) {
      console.error('Failed to get usage limit:', error);
      return {
        monthlyAnalysisCount: 0,
        canAnalyze: false,
      };
    }
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
        SecureStore.deleteItemAsync(KEYS.FREE_ANALYSIS_COUNT),
        SecureStore.deleteItemAsync(KEYS.FREE_ANALYSIS_MONTH),
        SecureStore.deleteItemAsync(KEYS.ONBOARDING_COMPLETE),
        SecureStore.deleteItemAsync('last_premium_season'),
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}

export const storage = new StorageService(); 