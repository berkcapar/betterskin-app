import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Services
import { database } from '@/lib/database';
import { storage } from '@/lib/storage';

// Types
import { RootStackParamList, AnalysisResult } from '@/types';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

interface HistoryScreenProps {
  navigation: HistoryScreenNavigationProp;
}

interface HistoryItemProps {
  analysis: AnalysisResult;
  onPress: () => void;
  onDelete: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ analysis, onPress, onDelete }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#EF4444';
    if (score >= 40) return '#F59E0B';
    return '#10B981';
  };

  const getTextureColor = (score: number) => {
    if (score >= 70) return '#EF4444'; // Red - rough texture
    if (score >= 40) return '#F59E0B'; // Orange - moderate texture
    return '#10B981'; // Green - smooth texture
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Analysis',
      'Are you sure you want to delete this analysis? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(analysis.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.historyItem} onPress={onPress}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{formatDate(analysis.timestamp)}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" style={styles.chevron} />
        </View>
      </View>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Oiliness</Text>
          <View style={styles.metricValueContainer}>
            <View
              style={[
                styles.metricIndicator,
                { backgroundColor: getScoreColor(analysis.metrics.oiliness) },
              ]}
            />
                            <Text style={styles.metricValue}>{analysis.metrics.oiliness}%</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Redness</Text>
          <View style={styles.metricValueContainer}>
            <View
              style={[
                styles.metricIndicator,
                { backgroundColor: getScoreColor(analysis.metrics.redness) },
              ]}
            />
                            <Text style={styles.metricValue}>{analysis.metrics.redness}%</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Texture</Text>
          <View style={styles.metricValueContainer}>
            <View
              style={[
                styles.metricIndicator,
                { backgroundColor: getTextureColor(analysis.metrics.texture) },
              ]}
            />
            <Text style={styles.metricValue}>
              {analysis.metrics.texture}%
            </Text>
          </View>
        </View>

        {analysis.metrics.acne && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Acne</Text>
            <View style={styles.metricValueContainer}>
              <View
                style={[
                  styles.metricIndicator,
                  { backgroundColor: getTextureColor(analysis.metrics.acne) },
                ]}
              />
              <Text style={styles.metricValue}>
                {analysis.metrics.acne}%
              </Text>
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={10} color="#F59E0B" />
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const history = await database.getAnalysisHistory();
      setAnalyses(history);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('Error', 'Failed to load analysis history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const handleItemPress = (analysis: AnalysisResult) => {
    navigation.navigate('Result', { analysisId: analysis.id });
  };

  const handleNewAnalysis = () => {
    navigation.navigate('Camera');
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      await database.deleteAnalysis(id);
      // Note: decrementAnalysisCount removed since basic analysis is now unlimited
      setAnalyses(analyses.filter(analysis => analysis.id !== id));
      Alert.alert('Analysis Deleted', 'Your analysis has been deleted and monthly count updated.');
    } catch (error) {
      console.error('Failed to delete analysis:', error);
      Alert.alert('Error', 'Failed to delete analysis.');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="analytics-outline" size={80} color="#94a3b8" />
      <Text style={styles.emptyTitle}>No Analysis History</Text>
      <Text style={styles.emptyText}>
        Your analysis results will appear here. Take your first photo to get started.
      </Text>
      <TouchableOpacity style={styles.newAnalysisButton} onPress={handleNewAnalysis}>
        <Ionicons name="camera" size={20} color="#ffffff" />
        <Text style={styles.newAnalysisButtonText}>Start Analysis</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Analysis History</Text>
      <Text style={styles.headerSubtitle}>
        {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} saved
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryItem
            analysis={item}
            onPress={() => handleItemPress(item)}
            onDelete={handleDeleteAnalysis}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          analyses.length === 0 && styles.emptyListContent,
        ]}
        ListHeaderComponent={analyses.length > 0 ? renderHeader : null}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#4F46E5"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 10,
  },
  chevron: {
    marginLeft: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  premiumBadge: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  newAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  newAnalysisButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 