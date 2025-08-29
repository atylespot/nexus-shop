"use client";
import { useState, useEffect, useRef } from "react";
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ArrowUpIcon
} from "@heroicons/react/24/outline";

interface ChatMessage {
  id: number;
  content: string;
  messageType: string;
  senderType: 'customer' | 'admin' | 'ai';
  senderName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWidgetProps {
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export default function ChatWidget({ customerInfo }: ChatWidgetProps) {
  // Get customer info from context or props
  const getCustomerInfo = () => {
    if (customerInfo) return customerInfo;
    
    // Try to get from localStorage or other sources
    const savedInfo = localStorage.getItem('customer-info');
    if (savedInfo) {
      try {
        return JSON.parse(savedInfo);
      } catch (e) {
        console.error('Error parsing customer info:', e);
      }
    }
    
    // Default customer info
    return {
      name: 'Customer',
      email: '',
      phone: ''
    };
  };
  // Add CSS animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
      @keyframes slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .animate-slide-up {
        animation: slide-up 0.4s ease-out forwards;
      }
      
      /* Custom Scrollbar */
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #93c5fd;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #3b82f6;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [botSettings, setBotSettings] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate unique session ID
    setSessionId(`customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Load bot settings
    fetchBotSettings();
    
    // Load existing chat session if available
    const savedSessionId = localStorage.getItem('chat-session-id');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatSession(savedSessionId);
    }

    // Detect current page
    const detectCurrentPage = () => {
      const pathname = window.location.pathname;
      if (pathname === '/') {
        setCurrentPage('home');
      } else if (pathname.startsWith('/products/')) {
        setCurrentPage('product-detail');
      } else if (pathname.startsWith('/products')) {
        setCurrentPage('products');
      } else if (pathname.startsWith('/categories/')) {
        setCurrentPage('category');
      } else if (pathname.startsWith('/categories')) {
        setCurrentPage('categories');
      } else if (pathname.startsWith('/checkout')) {
        setCurrentPage('checkout');
      } else if (pathname.startsWith('/cart')) {
        setCurrentPage('cart');
      } else {
        setCurrentPage('other');
      }
    };

    detectCurrentPage();
    // Listen for route changes
    window.addEventListener('popstate', detectCurrentPage);
    
    return () => {
      window.removeEventListener('popstate', detectCurrentPage);
    };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // Delay scroll to ensure message is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isOpen]);

  const fetchBotSettings = async () => {
    try {
      const response = await fetch('/api/chat/settings');
      if (response.ok) {
        const data = await response.json();
        setBotSettings(data.settings);
        
        // Add welcome message if enabled
        if (data.settings?.isEnabled && data.settings?.welcomeMessage) {
          const welcomeMessage: ChatMessage = {
            id: Date.now(),
            content: data.settings.welcomeMessage,
            messageType: 'text',
            senderType: 'ai',
            senderName: 'AI Assistant',
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setMessages([welcomeMessage]);
        }
      }
    } catch (error) {
      console.error('Error fetching bot settings:', error);
    }
  };

  // Update customer info when component mounts or customerInfo changes
  useEffect(() => {
    const info = getCustomerInfo();
    if (info.name !== 'Customer' || info.email || info.phone) {
      localStorage.setItem('customer-info', JSON.stringify(info));
    }
  }, [customerInfo]);

  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.session?.messages) {
          setMessages(data.session.messages);
        }
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId) return;

    try {
      setSending(true);
      
             // Add customer message to UI immediately
       const customerMessage: ChatMessage = {
         id: Date.now(),
         content: newMessage,
         messageType: 'text',
         senderType: 'customer',
         senderName: getCustomerInfo().name || 'Customer',
         isRead: true,
         createdAt: new Date().toISOString()
       };

      setMessages(prev => [...prev, customerMessage]);
      
      // Save session ID to localStorage
      localStorage.setItem('chat-session-id', sessionId);

             // Send to API
       const response = await fetch('/api/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           sessionId,
           message: newMessage,
           customerInfo: getCustomerInfo(),
           pageContext: currentPage
         })
       });

      if (response.ok) {
        const data = await response.json();
        
        // Add AI response to UI
        if (data.response) {
          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            content: data.response,
            messageType: 'text',
            senderType: 'ai',
            senderName: 'AI Assistant',
            isRead: false,
            createdAt: new Date().toISOString()
          };

          setMessages(prev => [...prev, aiMessage]);
        }
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        content: 'দুঃখিত, একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        messageType: 'text',
        senderType: 'ai',
        senderName: 'AI Assistant',
        isRead: false,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsCollapsed(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isWorkingHours = () => {
    if (!botSettings?.workingHours) return true;
    
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    
    console.log('🔍 Working Hours Check:', { day, time, workingHours: botSettings.workingHours });
    
    const dayHours = botSettings.workingHours[day];
    if (!dayHours?.isWorking) {
      console.log('❌ Day not working:', day);
      return false;
    }
    
    const isWorking = time >= dayHours.start && time <= dayHours.end;
    console.log('⏰ Time check:', { start: dayHours.start, end: dayHours.end, current: time, isWorking });
    
    return isWorking;
  };

  if (!botSettings?.isEnabled) {
    return null;
  }

  return (
    <>
             {/* Chat Button */}
       {!isOpen && (
         <button
           onClick={() => setIsOpen(true)}
           className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 z-50 group hover:scale-110"
           title="Chat with us"
         >
           <ChatBubbleLeftRightIcon className="h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
           <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
         </button>
       )}

                           {/* Chat Widget */}
                {isOpen && (
                  <>
                                         {/* Minimized State */}
                     {isMinimized && (
                       <div 
                         className="fixed bottom-6 right-6 w-[300px] h-[80px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex items-center justify-between p-4 transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-blue-500/20 cursor-pointer group"
                         onClick={toggleMinimize}
                       >
                                                 <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-100 rounded-full relative">
                             <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />
                             {messages.length > 1 && (
                               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                 <span className="text-xs text-white font-bold">{Math.min(messages.length - 1, 9)}</span>
                               </div>
                             )}
                           </div>
                           <div>
                             <h3 className="font-semibold text-gray-900 text-sm">Chat with us</h3>
                             <p className="text-xs text-gray-500">
                               {messages.length > 1 ? `${messages.length - 1} messages` : 'Click to expand'}
                             </p>
                           </div>
                         </div>
                                                 <div className="flex items-center gap-2">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               toggleMinimize();
                             }}
                             className="p-2 hover:bg-blue-50 rounded-full transition-all duration-200 hover:scale-110"
                             title="Expand chat"
                           >
                             <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600" />
                           </button>
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               closeChat();
                             }}
                             className="p-2 hover:bg-red-50 rounded-full transition-all duration-200 hover:scale-110"
                             title="Close chat"
                           >
                             <XMarkIcon className="h-4 w-4 text-red-500" />
                           </button>
                         </div>
                      </div>
                    )}

                    {/* Full Chat Widget */}
                    {!isMinimized && (
                      <div className="fixed bottom-6 right-6 w-[450px] md:w-[500px] lg:w-[550px] h-[700px] md:h-[800px] lg:h-[900px] md:max-h-[90vh] lg:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transform transition-all duration-300 ease-in-out hover:scale-105 animate-slide-up">
                     {/* Header */}
                       <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Chat with us</h3>
                  <p className="text-xs text-blue-100">AI Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isWorkingHours() ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-400/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-100">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 rounded-full border border-gray-400/30">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-100">Offline</span>
                  </div>
                )}
                                 <button
                   onClick={toggleMinimize}
                   className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                   title="Minimize chat"
                 >
                   <ChatBubbleLeftRightIcon className="h-5 w-5" />
                 </button>
                 <button
                   onClick={closeChat}
                   className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                   title="Close chat"
                 >
                   <XMarkIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>



          {/* Chat Content */}
          {!isMinimized && (
            <>
                             {/* Messages */}
                               <div className="messages-container flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 relative">
                 {messages.length === 0 ? (
                   <div className="text-center text-gray-500 py-12">
                     <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                       <ChatBubbleLeftRightIcon className="h-10 w-10 text-blue-400" />
                     </div>
                     <h3 className="text-lg font-semibold text-gray-700 mb-2">Start a conversation!</h3>
                     <p className="text-sm text-gray-500">Ask me anything about our products and services</p>
                   </div>
                 ) : (
                   messages.map((message, index) => (
                     <div
                       key={message.id}
                       className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                       style={{ animationDelay: `${index * 100}ms` }}
                     >
                       <div
                         className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                           message.senderType === 'customer'
                             ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                             : message.senderType === 'ai'
                             ? 'bg-white text-gray-900 border border-gray-200 shadow-md'
                             : 'bg-gray-100 text-gray-900'
                         }`}
                       >
                         <div className="flex items-center gap-2 mb-2">
                           {message.senderType === 'customer' && (
                             <div className="p-1 bg-white/20 rounded-full">
                               <UserIcon className="h-3 w-3" />
                             </div>
                           )}
                           {message.senderType === 'ai' && (
                             <div className="p-1 bg-blue-100 rounded-full">
                               <ChatBubbleLeftRightIcon className="h-3 w-3 text-blue-600" />
                             </div>
                           )}
                           <span className="text-xs font-semibold opacity-80">
                             {message.senderType === 'customer' ? 'You' : message.senderName || 'AI Assistant'}
                           </span>
                         </div>
                         <p className="text-sm leading-relaxed">{message.content}</p>
                         <p className="text-xs mt-2 opacity-60 text-right">
                           {formatTime(message.createdAt)}
                         </p>
                       </div>
                     </div>
                   ))
                 )}
                                   <div ref={messagesEndRef} />
                  
                  {/* Scroll to Top Button */}
                  {messages.length > 3 && (
                    <button
                      onClick={scrollToTop}
                      className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-110"
                      title="Scroll to top"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                             {/* Message Input */}
               <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                 {!isWorkingHours() ? (
                   <div className="text-center text-gray-500 py-6">
                     <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3">
                       <ClockIcon className="h-8 w-8 text-gray-400" />
                     </div>
                     <h4 className="font-semibold text-gray-700 mb-2">We're currently offline</h4>
                     <p className="text-sm text-gray-500 leading-relaxed">
                       {botSettings?.offlineMessage || 'We are currently offline. Please leave a message and we will get back to you soon.'}
                     </p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <div className="flex gap-3">
                       <input
                         type="text"
                         value={newMessage}
                         onChange={(e) => setNewMessage(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                         placeholder="Type your message here..."
                         className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-gray-300"
                         disabled={sending}
                       />
                       <button
                         onClick={sendMessage}
                         disabled={!newMessage.trim() || sending}
                         className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
                       >
                         {sending ? (
                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                         ) : (
                           <PaperAirplaneIcon className="h-5 w-5" />
                         )}
                       </button>
                     </div>
                     <p className="text-xs text-gray-400 text-center">
                       Press Enter to send • AI will respond automatically
                     </p>
                   </div>
                 )}
               </div>
                         </>
           )}
                         </div>
                       )}
                     </>
                   )}
                 </>
               );
             }
