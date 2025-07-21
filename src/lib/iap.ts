import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { storage } from './storage';
import { PremiumStatus } from '@/types';

const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;

const ENTITLEMENT_ID = 'premium'; // RevenueCat entitlement identifier

class IAPService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Configure RevenueCat with your API keys
      // Replace with your actual API keys from RevenueCat dashboard
      const apiKey = Platform.select({
        ios: 'your_ios_api_key_here',
        android: 'your_android_api_key_here',
      });

      if (!apiKey) {
        throw new Error('No API key found for platform');
      }

      await Purchases.configure({ apiKey });
      this.isInitialized = true;
      
      // Check current customer info and restore if needed
      await this.updatePremiumStatus();
    } catch (error) {
      console.error('IAP initialization failed:', error);
      throw error;
    }
  }

  async getProducts(): Promise<PurchasesPackage[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      // Get the default offering or a specific offering
      const currentOffering = offerings.current;
      
      if (currentOffering && currentOffering.availablePackages.length > 0) {
        return currentOffering.availablePackages;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get products:', error);
      return [];
    }
  }

  async purchasePremium(packageToPurchase: PurchasesPackage): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Check if the purchase was successful
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        await this.processPurchase(customerInfo);
        return true;
      } else {
        console.log('Purchase completed but entitlement not active');
        return false;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  async purchaseProductById(productId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const { customerInfo } = await Purchases.purchaseProduct(productId);
      
      // Check if the purchase was successful
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        await this.processPurchase(customerInfo);
        return true;
      } else {
        console.log('Purchase completed but entitlement not active');
        return false;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Check if user has active premium entitlement
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        await this.processPurchase(customerInfo);
        return true;
      } else {
        // No active premium subscription found
        await storage.setPremiumStatus({ isPremium: false });
        return false;
      }
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return false;
    }
  }

  private async processPurchase(customerInfo: CustomerInfo): Promise<void> {
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    if (premiumEntitlement) {
      const premiumStatus: PremiumStatus = {
        isPremium: true,
        purchaseDate: premiumEntitlement.latestPurchaseDate ? 
          new Date(premiumEntitlement.latestPurchaseDate).getTime() : Date.now(),
        expiryDate: premiumEntitlement.expirationDate ? 
          new Date(premiumEntitlement.expirationDate).getTime() : undefined,
        productId: premiumEntitlement.productIdentifier,
      };

      await storage.setPremiumStatus(premiumStatus);
    } else {
      await storage.setPremiumStatus({ isPremium: false });
    }
  }

  async checkPremiumStatus(): Promise<PremiumStatus> {
    // FOR TESTING: Check mock premium status first
    const storedStatus = await storage.getPremiumStatus();
    if (storedStatus.isPremium) {
      return storedStatus;
    }

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get latest customer info from RevenueCat
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has active premium entitlement
      const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      
      if (premiumEntitlement) {
        const premiumStatus: PremiumStatus = {
          isPremium: true,
          purchaseDate: premiumEntitlement.latestPurchaseDate ? 
            new Date(premiumEntitlement.latestPurchaseDate).getTime() : Date.now(),
          expiryDate: premiumEntitlement.expirationDate ? 
            new Date(premiumEntitlement.expirationDate).getTime() : undefined,
          productId: premiumEntitlement.productIdentifier,
        };

        await storage.setPremiumStatus(premiumStatus);
        return premiumStatus;
      } else {
        const expiredStatus: PremiumStatus = { isPremium: false };
        await storage.setPremiumStatus(expiredStatus);
        return expiredStatus;
      }
    } catch (error) {
      console.error('Failed to check premium status:', error);
      // Fallback to stored status if network request fails
      return await storage.getPremiumStatus();
    }
  }

  // FOR TESTING: Mock premium activation
  async activateMockPremium(): Promise<void> {
    const premiumStatus: PremiumStatus = {
      isPremium: true,
      purchaseDate: Date.now(),
      expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      productId: 'mock_premium',
    };
    
    await storage.setPremiumStatus(premiumStatus);
    console.log('🎉 Mock premium activated!');
  }

  async deactivateMockPremium(): Promise<void> {
    const premiumStatus: PremiumStatus = {
      isPremium: false,
    };
    
    await storage.setPremiumStatus(premiumStatus);
    console.log('❌ Mock premium deactivated!');
  }

  private async updatePremiumStatus(): Promise<void> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      await this.processPurchase(customerInfo);
    } catch (error) {
      console.error('Failed to update premium status:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // RevenueCat doesn't have a disconnect method
      // The SDK handles cleanup automatically
      this.isInitialized = false;
    } catch (error) {
      console.error('IAP disconnect failed:', error);
    }
  }
}

export const iap = new IAPService(); 