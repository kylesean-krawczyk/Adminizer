import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

interface AnthropicRequest {
  query?: string;
  customerData?: any[];
  context?: {
    timeframe?: string;
    focusArea?: string;
    comparisonData?: any;
  };
  mode?: 'intent_detection' | 'generate_response' | 'analytics' | 'tool_enabled_chat' | 'tool_continuation';
  userMessage?: string;
  conversationHistory?: Array<{role: string; content: string | any[]}>;
  systemPrompt?: string;
  intent?: string;
  tools?: any[];
  toolResults?: any[];
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const anthropicApiKey = process.env.VITE_ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Anthropic API key not configured',
          content: 'The AI service is not properly configured. Please contact the administrator.',
          insights: [],
          recommendations: [],
          confidence: 0
        }),
      };
    }

    const client = new Anthropic({
      apiKey: anthropicApiKey,
    });

    const requestBody: AnthropicRequest = JSON.parse(event.body || '{}');
    const mode = requestBody.mode || 'analytics';

    if (mode === 'tool_enabled_chat' || mode === 'tool_continuation') {
      return await handleToolEnabledChat(client, requestBody);
    }

    if (mode === 'analytics' && !requestBody.query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Query is required for analytics mode' }),
      };
    }

    if ((mode === 'intent_detection' || mode === 'generate_response') && !requestBody.userMessage) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User message is required for chat mode' }),
      };
    }

    let prompt: string;
    let maxTokens = 1500;

    if (mode === 'intent_detection') {
      prompt = constructIntentDetectionPrompt(
        requestBody.userMessage!,
        requestBody.conversationHistory || [],
        requestBody.systemPrompt
      );
      maxTokens = 500;
    } else if (mode === 'generate_response') {
      prompt = constructResponsePrompt(
        requestBody.userMessage!,
        requestBody.conversationHistory || [],
        requestBody.systemPrompt,
        requestBody.intent
      );
      maxTokens = 1500;
    } else {
      const dataSummary = prepareCustomerDataSummary(requestBody.customerData || []);
      prompt = constructAnalysisPrompt(requestBody.query!, dataSummary);
      maxTokens = 1500;
    }

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const aiContent = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsedResponse;

    if (mode === 'intent_detection' || mode === 'generate_response') {
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch {
        parsedResponse = {
          content: aiContent,
          message: aiContent
        };
      }
    } else {
      try {
        parsedResponse = JSON.parse(aiContent);
      } catch {
        parsedResponse = {
          content: aiContent,
          insights: [],
          recommendations: [],
          confidence: 0.8
        };
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedResponse),
    };

  } catch (error) {
    console.error('Function error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        content: 'I apologize, but I encountered an unexpected error. Please try again later.',
        insights: [],
        recommendations: [],
        confidence: 0
      }),
    };
  }
};

async function handleToolEnabledChat(
  client: Anthropic,
  requestBody: AnthropicRequest
): Promise<any> {
  try {
    const messages: Anthropic.Messages.MessageParam[] = [];

    if (requestBody.conversationHistory && requestBody.conversationHistory.length > 0) {
      for (const msg of requestBody.conversationHistory) {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        });
      }
    }

    if (requestBody.mode === 'tool_continuation' && requestBody.toolResults) {
      messages.push({
        role: 'user',
        content: requestBody.toolResults
      });
    } else if (requestBody.userMessage) {
      messages.push({
        role: 'user',
        content: requestBody.userMessage
      });
    }

    const requestParams: Anthropic.Messages.MessageCreateParams = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: requestBody.systemPrompt || 'You are a helpful business assistant.',
      messages
    };

    if (requestBody.tools && requestBody.tools.length > 0) {
      requestParams.tools = requestBody.tools;
    }

    const response = await client.messages.create(requestParams);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: response.id,
        model: response.model,
        role: response.role,
        content: response.content,
        stop_reason: response.stop_reason,
        usage: response.usage
      }),
    };

  } catch (error) {
    console.error('Tool-enabled chat error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Tool-enabled chat failed',
        content: 'I apologize, but I encountered an error while processing your request with tools.',
      }),
    };
  }
}

function prepareCustomerDataSummary(customerData: any[]): any {
  if (!customerData || customerData.length === 0) {
    return {
      summary: {
        totalCustomers: 0,
        totalAmount: 0,
        totalSales: 0,
        averageSale: 0,
        averageCustomerValue: 0
      },
      segmentation: {
        frequent: 0,
        regular: 0,
        occasional: 0,
        oneTime: 0
      },
      monthlyTrends: [],
      topCustomers: []
    };
  }

  const totalCustomers = customerData.length;
  const totalAmount = customerData.reduce((sum, customer) => sum + (customer.totalAmount || 0), 0);
  const totalSales = customerData.reduce((sum, customer) => sum + (customer.saleCount || 0), 0);

  const monthlyData = new Map<string, { amount: number; count: number }>();
  customerData.forEach(customer => {
    if (customer.sales && Array.isArray(customer.sales)) {
      customer.sales.forEach((sale: any) => {
        const date = new Date(sale.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { amount: 0, count: 0 });
        }
        const data = monthlyData.get(monthKey)!;
        data.amount += sale.amount || 0;
        data.count += 1;
      });
    }
  });

  const frequentCustomers = customerData.filter(c => c.purchaseFrequency === 'frequent').length;
  const regularCustomers = customerData.filter(c => c.purchaseFrequency === 'regular').length;
  const occasionalCustomers = customerData.filter(c => c.purchaseFrequency === 'occasional').length;
  const oneTimeCustomers = customerData.filter(c => c.purchaseFrequency === 'one-time').length;

  return {
    summary: {
      totalCustomers,
      totalAmount,
      totalSales,
      averageSale: totalSales > 0 ? totalAmount / totalSales : 0,
      averageCustomerValue: totalCustomers > 0 ? totalAmount / totalCustomers : 0
    },
    segmentation: {
      frequent: frequentCustomers,
      regular: regularCustomers,
      occasional: occasionalCustomers,
      oneTime: oneTimeCustomers
    },
    monthlyTrends: Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count,
      average: data.count > 0 ? data.amount / data.count : 0
    })).sort((a, b) => a.month.localeCompare(b.month)),
    topCustomers: customerData
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, 10)
      .map(c => ({
        totalAmount: c.totalAmount || 0,
        saleCount: c.saleCount || 0,
        frequency: c.purchaseFrequency || 'unknown'
      }))
  };
}

function constructAnalysisPrompt(query: string, dataSummary: any): string {
  return `
You are an expert sales analyst with access to customer data.

CUSTOMER DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

USER QUERY: "${query}"

Please provide a comprehensive analysis that includes:
1. Direct insights from the customer data
2. Actionable recommendations for sales strategy
3. Statistical observations and patterns
4. Confidence level in your analysis

Format your response as JSON with the following structure:
{
  "content": "Main analysis narrative",
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "confidence": 0.85
}
`;
}

function constructIntentDetectionPrompt(
  userMessage: string,
  conversationHistory: Array<{role: string; content: string | any[]}>,
  systemPrompt?: string
): string {
  const historyContext = conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `${msg.role}: ${content}`;
      }).join('\n')}`
    : '';

  return `${systemPrompt || 'You are a helpful assistant that detects user intent.'}

${historyContext}

USER MESSAGE: "${userMessage}"

Analyze the user's message and respond ONLY with valid JSON matching this exact structure:
{
  "intent": "one of: employee_onboarding, document_search, data_analysis, general_question, system_navigation",
  "confidence": 0.85,
  "clarification_needed": false,
  "clarifying_questions": [],
  "reasoning": "brief explanation"
}`;
}

function constructResponsePrompt(
  userMessage: string,
  conversationHistory: Array<{role: string; content: string | any[]}>,
  systemPrompt?: string,
  intent?: string
): string {
  const historyContext = conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return `${msg.role}: ${content}`;
      }).join('\n')}`
    : '';

  const intentContext = intent
    ? `\n\nDETECTED INTENT: ${intent}\nTailor your response to address this specific type of request.`
    : '';

  return `${systemPrompt || 'You are a helpful business assistant.'}

${historyContext}${intentContext}

USER MESSAGE: "${userMessage}"

Provide a helpful, professional response. Be concise but thorough.`;
}

export { handler };
