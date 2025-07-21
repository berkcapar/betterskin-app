// Analysis types
export interface SkinMetrics {
  oiliness: number; // 0-100 (higher = more oily)
  redness: number; // 0-100 (higher = more red/irritated)
  texture: number; // 0-100 (higher = rougher texture)
  acne?: number; // 0-100 (higher = more acne) - Premium only
  wrinkles?: number; // 0-100 (higher = more wrinkles) - Premium only
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  imageUri: string;
  metrics: SkinMetrics;
  advice: AdviceTexts;
  routines?: PersonalizedRoutines; // Premium only
  confidence?: number; // Analysis confidence score
  skinType?: string; // Detected skin type
  environmentalFactors?: {
    lightingQuality: number;
    colorTemperature: number;
    contrast: number;
  };
}

export interface AdviceTexts {
  oiliness: string;
  redness: string;
  texture: string;
  acne?: string;
  wrinkles?: string; // New field for anti-aging advice
}

export interface PersonalizedRoutines {
  morning: string[];
  evening: string[];
  enhanced?: any; // AI-generated enhanced routines
}

// Face detection types
export interface FaceDetectionResult {
  landmarks: Float32Array;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface FaceRegions {
  tZone: number[][]; // T-zone coordinates
  uZone: number[][]; // U-zone coordinates
  fullFace: number[][]; // Full face mask
}

// IAP types
export interface PremiumStatus {
  isPremium: boolean;
  purchaseDate?: number;
  expiryDate?: number;
  productId?: string;
}

export interface UsageLimit {
  lastAnalysisDate?: number;
  monthlyAnalysisCount: number;
  canAnalyze: boolean;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Camera: undefined;
  Result: {
    analysisId: string;
  };
  History: undefined;
  Upgrade: undefined;
  PremiumReport: {
    analysisId: string;
  };
};

// Camera types
export interface CaptureOptions {
  quality: number;
  base64: boolean;
  skipProcessing?: boolean;
}

// Database types
export interface DatabaseAnalysis {
  id: string;
  timestamp: number;
  imageUri: string;
  oiliness: number;
  redness: number;
  texture: string;
  acne?: string;
  advice: string; // JSON string
  routines?: string; // JSON string
}

 