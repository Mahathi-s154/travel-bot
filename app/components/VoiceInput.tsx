"use client";
import { useAudioRecorder } from 'react-audio-voice-recorder';
import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  isProcessing: boolean;
}

export default function VoiceInput({ onTranscription, isProcessing }: VoiceInputProps) {
  const { startRecording, stopRecording, recordingBlob, isRecording } = useAudioRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (!recordingBlob) return;

    const processAudio = async () => {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("file", recordingBlob, "voice.webm");

      try {
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        const data = await res.json();
        if (data.text) onTranscription(data.text);
      } catch (error) {
        console.error("Transcription error", error);
      } finally {
        setIsTranscribing(false);
      }
    };

    processAudio();
  }, [recordingBlob, onTranscription]);

  const isDisabled = isProcessing || isTranscribing;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Pulse Animation Ring */}
        {isRecording && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-red-500"
          />
        )}

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled}
          className={`relative z-10 p-4 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center
            ${isRecording ? 'bg-red-600 text-white' : 'bg-black text-white hover:bg-gray-800'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
        </button>
      </div>
      
      {/* Status Text */}
      <p className="text-xs font-mono text-gray-500 h-4">
        {isRecording ? "Listening..." : isTranscribing ? "Transcribing..." : isProcessing ? "Thinking..." : "Tap to Speak"}
      </p>
    </div>
  );
}