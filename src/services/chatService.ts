import { supabase } from '../lib/supabase';
import { ClaudeService } from './claudeService';
import { ToolUseCoordinator } from './toolUseCoordinator';
import type { ChatMessage, ChatSession, ChatMessageCreate, ChatSessionCreate } from '../types/chat';

export class ChatService {
  static async createSession(data: ChatSessionCreate): Promise<ChatSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: data.title || 'New Chat',
          organization_id: data.organization_id
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }

  static async getOrCreateActiveSession(organizationId?: string): Promise<ChatSession | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: sessions, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (sessions && sessions.length > 0) {
        return sessions[0];
      }

      return await this.createSession({ organization_id: organizationId });
    } catch (error) {
      console.error('Error getting or creating session:', error);
      return null;
    }
  }

  static async getSessions(): Promise<ChatSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }
  }

  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  static async addMessage(message: ChatMessageCreate): Promise<ChatMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: message.session_id,
          user_id: user.id,
          message: message.message,
          role: message.role,
          intent: message.intent || null,
          intent_confidence: message.intent_confidence || null,
          metadata: message.metadata || {}
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  static async processUserMessage(
    userMessage: string,
    sessionId: string,
    conversationHistory: ChatMessage[],
    useTools: boolean = true
  ): Promise<{ userMsg: ChatMessage | null; assistantMsg: ChatMessage | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (useTools) {
        return await this.processToolEnabledMessage(userMessage, sessionId, conversationHistory, user.id);
      }

      const { message: aiResponse, intent: detectedIntent } = await ClaudeService.processMessage(
        userMessage,
        conversationHistory
      );

      const userMsg = await this.addMessage({
        session_id: sessionId,
        message: userMessage,
        role: 'user',
        intent: detectedIntent.intent,
        intent_confidence: detectedIntent.confidence,
        metadata: {
          clarification_questions: detectedIntent.clarifying_questions,
          intent_raw_response: detectedIntent.reasoning
        }
      });

      const assistantMsg = await this.addMessage({
        session_id: sessionId,
        message: aiResponse,
        role: 'assistant',
        metadata: {
          responding_to_intent: detectedIntent.intent,
          clarification_provided: detectedIntent.clarification_needed
        }
      });

      return { userMsg, assistantMsg };
    } catch (error) {
      console.error('Error processing user message:', error);
      return { userMsg: null, assistantMsg: null };
    }
  }

  static async processToolEnabledMessage(
    userMessage: string,
    sessionId: string,
    conversationHistory: ChatMessage[],
    userId: string
  ): Promise<{ userMsg: ChatMessage | null; assistantMsg: ChatMessage | null }> {
    try {
      const availableTools = await ToolUseCoordinator.fetchAvailableTools(userId);
      const systemPrompt = ClaudeService.buildToolEnabledSystemPrompt(availableTools.length);

      const preparedHistory = conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.message
      }));

      const result = await ToolUseCoordinator.processToolEnabledConversation(
        userMessage,
        preparedHistory,
        systemPrompt,
        userId,
        sessionId
      );

      const userMsg = await this.addMessage({
        session_id: sessionId,
        message: userMessage,
        role: 'user',
        metadata: {
          tool_enabled: true
        }
      });

      const assistantMsg = await this.addMessage({
        session_id: sessionId,
        message: result.response,
        role: 'assistant',
        metadata: {
          tool_enabled: true,
          tools_used: result.toolsUsed,
          requires_confirmation: result.requiresConfirmation,
          pending_confirmations: result.pendingConfirmations
        }
      });

      return { userMsg, assistantMsg };
    } catch (error) {
      console.error('Error processing tool-enabled message:', error);
      return { userMsg: null, assistantMsg: null };
    }
  }

  static generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm your AI assistant. I'm here to help you navigate the platform and answer any questions you might have. What would you like to know?";
    }

    if (lowerMessage.includes('help')) {
      return "I can help you with:\n\n• Document management and uploads\n• Understanding your dashboard\n• Navigating different departments\n• User management and settings\n• Sales analytics and reports\n\nWhat would you like assistance with?";
    }

    if (lowerMessage.includes('document')) {
      return "For document management, you can upload files from the Documents page, organize them by category, and set expiry dates. Would you like me to guide you through the upload process?";
    }

    if (lowerMessage.includes('sales') || lowerMessage.includes('analytics')) {
      return "The Sales Analytics dashboard provides AI-powered insights into your sales performance, customer retention, and forecasting. You can upload your sales data and get instant analysis. Would you like to know more about any specific feature?";
    }

    return `I understand you said: "${userMessage}"\n\nI'm a mock assistant right now, but in the full version, I'll provide intelligent responses to help you with your tasks. Is there anything specific you'd like to know about the platform?`;
  }
}
