"use client";
import { useState, useEffect, useRef } from "react";
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { formatPrice } from "@/lib/currency";

interface ChatMessage {
  id: number;
  content: string;
  messageType: string;
  senderType: 'customer' | 'admin' | 'ai';
  senderName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatSession {
  id: number;
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export default function AIChatBoard() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      scrollToBottom();
    }
  }, [selectedSession]);

  const fetchChatSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        if (data.sessions?.length > 0 && !selectedSession) {
          setSelectedSession(data.sessions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    try {
      setSending(true);
      
      // Add admin message to UI immediately
      const adminMessage: ChatMessage = {
        id: Date.now(),
        content: newMessage,
        messageType: 'text',
        senderType: 'admin',
        senderName: 'Admin',
        isRead: true,
        createdAt: new Date().toISOString()
      };

      setSelectedSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, adminMessage]
      } : null);

      // Send to API
      const response = await fetch('/api/chat/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSession.sessionId,
          message: newMessage,
          senderType: 'admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to UI
        if (data.aiResponse) {
          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            content: data.aiResponse,
            messageType: 'text',
            senderType: 'ai',
            senderName: 'AI Assistant',
            isRead: false,
            createdAt: new Date().toISOString()
          };

          setSelectedSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, aiMessage]
          } : null);
        }
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      case 'archived': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
          AI Chat Board
        </h1>
        <p className="text-gray-600 mt-2">Manage customer conversations and AI responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat Sessions List */}
        <div className="bg-white rounded-lg shadow-md border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
            <p className="text-sm text-gray-600">{sessions.length} conversations</p>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-300px)]">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No chat sessions yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSession?.id === session.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {session.customerName || 'Anonymous Customer'}
                    </h3>
                    <span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(session.status)}`}></span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {session.customerPhone || session.customerEmail || 'No contact info'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{session.source}</span>
                    <span>{formatTime(session.updatedAt)}</span>
                  </div>
                  
                  {session.messages.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2 truncate">
                      {session.messages[session.messages.length - 1]?.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedSession.customerName || 'Anonymous Customer'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedSession.customerPhone || selectedSession.customerEmail || 'No contact info'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedSession.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSession.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Started {new Date(selectedSession.createdAt).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderType === 'admin'
                          ? 'bg-blue-600 text-white'
                          : message.senderType === 'ai'
                          ? 'bg-green-100 text-gray-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.senderType === 'admin' && <UserIcon className="h-4 w-4" />}
                        {message.senderType === 'ai' && <ChatBubbleLeftRightIcon className="h-4 w-4 text-green-600" />}
                        <span className="text-xs font-medium">
                          {message.senderName || 'Customer'}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a chat session</h3>
                <p className="text-sm">Choose a conversation from the left panel to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

