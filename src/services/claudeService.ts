import type {
  ChatMessage,
  IntentCategory,
  IntentDetectionResult
} from '../types/chat';

const INTENT_CATEGORIES: Record<IntentCategory, string> = {
  employee_onboarding: 'Questions about getting started, user setup, account creation, or initial system configuration',
  document_search: 'Requests to find, view, upload, organize, or manage documents in the system',
  data_analysis: 'Questions about sales data, analytics, reports, trends, or business insights',
  general_question: 'General inquiries about features, how things work, or information not fitting other categories',
  system_navigation: 'Help with navigating the UI, finding specific pages, or understanding where to perform actions'
};

export class ClaudeService {
  private static readonly API_ENDPOINT = '/.netlify/functions/anthropic-proxy';
  private static readonly MAX_CONTEXT_MESSAGES = 10;
  private static readonly INTENT_CONFIDENCE_THRESHOLD = 0.7;

  static buildSystemPrompt(detectIntent: boolean = false): string {
    const basePrompt = `You are a helpful business management assistant for a multi-purpose business administration platform. Your role is to help users with:

- Employee onboarding and user management
- Document storage, search, and organization
- Sales analytics and data analysis
- General platform features and capabilities
- Navigation and finding specific functionality

Be professional, concise, and helpful. Provide clear guidance and ask clarifying questions when needed.`;

    if (!detectIntent) {
      return basePrompt;
    }

    return `${basePrompt}

INTENT DETECTION: Analyze the user's message and categorize their intent into ONE of these categories:

${Object.entries(INTENT_CATEGORIES).map(([intent, description]) =>
  `- ${intent}: ${description}`
).join('\n')}

Provide your response as JSON with this structure:
{
  "intent": "category_name",
  "confidence": 0.0-1.0,
  "clarification_needed": true/false,
  "clarifying_questions": ["question1", "question2"],
  "reasoning": "brief explanation of why you chose this intent"
}

Set "clarification_needed" to true if the user's intent is ambiguous or you need more information.`;
  }

  static buildToolEnabledSystemPrompt(availableToolCount?: number): string {
    const toolAvailabilityNote = availableToolCount !== undefined
      ? `\n\nNOTE: You have access to ${availableToolCount} tool(s) based on the user's permission level. Only use the tools that are available to you. If a user asks for an action that requires a tool you don't have access to, politely explain that they need additional permissions and suggest they contact their administrator or request access through the system.`
      : '';

    return `You are a helpful business management assistant for a multi-purpose business administration platform.

Your capabilities include:
- Employee onboarding and user management
- AI-powered document search and organization with natural language understanding
- **Data analytics and natural language querying** - answer questions about employees, donations, grants, donors, and campaigns
- Sales analytics and data analysis
- System status monitoring and reports
- General platform features and navigation assistance${toolAvailabilityNote}

IMPORTANT GUIDELINES:
1. When users ask questions that can be answered using the available tools, use them proactively
2. You can call multiple tools in a single response if needed to fully answer a question
3. After receiving tool results, interpret and explain them in a user-friendly, conversational way
4. Don't just show raw data - provide context, insights, and actionable information
5. If a tool execution fails, acknowledge it gracefully and offer alternatives
6. Be professional, concise, and helpful in your explanations
7. When appropriate, suggest follow-up actions or related functionality

DATA ANALYSIS CAPABILITIES (analyzeData tool):
The analyzeData tool allows you to query organizational data using natural language. Use this tool when users ask questions like:
- "How many employees were hired this quarter?"
- "What's the average donation amount?"
- "Show me grant applications from the past 6 months"
- "Total donations this year"
- "List employees in the Finance department"

WHEN TO USE analyzeData:
- Questions starting with "how many", "what is", "show me", "list", "count", "total", "average"
- Any question about employees, staff, workers, hiring, terminations
- Any question about donations, giving, gifts, contributions, donors, supporters
- Any question about grants, funding, applications, awards
- Time-based queries: this/last week/month/quarter/year, past X days/months, YTD
- Filtered queries: by department, status, amount ranges, date ranges

HOW TO USE analyzeData:
- Pass the user's question directly in the naturalLanguageQuery parameter
- The tool automatically parses time ranges (e.g., "this quarter", "last month", "past 6 months")
- It handles filters (e.g., "in Finance department", "over $1000", "awarded grants")
- It detects aggregations (count, sum, average, min, max)
- It supports grouping (by department, by month, by status)
- You don't need to specify dataSource - the tool infers it from the query

WHEN PRESENTING ANALYTICS RESULTS:
- Start with key insights from the summary.insights array
- Present aggregations in a clear, conversational way
- If there's a visualization recommendation, mention what type of chart would work best
- Offer to drill down or provide more details if the user wants
- Suggest related queries they might find interesting
- If data seems surprising (very high/low numbers), acknowledge it and offer context

DOCUMENT SEARCH CAPABILITIES:
The searchDocuments tool has AI-powered natural language understanding. When users search for documents:
- You can pass natural language queries directly (e.g., "Q3 financial report from last year")
- The system will automatically extract keywords, document types, date ranges, and other parameters
- If no results are found, the system provides intelligent suggestions
- You should summarize search results in a helpful way and can answer follow-up questions about the documents
- Suggest alternative searches or filters if results are not what the user expected

TOOL USAGE BEST PRACTICES:
- Use analyzeData when users ask data questions about employees, donations, grants, donors, or campaigns
  * Pass the natural language question directly - the tool handles all parsing
  * Don't try to extract parameters yourself - let the tool do it
  * Focus on interpreting and explaining the results
- Use searchDocuments when users ask about finding, locating, or retrieving documents
  * Pass the user's natural language query directly - don't try to parse it yourself
  * The system handles date expressions like "last month", "Q3", "this year"
  * You can optionally specify filters if clearly stated by the user
- Use getEmployeeList when users want to see team members or staff information
- Use createEmployeeRecord when users need to add a new employee or team member
- Use generateReport when users request analytics, reports, or data summaries
- Use getSystemStatus when users ask about system health or platform status

EXAMPLE DATA ANALYSIS INTERACTIONS:

User: "How many employees were hired this quarter?"
Assistant: [Uses analyzeData tool with naturalLanguageQuery: "How many employees were hired this quarter?"]
Result: Found 15 employees hired this quarter
Assistant: "I found that 15 employees were hired this quarter. The data shows hiring across multiple departments, with the majority in Operations and IT."

User: "What's our average donation amount?"
Assistant: [Uses analyzeData tool with naturalLanguageQuery: "What's our average donation amount?"]
Result: Average donation is $245.50
Assistant: "The average donation amount is $245.50. This includes all donations in your system. Would you like to see how this breaks down by time period or donor category?"

User: "Show me grant applications from the past 6 months"
Assistant: [Uses analyzeData tool with naturalLanguageQuery: "Show me grant applications from the past 6 months"]
Result: Found 8 grant applications
Assistant: "I found 8 grant applications from the past 6 months. Of these, 3 have been awarded, 2 are under review, 2 were rejected, and 1 was withdrawn. The total amount requested across these applications is $450,000."

Always collect all necessary tool results before providing your final response to the user.`;
  }

  static async detectIntent(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<IntentDetectionResult> {
    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'intent_detection',
          userMessage,
          conversationHistory: this.prepareConversationHistory(conversationHistory),
          systemPrompt: this.buildSystemPrompt(true)
        })
      });

      if (!response.ok) {
        throw new Error(`Intent detection failed: ${response.status}`);
      }

      const data = await response.json();

      return this.parseIntentResponse(data);
    } catch (error) {
      console.error('Intent detection error:', error);
      return this.fallbackIntentDetection(userMessage);
    }
  }

  static async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    detectedIntent?: IntentCategory
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(false);
      const contextPrompt = detectedIntent
        ? `\n\nDETECTED USER INTENT: ${detectedIntent}\nProvide a response specifically addressing this type of request.`
        : '';

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mode: 'generate_response',
          userMessage,
          conversationHistory: this.prepareConversationHistory(conversationHistory),
          systemPrompt: systemPrompt + contextPrompt,
          intent: detectedIntent
        })
      });

      if (!response.ok) {
        throw new Error(`Response generation failed: ${response.status}`);
      }

      const data = await response.json();

      return data.message || data.content || 'I apologize, but I encountered an issue generating a response. Please try again.';
    } catch (error) {
      console.error('Response generation error:', error);
      return this.fallbackResponse(userMessage, detectedIntent);
    }
  }

  static async processMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ message: string; intent: IntentDetectionResult }> {
    const intent = await this.detectIntent(userMessage, conversationHistory);

    let message: string;

    if (intent.clarification_needed && intent.clarifying_questions && intent.clarifying_questions.length > 0) {
      message = `I'd like to help you better. Could you clarify:\n\n${intent.clarifying_questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    } else {
      message = await this.generateResponse(userMessage, conversationHistory, intent.intent);
    }

    return { message, intent };
  }

  private static prepareConversationHistory(messages: ChatMessage[]): Array<{role: string; content: string}> {
    const recentMessages = messages.slice(-this.MAX_CONTEXT_MESSAGES);

    return recentMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.message
    }));
  }

  private static parseIntentResponse(data: any): IntentDetectionResult {
    try {
      let intentData = data;

      if (typeof data.content === 'string') {
        try {
          intentData = JSON.parse(data.content);
        } catch {
          intentData = data;
        }
      }

      const intent = intentData.intent as IntentCategory;
      const confidence = Math.min(Math.max(intentData.confidence || 0.5, 0), 1);

      return {
        intent: this.isValidIntent(intent) ? intent : 'general_question',
        confidence,
        clarification_needed: confidence < this.INTENT_CONFIDENCE_THRESHOLD || intentData.clarification_needed || false,
        clarifying_questions: intentData.clarifying_questions || [],
        reasoning: intentData.reasoning
      };
    } catch (error) {
      console.error('Error parsing intent response:', error);
      return {
        intent: 'general_question',
        confidence: 0.5,
        clarification_needed: false
      };
    }
  }

  private static isValidIntent(intent: string): intent is IntentCategory {
    return ['employee_onboarding', 'document_search', 'data_analysis', 'general_question', 'system_navigation'].includes(intent);
  }

  private static fallbackIntentDetection(message: string): IntentDetectionResult {
    const lowerMessage = message.toLowerCase();

    const keywords: Record<IntentCategory, string[]> = {
      employee_onboarding: ['onboard', 'new user', 'setup', 'account', 'invite', 'register', 'sign up'],
      document_search: ['document', 'file', 'upload', 'download', 'pdf', 'search document', 'find file'],
      data_analysis: ['sales', 'analytics', 'report', 'data', 'forecast', 'trend', 'chart', 'metric'],
      general_question: ['what is', 'how does', 'why', 'explain', 'help', 'info', 'about'],
      system_navigation: ['where', 'how to find', 'navigate', 'go to', 'page', 'menu', 'dashboard']
    };

    let maxMatches = 0;
    let detectedIntent: IntentCategory = 'general_question';

    for (const [intent, words] of Object.entries(keywords)) {
      const matches = words.filter(word => lowerMessage.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedIntent = intent as IntentCategory;
      }
    }

    return {
      intent: detectedIntent,
      confidence: maxMatches > 0 ? 0.6 : 0.3,
      clarification_needed: maxMatches === 0,
      clarifying_questions: maxMatches === 0
        ? ['What would you like help with today?', 'Are you looking for help with documents, analytics, user management, or something else?']
        : []
    };
  }

  private static fallbackResponse(_message: string, intent?: IntentCategory): string {
    if (!intent) {
      return "I'm here to help! Could you tell me more about what you're looking for?";
    }

    const responses: Record<IntentCategory, string> = {
      employee_onboarding: "I can help you with user onboarding and account setup. You can invite new users from the User Management page. Would you like detailed steps?",
      document_search: "For document management, head to the Documents page where you can upload, organize, and search for files. What specific document task do you need help with?",
      data_analysis: "The Sales Analytics dashboard provides insights into your business data. You can upload data files and view trends, forecasts, and key metrics. What analysis are you interested in?",
      general_question: "I'm here to answer any questions about the platform. What would you like to know more about?",
      system_navigation: "I can help you navigate the platform. The main sections are accessible from the sidebar. Where would you like to go?"
    };

    return responses[intent];
  }

  static getIntentDescription(intent: IntentCategory): string {
    return INTENT_CATEGORIES[intent] || 'General assistance';
  }

  static getIntentColor(intent: IntentCategory): string {
    const colors: Record<IntentCategory, string> = {
      employee_onboarding: 'bg-blue-100 text-blue-800',
      document_search: 'bg-green-100 text-green-800',
      data_analysis: 'bg-purple-100 text-purple-800',
      general_question: 'bg-gray-100 text-gray-800',
      system_navigation: 'bg-orange-100 text-orange-800'
    };

    return colors[intent] || 'bg-gray-100 text-gray-800';
  }

  static getIntentLabel(intent: IntentCategory): string {
    const labels: Record<IntentCategory, string> = {
      employee_onboarding: 'Employee Onboarding',
      document_search: 'Document Search',
      data_analysis: 'Data Analysis',
      general_question: 'General Question',
      system_navigation: 'Navigation Help'
    };

    return labels[intent] || 'General';
  }
}
