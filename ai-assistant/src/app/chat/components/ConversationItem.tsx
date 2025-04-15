"use client";

// src/app/chat/components/ConversationItem.tsx
import React from 'react';
import { MessageSquare, Calendar } from 'lucide-react';

interface ConversationItemProps {
  id: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({ 
  id, 
  title, 
  updatedAt, 
  isActive, 
  onClick 
}: ConversationItemProps) {
  // Format the date - show today/yesterday or the actual date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActive ? "bg-gray-100 dark:bg-gray-700" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isActive 
            ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300" 
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}>
          <MessageSquare size={16} />
        </div>
        <div className="overflow-hidden">
          <div className="font-medium truncate">{title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <Calendar size={12} />
            <span>{formatDate(updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}