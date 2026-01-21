import { CustomerData } from '../types';

export interface AIAnalysisRequest {
  query: string;
  customerData: CustomerData[];
  context?: {
    timeframe?: string;
    focusArea?: string;
    comparisonData?: any;
  };
}

export interface AIAnalysisResponse {
  content: string;
  insights: string[];
  recommendations: string[];
  data?: any[];
  confidence: number;
  sources?: string[];
}

export interface ExternalDataSource {
  name: string;
  type: 'economic' | 'demographic' | 'market' | 'social';
  endpoint: string;
  description: string;
}

export class AIService {
  static async analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const aiResponse = await this.callNetlifyFunction(request);

      return {
        content: aiResponse.content,
        insights: aiResponse.insights || [],
        recommendations: aiResponse.recommendations || [],
        data: [],
        confidence: aiResponse.confidence || 0.8,
        sources: ['Internal Customer Database']
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to complete AI analysis. Please try again.');
    }
  }

  private static async callNetlifyFunction(request: AIAnalysisRequest): Promise<any> {
    try {
      const response = await fetch('/.netlify/functions/anthropic-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          customerData: request.customerData,
          context: request.context
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Netlify Function error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Netlify Function Error:', error);
      throw error;
    }
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (anthropicKey) {
        return {
          success: true,
          message: 'Anthropic Claude API key found. Using Netlify function for AI analysis.'
        };
      }

      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (openaiKey) {
        return {
          success: true,
          message: 'OpenAI API key found. Using Netlify function for AI analysis.'
        };
      }

      return {
        success: false,
        message: 'No AI service configured. Please add VITE_ANTHROPIC_API_KEY or VITE_OPENAI_API_KEY to your environment variables.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static getAvailableServices() {
    return [
      {
        name: 'Anthropic Claude',
        description: 'Advanced reasoning and analysis capabilities',
        costStructure: '$5 free credit, then $0.25 per million tokens',
        freeOption: true
      },
      {
        name: 'OpenAI GPT-3.5',
        description: 'Reliable and well-tested for analysis tasks',
        costStructure: '$5 free credit, then $0.002 per 1K tokens',
        freeOption: true
      },
      {
        name: 'Hugging Face',
        description: 'Open source models, completely free',
        costStructure: 'Free (may require more technical setup)',
        freeOption: true
      }
    ];
  }
}
