"use client";

import { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export default function TypingText({ text, speed = 20, onComplete }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  // Format the displayed text to preserve line breaks and structure
  const formatText = (str: string) => {
    return str.split('\n').map((line, idx) => {
      // Check if line starts with bullet point markers
      const bulletMatch = line.match(/^[•\-\*]\s+(.+)/);
      if (bulletMatch) {
        return (
          <div key={idx} className="flex gap-2 my-1">
            <span className="flex-shrink-0">•</span>
            <span>{bulletMatch[1]}</span>
          </div>
        );
      }
      // Regular line
      return line.trim() ? (
        <div key={idx} className="my-1">
          {line}
        </div>
      ) : (
        <div key={idx} className="h-2" />
      );
    });
  };

  return (
    <>
      {formatText(displayedText)}
      {currentIndex < text.length && (
        <span className="inline-block w-1 h-4 bg-slate-400 animate-pulse ml-0.5" />
      )}
    </>
  );
}

