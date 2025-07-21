import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import MetricCard from '@/components/MetricCard';
import RoutineCard from '@/components/RoutineCard';

// Services
import { database } from '@/lib/database';
import { iap } from '@/lib/iap';

// Types
import { RootStackParamList, AnalysisResult, PremiumStatus } from '@/types';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

interface ResultScreenProps {
  route: ResultScreenRouteProp;
  navigation: ResultScreenNavigationProp;
}

export default function ResultScreen({ route, navigation }: ResultScreenProps) {
  const { analysisId } = route.params;
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({ isPremium: false });
  const [isLoading, setIsLoading] = useState(true);
  const [enhancedData, setEnhancedData] = useState<{
    confidence?: number;
    skinType?: string;
    environmentalFactors?: any;
  }>({});

  useEffect(() => {
    loadAnalysisResult();
  }, [analysisId]);

  const loadAnalysisResult = async () => {
    try {
      const [analysisData, premium] = await Promise.all([
        database.getAnalysisById(analysisId),
        iap.checkPremiumStatus(),
      ]);

      if (!analysisData) {
        Alert.alert('Error', 'Analysis not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setAnalysis(analysisData);
      setPremiumStatus(premium);
    } catch (error) {
      console.error('Failed to load analysis:', error);
      Alert.alert('Error', 'Failed to load analysis results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigation.navigate('Upgrade');
  };

  const handleNewAnalysis = () => {
    navigation.navigate('Camera');
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#EF4444'; // Red
    if (score >= 40) return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  const getTextureColor = (score: number) => {
    if (score >= 70) return '#EF4444'; // Red - rough texture
    if (score >= 40) return '#F59E0B'; // Orange - moderate texture
    return '#10B981'; // Green - smooth texture
  };

  const generateSkinOverview = (metrics: any, skinType?: string, confidence?: number) => {
    const avgScore = (metrics.oiliness + metrics.redness + metrics.texture + (metrics.acne || 0) + (metrics.wrinkles || 0)) / 5;
    
    let condition = 'good';
    if (avgScore > 60) condition = 'needs attention';
    else if (avgScore > 40) condition = 'moderate';
    else condition = 'excellent';
    
    const primaryConcern = metrics.oiliness > metrics.redness && metrics.oiliness > metrics.texture ? 'oiliness' :
                          metrics.redness > metrics.texture ? 'redness' : 'texture';
    
    const confidenceText = confidence ? ` Analysis confidence: ${confidence}%` : '';
    const skinTypeText = skinType ? ` Your ${skinType} skin` : ' Your skin';
    
    return `${skinTypeText} is in ${condition} condition. Primary focus area: ${primaryConcern}.${confidenceText}${!premiumStatus.isPremium ? ' Upgrade for detailed analysis including acne scoring and personalized routines.' : ''}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Analysis not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Results</Text>
          <Text style={styles.date}>
            {new Date(analysis.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Skin Overview Section */}
        <View style={styles.overviewSection}>
          <Text style={styles.overviewTitle}>Analysis Overview</Text>
          <Text style={styles.overviewText}>
            {generateSkinOverview(analysis.metrics, analysis.skinType, analysis.confidence)}
          </Text>
        </View>

        {/* Metrics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skin Metrics</Text>
          
          <MetricCard
            title="Oiliness"
            value={analysis.metrics.oiliness}
            type="percentage"
            color={getScoreColor(analysis.metrics.oiliness)}
            advice={analysis.advice.oiliness}
            icon="water-outline"
          />

          <MetricCard
            title="Redness"
            value={analysis.metrics.redness}
            type="percentage"
            color={getScoreColor(analysis.metrics.redness)}
            advice={analysis.advice.redness}
            icon="heart-outline"
          />

          <MetricCard
            title="Texture"
            value={analysis.metrics.texture}
            type="percentage"
            color={getTextureColor(analysis.metrics.texture)}
            advice={analysis.advice.texture}
            icon="grid-outline"
          />

          {/* Premium Acne Metric */}
          {premiumStatus.isPremium && analysis.metrics.acne ? (
            <MetricCard
              title="Acne Score"
              value={analysis.metrics.acne}
              type="percentage"
              color={getTextureColor(analysis.metrics.acne)}
              advice={analysis.advice.acne || ''}
              icon="medical-outline"
              isPremium
            />
          ) : !premiumStatus.isPremium && (
            <TouchableOpacity 
              style={styles.premiumMetricLocked}
              onPress={handleUpgrade}
            >
              <View style={styles.premiumMetricContent}>
                <Ionicons name="sparkles" size={24} color="#F59E0B" />
                <View style={styles.premiumMetricText}>
                  <Text style={styles.premiumMetricTitle}>🧴 Advanced Analysis</Text>
                  <Text style={styles.premiumMetricSubtitle}>Unlock acne scoring & wrinkle detection</Text>
                </View>
              </View>
              <View style={styles.premiumCtaButton}>
                <Text style={styles.premiumCtaText}>See More</Text>
                <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
              </View>
            </TouchableOpacity>
          )}

          {/* Premium Wrinkles Metric */}
          {premiumStatus.isPremium && analysis.metrics.wrinkles ? (
            <MetricCard
              title="Wrinkles"
              value={analysis.metrics.wrinkles}
              type="percentage"
              color={getTextureColor(analysis.metrics.wrinkles)}
              advice={analysis.advice.wrinkles || ''}
              icon="time-outline"
              isPremium
            />
          ) : null}
        </View>

        {/* Routines Section */}
        {premiumStatus.isPremium && analysis.routines ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalized Routines</Text>
            
            <RoutineCard
              title="Morning Routine"
              steps={analysis.routines.morning}
              icon="sunny-outline"
              color="#F59E0B"
            />

            <RoutineCard
              title="Evening Routine"
              steps={analysis.routines.evening}
              icon="moon-outline"
              color="#6366F1"
            />
          </View>
        ) : !premiumStatus.isPremium && (
          <View style={styles.section}>
            <View style={styles.premiumRoutinesLocked}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.premiumGradient}
              >
                <Ionicons name="sparkles" size={36} color="#ffffff" />
                <Text style={styles.premiumTitle}>Unlock Your Perfect Routine</Text>
                <Text style={styles.premiumSubtitle}>
                  🌅 Personalized morning & evening routines{'\n'}
                  🧴 Advanced acne & wrinkle analysis{'\n'}
                  💎 Professional skincare recommendations{'\n'}
                  📊 Detailed progress tracking
                </Text>
                <TouchableOpacity style={styles.premiumUpgradeButton} onPress={handleUpgrade}>
                  <Text style={styles.premiumUpgradeButtonText}>✨ Activate Premium</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* General Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>Always use SPF 30+ during the day</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="water-outline" size={20} color="#3B82F6" />
              <Text style={styles.tipText}>Stay hydrated and moisturize regularly</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="time-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>Maintain consistent skincare routine</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="medical-outline" size={20} color="#EF4444" />
              <Text style={styles.tipText}>Consult dermatologist for persistent issues</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.newAnalysisButton} onPress={handleNewAnalysis}>
            <Text style={styles.newAnalysisButtonText}>New Analysis</Text>
          </TouchableOpacity>

          {!premiumStatus.isPremium && (
            <TouchableOpacity style={styles.upgradeActionButton} onPress={handleUpgrade}>
              <LinearGradient
                colors={['#F59E0B', '#EAB308']}
                style={styles.upgradeGradient}
              >
                <Ionicons name="star" size={20} color="#ffffff" />
                <Text style={styles.upgradeActionButtonText}>Get Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  premiumMetricLocked: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  premiumMetricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumMetricText: {
    marginLeft: 12,
  },
  premiumMetricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  premiumMetricSubtitle: {
    fontSize: 14,
    color: '#F59E0B',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumRoutinesLocked: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: 32,
    alignItems: 'center',
  },
  premiumTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumSubtitle: {
    color: '#e0e7ff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  premiumUpgradeButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  premiumUpgradeButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tipText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  newAnalysisButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
  },
  newAnalysisButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  upgradeActionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  upgradeActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumReportButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 8,
  },
  premiumReportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  premiumReportButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  overviewSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  premiumCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  premiumCtaText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
}); 