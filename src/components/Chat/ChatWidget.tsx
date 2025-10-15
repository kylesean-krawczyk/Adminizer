import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, Minimize2, Shield, Key } from 'lucide-react';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import { ChatService } from '../../services/chatService';
import { SuggestionGenerationService } from '../../services/suggestionGenerationService';
import { usePermissions } from '../../hooks/usePermissions';
import { usePageContext } from '../../contexts/PageContextContext';
import ToolAccessRequestModal from '../Permissions/ToolAccessRequestModal';
import type { ChatMessage, ChatSession } from '../../types/chat';
import type { AISuggestion } from '../../types/contextAware';
import { useUserManagement } from '../../hooks';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const { organization } = useUserManagement();
  const { permissionLevel, availableTools } = usePermissions();
  const { currentContext } = usePageContext();

  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeSession();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentSession) {
      loadMessages();
    }
  }, [currentSession]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!currentContext || !isOpen) return;

      const activeSuggestions = await SuggestionGenerationService.getActiveSuggestions(
        currentContext.pageType
      );

      setSuggestions(activeSuggestions);
    };

    loadSuggestions();
  }, [currentContext, isOpen]);

  const initializeSession = async () => {
    const session = await ChatService.getOrCreateActiveSession(organization?.id);
    if (session) {
      setCurrentSession(session);
    }
  };

  const loadMessages = async () => {
    if (!currentSession) return;
    const sessionMessages = await ChatService.getSessionMessages(currentSession.id);
    setMessages(sessionMessages);
  };

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!currentSession || isLoading) return;

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: currentSession.id,
      user_id: '',
      message: messageText,
      role: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { userMsg, assistantMsg } = await ChatService.processUserMessage(
        messageText,
        currentSession.id,
        messages
      );

      if (userMsg) {
        setMessages(prev => prev.map(msg =>
          msg.id === userMessage.id ? userMsg : msg
        ));
      }

      if (assistantMsg) {
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = await ChatService.addMessage({
        session_id: currentSession.id,
        message: 'I apologize, but I encountered an error processing your message. Please try again.',
        role: 'assistant'
      });

      if (errorMessage) {
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, isLoading, messages]);

  const handleSuggestionClick = useCallback(async (suggestion: AISuggestion) => {
    await SuggestionGenerationService.markSuggestionClicked(suggestion.id);

    if (suggestion.suggestion_query) {
      handleSendMessage(suggestion.suggestion_query);
    }

    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [handleSendMessage]);

  const handleSuggestionDismiss = useCallback(async (suggestionId: string) => {
    await SuggestionGenerationService.markSuggestionDismissed(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 z-50 group"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            AI
          </span>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-800 text-white text-sm rounded-lg py-2 px-3 whitespace-nowrap">
              Chat with AI Assistant
            </div>
          </div>
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
          }`}
          style={{
            maxHeight: 'calc(100vh - 3rem)',
            maxWidth: 'calc(100vw - 3rem)'
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      permissionLevel === 'master_admin' ? 'bg-purple-500 bg-opacity-30' :
                      permissionLevel === 'admin' ? 'bg-blue-400 bg-opacity-30' :
                      permissionLevel === 'manager' ? 'bg-green-400 bg-opacity-30' :
                      permissionLevel === 'employee' ? 'bg-gray-400 bg-opacity-30' :
                      'bg-slate-400 bg-opacity-30'
                    }`} title={`Permission Level: ${permissionLevel}`}>
                      {permissionLevel.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-100 truncate">
                  {availableTools.length} tool{availableTools.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMinimize}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Maximize chat' : 'Minimize chat'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <ChatMessageList messages={messages} isLoading={isLoading} />
              <div className="flex-shrink-0 border-t border-gray-200">
                <SuggestionChips
                  suggestions={suggestions}
                  onSuggestionClick={handleSuggestionClick}
                  onDismiss={handleSuggestionDismiss}
                />
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={isLoading || !currentSession}
                  placeholder="Ask me anything..."
                />
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    <span>Request Tool Access</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <ToolAccessRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => setShowRequestModal(false)}
      />
    </>
  );
}
