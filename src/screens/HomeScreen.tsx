import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Services
import { storage } from '@/lib/storage';
import { iap } from '@/lib/iap';
import { database } from '@/lib/database';

// Types
import { RootStackParamList, PremiumStatus, UsageLimit, AnalysisResult } from '@/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({ isPremium: false });
  const [usageLimit, setUsageLimit] = useState<UsageLimit>({ monthlyAnalysisCount: 0, canAnalyze: true });
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [premium, usage, analyses] = await Promise.all([
        iap.checkPremiumStatus(),
        storage.getUsageLimit(),
        database.getAnalysisHistory(),
      ]);
      
      setPremiumStatus(premium);
      setUsageLimit(usage);
      setRecentAnalyses(analyses);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAnalyze = async () => {
    try {
      const canAnalyze = await storage.checkCanAnalyze();
      
      if (!canAnalyze) {
        Alert.alert(
          'Analysis Limit Reached',
          'You\'ve reached your monthly analysis limit. Upgrade to Premium for unlimited analyses.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { 
              text: 'Upgrade Now', 
              onPress: () => navigation.navigate('Upgrade'),
              style: 'default'
            },
          ]
        );
        return;
      }

      navigation.navigate('Camera');
    } catch (error) {
      console.error('Failed to check analysis permission:', error);
      Alert.alert('Error', 'Failed to start analysis. Please try again.');
    }
  };



  // TEMPORARY: Reset function for testing
  const handleResetStorage = async () => {
    Alert.alert(
      'Reset Storage',
      'This will clear all your data including premium status and usage limits. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAllData();
              await iap.deactivateMockPremium();
              await database.clearAllData();
              Alert.alert('Success', 'Storage has been reset. You can now analyze again.');
              loadData(); // Reload data
            } catch (error) {
              console.error('Failed to reset storage:', error);
              Alert.alert('Error', 'Failed to reset storage.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Premium Status Banner */}
        {premiumStatus.isPremium ? (
          <View style={styles.premiumBanner}>
            <LinearGradient
              colors={['#08B5BF', '#06A3AC']}
              style={styles.premiumGradient}
            >
              <Ionicons name="star" size={24} color="#ffffff" />
              <Text style={styles.premiumText}>Premium Active</Text>
            </LinearGradient>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.upgradeBanner}
            onPress={() => navigation.navigate('Upgrade')}
          >
            <View style={styles.upgradeContent}>
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeSubtitle}>
                  Unlimited analyses + Acne scoring + Personalized routines
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#08B5BF" />
            </View>
          </TouchableOpacity>
        )}



        {/* Analysis Status */}
        {!premiumStatus.isPremium && (
          <View style={styles.analysisStatus}>
            <View style={styles.statusContent}>
              <Ionicons name="analytics-outline" size={20} color="#6B7280" />
              <Text style={styles.statusText}>
                {usageLimit.monthlyAnalysisCount === 0 
                  ? '1 free analysis remaining this month'
                  : 'Monthly analysis limit reached'
                }
              </Text>
            </View>
            {usageLimit.nextResetDate && (
              <Text style={styles.resetDate}>
                Resets on {new Date(usageLimit.nextResetDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Main Action Button */}
        <TouchableOpacity 
          style={[
            styles.analyzeButton, 
            !usageLimit.canAnalyze && styles.analyzeButtonDisabled
          ]} 
          onPress={handleAnalyze}
          disabled={!usageLimit.canAnalyze}
        >
          <LinearGradient
            colors={usageLimit.canAnalyze ? ['#08B5BF', '#06A3AC'] : ['#9CA3AF', '#6B7280']}
            style={styles.analyzeGradient}
          >
            <Ionicons name="camera" size={32} color="#ffffff" />
            <Text style={styles.analyzeButtonText}>
              {usageLimit.canAnalyze ? 'Start Analysis' : 'Analysis Limit Reached'}
            </Text>
            <Text style={styles.analyzeButtonSubtext}>
              {usageLimit.canAnalyze 
                ? 'Get personalized skincare routine'
                : 'Upgrade to Premium for unlimited analyses'
              }
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Analyses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Analyses</Text>
            {recentAnalyses.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentAnalyses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyStateText}>No analyses yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Take your first photo to get started
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentAnalyses.slice(0, 3).map((analysis) => (
                <TouchableOpacity
                  key={analysis.id}
                  style={styles.recentItem}
                  onPress={() => navigation.navigate('Result', { analysisId: analysis.id })}
                >
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentDate}>
                      {new Date(analysis.timestamp).toLocaleDateString()}
                    </Text>
                    <View style={styles.recentMetrics}>
                      <Text style={styles.recentMetric}>
                        Oil: {analysis.metrics.oiliness}
                      </Text>
                      <Text style={styles.recentMetric}>
                        Red: {analysis.metrics.redness}
                      </Text>
                      <Text style={styles.recentMetric}>
                        Texture: {analysis.metrics.texture}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="time-outline" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>

          {!premiumStatus.isPremium && (
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Upgrade')}
            >
              <Ionicons name="star-outline" size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Upgrade</Text>
            </TouchableOpacity>
          )}

          {/* TEMPORARY RESET BUTTON - Remove after testing */}
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: '#FEE2E2', borderRadius: 8 }]}
            onPress={handleResetStorage}
          >
            <Ionicons name="refresh-outline" size={24} color="#DC2626" />
            <Text style={[styles.quickActionText, { color: '#DC2626' }]}>Reset</Text>
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
    padding: 20,
  },
  premiumBanner: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  premiumText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  upgradeBanner: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8, // Reduce right padding to prevent overflow
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  analyzeButton: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analysisStatus: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  resetDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 28,
  },
  analyzeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  analyzeButtonSubtext: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  sectionLink: {
    fontSize: 16,
    color: '#08B5BF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  recentList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  recentItemContent: {
    flex: 1,
  },
  recentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recentMetrics: {
    flexDirection: 'row',
  },
  recentMetric: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1f2937',
    marginTop: 8,
    fontWeight: '500',
  },
}); 