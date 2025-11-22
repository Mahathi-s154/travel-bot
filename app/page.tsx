"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatMessage from './components/ChatMessage';
import LoadingIndicator from './components/LoadingIndicator';
import SuggestedQuestions from './components/SuggestedQuestions';
import { Plane, Languages } from 'lucide-react';

// Dynamic import for the input component
const ChatInputArea = dynamic(() => import('./components/ChatInputArea'), { ssr: false });

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Lang = 'en' | 'ja';

const translations = {
  en: {
    title: "Jini - A guide to travel in Japan",
    subtitle: "AI Travel Agent",
    greeting: "Hello! I'm your travel assistant. Ask me about weather or trips in Japan.",
    emptyTitle: "Where to next?",
    emptyDesc: "I can check the weather and suggest itineraries.",
    emptyHint: 'Try: "How is the weather in Kyoto?"',
    thinking: "Thinking...",
    error: "Sorry, I couldn't connect. Please try again."
  },
  ja: {
    title: "日本ガイド",
    subtitle: "AI トラベルエージェント",
    greeting: "こんにちは！旅行アシスタントです。日本の天気や旅行プランについて聞いてください。",
    emptyTitle: "次はどこへ？",
    emptyDesc: "天気予報や旅行プランを提案できます。",
    emptyHint: '例: "京都の天気はどうですか？"',
    thinking: "考え中...",
    error: "申し訳ありません。接続できませんでした。"
  }
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'weather' | 'analyzing' | 'generating' | null>(null);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string | null>(null);
  const [language, setLanguage] = useState<Lang>('ja'); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Initialize Greeting
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return [{ role: 'assistant', content: t.greeting }];
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [{ role: 'assistant', content: t.greeting }];
      }
      return prev;
    });
  }, [language]); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ja' : 'en'));
  };

  // Determine background class based on weather
  const getWeatherBackground = () => {
    if (!weatherCondition) return 'bg-weather-default';
    const lower = weatherCondition.toLowerCase();
    if (lower.includes('clear') || lower.includes('sunny')) return 'bg-weather-clear';
    if (lower.includes('cloud')) return 'bg-weather-clouds';
    if (lower.includes('rain') || lower.includes('drizzle')) return 'bg-weather-rain';
    if (lower.includes('snow')) return 'bg-weather-snow';
    if (lower.includes('thunder') || lower.includes('storm')) return 'bg-weather-thunderstorm';
    if (lower.includes('mist') || lower.includes('fog')) return 'bg-weather-mist';
    return 'bg-weather-default';
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      // Filter out the initial greeting and send conversation history
      const conversationHistory = updatedMessages.filter((msg, idx) => {
        // Skip the first message if it's just the greeting
        if (idx === 0 && msg.role === 'assistant' && 
            (msg.content === t.greeting || 
             msg.content.includes("Hello! I'm your travel assistant") ||
             msg.content.includes("こんにちは！旅行アシスタント"))) {
          return false;
        }
        return true;
      });

      // Start with weather phase for queries that might need weather
      setLoadingPhase('weather');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: conversationHistory,
          language: language === 'ja' ? 'Japanese' : 'English' 
        }),
      });
      
      const data = await response.json();

      // Transition through phases based on whether weather was fetched
      if (data.weatherFetched) {
        setLoadingPhase('analyzing');
        // Update weather condition for dynamic background
        if (data.weather && data.weather.condition) {
           setWeatherCondition(data.weather.condition);
        }
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setLoadingPhase('generating');
      await new Promise(resolve => setTimeout(resolve, 600));

      if (data.reply) {
        setMessages((prev) => {
          const newMessages: Message[] = [...prev, { role: 'assistant' as const, content: data.reply }];
          setTypingMessageIndex(newMessages.length - 1);
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: t.error }]);
    } finally {
      setIsProcessing(false);
      setLoadingPhase(null);
    }
  };

  const handleTypingComplete = () => {
    setTypingMessageIndex(null);
  };

  return (
    // Set main background with dynamic weather class
    <div className={`flex justify-center min-h-screen font-sans transition-colors duration-1000 ${getWeatherBackground()}`}>
      
      {/* Main App Container */}
      <main className="w-full max-w-[480px] bg-white/95 backdrop-blur-lg h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden sm:rounded-[30px] sm:my-8 sm:h-[calc(100vh-64px)] sm:border border-white/20">
        
        {/* Header with Gradient */}
        <header className="px-6 py-4 glass border-b border-white/30 z-20 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <div className="gradient-primary p-2 rounded-xl shadow-lg">
              <Plane size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">{t.title}</h1>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 glass hover:glass-dark hover:text-white border border-white/40 rounded-full transition-all text-xs font-semibold text-slate-700 active:scale-95 shadow-sm"
          >
            <Languages size={14} />
            {language === 'en' ? 'EN' : 'JP'}
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth no-scrollbar">
          
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 opacity-0 animate-in fade-in duration-700 slide-in-from-bottom-4 fill-mode-forwards">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Plane size={32} className="text-slate-300" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="font-semibold text-slate-800">{t.emptyTitle}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t.emptyDesc}</p>
              </div>
              <div className="text-xs font-mono bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-slate-400">
                {t.emptyHint}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage 
              key={idx} 
              role={msg.role} 
              content={msg.content}
              isTyping={idx === typingMessageIndex}
              onTypingComplete={handleTypingComplete}
            />
          ))}
          
          {/* Loading Indicator with Phases */}
          {isProcessing && loadingPhase && (
            <LoadingIndicator phase={loadingPhase} language={language} />
          )}
          <div className="h-4" ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 z-30 bg-white/80 backdrop-blur-md">
           {/* Suggested Questions */}
           {!isProcessing && messages.length > 0 && (
             <SuggestedQuestions 
               onSelect={handleSendMessage} 
               language={language} 
               disabled={isProcessing}
             />
           )}
           
           <ChatInputArea 
              onSendMessage={handleSendMessage} 
              isProcessing={isProcessing} 
              language={language}
           />
        </div>

      </main>
    </div>
  );
}