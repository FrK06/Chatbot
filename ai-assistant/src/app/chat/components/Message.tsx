"use client";

// src/app/chat/components/Message.tsx
import React from 'react';
import { User, MessageSquare } from 'lucide-react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function Message({ role, content, timestamp }: MessageProps) {
  // Format message content with proper line breaks and formatting
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} message-animation`}>
      <div
        className={`max-w-3xl rounded-lg p-4 shadow ${
          role === "user"
            ? "bg-indigo-600 text-white"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            role === "user" 
              ? "bg-indigo-500" 
              : "bg-gray-200 dark:bg-gray-700"
          }`}>
            {role === "user" 
              ? <User size={14} /> 
              : <MessageSquare size={14} />
            }
          </div>
          <div className="text-sm font-semibold">
            {role === "user" ? "You" : "AI Assistant"}
          </div>
        </div>
        
        <div className="whitespace-pre-wrap message-content">
          {formatMessageContent(content)}
        </div>
        
        <div className="text-xs opacity-70 mt-2 text-right">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}