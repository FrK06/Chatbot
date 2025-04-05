"use client";

// Modified: src/app/chat/ChatInterfaceDirect.tsx
import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";

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

export default function ChatInterfaceDirect({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Get CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/auth/csrf", {
          credentials: 'include' // Ensure cookies are sent and received
        });
        const data = await response.json();
        console.log("CSRF token received:", data.token ? data.token.substring(0, 10) + "..." : "none");
        setCsrfToken(data.token);
        setStatus("CSRF token obtained");
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
        setError("Failed to get security token. Please refresh the page.");
      }
    };

    fetchCsrfToken();
  }, []);

  // Check auth status - debugging helper
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const debugResponse = await fetch("/api/debug-session", {
          credentials: 'include',
        });
        
        const debugData = await debugResponse.json();
        console.log("Auth status:", debugData);
        
        if (!debugData.hasToken || !debugData.validToken) {
          setStatus("Authentication issue detected. You may need to log in again.");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    if (csrfToken) {
      checkAuthStatus();
    }
  }, [csrfToken]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!csrfToken) return;
      
      try {
        setIsLoading(true);
        setStatus("Fetching conversations...");
        
        // Use consistent headers and credentials for fetch
        const response = await fetch("/api/conversations", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Conversations loaded:", data.conversations?.length || 0);
          setConversations(data.conversations || []);
          setStatus("Conversations loaded");
        } else {
          let errorText = await response.text();
          console.error("Failed to fetch conversations:", response.status, errorText);
          
          if (response.status === 401) {
            setError("Authentication failed. Please go back to login page and try again.");
            setStatus("Authentication error");
          } else {
            setError(`Error ${response.status}: ${errorText}`);
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setError("Failed to load conversations. Please try again.");
        setStatus("Network error");
      } finally {
        setIsLoading(false);
      }
    };

    if (csrfToken) {
      fetchConversations();
    }
  }, [csrfToken]);

  // Create a new conversation
  const createConversation = async () => {
    if (!csrfToken) {
      setError("Security token not available. Please refresh the page.");
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
        console.log("New conversation created:", newConversation.id);
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        setMessages([]);
        setStatus("New conversation created");
      } else {
        const errorText = await response.text();
        console.error("Failed to create conversation:", response.status, errorText);
        
        if (response.status === 401) {
          setError("Your session has expired. Please return to login page.");
        } else {
          setError(`Failed to create conversation: ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("An unexpected error occurred. Please try again.");
      setStatus("Error creating conversation");
    } finally {
      setIsLoading(false);
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
      setStatus("Sending message...");
      
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
      
      // Debug the CSRF token and cookie
      console.log("Message submission - CSRF token:", csrfToken);
      
      // Send to API with consistent headers and credentials
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
      
      console.log("Message submission response status:", response.status);
      
      if (response.ok) {
        // Process with LLM
        setStatus("Processing with AI...");
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
          setStatus("AI response received");
          
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
          setStatus("AI processing error");
        }
      } else {
        const errorText = await response.text();
        console.error("Failed to send message:", response.status, errorText);
        setError(`Failed to send message: ${errorText}`);
        setStatus("Message sending error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("An unexpected error occurred. Please try again.");
      setStatus("Error");
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
        setStatus("Messages loaded");
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch messages:", response.status, errorText);
        setError(`Failed to load messages: ${errorText}`);
        setStatus("Message loading error");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("An unexpected error occurred. Please try again.");
      setStatus("Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Link 
              href="/dashboard" 
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Dashboard
            </Link>
          </div>
          <button
            onClick={createConversation}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            New Conversation
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`p-3 cursor-pointer hover:bg-gray-100 ${
                currentConversation?.id === conv.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="font-medium truncate">{conv.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(conv.updatedAt).toLocaleString()}
              </div>
            </div>
          ))}
          {conversations.length === 0 && !isLoading && (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Create one to start chatting!
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{user.email}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: {status}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError("")}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}
      
        {currentConversation ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-3xl ${
                    message.role === "user" ? "ml-auto" : "mr-auto"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-indigo-100 text-right"
                        : "bg-white border"
                    }`}
                  >
                    <div className="text-sm font-bold mb-1">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="max-w-3xl mr-auto">
                  <div className="rounded-lg p-3 bg-white border">
                    <div className="text-sm font-bold mb-1">AI Assistant</div>
                    <div>Thinking...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 border rounded p-2"
                  placeholder="Type your message..."
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation or create a new one to start chatting
          </div>
        )}
      </div>
    </div>
  );
}