import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '@/lib/database';
import { storage } from '@/lib/storage';
import { iap } from '@/lib/iap';
import { analyzeRealImage, analyzeRealImageEnhanced } from '@/lib/realPixelAnalysis';
import { premiumAnalysis, PremiumAnalysisResult } from '@/lib/premiumAnalysis';
import { openaiService } from '@/lib/openaiService';
import * as ImageManipulator from 'expo-image-manipulator';
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

  const analyzeImageNew = useCallback(async (imageUri: string, isPremium: boolean = false): Promise<AnalysisResult | null> => {
    try {
      setState({
        isAnalyzing: true,
        progress: 0,
        currentStep: 'Checking permissions...',
        error: null,
      });

      // Basic analysis is always free and unlimited
      const canAnalyze = await storage.checkCanAnalyze();
      if (!canAnalyze) {
        setState(prev => ({ ...prev, error: 'Analysis temporarily unavailable. Please try again.' }));
        return null;
      }

      updateProgress(20, 'Processing image...');
      
      // Resize image for analysis
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 256, height: 256 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.PNG }
      );

      updateProgress(40, 'Analyzing image colors...');

      // Get previous analysis for temporal smoothing
      const previousAnalyses = await database.getAnalysisHistory();
      const previousResults = previousAnalyses.slice(0, 2).map(a => a.metrics);

      // Use enhanced real image color analysis
      const analysisResult = await analyzeRealImageEnhanced(
        resizedImage.uri, 
        undefined, // faceData - we can add this later
        previousResults
      );

      // Check premium status first for appropriate progress message
      const premiumStatus = await iap.checkPremiumStatus();
      updateProgress(80, premiumStatus.isPremium ? 'Generating AI recommendations...' : 'Preparing recommendations...');

      // Create base analysis result
      const result: AnalysisResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        metrics: analysisResult.metrics,
        advice: analysisResult.advice,
        confidence: analysisResult.confidence,
        skinType: analysisResult.skinType,
        environmentalFactors: analysisResult.environmentalFactors,
      };

      // Add premium detailed report if requested
      if (isPremium) {
        updateProgress(85, 'Generating premium report...');
        try {
          const premiumReport = await premiumAnalysis.generatePremiumReport(
            analysisResult.metrics,
            analysisResult.skinType || 'medium',
            analysisResult.confidence || 85
          );
          
          // Add premium data to result
          (result as any).premiumReport = premiumReport;
          
        } catch (error) {
          console.error('Premium report generation failed:', error);
          // Continue with basic result
        }
      } else {
        // Add routines based on user status (already checked above)
        result.routines = await generatePersonalizedRoutines(
          analysisResult.metrics, 
          analysisResult.skinType,
          premiumStatus.isPremium
        );
      }

      updateProgress(90, 'Saving results...');

      // Save to database
      await database.saveAnalysis(result);

      // Track usage (no limits for basic analysis)
      await storage.incrementAnalysisCount();

      updateProgress(100, 'Complete!');

      setState({
        isAnalyzing: false,
        progress: 100,
        currentStep: 'Complete!',
        error: null,
      });

      return result;

    } catch (error) {
      console.error('Analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      }));
      return null;
    }
  }, [updateProgress]);

  const generatePersonalizedRoutines = async (
    metrics: SkinMetrics, 
    skinType?: string,
    isPremiumUser: boolean = false
  ): Promise<PersonalizedRoutines> => {
    
    // FREE USERS: Fast template-based routines
    if (!isPremiumUser) {
      console.log('🆓 Generating basic routines for free user');
      
      const morning = ['Gentle cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 30+'];
      const evening = ['Gentle cleanser', 'Treatment serum', 'Night moisturizer'];

      // Quick customization based on metrics
      if (metrics.oiliness > 70) {
        morning.splice(1, 0, 'Oil-control toner');
        evening.splice(1, 0, 'Niacinamide serum');
      }

      if (metrics.redness > 60) {
        morning.splice(1, 0, 'Soothing toner');
        evening.splice(1, 0, 'Centella serum');
      }

      if (metrics.texture > 60) {
        evening.splice(-1, 0, 'AHA/BHA treatment (2-3x/week)');
      }

      return { morning, evening };
    }

    // PREMIUM USERS: AI-enhanced routines
    try {
      console.log('💎 Generating AI-enhanced routines for premium user');
      
      const season = await storage.getCurrentSeason();
      const aiRoutines = await openaiService.generateEnhancedRoutines(
        metrics, 
        skinType || 'medium', 
        season
      );

      console.log('🤖 OpenAI routines generated successfully');

      // Convert AI routines to our format
      return {
        morning: aiRoutines.morningRoutine.steps.map(step => 
          `${step.product}: ${step.application}`
        ),
        evening: aiRoutines.eveningRoutine.steps.map(step => 
          `${step.product}: ${step.application}`
        ),
        // Store full AI data for future use
        enhanced: aiRoutines
      };
    } catch (error) {
      console.error('❌ Failed to generate AI routines, using fallback:', error);
      
      // Fallback to basic routines even for premium
      const morning = ['Gentle cleanser', 'Vitamin C serum', 'Moisturizer', 'SPF 30+'];
      const evening = ['Gentle cleanser', 'Treatment serum', 'Night moisturizer'];

      // Enhanced customization for premium fallback
      if (metrics.oiliness > 70) {
        morning.splice(1, 0, 'Oil-control toner');
        evening.splice(1, 0, 'Niacinamide serum');
      }

      if (metrics.redness > 60) {
        morning.splice(1, 0, 'Soothing toner');
        evening.splice(1, 0, 'Centella serum');
      }

      if (metrics.texture > 60) {
        evening.splice(-1, 0, 'AHA/BHA treatment (2-3x/week)');
      }

      if (metrics.acne && metrics.acne > 50) {
        evening.splice(1, 0, 'Salicylic acid treatment');
      }

      if (metrics.wrinkles && metrics.wrinkles > 40) {
        evening.splice(-1, 0, 'Retinol (start 1x/week)');
      }

      return { morning, evening };
    }
  };

  return {
    ...state,
    analyzeImage: analyzeImageNew,
  };
}; 