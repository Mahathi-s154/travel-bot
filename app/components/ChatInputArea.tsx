"use client";
import { useState, useRef } from 'react';
import { Mic, Send, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  language: 'en' | 'ja';
}

// Translation for the UI elements
const dictionary = {
  en: { placeholder: "Ask a question...", listening: "Listening...", transcribing: "Transcribing..." },
  ja: { placeholder: "質問を入力...", listening: "聞き取り中...", transcribing: "文字起こし中..." }
};

export default function ChatInputArea({ onSendMessage, isProcessing, language }: ChatInputAreaProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const t = dictionary[language];

  // --- TEXT HANDLING ---
  const handleSendText = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText(""); // Clear input
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // --- VOICE HANDLING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop()); // Turn off mic light
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    const formData = new FormData();
    formData.append("file", blob, "voice.webm");
    
    // --- UPDATED: Send the selected language to the backend ---
    formData.append("language", language); 

    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) {
        // Send the transcribed text directly
        onSendMessage(data.text);
      }
    } catch (error) {
      console.error("Transcription failed", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const isDisabled = isProcessing || isTranscribing;

  return (
    <div className="w-full glass border-t border-white/40 p-4 pb-6 shadow-xl">
      
      {/* Floating Status Badge (Listening/Transcribing) */}
      <AnimatePresence>
        {(isRecording || isTranscribing) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: -10 }} 
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-0 w-full flex justify-center pointer-events-none"
          >
            <span className="glass-dark text-white text-xs font-medium px-3 py-1 rounded-full shadow-xl flex items-center gap-2">
              {isRecording && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              {isRecording ? t.listening : t.transcribing}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="flex items-center gap-2 max-w-[480px] mx-auto">
        
        {/* Text Input Field with Glassmorphism */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "" : t.placeholder}
          disabled={isDisabled || isRecording}
          className="flex-1 glass border border-white/40 focus:border-purple-300 rounded-2xl px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:glow-purple transition-all disabled:opacity-50"
        />

        {/* Dynamic Button: Shows SEND if typing, MIC if empty */}
        {text.trim() ? (
          <motion.button
            onClick={handleSendText}
            disabled={isDisabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center gradient-primary text-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </motion.button>
        ) : (
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isDisabled}
            whileHover={{ scale: isDisabled ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200 shadow-md
              ${isRecording ? 'bg-red-500 text-white shadow-red-300 shadow-xl scale-110' : 'glass border border-white/40 text-slate-700 hover:border-purple-300'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={22} />}
          </motion.button>
        )}

      </div>
    </div>
  );
}