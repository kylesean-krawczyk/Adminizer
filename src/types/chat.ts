export type IntentCategory =
  | 'employee_onboarding'
  | 'document_search'
  | 'data_analysis'
  | 'general_question'
  | 'system_navigation';

export interface IntentDetectionResult {
  intent: IntentCategory;
  confidence: number;
  clarification_needed: boolean;
  clarifying_questions?: string[];
  reasoning?: string;
}

export interface ChatMessageMetadata {
  intent_raw_response?: string;
  clarification_questions?: string[];
  context_used?: string[];
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
  intent?: IntentCategory | null;
  intent_confidence?: number | null;
  metadata?: ChatMessageMetadata;
}

export interface ChatSession {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageCreate {
  session_id: string;
  message: string;
  role: 'user' | 'assistant';
  intent?: IntentCategory | null;
  intent_confidence?: number | null;
  metadata?: ChatMessageMetadata;
}

export interface ConversationContext {
  recentMessages: ChatMessage[];
  currentIntent?: IntentCategory;
  userProfile?: {
    commonIntents: IntentCategory[];
    preferredTopics: string[];
  };
}

export interface ChatSessionCreate {
  title?: string;
  organization_id?: string;
}
