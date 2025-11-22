"use client";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  isProcessing: boolean;
}

export default function VoiceInput({ onTranscription, isProcessing }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Please allow microphone access.");
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

    try {
      console.log("🚀 Sending audio to /api/transcribe...");
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });

      // 1. Check the status code first
      if (!res.ok) {
        console.error(`❌ Server Error: ${res.status} ${res.statusText}`);
        const text = await res.text(); // Get raw text (likely HTML)
        console.error("📄 Server Response:", text.slice(0, 500)); // Print first 500 chars to see the error title
        alert(`Server Error (${res.status}). Check console for details.`);
        return;
      }

      // 2. Only parse JSON if status is OK (200)
      const data = await res.json();
      console.log("✅ Transcription:", data);
      
      if (data.text) onTranscription(data.text);

    } catch (error) {
      console.error("🔥 Network/Parsing Error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Determine Icon and State
  const isDisabled = isProcessing || isTranscribing;
  
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        
        {/* Pulse Animation (Only when recording) */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 rounded-full bg-red-500/30"
            />
          )}
        </AnimatePresence>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled}
          className={`relative z-10 w-16 h-16 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 transform active:scale-95
            ${isRecording 
              ? 'bg-red-500 text-white' 
              : isDisabled 
                ? 'bg-slate-100 text-slate-400' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-105'
            }
          `}
        >
          {isRecording ? (
            <Square size={24} fill="currentColor" />
          ) : isDisabled ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Mic size={28} />
          )}
        </button>
      </div>

      <div className="h-6 flex items-center justify-center">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : isProcessing ? "Thinking..." : "Tap to Speak"}
        </span>
      </div>
    </div>
  );
}