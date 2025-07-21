import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Services
import { premiumAnalysis, PremiumAnalysisResult } from '@/lib/premiumAnalysis';
import { storage } from '@/lib/storage';
import { database } from '@/lib/database';

// Types
import { RootStackParamList, SkinMetrics } from '@/types';

type PremiumReportScreenRouteProp = RouteProp<RootStackParamList, 'PremiumReport'>;
type PremiumReportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PremiumReport'>;

interface PremiumReportScreenProps {
  route: PremiumReportScreenRouteProp;
  navigation: PremiumReportScreenNavigationProp;
}

export default function PremiumReportScreen({ route, navigation }: PremiumReportScreenProps) {
  const { analysisId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [premiumReport, setPremiumReport] = useState<PremiumAnalysisResult | null>(null);
  const [basicAnalysis, setBasicAnalysis] = useState<any>(null);
  const [currentSeason, setCurrentSeason] = useState('');
  const [shouldShowRenewal, setShouldShowRenewal] = useState(false);

  useEffect(() => {
    loadAnalysisData();
  }, [analysisId]);

  const loadAnalysisData = async () => {
    try {
      setIsLoading(true);
      
      // Load basic analysis
      const analysis = await database.getAnalysisById(analysisId);
      setBasicAnalysis(analysis);
      
      // Check seasonal status
      const season = await storage.getCurrentSeason();
      setCurrentSeason(season);
      
      const showRenewal = await storage.shouldShowSeasonalRenewal();
      setShouldShowRenewal(showRenewal);
      
      // Check if premium report already exists
      if ((analysis as any)?.premiumReport) {
        setPremiumReport((analysis as any).premiumReport);
      }
      
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePremiumReport = async () => {
    if (!basicAnalysis) return;

    Alert.alert(
      'Premium Analysis Report',
      `Generate detailed seasonal skincare report for $10?\n\n✨ Personalized morning & evening routines\n🧴 Specific product recommendations\n🌱 ${currentSeason} seasonal adjustments\n📅 Renewal reminder for next season`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Purchase $10', 
          style: 'default',
          onPress: generateReport 
        }
      ]
    );
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      
      const report = await premiumAnalysis.generatePremiumReport(
        basicAnalysis.metrics,
        basicAnalysis.skinType || 'medium',
        basicAnalysis.confidence || 85
      );
      
      setPremiumReport(report);
      
      // Update analysis with premium report
      const updatedAnalysis = {
        ...basicAnalysis,
        premiumReport: report
      };
      await database.saveAnalysis(updatedAnalysis);
      
      Alert.alert(
        'Report Generated! 🎉',
        'Your personalized skincare analysis is ready. Save these recommendations and check back next season for updates!'
      );
      
    } catch (error) {
      console.error('Failed to generate premium report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading analysis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Analysis</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seasonal Alert */}
        {shouldShowRenewal && (
          <View style={styles.seasonalAlert}>
            <View style={styles.seasonalAlertHeader}>
              <Ionicons name="leaf" size={20} color="#F59E0B" />
              <Text style={styles.seasonalAlertTitle}>New Season, New Needs</Text>
            </View>
            <Text style={styles.seasonalAlertText}>
              It's {currentSeason} now! Your skin's needs have changed. Consider a fresh analysis for this season.
            </Text>
          </View>
        )}

        {/* Premium Report or Upgrade Prompt */}
        {premiumReport ? (
          <PremiumReportDisplay report={premiumReport} />
        ) : (
          <UpgradePrompt 
            onUpgrade={handleGeneratePremiumReport}
            isGenerating={isGenerating}
            currentSeason={currentSeason}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const UpgradePrompt: React.FC<{
  onUpgrade: () => void;
  isGenerating: boolean;
  currentSeason: string;
}> = ({ onUpgrade, isGenerating, currentSeason }) => (
  <View style={styles.upgradeContainer}>
    <LinearGradient
      colors={['#4F46E5', '#7C3AED']}
      style={styles.upgradeHeader}
    >
      <Ionicons name="sparkles" size={32} color="#FFFFFF" />
      <Text style={styles.upgradeTitle}>Premium Analysis Report</Text>
      <Text style={styles.upgradeSubtitle}>
        Get AI-powered, personalized skincare recommendations for {currentSeason}
      </Text>
    </LinearGradient>

    <View style={styles.featuresList}>
      <FeatureItem 
        icon="medical" 
        title="Detailed Skin Assessment"
        description="Professional-grade analysis of your skin condition with specific improvement areas"
      />
      <FeatureItem 
        icon="time" 
        title="Morning & Evening Routines"
        description="Step-by-step personalized routines with product types and application instructions"
      />
      <FeatureItem 
        icon="storefront" 
        title="Specific Product Recommendations"
        description="Real product names, brands, and prices tailored to your exact needs and skin type"
      />
      <FeatureItem 
        icon="leaf" 
        title={`${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} Seasonal Adjustments`}
        description={`Customized recommendations for ${currentSeason} weather and environmental factors`}
      />
      <FeatureItem 
        icon="calendar" 
        title="Seasonal Renewal Reminders"
        description="Know exactly when to update your routine for optimal year-round skin health"
      />
    </View>

    <View style={styles.pricingContainer}>
      <Text style={styles.priceText}>$10.00</Text>
      <Text style={styles.priceSubtext}>One-time payment • Valid for current season</Text>
    </View>

    <TouchableOpacity 
      style={[styles.upgradeButton, isGenerating && styles.upgradeButtonDisabled]}
      onPress={onUpgrade}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="star" size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Generate Premium Report</Text>
        </>
      )}
    </TouchableOpacity>

    <Text style={styles.disclaimerText}>
      This analysis is personalized for {currentSeason}. Get a new report next season for updated recommendations.
    </Text>
  </View>
);

const PremiumReportDisplay: React.FC<{ report: PremiumAnalysisResult }> = ({ report }) => (
  <View style={styles.reportContainer}>
    <View style={styles.reportHeader}>
      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
      <Text style={styles.reportTitle}>Your Premium Analysis Report</Text>
      <Text style={styles.reportDate}>
        Generated on {new Date(report.analysisDate).toLocaleDateString()} • {report.season} season
      </Text>
    </View>

    <View style={styles.confidenceCard}>
      <Text style={styles.confidenceTitle}>Analysis Confidence</Text>
      <Text style={styles.confidenceScore}>{report.confidence}%</Text>
    </View>

    <ReportSection 
      title="Overall Assessment"
      icon="medical"
      content={report.detailedReport.overallAssessment}
    />

    <ReportSection 
      title="Seasonal Context"
      icon="leaf"
      content={report.detailedReport.seasonalContext}
    />

    <RoutineSection 
      title="Morning Routine"
      icon="sunny"
      routine={report.detailedReport.morningRoutine}
    />

    <RoutineSection 
      title="Evening Routine"
      icon="moon"
      routine={report.detailedReport.eveningRoutine}
    />

    <ProductRecommendationsSection 
      recommendations={report.detailedReport.productRecommendations}
    />

    <ReportSection 
      title="Next Season Reminder"
      icon="calendar"
      content={report.detailedReport.nextSeasonReminder}
    />
  </View>
);

const FeatureItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={20} color="#4F46E5" />
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const ReportSection: React.FC<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  content: string;
}> = ({ title, icon, content }) => (
  <View style={styles.reportSection}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#4F46E5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionContent}>{content}</Text>
  </View>
);

const RoutineSection: React.FC<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  routine: any[];
}> = ({ title, icon, routine }) => (
  <View style={styles.reportSection}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={20} color="#4F46E5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {routine.map((step, index) => (
      <View key={index} style={styles.routineStep}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{step.step}</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{step.action}</Text>
          <Text style={styles.stepProduct}>{step.product}</Text>
          <Text style={styles.stepFrequency}>{step.frequency}</Text>
          <Text style={styles.stepInstructions}>{step.instructions}</Text>
        </View>
      </View>
    ))}
  </View>
);

const ProductRecommendationsSection: React.FC<{
  recommendations: any[];
}> = ({ recommendations }) => (
  <View style={styles.reportSection}>
    <View style={styles.sectionHeader}>
      <Ionicons name="storefront" size={20} color="#4F46E5" />
      <Text style={styles.sectionTitle}>Product Recommendations</Text>
    </View>
    {recommendations.map((product, index) => (
      <View key={index} style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.productName}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <Text style={styles.productPrice}>{product.priceRange}</Text>
        </View>
        <Text style={styles.productIngredients}>
          Active: {product.activeIngredients.join(', ')}
        </Text>
        <Text style={styles.productReasoning}>{product.reasoning}</Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  seasonalAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  seasonalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  seasonalAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  seasonalAlertText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  upgradeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeHeader: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
  },
  featuresList: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureContent: {
    marginLeft: 12,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  priceSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  upgradeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 16,
  },
  reportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reportHeader: {
    backgroundColor: '#F0FDF4',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  confidenceCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confidenceTitle: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 4,
  },
  confidenceScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  reportSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  routineStep: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepProduct: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginBottom: 2,
  },
  stepFrequency: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stepInstructions: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  productCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  productHeader: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productBrand: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  productIngredients: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 4,
  },
  productReasoning: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});

// Add to RootStackParamList in types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 