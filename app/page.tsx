"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatMessage from './components/ChatMessage';
import { Plane, Map } from 'lucide-react';

const VoiceInput = dynamic(() => import('./components/VoiceInput'), { 
  ssr: false,
  loading: () => <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      
      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Unable to reach the travel guide." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      
      {/* Mobile-style Container */}
      <main className="w-full max-w-[480px] bg-white h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden sm:rounded-[30px] sm:my-8 sm:h-[calc(100vh-64px)] sm:border border-slate-200">
        
        {/* Glass Header */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-20 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-lg shadow-slate-200">
              <Plane size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Japan Guide</h1>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">AI Travel Agent</p>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            <Map size={20} />
          </button>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth no-scrollbar">
          
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 opacity-0 animate-in fade-in duration-700 slide-in-from-bottom-4 fill-mode-forwards">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                <Plane size={32} className="text-slate-300" />
              </div>
              <div className="space-y-2 max-w-xs">
                <h3 className="font-semibold text-slate-800">Where to next?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  I can check the weather and suggest itineraries in Japan.
                </p>
              </div>
              <div className="text-xs font-mono bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-slate-400">
                Try: "京都の天気は？"
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
          
          {/* Spacer for bottom area */}
          <div className="h-32" ref={messagesEndRef} />
        </div>

        {/* Floating Bottom Interface */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/95 to-transparent pb-8 pt-12 px-6 z-20">
          <VoiceInput onTranscription={handleVoiceInput} isProcessing={isProcessing} />
        </div>

      </main>
    </div>
  );
}