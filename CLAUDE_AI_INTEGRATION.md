# Claude AI Chat Integration

This document describes the Claude AI integration in the chat interface with intent detection and conversation history.

## Overview

The chat assistant now uses Claude AI to:
1. Detect user intent from messages
2. Categorize requests into specific types
3. Provide contextual, intelligent responses
4. Store conversation history for context awareness

## Intent Categories

The system categorizes user messages into five intent types:

1. **Employee Onboarding** - Questions about getting started, user setup, account creation
2. **Document Search** - Requests to find, view, upload, or manage documents
3. **Data Analysis** - Questions about sales data, analytics, reports, and insights
4. **General Question** - General inquiries about features and capabilities
5. **System Navigation** - Help with navigating the UI and finding pages

## How It Works

### User Sends Message
1. User types a message in the chat widget
2. Message is sent to `ChatService.processUserMessage()`
3. The service calls `ClaudeService.processMessage()` with conversation history

### Intent Detection
1. Claude API analyzes the message using a specialized system prompt
2. Returns intent category, confidence score, and reasoning
3. If confidence is low, Claude asks clarifying questions
4. Intent is stored in database with the user message

### Response Generation
1. Claude generates a response using the detected intent as context
2. Response is tailored to the specific intent category
3. Previous conversation messages provide context (last 10 messages)
4. Response is stored in database as assistant message

### Display
- In development mode, intent badges show above user messages
- Confidence scores display next to intent labels
- All messages show in chronological order with timestamps

## Database Schema

### chat_messages table (enhanced)
- `intent` - The detected intent category (nullable)
- `intent_confidence` - Confidence score 0.0-1.0 (nullable)
- `metadata` - JSONB field storing clarification questions and context

## API Flow

```
User Message
    ↓
ChatWidget.handleSendMessage()
    ↓
ChatService.processUserMessage()
    ↓
ClaudeService.processMessage()
    ↓
    ├─→ detectIntent() → Netlify Function (mode: intent_detection)
    │                         ↓
    │                    Claude API
    │                         ↓
    │                    Parse Intent Result
    │
    └─→ generateResponse() → Netlify Function (mode: generate_response)
                                  ↓
                             Claude API
                                  ↓
                             Return Response
    ↓
Save to Database (user + assistant messages)
    ↓
Display in Chat UI
```

## Configuration

### Environment Variables Required
- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key for Claude access

### Netlify Function
The `/functions/anthropic-proxy.ts` handles three modes:
1. `intent_detection` - Analyzes user intent
2. `generate_response` - Generates contextual responses
3. `analytics` - Original sales analytics mode (legacy)

## Fallback Behavior

If Claude API is unavailable:
1. Keyword-based intent detection activates
2. Template-based responses are used
3. User experience degrades gracefully

## Testing

In development mode (`npm run dev`):
- Intent badges display above user messages
- Confidence scores show for debugging
- Full conversation history is visible

## Future Enhancements

Potential improvements:
- Multi-turn clarification dialogs
- Intent-specific action buttons (e.g., "Take me to Documents")
- Conversation summarization for long chats
- User preference learning
- Intent analytics dashboard
- Voice input support
- Multi-language support

## Files Modified

### New Files
- `src/services/claudeService.ts` - Core Claude integration logic
- `supabase/migrations/20251010180000_add_intent_tracking.sql` - Database schema

### Modified Files
- `src/types/chat.ts` - Added intent types and interfaces
- `src/services/chatService.ts` - Integration with Claude service
- `src/components/Chat/ChatWidget.tsx` - Updated message handling
- `src/components/Chat/ChatMessage.tsx` - Added intent badge display
- `netlify functions/anthropic-proxy.ts` - Added intent detection modes

## Usage Example

User: "How do I upload a document?"

1. Intent Detection:
   - Category: `document_search`
   - Confidence: 0.95
   - Clarification: Not needed

2. Response Generation:
   - Context: Document search intent + conversation history
   - Response: Step-by-step guide to document upload
   - Metadata: Stores intent and confidence

3. Display:
   - User message shows "Document Search" badge (dev mode)
   - Assistant response appears with guidance
   - Both stored in database for future context
