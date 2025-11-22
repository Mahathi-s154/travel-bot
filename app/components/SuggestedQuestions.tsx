"use client";

import { motion } from 'framer-motion';

interface SuggestedQuestionsProps {
  onSelect: (text: string) => void;
  language: 'en' | 'ja';
  disabled?: boolean;
}

const questions = {
  en: [
    "Is it good for hiking in Tokyo?",
    "Weather in Kyoto today?",
    "Best food in Osaka?",
    "Day trip to Mt. Fuji?",
    "Indoor activities in rainy Tokyo?"
  ],
  ja: [
    "東京でハイキングはできますか？",
    "今日の京都の天気は？",
    "大阪のおすすめグルメは？",
    "富士山への日帰り旅行？",
    "雨の東京でできる屋内アクティビティ？"
  ]
};

export default function SuggestedQuestions({ onSelect, language, disabled }: SuggestedQuestionsProps) {
  const list = questions[language];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 px-4 flex gap-2">
      {list.map((q, idx) => (
        <motion.button
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium glass border border-white/40 text-slate-700 hover:bg-white/50 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {q}
        </motion.button>
      ))}
    </div>
  );
}

