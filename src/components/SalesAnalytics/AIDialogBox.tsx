import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader, Brain, Minimize2, Maximize2 } from 'lucide-react';
import { AIService } from '../../Services/aiService';
import { CustomerData } from '../../types';

interface AIDialogBoxProps {
  customerData: CustomerData[];
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  analysis?: {
    insights: string[];
    recommendations: string[];
  };
}

export const AIDialogBox: React.FC<AIDialogBoxProps> = ({ customerData, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI sales analytics assistant powered by Anthropic Claude. I can help you analyze your customer data and answer questions like:\n\n• 'What patterns do you see in our top customers?'\n• 'How do seasonal trends affect our sales?'\n• 'Compare our retention with industry benchmarks'\n• 'Suggest optimal campaign timing based on our data'",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await AIService.analyzeWithAI({
        query: inputValue,
        customerData: customerData
      });
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        analysis: {
          insights: aiResponse.insights,
          recommendations: aiResponse.recommendations
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I apologize, but I encountered an error while analyzing your data. This might be because the AI service isn't configured yet. Please check your API key configuration or try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Analyze our customer retention patterns",
    "What are our peak sales months?",
    "Identify our most valuable customer segments",
    "Suggest campaign timing strategies"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">
              br<span className="font-bold text-purple-600">A</span><span className="font-bold text-purple-600">I</span>n
            </h3>
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
              Claude
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px]">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.type === 'ai' && <Bot className="w-4 h-4 mt-0.5 text-purple-600" />}
                      {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Analysis Results */}
                        {message.analysis && (
                          <div className="mt-3 space-y-2">
                            {message.analysis.insights.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-purple-200">
                                <h4 className="text-xs font-semibold text-purple-800 mb-2">Key Insights</h4>
                                <ul className="text-xs text-gray-700 space-y-1">
                                  {message.analysis.insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-purple-600 mr-2">•</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {message.analysis.recommendations.length > 0 && (
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <h4 className="text-xs font-semibold text-green-800 mb-2">Recommendations</h4>
                                <ul className="text-xs text-green-700 space-y-1">
                                  {message.analysis.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex items-start">
                                      <span className="text-green-600 mr-2">→</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <Loader className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600">Claude is analyzing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputValue(question)}
                      className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your customer data..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};