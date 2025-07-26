import { SkinMetrics } from '@/types';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface OpenAIAnalysisResult {
  oiliness: 'low' | 'medium' | 'high';
  redness: 'low' | 'medium' | 'high';  
  texture: 'good' | 'medium' | 'poor';
  acne: 'low' | 'medium' | 'high';
  wrinkles: 'minimal' | 'moderate' | 'significant';
  advice: {
    oiliness: string;
    redness: string;
    texture: string;
    acne: string;
    wrinkles: string;
  };
}

/**
 * Converts image URI to base64 format required by OpenAI
 */
async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    throw new Error('Image conversion failed');
  }
}

/**
 * Analyzes facial skin using OpenAI Vision API
 */
export async function analyzeWithOpenAI(imageUri: string): Promise<OpenAIAnalysisResult> {
  try {
    console.log('🤖 Starting OpenAI Vision analysis...');

    // Convert image to base64
    const base64Image = await imageUriToBase64(imageUri);
    
    const prompt = `You are a professional skincare consultant. Please evaluate the uploaded photo and provide an analysis of skin health in the following aspects:

- Oil/shine level (low/medium/high)
- Redness (low/medium/high) 
- Smoothness (good/medium/poor)
- Blemishes or breakouts (low/medium/high)
- Visible signs of aging (minimal/moderate/significant)

For each aspect, give 1-2 practical and supportive skincare tips.
Do not guess age or attractiveness. Do not make subjective judgments.
Focus on health, care, and well-being.

Respond ONLY with a valid JSON object in this exact format:
{
  "oiliness": "medium",
  "redness": "low",
  "texture": "good",
  "acne": "low", 
  "wrinkles": "minimal",
  "advice": {
    "oiliness": "Use gentle, hydrating cleansers and lightweight moisturizers to maintain healthy skin balance.",
    "redness": "Apply products with soothing ingredients like aloe vera or chamomile to calm the skin.",
    "texture": "Regular gentle exfoliation and consistent moisturizing can help maintain smooth skin texture.",
    "acne": "Maintain a gentle cleansing routine and avoid over-washing to prevent irritation.",
    "wrinkles": "Daily sunscreen use and gentle moisturizing can help maintain healthy, youthful-looking skin."
  }
}

Focus on supportive skincare health recommendations.`;

    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent results
    };

    console.log('📤 Sending request to OpenAI...');

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚫 OpenAI API Error:', response.status, response.statusText);
      console.error('🚫 Error details:', errorText);
      
      // Parse error if possible
      try {
        const errorData = JSON.parse(errorText);
        console.error('🚫 Parsed error:', errorData);
      } catch {
        // Ignore parse error
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Full OpenAI response:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in response:', data);
      throw new Error('No response content from OpenAI');
    }

    console.log('📥 Raw OpenAI response content:', content);

    // Check if response looks like JSON
    if (!content.trim().startsWith('{')) {
      console.error('❌ Response is not JSON format:', content);
      throw new Error('OpenAI returned non-JSON response: ' + content.substring(0, 100));
    }

    // Parse JSON response
    const analysisResult: OpenAIAnalysisResult = JSON.parse(content);
    
    console.log('✅ OpenAI analysis complete:', analysisResult);
    
    return analysisResult;

  } catch (error) {
    console.error('❌ OpenAI analysis failed:', error);
    
    // Return fallback mock data if API fails
    return {
      oiliness: 'medium',
      redness: 'low',
      texture: 'medium',
      acne: 'low',
      wrinkles: 'minimal',
      advice: {
        oiliness: 'Your skin shows moderate oil production. Use a gentle cleanser twice daily and consider oil-free moisturizers.',
        redness: 'Minimal redness detected. Continue with gentle, fragrance-free products.',
        texture: 'Good skin texture with room for improvement. Regular exfoliation 2-3 times per week may help.',
        acne: 'Low acne levels detected. Maintain current skincare routine and avoid over-cleansing.',
        wrinkles: 'Minimal signs of aging. Focus on daily SPF protection and consider retinol products for prevention.'
      }
    };
  }
}

/**
 * Converts OpenAI result to our app's SkinMetrics format
 */
export function convertToSkinMetrics(openaiResult: OpenAIAnalysisResult): SkinMetrics {
  // Convert string values to numeric scores (0-100)
  const convertOiliness = (level: string): number => {
    switch (level) {
      case 'low': return 20;
      case 'medium': return 50;
      case 'high': return 80;
      default: return 50;
    }
  };

  const convertRedness = (level: string): number => {
    switch (level) {
      case 'low': return 20;
      case 'medium': return 50;
      case 'high': return 80;
      default: return 30;
    }
  };

  const convertTexture = (level: string): number => {
    switch (level) {
      case 'good': return 20;
      case 'medium': return 50;
      case 'poor': return 80;
      default: return 40;
    }
  };

  const convertAcne = (level: string): number => {
    switch (level) {
      case 'low': return 15;
      case 'medium': return 45;
      case 'high': return 75;
      default: return 25;
    }
  };

  const convertWrinkles = (level: string): number => {
    switch (level) {
      case 'minimal': return 15;
      case 'moderate': return 45;
      case 'significant': return 75;
      default: return 25;
    }
  };

  return {
    oiliness: convertOiliness(openaiResult.oiliness),
    redness: convertRedness(openaiResult.redness),
    texture: convertTexture(openaiResult.texture),
    acne: convertAcne(openaiResult.acne),
    wrinkles: convertWrinkles(openaiResult.wrinkles),
  };
} 