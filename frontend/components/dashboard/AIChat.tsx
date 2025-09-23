'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  onContentGenerated: (content: string, conversation: Message[]) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ onContentGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant. I'll help you create engaging LinkedIn posts. What would you like to post about today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Dummy AI responses for now
  const getDummyResponse = (userInput: string): string => {
    const responses = [
      `Great topic! Here's a LinkedIn post about "${userInput}":\n\n🚀 Just had an incredible experience with ${userInput}! \n\nKey takeaways:\n• Innovation drives success\n• Collaboration is key\n• Never stop learning\n\nWhat's your experience with this? Let me know in the comments! \n\n#LinkedIn #Professional #Growth #${userInput.replace(/\s+/g, '')}`,
      
      `Excellent idea! Here's a professional post:\n\n💡 Reflecting on ${userInput} and its impact on my career journey.\n\nThree insights I've gained:\n1. Continuous learning is essential\n2. Networking opens unexpected doors  \n3. Sharing knowledge benefits everyone\n\nHow has ${userInput} influenced your professional growth? \n\n#CareerGrowth #ProfessionalDevelopment #Learning`,
      
      `Perfect topic for engagement! Here's your post:\n\n🎯 Why ${userInput} matters more than ever:\n\n✅ Drives innovation\n✅ Creates opportunities\n✅ Builds meaningful connections\n\nI'd love to hear your thoughts on this. What's been your biggest learning about ${userInput}?\n\n#ThoughtLeadership #Innovation #Business`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getDummyResponse(input.trim()),
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage, aiResponse];
      setMessages(updatedMessages);
      setIsLoading(false);

      // Send the generated content to parent component
      onContentGenerated(aiResponse.content, updatedMessages);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {isClient ? message.timestamp.toLocaleTimeString() : ''}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your post idea..."
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 bg-black hover:bg-gray-800 text-white text-sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
