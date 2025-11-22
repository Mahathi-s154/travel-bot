"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Brain, Sparkles } from 'lucide-react';

interface LoadingIndicatorProps {
  phase: 'weather' | 'analyzing' | 'generating';
  language: 'en' | 'ja';
}

const phaseConfig = {
  weather: {
    icon: Cloud,
    en: 'Checking weather...',
    ja: '天気を確認中...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  analyzing: {
    icon: Brain,
    en: 'Analyzing conditions...',
    ja: '状況を分析中...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  generating: {
    icon: Sparkles,
    en: 'Generating recommendations...',
    ja: 'おすすめを生成中...',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
};

export default function LoadingIndicator({ phase, language }: LoadingIndicatorProps) {
  const config = phaseConfig[phase];
  const Icon = config.icon;
  const text = language === 'ja' ? config.ja : config.en;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3 animate-in fade-in duration-300"
      >
        <motion.div
          className={`w-9 h-9 rounded-full ${config.bgColor} border border-slate-200 flex items-center justify-center shadow-sm`}
          animate={{ 
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon size={16} className={`${config.color}`} />
        </motion.div>
        
        <div className={`${config.bgColor} px-4 py-3 rounded-2xl rounded-tl-sm text-sm ${config.color} border border-slate-100 flex items-center gap-2`}>
          <span>{text}</span>
          <motion.span
            className="flex gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              .
            </motion.span>
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            >
              .
            </motion.span>
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

