import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { mediaPipe } from '@/lib/mediapipe';
import { opencv } from '@/lib/opencv';
import { database } from '@/lib/database';
import { storage } from '@/lib/storage';
import { iap } from '@/lib/iap';
import { AnalysisResult, SkinMetrics, AdviceTexts, PersonalizedRoutines } from '@/types';

interface AnalysisState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
}

export const useFaceAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    error: null,
  });

  const updateProgress = useCallback((progress: number, step: string) => {
    setState(prev => ({ ...prev, progress, currentStep: step }));
  }, []);

  const analyzeImage = useCallback(async (imageUri: string): Promise<AnalysisResult | null> => {
    try {
      setState({
        isAnalyzing: true,
        progress: 0,
        currentStep: 'Checking permissions...',
        error: null,
      });

      // Check if user can analyze (free/premium limits)
      const canAnalyze = await storage.checkCanAnalyze();
      if (!canAnalyze) {
        setState(prev => ({ ...prev, error: 'Monthly analysis limit reached. Upgrade to Premium for unlimited analyses.' }));
        return null;
      }

      updateProgress(10, 'Initializing face detection...');
      
      // Initialize MediaPipe if needed
      if (!mediaPipe.isReady()) {
        await mediaPipe.initialize();
      }
      
      updateProgress(25, 'Detecting face...');
      
      // Detect face and extract landmarks
      const faceResult = await mediaPipe.detectFace(imageUri);
      if (!faceResult) {
        setState(prev => ({ ...prev, error: 'No face detected. Please ensure your face is clearly visible and well-lit.' }));
        return null;
      }

      updateProgress(40, 'Analyzing skin regions...');
      
      // Extract face regions for analysis
      const regions = mediaPipe.extractFaceRegions(faceResult.landmarks, 720, 720);
      
      updateProgress(60, 'Processing skin metrics...');
      
      // Initialize OpenCV and analyze skin
      if (!opencv.isReady()) {
        await opencv.initialize();
      }
      
      const skinMetrics = await opencv.analyzeSkin(imageUri, regions);
      
      updateProgress(75, 'Generating analysis...');
      
      // Check premium status for additional features
      const premiumStatus = await iap.checkPremiumStatus();
      
      // Add acne analysis for premium users
      if (premiumStatus.isPremium) {
        skinMetrics.acne = generateAcneScore(); // TODO: Replace with actual ML model
      }
      
      updateProgress(85, 'Creating personalized advice...');
      
      // Generate advice and routines
      const advice = generateAdvice(skinMetrics);
      const routines = premiumStatus.isPremium ? await generatePersonalizedRoutines(skinMetrics) : undefined;
      
      updateProgress(95, 'Saving results...');
      
      // Create analysis result
      const analysisResult: AnalysisResult = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        imageUri,
        metrics: skinMetrics,
        advice,
        routines,
      };
      
      // Save to database
      await database.saveAnalysis(analysisResult);
      
      // Update usage count
      await storage.incrementAnalysisCount();
      
      updateProgress(100, 'Analysis complete!');
      
      setState({
        isAnalyzing: false,
        progress: 100,
        currentStep: 'Complete',
        error: null,
      });
      
      return analysisResult;
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setState({
        isAnalyzing: false,
        progress: 0,
        currentStep: '',
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      });
      return null;
    }
  }, [updateProgress]);

  const checkLighting = useCallback(async (imageUri: string): Promise<boolean> => {
    try {
      const { isGood, brightness } = await opencv.checkLightingConditions(imageUri);
      
      if (!isGood) {
        const message = brightness < 100 
          ? 'Lighting is too dark. Please move to a brighter area.'
          : 'Lighting is too bright. Please avoid direct sunlight.';
        
        Alert.alert('Lighting Issue', message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Lighting check failed:', error);
      return true; // Allow analysis to continue if check fails
    }
  }, []);

  return {
    ...state,
    analyzeImage,
    checkLighting,
  };
};

// Helper functions
function generateAcneScore(): 'low' | 'medium' | 'high' {
  // TODO: Replace with actual ML model (MobileNetV2 or similar)
  const random = Math.random();
  if (random < 0.5) return 'low';
  if (random < 0.8) return 'medium';
  return 'high';
}

function generateAdvice(metrics: SkinMetrics): AdviceTexts {
  const advice: AdviceTexts = {
    oiliness: getOilinessAdvice(metrics.oiliness),
    redness: getRednessAdvice(metrics.redness),
    texture: getTextureAdvice(metrics.texture),
  };
  
  if (metrics.acne) {
    advice.acne = getAcneAdvice(metrics.acne);
  }
  
  return advice;
}

function getOilinessAdvice(score: number): string {
  if (score >= 70) return 'High oil levels detected. Use oil-free cleansers and mattifying products.';
  if (score >= 40) return 'Moderate oil levels. Balance with gentle cleansing and light moisturizer.';
  return 'Low oil levels. Focus on hydration and gentle care.';
}

function getRednessAdvice(score: number): string {
  if (score >= 60) return 'Significant redness detected. Consider anti-inflammatory ingredients like niacinamide.';
  if (score >= 30) return 'Some redness present. Use gentle, fragrance-free products.';
  return 'Minimal redness. Maintain your current gentle routine.';
}

function getTextureAdvice(texture: 'good' | 'medium' | 'poor'): string {
  switch (texture) {
    case 'good': return 'Great skin texture! Keep up your current routine.';
    case 'medium': return 'Good texture with room for improvement. Consider gentle exfoliation.';
    case 'poor': return 'Uneven texture detected. Focus on hydration and gentle exfoliation.';
  }
}

function getAcneAdvice(acne: 'low' | 'medium' | 'high'): string {
  switch (acne) {
    case 'low': return 'Minimal acne detected. Maintain good hygiene and gentle cleansing.';
    case 'medium': return 'Moderate acne present. Consider salicylic acid or benzoyl peroxide.';
    case 'high': return 'Significant acne detected. Consider consulting a dermatologist.';
  }
}

async function generatePersonalizedRoutines(metrics: SkinMetrics): Promise<PersonalizedRoutines> {
  // TODO: Replace with OpenAI API call in production
  // For MVP, use hard-coded intelligent routines based on metrics
  
  const baseRoutines = {
    morning: ['Gentle Cleanser', 'Moisturizer', 'SPF 30+'],
    evening: ['Cleanser', 'Treatment', 'Night Moisturizer'],
  };
  
  // Customize based on metrics
  if (metrics.oiliness > 60) {
    baseRoutines.morning.splice(1, 0, 'Oil-Free Toner');
    baseRoutines.evening[1] = 'Salicylic Acid Treatment';
  }
  
  if (metrics.redness > 50) {
    baseRoutines.morning.splice(1, 0, 'Niacinamide Serum');
    baseRoutines.evening.splice(1, 0, 'Calming Serum');
  }
  
  if (metrics.texture === 'poor') {
    baseRoutines.evening[1] = 'Gentle Exfoliant (2-3x/week)';
  }
  
  if (metrics.acne === 'high') {
    baseRoutines.evening.splice(1, 0, 'Benzoyl Peroxide (spot treatment)');
  }
  
  return baseRoutines;
} 