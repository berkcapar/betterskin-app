import { SkinMetrics } from '@/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

export interface EnhancedRoutine {
  steps: RoutineStep[];
  explanation: string;
  tips: string[];
}

export interface RoutineStep {
  step: number;
  product: string;
  application: string;
  timing: string;
  reasoning: string;
}

export interface AIRoutineResponse {
  morningRoutine: EnhancedRoutine;
  eveningRoutine: EnhancedRoutine;
  seasonalTips: string[];
  productRecommendations: string[];
}

class OpenAIService {
  async generateEnhancedRoutines(
    metrics: SkinMetrics,
    skinType: string = 'medium',
    season: string = 'spring'
  ): Promise<AIRoutineResponse> {
    try {
      const prompt = this.buildRoutinePrompt(metrics, skinType, season);
      
      console.log('🔄 Making OpenAI API call...');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional dermatologist and skincare expert. Provide detailed, evidence-based skincare routines. Respond ONLY with valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500, // Reduced for faster response
        }),
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ OpenAI API error:', response.status, await response.text());
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log('✅ OpenAI API response received, length:', content?.length);
      
      try {
        const parsedResponse = JSON.parse(content);
        return parsedResponse;
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        return this.getFallbackRoutines(metrics, skinType, season);
      }

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return this.getFallbackRoutines(metrics, skinType, season);
    }
  }

  private buildRoutinePrompt(metrics: SkinMetrics, skinType: string, season: string): string {
    return `
Create personalized skincare routines for a person with the following profile:

SKIN PROFILE:
- Skin Type: ${skinType}
- Current Season: ${season}
- Oiliness Score: ${metrics.oiliness}/100
- Redness Score: ${metrics.redness}/100  
- Texture Score: ${metrics.texture}/100
- Acne Score: ${metrics.acne || 'Not assessed'}/100
- Wrinkles Score: ${metrics.wrinkles || 'Not assessed'}/100

Please respond with ONLY a JSON object in this exact format:
{
  "morningRoutine": {
    "steps": [
      {
        "step": 1,
        "product": "Gentle Cleanser",
        "application": "Massage onto damp face for 30 seconds",
        "timing": "First thing upon waking",
        "reasoning": "Removes overnight buildup without stripping skin"
      }
    ],
    "explanation": "Your morning routine focuses on protection and hydration...",
    "tips": ["Apply products on damp skin", "Wait 5 minutes between serums"]
  },
  "eveningRoutine": {
    "steps": [
      {
        "step": 1,
        "product": "Double Cleanse",
        "application": "Oil cleanser first, then water-based cleanser", 
        "timing": "Before bed",
        "reasoning": "Thoroughly removes makeup, sunscreen, and daily pollutants"
      }
    ],
    "explanation": "Your evening routine emphasizes repair and treatment...",
    "tips": ["Use tretinoin on alternating nights", "Apply moisturizer while skin is damp"]
  },
  "seasonalTips": [
    "Increase hydration during ${season}",
    "Use humidifier during dry months"
  ],
  "productRecommendations": [
    "CeraVe Hydrating Cleanser for your skin type",
    "The Ordinary Niacinamide for oiliness control"
  ]
}

Focus on:
1. Evidence-based recommendations
2. Specific product application techniques  
3. Timing and frequency guidance
4. Seasonal adjustments for ${season}
5. Address the primary concerns: ${this.getPrimaryConcerns(metrics)}

Keep routines practical (5-7 steps max) and suitable for daily use.
`;
  }

  private getPrimaryConcerns(metrics: SkinMetrics): string {
    const concerns = [];
    if (metrics.oiliness > 60) concerns.push('excess oil production');
    if (metrics.redness > 50) concerns.push('inflammation/redness');
    if (metrics.texture > 60) concerns.push('rough texture');
    if (metrics.acne && metrics.acne > 40) concerns.push('acne');
    if (metrics.wrinkles && metrics.wrinkles > 40) concerns.push('signs of aging');
    
    return concerns.length > 0 ? concerns.join(', ') : 'general skin maintenance';
  }

  private getFallbackRoutines(metrics: SkinMetrics, skinType: string, season: string): AIRoutineResponse {
    return {
      morningRoutine: {
        steps: [
          {
            step: 1,
            product: "Gentle Cleanser",
            application: "Massage onto damp face for 30-60 seconds with lukewarm water",
            timing: "First thing upon waking",
            reasoning: "Removes overnight buildup while maintaining skin barrier"
          },
          {
            step: 2,
            product: "Vitamin C Serum",
            application: "Apply 2-3 drops to clean face, avoid eye area",
            timing: "After cleansing, before moisturizer",
            reasoning: "Provides antioxidant protection and brightening for day ahead"
          },
          {
            step: 3,
            product: metrics.oiliness > 60 ? "Lightweight Gel Moisturizer" : "Hydrating Cream",
            application: "Apply evenly to face and neck with upward motions",
            timing: "After serum absorption (2-3 minutes)",
            reasoning: `Maintains hydration without ${metrics.oiliness > 60 ? 'adding excess oil' : 'feeling heavy'}`
          },
          {
            step: 4,
            product: "Broad-Spectrum SPF 30+",
            application: "Apply generously (1/4 teaspoon) to all exposed areas",
            timing: "Final step, 15 minutes before sun exposure",
            reasoning: "Essential protection against UV damage and premature aging"
          }
        ],
        explanation: `Your morning routine focuses on protection and hydration for ${skinType} skin during ${season}. The key is consistency and sun protection.`,
        tips: [
          "Apply products to slightly damp skin for better absorption",
          "Wait 2-3 minutes between serum and moisturizer",
          "Reapply sunscreen every 2 hours if outdoors"
        ]
      },
      eveningRoutine: {
        steps: [
          {
            step: 1,
            product: "Makeup Remover/First Cleanse",
            application: "Gently massage makeup remover, then rinse thoroughly",
            timing: "First step of evening routine",
            reasoning: "Removes makeup, sunscreen, and surface pollutants"
          },
          {
            step: 2,
            product: "Gentle Cleanser",
            application: "Second cleanse with your morning cleanser",
            timing: "After makeup removal",
            reasoning: "Ensures thorough cleaning without over-stripping"
          },
          {
            step: 3,
            product: metrics.acne && metrics.acne > 30 ? "Salicylic Acid (2%)" : "Retinol Serum",
            application: "Apply thin layer, start 2-3x per week",
            timing: "On clean, dry skin",
            reasoning: `Addresses ${metrics.acne && metrics.acne > 30 ? 'acne concerns' : 'anti-aging and skin renewal'}`
          },
          {
            step: 4,
            product: "Rich Night Moisturizer",
            application: "Apply generously while skin is slightly damp",
            timing: "Final step, after active treatments",
            reasoning: "Repairs and hydrates overnight when skin is most receptive"
          }
        ],
        explanation: `Your evening routine emphasizes repair and treatment for ${skinType} skin. This is when skin does most of its healing work.`,
        tips: [
          "Double cleanse every night for best results",
          "Start actives slowly (2-3x per week) and build tolerance",
          "Apply moisturizer on slightly damp skin for enhanced hydration"
        ]
      },
      seasonalTips: [
        `During ${season}, adjust your routine for changing weather`,
        season === 'winter' ? 'Use heavier moisturizers and consider a humidifier' : 
        season === 'summer' ? 'Switch to lighter textures and reapply SPF frequently' :
        'Gradually transition your routine as weather changes'
      ],
      productRecommendations: [
        metrics.oiliness > 60 ? "CeraVe Foaming Cleanser for oily skin" : "CeraVe Hydrating Cleanser",
        "The Ordinary Vitamin C Suspension 23%",
        metrics.redness > 50 ? "PURITO Centella Unscented Serum" : "The Ordinary Niacinamide 10%",
        "La Roche-Posay Anthelios Melt-in Milk SPF 60"
      ]
    };
  }
}

export const openaiService = new OpenAIService(); 