// src/app/chat/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define types for our data structures
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

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/chat");
    }
  }, [status, router]);

  // Get CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/auth/csrf");
        const data = await response.json();
        setCsrfToken(data.token);
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };

    if (status === "authenticated") {
      fetchCsrfToken();
    }
  }, [status]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        } else {
          console.error("Failed to fetch conversations:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (status === "authenticated" && csrfToken) {
      fetchConversations();
    }
  }, [status, csrfToken]);

  // Create a new conversation
  const createConversation = async () => {
    if (!csrfToken) {
      console.error("CSRF token not available");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });

      if (response.ok) {
        const newConversation: Conversation = await response.json();
        setConversations([newConversation, ...conversations]);
        setCurrentConversation(newConversation);
        setMessages([]);
      } else {
        console.error("Failed to create conversation:", response.statusText);
        
        // If unauthorized, refresh the page to trigger authentication
        if (response.status === 401) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !currentConversation || !csrfToken) return;
    
    try {
      setIsLoading(true);
      
      // Add message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: inputMessage,
        createdAt: new Date().toISOString(),
      };
      
      setMessages([...messages, userMessage]);
      setInputMessage("");
      
      // Send to API
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          content: inputMessage,
        }),
      });
      
      if (response.ok) {
        // Process with LLM
        const llmResponse = await fetch("/api/llm/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({
            conversationId: currentConversation.id,
            query: inputMessage,
          }),
        });
        
        if (llmResponse.ok) {
          const result = await llmResponse.json();
          
          // Add AI response to UI
          const aiMessage: Message = {
            id: Date.now().toString() + "-ai",
            role: "assistant",
            content: result.response,
            createdAt: new Date().toISOString(),
          };
          
          setMessages((prevMessages) => [...prevMessages, aiMessage]);
        } else {
          console.error("LLM process failed:", llmResponse.statusText);
          
          // Handle unauthorized response
          if (llmResponse.status === 401) {
            router.refresh();
          }
        }
      } else {
        console.error("Failed to send message:", response.statusText);
        
        // Handle unauthorized response
        if (response.status === 401) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Select a conversation
  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    
    try {
      const response = await fetch(`/api/conversations/${conversation.id}/messages`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error("Failed to fetch messages:", response.statusText);
        
        // Handle unauthorized response
        if (response.status === 401) {
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (status === "unauthenticated") {
    // Will redirect to login
    return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <button
            onClick={createConversation}
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            New Conversation
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-80px)]">
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
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
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