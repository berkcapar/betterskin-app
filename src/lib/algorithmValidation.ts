import { analyzeRealImage } from './realPixelAnalysis';

/**
 * Test suite for algorithm consistency and accuracy
 */

// Test cases with known expected ranges
export const testCases = [
  {
    name: 'Parlak Yağlı Cilt',
    mockColors: {
      platform: 'ios',
      primary: '#F0E5D0', // Parlak ten
      secondary: '#E8D5B7',
      detail: '#DCC5A0'
    },
    expectedRanges: {
      oiliness: [60, 80],
      redness: [5, 25],
      texture: [20, 50],
      acne: [5, 30],
      wrinkles: [10, 40]
    }
  },
  {
    name: 'Koyu Mat Cilt',
    mockColors: {
      platform: 'ios',
      primary: '#8B4513', // Koyu ten
      secondary: '#A0522D',
      detail: '#CD853F'
    },
    expectedRanges: {
      oiliness: [20, 45],
      redness: [5, 20],
      texture: [25, 60],
      acne: [10, 35],
      wrinkles: [15, 45]
    }
  },
  {
    name: 'Kızıl/Hassas Cilt',
    mockColors: {
      platform: 'ios',
      primary: '#E6B8A2', // Kızıl ton
      secondary: '#D4A574',
      detail: '#C89660'
    },
    expectedRanges: {
      oiliness: [25, 55],
      redness: [40, 70],
      texture: [30, 65],
      acne: [15, 40],
      wrinkles: [20, 50]
    }
  }
];

/**
 * Test algorithm consistency - same input should give same output
 */
export async function testConsistency(imageUri: string, iterations: number = 5): Promise<{
  isConsistent: boolean;
  variance: any;
  results: any[];
}> {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const result = await analyzeRealImage(imageUri);
    results.push(result.metrics);
  }
  
  // Calculate variance for each metric
  const variance = {
    oiliness: calculateVariance(results.map(r => r.oiliness)),
    redness: calculateVariance(results.map(r => r.redness)),
    texture: calculateVariance(results.map(r => r.texture)),
    acne: calculateVariance(results.map(r => r.acne || 0)),
    wrinkles: calculateVariance(results.map(r => r.wrinkles || 0)),
  };
  
  // Algorithm is consistent if variance is low (< 5% for each metric)
  const isConsistent = Object.values(variance).every(v => v < 5);
  
  return { isConsistent, variance, results };
}

/**
 * Test algorithm accuracy against known samples
 */
export function testAccuracy(actualResults: any, testCase: typeof testCases[0]): {
  isAccurate: boolean;
  score: number;
  details: any;
} {
  const { expectedRanges } = testCase;
  const details: any = {};
  let correctPredictions = 0;
  let totalMetrics = 0;
  
  Object.keys(expectedRanges).forEach(metric => {
    const actual = actualResults[metric];
    const [min, max] = expectedRanges[metric as keyof typeof expectedRanges];
    const isInRange = actual >= min && actual <= max;
    
    details[metric] = {
      actual,
      expected: [min, max],
      correct: isInRange
    };
    
    if (isInRange) correctPredictions++;
    totalMetrics++;
  });
  
  const score = (correctPredictions / totalMetrics) * 100;
  const isAccurate = score >= 70; // 70% doğruluk eşiği
  
  return { isAccurate, score, details };
}

/**
 * Test sensitivity - algorithm should detect meaningful differences
 */
export async function testSensitivity(
  brightImageUri: string, 
  darkImageUri: string
): Promise<{
  isSensitive: boolean;
  differences: any;
}> {
  const brightResult = await analyzeRealImage(brightImageUri);
  const darkResult = await analyzeRealImage(darkImageUri);
  
  const differences = {
    oiliness: Math.abs(brightResult.metrics.oiliness - darkResult.metrics.oiliness),
    redness: Math.abs(brightResult.metrics.redness - darkResult.metrics.redness),
    texture: Math.abs(brightResult.metrics.texture - darkResult.metrics.texture),
    acne: Math.abs((brightResult.metrics.acne || 0) - (darkResult.metrics.acne || 0)),
    wrinkles: Math.abs((brightResult.metrics.wrinkles || 0) - (darkResult.metrics.wrinkles || 0)),
  };
  
  // Algorithm is sensitive if it detects meaningful differences (>10 points)
  const significantDifferences = Object.values(differences).filter(d => d > 10).length;
  const isSensitive = significantDifferences >= 2; // En az 2 metrikte fark olmalı
  
  return { isSensitive, differences };
}

/**
 * Calculate variance for consistency testing
 */
function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  return Math.sqrt(variance); // Standard deviation
}

/**
 * Run comprehensive algorithm validation
 */
export async function runFullValidation(testImageUri: string): Promise<{
  consistency: any;
  sensitivity: any;
  recommendations: string[];
}> {
  console.log('🧪 Starting algorithm validation...');
  
  // Test consistency
  const consistency = await testConsistency(testImageUri, 3);
  console.log('📊 Consistency test:', consistency);
  
  // Test sensitivity (using same image twice for now - in production use different images)
  const sensitivity = await testSensitivity(testImageUri, testImageUri);
  console.log('🎯 Sensitivity test:', sensitivity);
  
  // Generate recommendations
  const recommendations = [];
  
  if (!consistency.isConsistent) {
    recommendations.push('Algoritma tutarlılığı artırılmalı - random değerler kaldırıldı');
  }
  
  if (Object.values(consistency.variance).some((v: any) => v > 10)) {
    recommendations.push('Yüksek varyans - daha stabil hesaplama gerekli');
  }
  
  if (!sensitivity.isSensitive) {
    recommendations.push('Algoritma hassaslığı artırılmalı - farklı girişlerde daha belirgin farklar olmalı');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Algoritma performansı iyi görünüyor! ✅');
  }
  
  return { consistency, sensitivity, recommendations };
} 