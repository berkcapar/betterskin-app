import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  title: string;
  value: number | string;
  type: 'percentage' | 'category';
  color: string;
  advice: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPremium?: boolean;
}

export default function MetricCard({
  title,
  value,
  type,
  color,
  advice,
  icon,
  isPremium = false,
}: MetricCardProps) {
  const formatValue = () => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  };

  const getScoreDescription = () => {
    if (type === 'percentage') {
      const score = value as number;
      if (score >= 70) return 'High';
      if (score >= 40) return 'Moderate';
      return 'Low';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.title}>{title}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.premiumText}>Premium</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color }]}>{formatValue()}</Text>
          {type === 'percentage' && (
            <Text style={[styles.scoreDescription, { color }]}>
              {getScoreDescription()}
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar for percentage type */}
      {type === 'percentage' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, value as number))}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0</Text>
            <Text style={styles.progressLabel}>50</Text>
            <Text style={styles.progressLabel}>100</Text>
          </View>
        </View>
      )}

      {/* Category indicators for category type */}
      {type === 'category' && (
        <View style={styles.categoryContainer}>
          {['Poor', 'Medium', 'Good'].map((category) => {
            const isActive = (value as string).toLowerCase() === category.toLowerCase();
            return (
              <View
                key={category}
                style={[
                  styles.categoryItem,
                  isActive && { backgroundColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && { color: '#ffffff' },
                  ]}
                >
                  {category}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Advice */}
      <View style={styles.adviceContainer}>
        <Text style={styles.adviceText}>{advice}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  scoreDescription: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  categoryItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  adviceContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  adviceText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
}); 