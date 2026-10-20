import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';
import {
  BotMessageSquare,
  Sparkles,
  Send,
  AlertCircle,
  ShieldCheck,
  Building2,
  Clock,
  Car,
  Trash2,
  VolumeX,
  CreditCard,
  PhoneCall,
  Info
} from 'lucide-react';

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I am your NESTORA Residential Concierge. I can assist you with official apartment policies, amenities schedules, visitor parking rules, quiet hours, and facility guidelines. How can I help you today?',
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setStatusLoading(true);
        const res = await aiService.getStatus();
        if (res.success && res.data) {
          setAiStatus(res.data);
        }
      } catch (err) {
        console.warn('Could not retrieve AI engine status:', err.message);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history for context
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiService.chat(textToSend.trim(), history);

      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.reply,
            timestamp: new Date(),
            disclaimer: res.data.disclaimer
          }
        ]);
      } else {
        throw new Error(res.error || 'Failed to generate response');
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'The AI service is currently unavailable. Please verify backend AI configuration.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      label: 'Clubhouse & Pool Hours',
      icon: Clock,
      query: 'What are the operating hours for the society clubhouse, gym, and swimming pool?'
    },
    {
      label: 'Guest Parking Rules',
      icon: Car,
      query: 'Where can guests and visitors park, and what is the maximum duration?'
    },
    {
      label: 'Waste Collection Schedule',
      icon: Trash2,
      query: 'When is door-to-door garbage and waste collected, and what are segregation rules?'
    },
    {
      label: 'Society Quiet Hours',
      icon: VolumeX,
      query: 'What are the official apartment quiet hours and rules regarding drilling noise?'
    },
    {
      label: 'Maintenance Payment Deadlines',
      icon: CreditCard,
      query: 'When are monthly maintenance dues generated, and when is the payment deadline?'
    },
    {
      label: 'Emergency Contacts',
      icon: PhoneCall,
      query: 'What are the telephone extensions for the security gate and facility manager?'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & AI Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-accent">
            Residential Intelligence
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
            NESTORA AI Concierge
          </h1>
          <p className="text-xs sm:text-sm text-navy-800/70 mt-1">
            24/7 automated residential assistant grounded strictly in verified society bylaws and guidelines.
          </p>
        </div>

        {/* AI Readiness Status Tag */}
        <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-ivory-300 shadow-subtle text-xs">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              aiStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-navy-900 font-semibold">
            {aiStatus?.configured
              ? `AI Active (${aiStatus.provider?.toUpperCase()} - ${aiStatus.model})`
              : 'AI Engine Offline / Unconfigured'}
          </span>
        </div>
      </div>

      {/* Verified Guidelines Notice Banner */}
      <div className="p-4 rounded-2xl bg-ivory-100/90 border border-ivory-300 flex items-start space-x-3 text-xs text-navy-900">
        <ShieldCheck className="w-5 h-5 text-teal-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-navy-900">Grounded Residential Guidelines</p>
          <p className="text-navy-800/70 leading-relaxed font-light">
            The AI Concierge answers residential queries based on official society rules. It does not access private financial balances, personal resident data, or fabricate policies. For direct administrative concerns, please reach out to the Management Office.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-ivory-300 shadow-elevated flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-ivory-50/40">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-navy-900 text-ivory-50 shadow-sm'
                      : 'bg-teal-accent text-white shadow-glow-teal'
                  }`}
                >
                  {isUser ? 'ME' : <BotMessageSquare className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-subtle ${
                    isUser
                      ? 'bg-navy-900 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-none'
                      : 'bg-white text-navy-900 border border-ivory-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Disclaimer / Timestamp footer */}
                  <div className={`mt-2 text-[10px] flex items-center justify-between ${
                    isUser ? 'text-ivory-400' : 'text-navy-800/50'
                  }`}>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && !msg.isError && (
                      <span className="ml-2 flex items-center text-teal-accent">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        Grounded Answer
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-teal-accent text-white flex items-center justify-center shrink-0">
                <BotMessageSquare className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-none p-4 border border-ivory-200 shadow-subtle">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-teal-accent animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-navy-800/60 font-medium ml-2">Consulting community bylaws...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-4 py-2.5 bg-ivory-100/60 border-t border-ivory-200 overflow-x-auto flex items-center space-x-2 scrollbar-none">
          <span className="text-[10px] font-bold text-navy-800/60 uppercase shrink-0">
            Suggested:
          </span>
          {samplePrompts.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(p.query)}
                className="shrink-0 inline-flex items-center px-2.5 py-1 bg-white hover:bg-ivory-200 text-navy-850 text-xs rounded-full border border-ivory-300 transition shadow-2xs font-medium"
              >
                <Icon className="w-3 h-3 mr-1 text-teal-accent" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-ivory-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question about society rules, amenities, or parking..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-ivory-50 border border-ivory-300 rounded-xl text-xs sm:text-sm text-navy-900 placeholder-navy-800/40 focus:outline-none focus:ring-2 focus:ring-teal-accent focus:border-teal-accent transition"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-5 py-3 bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white rounded-xl transition shadow-sm flex items-center font-semibold text-xs sm:text-sm shrink-0"
            >
              <Send className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
