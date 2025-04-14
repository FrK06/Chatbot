// src/app/chat/ChatWithFileUpload.tsx

"use client";
import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Send, Plus, Settings, LogOut, Menu, X, AlertCircle, MessageSquare, Paperclip, File } from "lucide-react";
import Message from "./components/Message";
import ConversationItem from "./components/ConversationItem";
import { ThemeToggle } from "../components/theme-toggle";
import { useToast } from "../providers/toast-provider";
import { FileUploader } from "../components/file-uploader";

interface User {
  id: string;
  email: string;
  name?: string;
  tier: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function ChatWithFileUpload({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFileUploader, setShowFileUploader] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: 'include'
        });
        const data = await response.json();
        setCsrfToken(data.token);
        setStatus("Ready");
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
        setError("Failed to get security token. Please refresh the page.");
        showToast("Failed to get security token. Please refresh the page.", "error");
      }
    };

    fetchCsrfToken();
  }, [showToast]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!csrfToken) return;
      
      try {
        setIsLoading(true);
        setStatus("Fetching conversations...");
        
        const response = await fetch("/api/conversations", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          setStatus("Ready");
        } else {
          let errorText = await response.text();
          console.error("Failed to fetch conversations:", response.status, errorText);
          
          if (response.status === 401) {
            setError("Authentication failed. Please go back to login page and try again.");
            showToast("Authentication failed. Please login again.", "error");
          } else {
            setError(`Error ${response.status}: ${errorText}`);
            showToast("Failed to load conversations.", "error");
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations. Please try again.");
        showToast("Network error. Please check your connection.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (csrfToken) {
      fetchConversations();
    }
  }, [csrfToken, showToast]);

  // Create a new conversation
  const createConversation = async () => {
    if (!csrfToken) {
      setError("Security token not available. Please refresh the page.");
      showToast("Security token not available. Please refresh the page.", "error");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      setStatus("Creating new conversation...");
      
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      if (response.ok) {
        const newConversation: Conversation = await response.json();
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        setMessages([]);
        setStatus("Ready");
        showToast("New conversation created", "success");
        
        // Focus the message input field
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      } else {
        const errorText = await response.text();
        console.error("Failed to create conversation:", response.status, errorText);
        
        if (response.status === 401) {
          setError("Your session has expired. Please return to login page.");
          showToast("Your session has expired. Please login again.", "error");
        } else {
          setError(`Failed to create conversation: ${errorText}`);
          showToast("Failed to create conversation", "error");
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("An unexpected error occurred. Please try again.");
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setShowFileUploader(false);
    
    // Append file info to the message input
    if (file) {
      const fileInfo = `[File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)]`;
      setInputMessage((prev) => prev ? `${prev}\n${fileInfo}` : fileInfo);
      showToast(`File "${file.name}" added to message`, "success");
      
      // Focus the message input field
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  };

  // Send a message
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentConversation || !csrfToken) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      // Add message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: inputMessage,
        createdAt: new Date().toISOString(),
      };
      
      setMessages([...messages, userMessage]);
      const messageToBeSent = inputMessage;
      setInputMessage("");
      
      // Clear uploaded file after sending
      setUploadedFile(null);
      
      // Send to API
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          content: messageToBeSent,
        }),
      });
      
      if (response.ok) {
        // Process with LLM
        setStatus("AI is thinking...");
        const llmResponse = await fetch("/api/llm/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            conversationId: currentConversation.id,
            query: messageToBeSent,
          }),
        });
        
        if (llmResponse.ok) {
          const result = await llmResponse.json();
          setStatus("Ready");
          
          // Add AI response to UI
          const aiMessage: Message = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: result.response,
            createdAt: new Date().toISOString(),
          };
          
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        } else {
          const errorText = await llmResponse.text();
          console.error("LLM process failed:", llmResponse.status, errorText);
          setError(`Failed to get AI response: ${errorText}`);
          setStatus("Error");
          showToast("Failed to get AI response", "error");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to send message:", response.status, errorText);
        setError(`Failed to send message: ${errorText}`);
        setStatus("Error");
        showToast("Failed to send message", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("An unexpected error occurred. Please try again.");
      setStatus("Error");
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Select a conversation
  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setError("");
    setStatus("Loading messages...");
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${conversation.id}/messages`, {
        credentials: 'include',
        headers: {
          'x-csrf-token': csrfToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setStatus("Ready");
        
        // On mobile, close the sidebar after selecting a conversation
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        }
        
        // Focus the message input
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch messages:", response.status, errorText);
        setError(`Failed to load messages: ${errorText}`);
        setStatus("Error");
        showToast("Failed to load messages", "error");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("An unexpected error occurred. Please try again.");
      setStatus("Error");
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-resize textarea
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputMessage(textarea.value);
    
    // Reset height to auto to properly calculate the new height
    textarea.style.height = 'auto';
    
    // Set the height based on scrollHeight (with a max-height)
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  };
  
  // Submit with Enter (but allow Shift+Enter for new lines)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim()) {
        sendMessage(e as unknown as FormEvent);
      }
    }
  };

  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
    
    // Remove file info from message input
    const fileInfoRegex = /\[File: .+ \(\d+\.\d+ MB\)\]\n?/g;
    setInputMessage(inputMessage.replace(fileInfoRegex, ''));
    
    showToast("File removed", "info");
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile sidebar toggle */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed bottom-4 left-4 z-20 bg-indigo-600 text-white p-3 rounded-full shadow-lg"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transform transition-transform md:translate-x-0 fixed md:static inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <ThemeToggle />
          </div>
          <button
            onClick={createConversation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={18} />
            <span>New Conversation</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-grow custom-scrollbar">
          {conversations.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                id={conv.id}
                title={conv.title}
                updatedAt={conv.updatedAt}
                isActive={currentConversation?.id === conv.id}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
          {isLoading && conversations.length === 0 && (
            <div className="p-4 space-y-3">
              <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-semibold">
                {user?.name?.[0] || user?.email?.[0] || "U"}
              </div>
              <div className="truncate">
                <div className="font-medium text-sm truncate">
                  {user?.name || user?.email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.tier === "PRO" ? "Pro Plan" : "Free Plan"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/dashboard" title="Dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings size={18} />
              </a>
              <a href="/api/logout" title="Logout" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <LogOut size={18} />
              </a>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
            {status || "Ready"}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Chat header */}
        {currentConversation && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <h3 className="font-medium truncate">{currentConversation.title}</h3>
            <div className="flex gap-2">
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 m-4 rounded relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button 
              className="text-red-500 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100"
              onClick={() => setError("")}
              title="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {/* File upload overlay */}
        {showFileUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 m-4 max-w-xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Upload File</h3>
                <button 
                  onClick={() => setShowFileUploader(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <FileUploader
                onFileUpload={handleFileUpload}
                allowedTypes={['pdf', 'txt', 'doc', 'docx', 'csv', 'json']}
                maxSizeMB={10}
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowFileUploader(false)}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      
        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 my-16">
                  <div className="mb-2">👋 Start a new conversation</div>
                  <div className="text-sm">Type a message below to begin chatting with the AI Assistant</div>
                </div>
              ) : (
                messages.map((message) => (
                  <Message
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.createdAt}
                  />
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl rounded-lg p-4 shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <MessageSquare size={14} />
                      </div>
                      <div className="text-sm font-semibold">
                        AI Assistant
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="loading-dot">●</span>
                      <span className="loading-dot">●</span>
                      <span className="loading-dot">●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} /> {/* Auto-scroll anchor */}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {uploadedFile && (
                <div className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                    <File size={16} />
                    <span className="truncate">{uploadedFile.name}</span>
                    <span className="text-xs">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button 
                    onClick={removeUploadedFile}
                    className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <form onSubmit={sendMessage} className="flex gap-2 items-end">
                <div className="relative flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={inputMessage}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="w-full border rounded-lg p-3 pr-12 min-h-[44px] max-h-[150px] resize-none bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600"
                    placeholder="Type your message..."
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                    {isLoading ? 'Processing...' : 'Press Enter to send'}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowFileUploader(true)}
                  disabled={isLoading}
                  title="Attach file"
                  className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Paperclip size={20} />
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4">
            <div className="mb-4 text-6xl">💬</div>
            <h3 className="text-xl font-semibold mb-2">Welcome to AI Assistant</h3>
            <p className="text-center max-w-md mb-6">
              Select a conversation from the sidebar or create a new one to start chatting
            </p>
            <button
              onClick={createConversation}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-full disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={20} />
              <span>New Conversation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}