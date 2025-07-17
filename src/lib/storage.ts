import * as SecureStore from 'expo-secure-store';
import { PremiumStatus, UsageLimit } from '@/types';

const KEYS = {
  PREMIUM_STATUS: 'premium_status',
  USAGE_LIMIT: 'usage_limit',
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

  // Usage Limit Management
  async setUsageLimit(limit: UsageLimit): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEYS.USAGE_LIMIT, JSON.stringify(limit));
    } catch (error) {
      console.error('Failed to save usage limit:', error);
    }
  }

  async getUsageLimit(): Promise<UsageLimit> {
    try {
      const data = await SecureStore.getItemAsync(KEYS.USAGE_LIMIT);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to get usage limit:', error);
    }

    return {
      monthlyAnalysisCount: 0,
      canAnalyze: true,
    };
  }

  async incrementAnalysisCount(): Promise<UsageLimit> {
    const current = await this.getUsageLimit();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if we're in a new month
    let resetCount = false;
    if (current.lastAnalysisDate) {
      const lastAnalysis = new Date(current.lastAnalysisDate);
      if (lastAnalysis.getMonth() !== currentMonth || lastAnalysis.getFullYear() !== currentYear) {
        resetCount = true;
      }
    }

    const newLimit: UsageLimit = {
      lastAnalysisDate: now.getTime(),
      monthlyAnalysisCount: resetCount ? 1 : current.monthlyAnalysisCount + 1,
      canAnalyze: true, // Will be determined by the calling code based on premium status
    };

    await this.setUsageLimit(newLimit);
    return newLimit;
  }

  async checkCanAnalyze(): Promise<boolean> {
    const premiumStatus = await this.getPremiumStatus();
    
    // Premium users can always analyze
    if (premiumStatus.isPremium) {
      return true;
    }

    // Free users: check monthly limit
    const usageLimit = await this.getUsageLimit();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // If no previous analysis, they can analyze
    if (!usageLimit.lastAnalysisDate) {
      return true;
    }

    const lastAnalysis = new Date(usageLimit.lastAnalysisDate);
    
    // If it's a new month, they can analyze
    if (lastAnalysis.getMonth() !== currentMonth || lastAnalysis.getFullYear() !== currentYear) {
      return true;
    }

    // Free users get 1 analysis per month
    return usageLimit.monthlyAnalysisCount < 1;
  }

  // Onboarding Management
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

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEYS.PREMIUM_STATUS);
      await SecureStore.deleteItemAsync(KEYS.USAGE_LIMIT);
      await SecureStore.deleteItemAsync(KEYS.ONBOARDING_COMPLETE);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

export const storage = new StorageService(); 