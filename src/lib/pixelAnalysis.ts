
import { SkinMetrics } from '@/types';

export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ImageAnalysisResult {
  metrics: SkinMetrics;
  advice: {
    oiliness: string;
    redness: string;
    texture: string;
    acne: string;
    wrinkles: string;
  };
}

/**
 * Analyzes image pixels to determine oiliness level (0-100)
 * Higher values indicate more oily/shiny skin
 */
function analyzeOiliness(pixels: PixelData[]): number {
  if (pixels.length === 0) return 50;

  // Calculate average brightness (high brightness = oily/shiny skin)
  const totalBrightness = pixels.reduce((sum, pixel) => {
    const brightness = (pixel.r + pixel.g + pixel.b) / 3;
    return sum + brightness;
  }, 0);

  const avgBrightness = totalBrightness / pixels.length;
  
  // Convert brightness (0-255) to oiliness score (0-100)
  // 200+ brightness = high oiliness, 100- brightness = low oiliness
  const oiliness = Math.min(100, Math.max(0, (avgBrightness - 100) * 0.8));
  
  return Math.round(oiliness);
}

/**
 * Analyzes image pixels to determine redness level (0-100)
 * Higher values indicate more redness/irritation
 */
function analyzeRedness(pixels: PixelData[]): number {
  if (pixels.length === 0) return 25;

  // Calculate red dominance vs green/blue
  const redDominance = pixels.reduce((sum, pixel) => {
    const avgGB = (pixel.g + pixel.b) / 2;
    const redExcess = Math.max(0, pixel.r - avgGB);
    return sum + redExcess;
  }, 0);

  const avgRedDominance = redDominance / pixels.length;
  
  // Convert red dominance to redness score (0-100)
  const redness = Math.min(100, Math.max(0, avgRedDominance * 1.2));
  
  return Math.round(redness);
}

/**
 * Analyzes texture by measuring color variation between neighboring pixels
 * Higher values indicate rougher/more uneven texture
 */
function analyzeTexture(pixels: PixelData[], width: number): number {
  if (pixels.length === 0) return 50;

  let totalVariation = 0;
  let comparisons = 0;

  // Compare each pixel with its neighbors
  for (let i = 0; i < pixels.length; i++) {
    const currentPixel = pixels[i];
    
    // Check right neighbor
    if ((i + 1) % width !== 0 && i + 1 < pixels.length) {
      const rightPixel = pixels[i + 1];
      const variation = Math.abs(currentPixel.r - rightPixel.r) + 
                       Math.abs(currentPixel.g - rightPixel.g) + 
                       Math.abs(currentPixel.b - rightPixel.b);
      totalVariation += variation;
      comparisons++;
    }
    
    // Check bottom neighbor
    if (i + width < pixels.length) {
      const bottomPixel = pixels[i + width];
      const variation = Math.abs(currentPixel.r - bottomPixel.r) + 
                       Math.abs(currentPixel.g - bottomPixel.g) + 
                       Math.abs(currentPixel.b - bottomPixel.b);
      totalVariation += variation;
      comparisons++;
    }
  }

  const avgVariation = comparisons > 0 ? totalVariation / comparisons : 0;
  
  // Convert variation to texture score (0-100)
  // Higher variation = rougher texture
  const texture = Math.min(100, Math.max(0, avgVariation / 3));
  
  return Math.round(texture);
}

/**
 * Analyzes acne by detecting dark spots (low RGB values)
 * Higher values indicate more acne/blemishes
 */
function analyzeAcne(pixels: PixelData[]): number {
  if (pixels.length === 0) return 15;

  // Count dark spots that could indicate acne/blemishes
  const darkSpots = pixels.filter(pixel => {
    const brightness = (pixel.r + pixel.g + pixel.b) / 3;
    return brightness < 80; // Dark threshold
  });

  const darkSpotRatio = darkSpots.length / pixels.length;
  
  // Convert ratio to acne score (0-100)
  const acne = Math.min(100, Math.max(0, darkSpotRatio * 400));
  
  return Math.round(acne);
}

/**
 * Analyzes wrinkles by detecting edge patterns (sudden color changes)
 * Higher values indicate more wrinkles/fine lines
 */
function analyzeWrinkles(pixels: PixelData[], width: number): number {
  if (pixels.length === 0) return 20;

  let edgeCount = 0;
  const edgeThreshold = 30;

  // Simple edge detection
  for (let i = 0; i < pixels.length; i++) {
    const currentPixel = pixels[i];
    
    // Check horizontal edges
    if ((i + 1) % width !== 0 && i + 1 < pixels.length) {
      const rightPixel = pixels[i + 1];
      const edgeStrength = Math.abs(
        (currentPixel.r + currentPixel.g + currentPixel.b) - 
        (rightPixel.r + rightPixel.g + rightPixel.b)
      ) / 3;
      
      if (edgeStrength > edgeThreshold) {
        edgeCount++;
      }
    }
  }

  const edgeRatio = edgeCount / pixels.length;
  
  // Convert edge ratio to wrinkle score (0-100)
  const wrinkles = Math.min(100, Math.max(0, edgeRatio * 300));
  
  return Math.round(wrinkles);
}

/**
 * Generates personalized advice based on skin metrics
 */
function generateAdvice(metrics: SkinMetrics): ImageAnalysisResult['advice'] {
  return {
    oiliness: generateOilinessAdvice(metrics.oiliness),
    redness: generateRednessAdvice(metrics.redness),
    texture: generateTextureAdvice(metrics.texture),
    acne: generateAcneAdvice(metrics.acne || 0),
    wrinkles: generateWrinklesAdvice(metrics.wrinkles || 0),
  };
}

function generateOilinessAdvice(score: number): string {
  if (score >= 70) {
    return "Your skin shows high oil production. Use oil-free cleansers twice daily, consider niacinamide serums, and opt for lightweight, non-comedogenic moisturizers.";
  } else if (score >= 40) {
    return "Moderate oiliness detected. Balance with gentle cleansing morning and evening, and use gel-based moisturizers to maintain hydration without excess oil.";
  } else {
    return "Low oil levels indicate potentially dry skin. Focus on hydration with cream-based moisturizers and avoid over-cleansing which can strip natural oils.";
  }
}

function generateRednessAdvice(score: number): string {
  if (score >= 60) {
    return "Significant redness detected. Use gentle, fragrance-free products with soothing ingredients like aloe vera, chamomile, or centella asiatica. Avoid harsh exfoliants.";
  } else if (score >= 30) {
    return "Mild redness present. Continue with gentle skincare and consider products with anti-inflammatory ingredients like green tea or niacinamide.";
  } else {
    return "Minimal redness detected. Your skin appears calm. Maintain current routine and focus on prevention with daily SPF protection.";
  }
}

function generateTextureAdvice(score: number): string {
  if (score >= 70) {
    return "Rough texture detected. Incorporate gentle exfoliation 2-3 times per week with AHA/BHA products and use hydrating serums to improve skin smoothness.";
  } else if (score >= 40) {
    return "Moderate texture irregularities. Regular gentle exfoliation once weekly and consistent moisturizing can help improve skin texture over time.";
  } else {
    return "Good skin texture detected. Maintain with gentle daily cleansing and regular moisturizing to preserve your skin's smooth appearance.";
  }
}

function generateAcneAdvice(score: number): string {
  if (score >= 60) {
    return "Multiple blemishes detected. Use gentle salicylic acid products, avoid over-washing, and consider non-comedogenic products. Consult a dermatologist if severe.";
  } else if (score >= 30) {
    return "Some blemishes present. Maintain gentle cleansing routine, spot-treat with salicylic acid, and avoid picking or touching affected areas.";
  } else {
    return "Minimal blemishes detected. Continue current routine and focus on prevention with gentle, non-comedogenic products and proper cleansing.";
  }
}

function generateWrinklesAdvice(score: number): string {
  if (score >= 60) {
    return "Visible aging signs detected. Incorporate retinol products gradually, use daily SPF 30+, and consider hydrating serums with hyaluronic acid and peptides.";
  } else if (score >= 30) {
    return "Early aging signs present. Focus on daily SPF protection, gentle retinol products, and antioxidant serums to prevent further aging.";
  } else {
    return "Minimal aging signs detected. Maintain prevention with daily SPF, antioxidant serums, and gentle moisturizing to preserve youthful appearance.";
  }
}

/**
 * Main function to analyze image pixels and return skin metrics with advice
 */
export function analyzeImagePixels(
  imageData: Uint8ClampedArray, 
  width: number, 
  height: number
): ImageAnalysisResult {
  // Convert image data to pixel array
  const pixels: PixelData[] = [];
  for (let i = 0; i < imageData.length; i += 4) {
    pixels.push({
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2],
      a: imageData[i + 3],
    });
  }

  // Calculate metrics
  const metrics: SkinMetrics = {
    oiliness: analyzeOiliness(pixels),
    redness: analyzeRedness(pixels),
    texture: analyzeTexture(pixels, width),
    acne: analyzeAcne(pixels),
    wrinkles: analyzeWrinkles(pixels, width),
  };

  // Generate personalized advice
  const advice = generateAdvice(metrics);

  return { metrics, advice };
} 