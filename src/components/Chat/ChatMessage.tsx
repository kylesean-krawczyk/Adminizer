import { format } from 'date-fns';
import { Bot, User, Target, Wrench } from 'lucide-react';
import { ClaudeService } from '../../services/claudeService';
import type { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const hasIntent = message.intent && message.role === 'user';
  const showDebugInfo = import.meta.env.DEV;

  const toolsUsed = message.metadata?.tools_used as string[] | undefined;
  const hasToolsUsed = toolsUsed && toolsUsed.length > 0;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : 'bg-gray-500'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {hasIntent && showDebugInfo && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              ClaudeService.getIntentColor(message.intent!)
            }`}>
              <Target className="w-3 h-3" />
              {ClaudeService.getIntentLabel(message.intent!)}
            </span>
            {message.intent_confidence !== null && message.intent_confidence !== undefined && (
              <span className="text-xs text-gray-500">
                {Math.round(message.intent_confidence * 100)}% confidence
              </span>
            )}
          </div>
        )}

        {hasToolsUsed && !isUser && (
          <div className="mb-1.5 flex items-center gap-1 flex-wrap">
            {toolsUsed.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800"
              >
                <Wrench className="w-3 h-3" />
                {tool}
              </span>
            ))}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.message}
          </p>
        </div>

        <span className="text-xs text-gray-400 mt-1 px-1">
          {format(new Date(message.created_at), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
