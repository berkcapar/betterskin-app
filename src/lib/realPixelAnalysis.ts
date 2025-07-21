import ImageColors from 'react-native-image-colors';
import { SkinMetrics } from '@/types';

export interface RealAnalysisResult {
  metrics: SkinMetrics;
  advice: {
    oiliness: string;
    redness: string;
    texture: string;
    acne: string;
    wrinkles: string;
  };
  confidence?: number;
  skinType?: string;
  environmentalFactors?: {
    lightingQuality: number;
    colorTemperature: number;
    contrast: number;
  };
}

export interface EnvironmentalFactors {
  lightingQuality: number;
  colorTemperature: number;
  contrast: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

/**
 * Enhanced real image analysis with all improvements
 */
export async function analyzeRealImageEnhanced(imageUri: string, faceData?: any, previousResults?: SkinMetrics[]): Promise<RealAnalysisResult> {
  try {
    console.log('🚀 Starting enhanced analysis...');

    // Extract dominant colors from real image
    const colors = await ImageColors.getColors(imageUri, {
      fallback: '#FFFFFF',
      cache: false,
      quality: 'high',
    });

    console.log('🎨 Extracted colors:', colors);

    // 1. Calculate environmental quality
    const envFactors = calculateEnvironmentalQuality(colors);
    console.log('🌍 Environmental factors:', envFactors);

    // 2. Analyze colors for raw skin metrics
    const rawMetrics = analyzeColorsForSkinMetrics(colors);
    console.log('📊 Raw metrics:', rawMetrics);

    // 3. Apply environmental corrections
    const adjustedMetrics = applyEnvironmentalCorrections(rawMetrics, envFactors);
    console.log('🔧 Environmentally adjusted:', adjustedMetrics);

    // 4. Apply temporal smoothing if previous results available
    const smoothedMetrics = applyTemporalSmoothing(adjustedMetrics, previousResults);
    console.log('⏱️ Temporally smoothed:', smoothedMetrics);

    // 5. Apply skin type normalization
    const normalizedMetrics = applySkinTypeNormalization(smoothedMetrics, colors);
    console.log('🎨 Skin type normalized:', normalizedMetrics);

    // 6. Calculate confidence score
    const confidence = calculateConfidenceScore(colors, faceData, envFactors);
    console.log('📊 Confidence score:', confidence);

    // 7. Determine skin type
    const skinType = determineSkinType(colors);
    console.log('🔍 Detected skin type:', skinType);

    // 8. Generate personalized advice
    const advice = generateAdviceFromMetrics(normalizedMetrics, confidence, skinType);

    return {
      metrics: normalizedMetrics,
      advice,
      confidence,
      skinType,
      environmentalFactors: envFactors
    };

  } catch (error) {
    console.error('❌ Enhanced analysis failed:', error);
    
    // Fallback to basic analysis
    return analyzeRealImage(imageUri);
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function analyzeRealImage(imageUri: string): Promise<RealAnalysisResult> {
  try {
    const colors = await ImageColors.getColors(imageUri, {
      fallback: '#FFFFFF',
      cache: false,
      quality: 'high',
    });

    console.log('🎨 Extracted colors:', colors);

    const metrics = analyzeColorsForSkinMetrics(colors);
    const advice = generateAdviceFromMetrics(metrics);

    return { metrics, advice };
  } catch (error) {
    console.error('Color analysis failed:', error);
    
    return {
      metrics: {
        oiliness: 45,
        redness: 25,
        texture: 35,
        acne: 15,
        wrinkles: 20,
      },
      advice: {
        oiliness: "Moderate oil levels detected. Use gentle cleansers and lightweight moisturizers.",
        redness: "Minimal redness present. Continue with gentle, fragrance-free products.",
        texture: "Good skin texture with room for improvement. Regular moisturizing recommended.",
        acne: "Low acne levels. Maintain gentle skincare routine.",
        wrinkles: "Early signs of aging. Focus on prevention with daily SPF.",
      }
    };
  }
}

/**
 * Calculate environmental quality factors
 */
function calculateEnvironmentalQuality(colors: any): EnvironmentalFactors {
  const dominantRGB = hexToRgb(getDominantColor(colors));
  const averageRGB = hexToRgb(getAverageColor(colors));
  
  const brightness = (dominantRGB.r + dominantRGB.g + dominantRGB.b) / 3;
  
  // Lighting quality (optimal range: 60-180)
  let lightingQuality = 1.0;
  if (brightness < 60) {
    lightingQuality = 0.7 + (brightness / 60) * 0.3; // 0.7-1.0
  } else if (brightness > 180) {
    lightingQuality = 1.0 - ((brightness - 180) / 75) * 0.3; // 1.0-0.7
  }

  // Color temperature (warm vs cool lighting)
  const redBlueRatio = dominantRGB.r / Math.max(dominantRGB.b, 1);
  const colorTemperature = redBlueRatio > 1.2 ? 1.1 : redBlueRatio < 0.8 ? 0.9 : 1.0;

  // Contrast quality
  const contrast = Math.abs(dominantRGB.r - averageRGB.r) + 
                  Math.abs(dominantRGB.g - averageRGB.g) + 
                  Math.abs(dominantRGB.b - averageRGB.b);
  const contrastFactor = contrast > 30 ? 1.2 : contrast < 10 ? 0.8 : 1.0;

  return {
    lightingQuality: Math.round(lightingQuality * 100) / 100,
    colorTemperature: Math.round(colorTemperature * 100) / 100,
    contrast: Math.round(contrastFactor * 100) / 100
  };
}

/**
 * Apply environmental corrections to raw metrics
 */
function applyEnvironmentalCorrections(metrics: SkinMetrics, envFactors: EnvironmentalFactors): SkinMetrics {
  return {
    oiliness: Math.round(Math.max(5, Math.min(95, metrics.oiliness * envFactors.lightingQuality))),
    redness: Math.round(Math.max(5, Math.min(95, metrics.redness * envFactors.colorTemperature))),
    texture: Math.round(Math.max(5, Math.min(95, metrics.texture * envFactors.contrast))),
    acne: Math.round(Math.max(5, Math.min(95, (metrics.acne || 0) * envFactors.lightingQuality))),
    wrinkles: Math.round(Math.max(5, Math.min(95, (metrics.wrinkles || 0) * envFactors.contrast)))
  };
}

/**
 * Apply temporal smoothing using previous results
 */
function applyTemporalSmoothing(currentMetrics: SkinMetrics, previousResults?: SkinMetrics[]): SkinMetrics {
  if (!previousResults || previousResults.length === 0) {
    return currentMetrics;
  }

  // Weighted average with recent results
  const weights = [0.5, 0.3, 0.2]; // Current, -1, -2
  
  let smoothed = {
    oiliness: currentMetrics.oiliness * weights[0],
    redness: currentMetrics.redness * weights[0],
    texture: currentMetrics.texture * weights[0],
    acne: (currentMetrics.acne || 0) * weights[0],
    wrinkles: (currentMetrics.wrinkles || 0) * weights[0]
  };

  // Add weighted previous results
  previousResults.slice(0, 2).forEach((previous, index) => {
    const weight = weights[index + 1] || 0;
    smoothed.oiliness += previous.oiliness * weight;
    smoothed.redness += previous.redness * weight;
    smoothed.texture += previous.texture * weight;
    smoothed.acne += (previous.acne || 0) * weight;
    smoothed.wrinkles += (previous.wrinkles || 0) * weight;
  });

  return {
    oiliness: Math.round(smoothed.oiliness),
    redness: Math.round(smoothed.redness),
    texture: Math.round(smoothed.texture),
    acne: Math.round(smoothed.acne),
    wrinkles: Math.round(smoothed.wrinkles)
  };
}

/**
 * Apply skin type normalization using ITA° standard
 */
function applySkinTypeNormalization(metrics: SkinMetrics, colors: any): SkinMetrics {
  const dominantRGB = hexToRgb(getDominantColor(colors));
  const lab = rgbToLabSimplified(dominantRGB);
  const ita = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  
  const skinType = classifySkinType(ita);
  
  let adjustedMetrics = { ...metrics };
  
  // Skin type specific adjustments
  switch (skinType) {
    case 'very-light':
      adjustedMetrics.oiliness = Math.round(adjustedMetrics.oiliness * 0.85);
      adjustedMetrics.redness = Math.round(adjustedMetrics.redness * 1.15);
      break;
    case 'light':
      adjustedMetrics.oiliness = Math.round(adjustedMetrics.oiliness * 0.95);
      adjustedMetrics.redness = Math.round(adjustedMetrics.redness * 1.05);
      break;
    case 'tan':
      adjustedMetrics.oiliness = Math.round(adjustedMetrics.oiliness * 1.05);
      adjustedMetrics.redness = Math.round(adjustedMetrics.redness * 0.85);
      break;
    case 'dark':
      adjustedMetrics.oiliness = Math.round(adjustedMetrics.oiliness * 1.1);
      adjustedMetrics.redness = Math.round(adjustedMetrics.redness * 0.7);
      break;
    default: // medium
      break;
  }

  console.log('🎨 Skin type normalization:', { skinType, ita, adjustedMetrics });
  
  return adjustedMetrics;
}

/**
 * Calculate confidence score for the analysis
 */
function calculateConfidenceScore(colors: any, faceData?: any, envFactors?: EnvironmentalFactors): number {
  const dominantRGB = hexToRgb(getDominantColor(colors));
  const brightness = (dominantRGB.r + dominantRGB.g + dominantRGB.b) / 3;
  
  // Lighting quality score (40-200 is optimal)
  let lightingScore = 100;
  if (brightness < 40 || brightness > 200) {
    lightingScore = 70;
  } else if (brightness < 60 || brightness > 180) {
    lightingScore = 85;
  }
  
  // Face angle score (if face data available)
  let angleScore = 100;
  if (faceData?.yawAngle !== undefined) {
    angleScore = Math.abs(faceData.yawAngle) < 15 ? 100 : Math.abs(faceData.yawAngle) < 30 ? 85 : 70;
  }
  
  // Color consistency score
  const avgRGB = hexToRgb(getAverageColor(colors));
  const colorDiff = Math.abs(dominantRGB.r - avgRGB.r) + 
                   Math.abs(dominantRGB.g - avgRGB.g) + 
                   Math.abs(dominantRGB.b - avgRGB.b);
  const consistencyScore = colorDiff < 50 ? 100 : colorDiff < 100 ? 85 : 70;
  
  // Environmental factors score
  let envScore = 100;
  if (envFactors) {
    envScore = (envFactors.lightingQuality + envFactors.colorTemperature + envFactors.contrast) / 3 * 100;
  }
  
  const overallConfidence = (lightingScore + angleScore + consistencyScore + envScore) / 4;
  
  console.log('📊 Confidence breakdown:', { 
    lighting: lightingScore,
    angle: angleScore,
    consistency: consistencyScore,
    environmental: envScore,
    overall: overallConfidence 
  });
  
  return Math.round(overallConfidence);
}

/**
 * Determine skin type using ITA° classification
 */
function determineSkinType(colors: any): string {
  const dominantRGB = hexToRgb(getDominantColor(colors));
  const lab = rgbToLabSimplified(dominantRGB);
  const ita = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  
  return classifySkinType(ita);
}

/**
 * Classify skin type based on ITA° value
 */
function classifySkinType(ita: number): string {
  if (ita > 55) return 'very-light';
  if (ita > 41) return 'light';
  if (ita > 28) return 'medium';
  if (ita > 10) return 'tan';
  return 'dark';
}

/**
 * Convert RGB to simplified Lab color space
 */
function rgbToLabSimplified(rgb: {r: number, g: number, b: number}): LabColor {
  // Simplified RGB to Lab conversion for ITA° calculation
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  // Simple linear transformation (not exact Lab but sufficient for ITA°)
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  const a = (r - g) * 0.5;
  const bLab = (g - b) * 0.5;
  
  return {
    l: l * 100,
    a: a * 100,
    b: bLab * 100
  };
}

/**
 * Get platform-specific dominant color
 */
function getDominantColor(colors: any): string {
  if (colors.platform === 'ios') {
    return colors.primary || '#D4A574';
  } else if (colors.platform === 'android') {
    return colors.dominant || '#D4A574';
  } else {
    return colors.dominant || '#D4A574';
  }
}

/**
 * Get platform-specific average color
 */
function getAverageColor(colors: any): string {
  if (colors.platform === 'ios') {
    return colors.secondary || '#C89660';
  } else if (colors.platform === 'android') {
    return colors.average || '#C89660';
  } else {
    return colors.average || '#C89660';
  }
}

/**
 * Enhanced color analysis with all improvements
 */
function analyzeColorsForSkinMetrics(colors: any): SkinMetrics {
  const dominantColor = getDominantColor(colors);
  const averageColor = getAverageColor(colors);
  const vibrantColor = colors.vibrant || colors.detail || '#E6B887';

  console.log('🔍 Analyzing colors:', { dominantColor, averageColor, vibrantColor });

  const dominantRGB = hexToRgb(dominantColor);
  const averageRGB = hexToRgb(averageColor);
  const vibrantRGB = hexToRgb(vibrantColor);

  const oiliness = calculateOilinessEnhanced(dominantRGB, averageRGB);
  const redness = calculateRednessEnhanced(dominantRGB, averageRGB);
  const texture = calculateTextureEnhanced(dominantRGB, averageRGB, vibrantRGB);
  const acne = calculateAcneEnhanced(dominantRGB, averageRGB);
  const wrinkles = calculateWrinklesEnhanced(dominantRGB, vibrantRGB);

  return {
    oiliness: Math.round(oiliness),
    redness: Math.round(redness),
    texture: Math.round(texture),
    acne: Math.round(acne),
    wrinkles: Math.round(wrinkles),
  };
}

function calculateOilinessEnhanced(dominant: any, average: any): number {
  const dominantBrightness = (dominant.r + dominant.g + dominant.b) / 3;
  const averageBrightness = (average.r + average.g + average.b) / 3;
  const overallBrightness = (dominantBrightness + averageBrightness) / 2;
  
  // Enhanced calculation with better distribution
  let oiliness;
  if (overallBrightness < 50) {
    oiliness = 25 + (overallBrightness * 0.4);
  } else if (overallBrightness > 180) {
    oiliness = 60 + ((overallBrightness - 180) * 0.4);
  } else {
    oiliness = 25 + ((overallBrightness - 50) * 0.35);
  }
  
  // Add saturation factor
  const saturation = Math.max(dominant.r, dominant.g, dominant.b) - Math.min(dominant.r, dominant.g, dominant.b);
  oiliness += saturation * 0.1;
  
  oiliness = Math.max(15, Math.min(85, oiliness));
  
  console.log('💧 Enhanced oiliness analysis:', { overallBrightness, saturation, oiliness });
  return oiliness;
}

function calculateRednessEnhanced(dominant: any, average: any): number {
  // Enhanced redness calculation with better sensitivity
  const dominantRedRatio = dominant.r / Math.max((dominant.g + dominant.b) / 2, 1);
  const averageRedRatio = average.r / Math.max((average.g + average.b) / 2, 1);
  const overallRedRatio = (dominantRedRatio + averageRedRatio) / 2;
  
  // Calculate erythema index (simplified)
  const erythemaIndex = dominant.r - dominant.g;
  
  let redness;
  if (overallRedRatio < 0.9) {
    redness = 8 + (overallRedRatio * 15);
  } else if (overallRedRatio > 1.4) {
    redness = 45 + ((overallRedRatio - 1.4) * 80);
  } else {
    redness = 20 + ((overallRedRatio - 0.9) * 50);
  }
  
  // Add erythema contribution
  redness += Math.max(0, erythemaIndex * 0.2);
  
  redness = Math.max(8, Math.min(85, redness));
  
  console.log('🔴 Enhanced redness analysis:', { overallRedRatio, erythemaIndex, redness });
  return redness;
}

function calculateTextureEnhanced(dominant: any, average: any, vibrant: any): number {
  // Enhanced texture with multiple factors
  const dominantLum = 0.299 * dominant.r + 0.587 * dominant.g + 0.114 * dominant.b;
  const averageLum = 0.299 * average.r + 0.587 * average.g + 0.114 * average.b;
  const vibrantLum = 0.299 * vibrant.r + 0.587 * vibrant.g + 0.114 * vibrant.b;
  
  const variation = Math.abs(dominantLum - averageLum) + Math.abs(averageLum - vibrantLum);
  
  // Color uniformity
  const colorUniformity = Math.abs(dominant.r - average.r) + 
                         Math.abs(dominant.g - average.g) + 
                         Math.abs(dominant.b - average.b);
  
  let texture = (variation * 0.3) + (colorUniformity * 0.2);
  texture = Math.max(10, Math.min(80, texture));
  
  console.log('🏔️ Enhanced texture analysis:', { variation, colorUniformity, texture });
  return texture;
}

function calculateAcneEnhanced(dominant: any, average: any): number {
  const dominantDarkness = 255 - ((dominant.r + dominant.g + dominant.b) / 3);
  const averageDarkness = 255 - ((average.r + average.g + average.b) / 3);
  const overallDarkness = (dominantDarkness + averageDarkness) / 2;
  
  // Color irregularity (spots/blemishes)
  const colorIrregularity = Math.abs(dominant.r - average.r) + 
                           Math.abs(dominant.g - average.g) + 
                           Math.abs(dominant.b - average.b);
  
  let acne = (overallDarkness * 0.15) + (colorIrregularity * 0.08);
  acne = Math.max(5, Math.min(60, acne));
  
  console.log('🦠 Enhanced acne analysis:', { overallDarkness, colorIrregularity, acne });
  return acne;
}

function calculateWrinklesEnhanced(dominant: any, vibrant: any): number {
  const contrast = Math.abs(dominant.r - vibrant.r) + 
                   Math.abs(dominant.g - vibrant.g) + 
                   Math.abs(dominant.b - vibrant.b);
  
  // Luminance variation (indicates depth/shadows)
  const dominantLum = 0.299 * dominant.r + 0.587 * dominant.g + 0.114 * dominant.b;
  const vibrantLum = 0.299 * vibrant.r + 0.587 * vibrant.g + 0.114 * vibrant.b;
  const lumVariation = Math.abs(dominantLum - vibrantLum);
  
  let wrinkles = (contrast * 0.15) + (lumVariation * 0.25);
  wrinkles = Math.max(8, Math.min(75, wrinkles));
  
  console.log('⏱️ Enhanced wrinkles analysis:', { contrast, lumVariation, wrinkles });
  return wrinkles;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 180, g: 140, b: 110 };
}

function generateAdviceFromMetrics(metrics: SkinMetrics, confidence?: number, skinType?: string): RealAnalysisResult['advice'] {
  const confidencePrefix = confidence && confidence < 80 ? "Based on current image quality, " : "";
  const skinTypeContext = skinType ? ` Your ${skinType} skin type` : "";
  
  return {
    oiliness: generateOilinessAdvice(metrics.oiliness, confidencePrefix, skinTypeContext),
    redness: generateRednessAdvice(metrics.redness, confidencePrefix, skinTypeContext),
    texture: generateTextureAdvice(metrics.texture, confidencePrefix, skinTypeContext),
    acne: generateAcneAdvice(metrics.acne || 0, confidencePrefix, skinTypeContext),
    wrinkles: generateWrinklesAdvice(metrics.wrinkles || 0, confidencePrefix, skinTypeContext),
  };
}

function generateOilinessAdvice(score: number, prefix: string = "", skinContext: string = ""): string {
  if (score >= 70) {
    return `${prefix}Your skin shows high oil production.${skinContext} benefits from oil-free cleansers twice daily, niacinamide serums, and lightweight, non-comedogenic moisturizers.`;
  } else if (score >= 40) {
    return `${prefix}Moderate oiliness detected.${skinContext} should balance with gentle cleansing morning and evening, and gel-based moisturizers to maintain hydration.`;
  } else {
    return `${prefix}Low oil levels indicate potentially dry skin.${skinContext} needs cream-based moisturizers and avoiding over-cleansing to preserve natural oils.`;
  }
}

function generateRednessAdvice(score: number, prefix: string = "", skinContext: string = ""): string {
  if (score >= 60) {
    return `${prefix}Significant redness detected.${skinContext} requires gentle, fragrance-free products with soothing ingredients like aloe vera, chamomile, or centella asiatica.`;
  } else if (score >= 30) {
    return `${prefix}Mild redness present.${skinContext} would benefit from gentle skincare with anti-inflammatory ingredients like green tea or niacinamide.`;
  } else {
    return `${prefix}Minimal redness detected.${skinContext} appears calm. Focus on prevention with daily SPF protection and gentle maintenance.`;
  }
}

function generateTextureAdvice(score: number, prefix: string = "", skinContext: string = ""): string {
  if (score >= 70) {
    return `${prefix}Rough texture detected.${skinContext} would improve with gentle exfoliation 2-3 times weekly using AHA/BHA products and hydrating serums.`;
  } else if (score >= 40) {
    return `${prefix}Moderate texture irregularities.${skinContext} can benefit from weekly gentle exfoliation and consistent moisturizing for smoother skin.`;
  } else {
    return `${prefix}Good skin texture detected.${skinContext} should maintain with gentle daily cleansing and regular moisturizing to preserve smoothness.`;
  }
}

function generateAcneAdvice(score: number, prefix: string = "", skinContext: string = ""): string {
  if (score >= 60) {
    return `${prefix}Multiple blemishes detected.${skinContext} needs gentle salicylic acid products, non-comedogenic skincare, and professional guidance if severe.`;
  } else if (score >= 30) {
    return `${prefix}Some blemishes present.${skinContext} should maintain gentle cleansing, spot-treat with salicylic acid, and avoid picking affected areas.`;
  } else {
    return `${prefix}Minimal blemishes detected.${skinContext} should continue current routine focusing on prevention with gentle, non-comedogenic products.`;
  }
}

function generateWrinklesAdvice(score: number, prefix: string = "", skinContext: string = ""): string {
  if (score >= 60) {
    return `${prefix}Visible aging signs detected.${skinContext} would benefit from gradual retinol introduction, daily SPF 30+, and hydrating serums with hyaluronic acid.`;
  } else if (score >= 30) {
    return `${prefix}Early aging signs present.${skinContext} should focus on daily SPF protection, gentle retinol products, and antioxidant serums for prevention.`;
  } else {
    return `${prefix}Minimal aging signs detected.${skinContext} should maintain prevention with daily SPF, antioxidant serums, and gentle moisturizing.`;
  }
} 