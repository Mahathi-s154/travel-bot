"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatMessage from './components/ChatMessage';
import { Plane, Languages, Map } from 'lucide-react';

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
  const [language, setLanguage] = useState<Lang>('en'); 
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          language: language === 'ja' ? 'Japanese' : 'English' 
        }),
      });
      
      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: t.error }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // Set main background to slate-50 (off-white) for a clean look outside the mobile frame
    <div className="flex justify-center min-h-screen bg-slate-50 font-sans">
      
      {/* Main App Container */}
      <main className="w-full max-w-[480px] bg-white h-[100dvh] flex flex-col relative shadow-xl overflow-hidden sm:rounded-[30px] sm:my-8 sm:h-[calc(100vh-64px)] sm:border border-slate-200">
        
        {/* Header */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 z-20 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200">
              <Plane size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-slate-900">{t.title}</h1>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all text-xs font-semibold text-slate-700 active:scale-95"
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
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
          
          {/* Loading Indicator */}
          {isProcessing && (
             <div className="flex gap-3 animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                   <Map size={16} className="text-slate-400 animate-pulse" />
                </div>
                <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-slate-500 border border-slate-100">
                   {t.thinking}
                </div>
             </div>
          )}
          <div className="h-4" ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 z-30 bg-white">
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