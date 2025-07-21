import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PurchasesPackage } from 'react-native-purchases';

// Services
import { iap } from '@/lib/iap';

// Types
import { RootStackParamList } from '@/types';

type UpgradeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Upgrade'>;

interface UpgradeScreenProps {
  navigation: UpgradeScreenNavigationProp;
  route?: {
    params?: {
      analysisData?: any; // For premium report upgrade flow
    };
  };
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isPremium?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description, isPremium = false }) => (
  <View style={styles.featureItem}>
    <View style={[styles.featureIcon, isPremium && styles.featureIconPremium]}>
      <Ionicons 
        name={icon} 
        size={24} 
        color={isPremium ? "#F59E0B" : "#4F46E5"} 
      />
    </View>
    <View style={styles.featureContent}>
      <View style={styles.featureTitleContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        )}
      </View>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

export default function UpgradeScreen({ navigation }: UpgradeScreenProps) {
  const [products, setProducts] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const availableProducts = await iap.getProducts();
      setProducts(availableProducts);
      
      // Set default selection to monthly if available
      const monthlyProduct = availableProducts.find(p => 
        p.product.identifier.includes('monthly')
      );
      if (monthlyProduct) {
        setSelectedProduct(monthlyProduct);
      } else if (availableProducts.length > 0) {
        setSelectedProduct(availableProducts[0]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (purchaseInProgress) return;

    setPurchaseInProgress(true);
    
    try {
      // FOR TESTING: Use mock premium activation
      await iap.activateMockPremium();
      
      Alert.alert(
        '🎉 Premium Activated!',
        'Welcome to Premium! You now have unlimited access to all features:\n\n✨ Advanced acne & wrinkle analysis\n🌅 Personalized routines\n📊 Progress tracking\n💎 Premium recommendations',
        [
          {
            text: 'Start Analyzing',
            onPress: () => navigation.navigate('Camera'),
          },
        ]
      );
      
      /* PRODUCTION CODE:
      if (!selectedProduct) return;
      const success = await iap.purchasePremium(selectedProduct);
      
      if (success) {
        Alert.alert('Success!', 'Welcome to Premium!', [
          { text: 'Start Analyzing', onPress: () => navigation.navigate('Camera') }
        ]);
      } else {
        Alert.alert('Purchase Failed', 'Please try again.');
      }
      */
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'An error occurred during purchase. Please try again.');
    } finally {
      setPurchaseInProgress(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      const restored = await iap.restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Purchases Restored',
          'Your Premium subscription has been restored.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('No Purchases Found', 'No previous Premium purchases were found.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const getProductPrice = (product: PurchasesPackage) => {
    return product.product.priceString;
  };

  const getProductTitle = (product: PurchasesPackage) => {
    if (product.product.identifier.includes('monthly')) return 'Monthly';
    if (product.product.identifier.includes('yearly')) return 'Yearly';
    return product.product.title || 'Premium';
  };

  const isYearlyProduct = (product: PurchasesPackage) => {
    return product.product.identifier.includes('yearly');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          style={styles.header}
        >
          <Ionicons name="star" size={48} color="#ffffff" />
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <Text style={styles.headerSubtitle}>
            Unlock unlimited analyses and advanced features
          </Text>
        </LinearGradient>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What You Get</Text>
          
          <FeatureItem
            icon="infinite"
            title="Unlimited Analyses"
            description="Analyze your skin as many times as you want, anytime"
            isPremium
          />

          <FeatureItem
            icon="medical"
            title="Advanced Acne Detection"
            description="Get detailed acne scoring with AI-powered analysis"
            isPremium
          />

          <FeatureItem
            icon="list"
            title="Personalized Routines"
            description="Custom morning and evening skincare recommendations"
            isPremium
          />

          <FeatureItem
            icon="trending-up"
            title="Progress Tracking"
            description="Monitor your skin improvements over time"
            isPremium
          />

          <FeatureItem
            icon="shield-checkmark"
            title="Privacy Protection"
            description="All data stays securely on your device"
          />
        </View>

        {/* Test Mode Banner */}
        <View style={styles.testModeSection}>
          <View style={styles.testModeBanner}>
            <Ionicons name="flask" size={24} color="#6366F1" />
            <View style={styles.testModeContent}>
              <Text style={styles.testModeTitle}>Test Mode</Text>
              <Text style={styles.testModeText}>
                Premium features activated for testing - all features unlocked!
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        {products.length > 0 && (
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            
            <View style={styles.pricingOptions}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.product.identifier}
                  style={[
                    styles.pricingOption,
                    selectedProduct?.product.identifier === product.product.identifier && styles.pricingOptionSelected,
                  ]}
                  onPress={() => setSelectedProduct(product)}
                >
                  {isYearlyProduct(product) && (
                    <View style={styles.pricingBadge}>
                      <Text style={styles.pricingBadgeText}>Save 50%</Text>
                    </View>
                  )}
                  <View style={styles.pricingHeader}>
                    <Text style={styles.pricingTitle}>{getProductTitle(product)}</Text>
                    <Text style={styles.pricingPrice}>{getProductPrice(product)}</Text>
                  </View>
                  <Text style={styles.pricingDescription}>
                    {isYearlyProduct(product) ? 'per year' : 'per month'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            • Subscription automatically renews unless cancelled
          </Text>
          <Text style={styles.termsText}>
            • Cancel anytime in your App Store account settings
          </Text>
          <Text style={styles.termsText}>
            • No commitment, cancel without penalty
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.purchaseButton, purchaseInProgress && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={purchaseInProgress}
          >
            <LinearGradient
              colors={['#F59E0B', '#EAB308']}
              style={styles.purchaseGradient}
            >
              {purchaseInProgress ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="star" size={20} color="#ffffff" />
                  <Text style={styles.purchaseButtonText}>
                    ✨ Activate Premium Features
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.restoreButton} 
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#e0e7ff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconPremium: {
    backgroundColor: '#FEF3C7',
  },
  featureContent: {
    flex: 1,
  },
  featureTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  pricingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingOption: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  pricingOptionSelected: {
    borderColor: '#F59E0B',
  },
  pricingBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pricingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F59E0B',
  },
  pricingDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  termsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  testModeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  testModeBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  testModeContent: {
    marginLeft: 12,
    flex: 1,
  },
  testModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  testModeText: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 18,
  },
}); 