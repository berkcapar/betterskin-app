import { SkinMetrics } from '@/types';
import { storage } from './storage';

export interface PremiumAnalysisResult {
  detailedReport: {
    overallAssessment: string;
    seasonalContext: string;
    morningRoutine: RoutineStep[];
    eveningRoutine: RoutineStep[];
    productRecommendations: ProductRecommendation[];
    nextSeasonReminder: string;
  };
  confidence: number;
  analysisDate: string;
  season: string;
  estimatedCost: number;
}

export interface RoutineStep {
  step: number;
  concern: string; // 'oiliness', 'redness', 'texture', 'acne', 'wrinkles'
  action: string;
  product: string;
  frequency: string;
  instructions: string;
}

export interface ProductRecommendation {
  concern: string;
  category: string; // 'cleanser', 'serum', 'moisturizer', 'treatment', 'sunscreen'
  productName: string;
  brand: string;
  activeIngredients: string[];
  priceRange: string;
  reasoning: string;
}

class PremiumAnalysisService {
  private readonly ANALYSIS_COST = 10; // $10 per analysis
  
  async generatePremiumReport(
    metrics: SkinMetrics, 
    skinType: string, 
    confidence: number
  ): Promise<PremiumAnalysisResult> {
    const season = await storage.getCurrentSeason();
    
    try {
      // Generate AI-powered detailed analysis
      const aiAnalysis = await this.generateAIAnalysis(metrics, skinType, season);
      
      // Track premium usage
      await storage.incrementPremiumAnalysis();
      await storage.setLastPremiumReportSeason(season);
      
      return {
        detailedReport: aiAnalysis,
        confidence,
        analysisDate: new Date().toISOString(),
        season,
        estimatedCost: this.ANALYSIS_COST
      };
      
    } catch (error) {
      console.error('Premium analysis failed:', error);
      
      // Fallback to template-based analysis
      return this.generateFallbackReport(metrics, skinType, confidence, season);
    }
  }
  
  private async generateAIAnalysis(
    metrics: SkinMetrics, 
    skinType: string, 
    season: string
  ): Promise<PremiumAnalysisResult['detailedReport']> {
    
    const prompt = this.buildAnalysisPrompt(metrics, skinType, season);
    
    // For testing, return mock data. In production, call OpenAI API
    return this.getMockAIResponse(metrics, skinType, season);
    
    /* Production OpenAI call would be:
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });
    
    const data = await response.json();
    return this.parseAIResponse(data.choices[0].message.content);
    */
  }
  
  private buildAnalysisPrompt(metrics: SkinMetrics, skinType: string, season: string): string {
    return `You are a professional dermatologist creating a personalized skincare report.

PATIENT PROFILE:
- Skin Type: ${skinType}
- Current Season: ${season}
- Analysis Scores (0-100):
  * Oiliness: ${metrics.oiliness}
  * Redness: ${metrics.redness} 
  * Texture: ${metrics.texture}
  * Acne: ${metrics.acne}
  * Wrinkles: ${metrics.wrinkles}

Please provide a comprehensive skincare analysis including:

1. OVERALL ASSESSMENT (2-3 sentences about current skin condition)

2. SEASONAL CONTEXT (how ${season} affects their specific skin type and concerns)

3. MORNING ROUTINE (5-7 steps with specific product types and instructions)

4. EVENING ROUTINE (5-7 steps with specific product types and instructions)

5. PRODUCT RECOMMENDATIONS (specific products for each major concern with reasoning)

6. NEXT SEASON REMINDER (when to get updated analysis for seasonal changes)

Focus on evidence-based recommendations, real product suggestions, and address their highest concern areas first. Make it professional but accessible.`;
  }
  
  private getMockAIResponse(
    metrics: SkinMetrics, 
    skinType: string, 
    season: string
  ): PremiumAnalysisResult['detailedReport'] {
    
    const primaryConcern = this.getPrimaryConcern(metrics);
    const seasonalAdjustments = this.getSeasonalAdjustments(season);
    
    return {
      overallAssessment: `Your ${skinType} skin shows ${this.getOverallCondition(metrics)}. The primary area for improvement is ${primaryConcern}, with secondary attention needed for texture and preventive anti-aging care. Your skin appears generally healthy with targeted treatment opportunities.`,
      
      seasonalContext: `During ${season}, your skin requires ${seasonalAdjustments.focus}. ${seasonalAdjustments.challenges} This season calls for ${seasonalAdjustments.recommendations} to maintain optimal skin health.`,
      
      morningRoutine: this.generateMorningRoutine(metrics, season),
      eveningRoutine: this.generateEveningRoutine(metrics, season),
      productRecommendations: this.generateProductRecommendations(metrics, skinType),
      
      nextSeasonReminder: `Your current analysis is optimized for ${season}. For best results, consider getting a new analysis at the beginning of ${this.getNextSeason(season)} (around ${this.getNextSeasonDate(season)}) when your skin's needs will change with the weather.`
    };
  }
  
  private generateMorningRoutine(metrics: SkinMetrics, season: string): RoutineStep[] {
    const routine: RoutineStep[] = [
      {
        step: 1,
        concern: 'general',
        action: 'Gentle Cleanser',
        product: metrics.oiliness > 60 ? 'Foaming cleanser with salicylic acid' : 'Cream or gel cleanser',
        frequency: 'Daily',
        instructions: 'Cleanse with lukewarm water for 30-60 seconds, pat dry gently'
      },
      {
        step: 2,
        concern: 'redness',
        action: 'Soothing Toner',
        product: metrics.redness > 40 ? 'Centella asiatica or chamomile toner' : 'Hydrating hyaluronic acid toner',
        frequency: 'Daily',
        instructions: 'Apply with cotton pad or gentle patting motions'
      }
    ];
    
    // Add vitamin C for most people
    routine.push({
      step: 3,
      concern: 'general',
      action: 'Antioxidant Serum',
      product: 'Vitamin C serum (10-20% L-ascorbic acid)',
      frequency: 'Daily',
      instructions: 'Apply to clean skin, wait 5 minutes before next step'
    });
    
    // Add specific treatments based on concerns
    if (metrics.oiliness > 60) {
      routine.push({
        step: 4,
        concern: 'oiliness',
        action: 'Oil Control',
        product: 'Niacinamide 10% serum',
        frequency: 'Daily',
        instructions: 'Focus on T-zone and oily areas'
      });
    }
    
    // Moisturizer
    routine.push({
      step: routine.length + 1,
      concern: 'general',
      action: 'Moisturizer',
      product: metrics.oiliness > 60 ? 'Lightweight gel moisturizer' : 'Cream moisturizer with ceramides',
      frequency: 'Daily',
      instructions: 'Apply evenly, allow to absorb fully'
    });
    
    // SPF (most important!)
    routine.push({
      step: routine.length + 1,
      concern: 'wrinkles',
      action: 'Sun Protection',
      product: 'Broad-spectrum SPF 30+ sunscreen',
      frequency: 'Daily',
      instructions: 'Apply generously, reapply every 2 hours if outdoors'
    });
    
    return routine;
  }
  
  private generateEveningRoutine(metrics: SkinMetrics, season: string): RoutineStep[] {
    const routine: RoutineStep[] = [
      {
        step: 1,
        concern: 'general',
        action: 'Makeup Removal/First Cleanse',
        product: 'Micellar water or cleansing oil',
        frequency: 'Daily (if wearing makeup/sunscreen)',
        instructions: 'Remove all makeup and sunscreen thoroughly'
      },
      {
        step: 2,
        concern: 'general',
        action: 'Second Cleanse',
        product: metrics.oiliness > 60 ? 'Foaming cleanser' : 'Gentle cream cleanser',
        frequency: 'Daily',
        instructions: 'Double cleanse for thorough cleaning'
      }
    ];
    
    // Active treatments based on concerns
    if (metrics.acne && metrics.acne > 30) {
      routine.push({
        step: 3,
        concern: 'acne',
        action: 'Acne Treatment',
        product: 'Salicylic acid 2% or benzoyl peroxide 2.5%',
        frequency: 'Daily (start 3x/week)',
        instructions: 'Start slowly, increase frequency as tolerated'
      });
    } else if (metrics.wrinkles && metrics.wrinkles > 30) {
      routine.push({
        step: 3,
        concern: 'wrinkles',
        action: 'Anti-Aging Treatment',
        product: 'Retinol 0.25-0.5% (start lower)',
        frequency: '2-3x per week initially',
        instructions: 'Start with pea-sized amount, gradually increase frequency'
      });
    }
    
    // Texture improvement
    if (metrics.texture > 50) {
      routine.push({
        step: routine.length + 1,
        concern: 'texture',
        action: 'Exfoliation',
        product: 'AHA (glycolic acid 5-10%) or BHA alternating',
        frequency: '2-3x per week',
        instructions: 'Use on non-retinol nights, start with lower concentration'
      });
    }
    
    // Night moisturizer
    routine.push({
      step: routine.length + 1,
      concern: 'general',
      action: 'Night Moisturizer',
      product: 'Rich cream with ceramides and peptides',
      frequency: 'Daily',
      instructions: 'Apply generously, focus on dry areas'
    });
    
    return routine;
  }
  
  private generateProductRecommendations(metrics: SkinMetrics, skinType: string): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];
    
    // Cleanser recommendation
    recommendations.push({
      concern: 'general',
      category: 'cleanser',
      productName: metrics.oiliness > 60 ? 'Foaming Facial Cleanser' : 'Gentle Skin Cleanser',
      brand: metrics.oiliness > 60 ? 'Neutrogena' : 'Cetaphil',
      activeIngredients: metrics.oiliness > 60 ? ['Salicylic Acid'] : ['Ceramides', 'Hyaluronic Acid'],
      priceRange: '$8-15',
      reasoning: `Selected for ${skinType} skin to ${metrics.oiliness > 60 ? 'control oil and prevent breakouts' : 'maintain moisture barrier while cleansing effectively'}.`
    });
    
    // Primary concern product
    if (metrics.oiliness > 60) {
      recommendations.push({
        concern: 'oiliness',
        category: 'serum',
        productName: 'Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        activeIngredients: ['Niacinamide', 'Zinc'],
        priceRange: '$6-8',
        reasoning: 'Reduces sebum production and minimizes pore appearance. Excellent value with proven efficacy for oily skin.'
      });
    }
    
    if (metrics.redness > 40) {
      recommendations.push({
        concern: 'redness',
        category: 'serum',
        productName: 'Centella Unscented Serum',
        brand: 'PURITO or CosRx',
        activeIngredients: ['Centella Asiatica', 'Niacinamide'],
        priceRange: '$12-18',
        reasoning: 'Anti-inflammatory properties help reduce redness and irritation. Gentle formula suitable for sensitive skin.'
      });
    }
    
    if (metrics.wrinkles && metrics.wrinkles > 30) {
      recommendations.push({
        concern: 'wrinkles',
        category: 'treatment',
        productName: 'Retinol 0.5% in Squalane',
        brand: 'The Ordinary',
        activeIngredients: ['Retinol', 'Squalane'],
        priceRange: '$8-12',
        reasoning: 'Gold standard anti-aging ingredient. Start with lower concentration to build tolerance.'
      });
    }
    
    // Sunscreen (always important)
    recommendations.push({
      concern: 'wrinkles',
      category: 'sunscreen',
      productName: 'Anthelios Melt-in Milk Sunscreen SPF 60',
      brand: 'La Roche-Posay',
      activeIngredients: ['Avobenzone', 'Homosalate', 'Octisalate'],
      priceRange: '$15-20',
      reasoning: 'Most important anti-aging product. Broad-spectrum protection with elegant texture for daily use.'
    });
    
    return recommendations;
  }
  
  private getPrimaryConcern(metrics: SkinMetrics): string {
    const concerns = [
      { name: 'oiliness', score: metrics.oiliness },
      { name: 'redness', score: metrics.redness },
      { name: 'texture', score: metrics.texture },
      { name: 'acne', score: metrics.acne || 0 },
      { name: 'wrinkles', score: metrics.wrinkles || 0 }
    ];
    
    return concerns.sort((a, b) => b.score - a.score)[0].name;
  }
  
  private getOverallCondition(metrics: SkinMetrics): string {
    const avgScore = (metrics.oiliness + metrics.redness + metrics.texture + (metrics.acne || 0) + (metrics.wrinkles || 0)) / 5;
    
    if (avgScore < 30) return 'excellent condition with minimal concerns';
    if (avgScore < 50) return 'good condition with some areas for improvement';
    if (avgScore < 70) return 'moderate concerns that can be addressed with targeted care';
    return 'several concerns that would benefit from comprehensive treatment';
  }
  
  private getSeasonalAdjustments(season: string): { focus: string; challenges: string; recommendations: string } {
    switch (season) {
      case 'winter':
        return {
          focus: 'intense hydration and barrier protection',
          challenges: 'Cold air and indoor heating can severely dry skin and compromise the moisture barrier.',
          recommendations: 'richer moisturizers, gentle cleansing, and humidifier use'
        };
      case 'spring':
        return {
          focus: 'transition care and allergy management',
          challenges: 'Changing weather and allergens can trigger sensitivity and breakouts.',
          recommendations: 'gradual routine changes, gentle exfoliation, and allergy-conscious products'
        };
      case 'summer':
        return {
          focus: 'oil control and sun protection',
          challenges: 'Heat and humidity increase oil production while UV exposure accelerates aging.',
          recommendations: 'lightweight products, diligent SPF use, and antioxidant protection'
        };
      case 'fall':
        return {
          focus: 'barrier repair and preparation for colder weather',
          challenges: 'Temperature drops begin drying skin while summer damage becomes apparent.',
          recommendations: 'barrier-strengthening ingredients and gradual transition to richer products'
        };
      default:
        return {
          focus: 'balanced year-round care',
          challenges: 'Seasonal changes affect skin needs.',
          recommendations: 'adaptable routine with seasonal adjustments'
        };
    }
  }
  
  private getNextSeason(season: string): string {
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    const currentIndex = seasons.indexOf(season);
    return seasons[(currentIndex + 1) % 4];
  }
  
  private getNextSeasonDate(season: string): string {
    const dates: Record<string, string> = {
      'winter': 'March 20th (Spring)',
      'spring': 'June 21st (Summer)',
      'summer': 'September 22nd (Fall)',
      'fall': 'December 21st (Winter)'
    };
    return dates[season] || 'next season';
  }
  
  private generateFallbackReport(
    metrics: SkinMetrics, 
    skinType: string, 
    confidence: number,
    season: string
  ): PremiumAnalysisResult {
    return {
      detailedReport: this.getMockAIResponse(metrics, skinType, season),
      confidence,
      analysisDate: new Date().toISOString(),
      season,
      estimatedCost: this.ANALYSIS_COST
    };
  }
}

export const premiumAnalysis = new PremiumAnalysisService(); 