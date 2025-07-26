import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Welcome to Face Analysis',
    subtitle: 'Discover your skin\'s condition in seconds',
    description: 'Get personalized insights about your skin\'s oiliness, redness, and texture using advanced AI analysis.',
    icon: 'analytics-outline' as const,
    color: '#4F46E5',
  },
  {
    id: 2,
    title: 'Your Privacy Matters',
    subtitle: 'All data stays on your device',
    description: 'Your photos and analysis results are stored locally on your device only. No cloud processing or data sharing.',
    icon: 'shield-checkmark-outline' as const,
    color: '#059669',
  },
  {
    id: 3,
    title: 'Important Notice',
    subtitle: 'This is not medical advice',
    description: 'This app provides general skin insights for informational purposes only and does not replace professional medical advice. Always consult a dermatologist for medical concerns.',
    icon: 'medical-outline' as const,
    color: '#DC2626',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.gradient}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? step.color : '#e2e8f0',
                },
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentStep === 0 ? (
            // First step: Show face analysis grid image
            <View style={[styles.iconContainer, { backgroundColor: '#f8fafc' }]}>
              <Image
                source={require('../../assets/face-analysis-grid.png')}
                style={styles.faceAnalysisImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            // Other steps: Show icon
            <View style={[styles.iconContainer, { backgroundColor: `${step.color}15` }]}>
              <Ionicons name={step.icon} size={80} color={step.color} />
            </View>
          )}

          <Text style={[styles.title, { color: step.color }]}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: step.color }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={currentStep === ONBOARDING_STEPS.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="#ffffff"
              style={styles.nextButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gradient: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  faceAnalysisImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  nextButtonIcon: {
    marginLeft: 8,
  },
}); 