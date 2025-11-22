import { User, MapPin } from 'lucide-react';
import TypingText from './TypingText';
import WeatherIcon from './WeatherIcon';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

export default function ChatMessage({ role, content, isTyping = false, onTypingComplete }: ChatMessageProps) {
  const isUser = role === 'user';

  // Detect weather condition from text
  const detectWeatherCondition = (text: string): string | null => {
    const weatherPatterns = [
      /晴れ|sunny|clear/i,
      /曇り|cloudy|clouds|overcast/i,
      /雨|rainy|rain|drizzle/i,
      /雪|snowy|snow/i,
      /雷|thunderstorm|storm/i,
      /霧|foggy|fog|mist|haze/i,
    ];
    
    for (const pattern of weatherPatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return null;
  };

  // Helper to parse inline formatting (bold)
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Format content: preserve line breaks, handle bullet points, headers, and weather icons
  const formatContent = (text: string) => {
    const weatherCondition = detectWeatherCondition(text);
    
    return text.split('\n').map((line, idx) => {
      // Headers (### Title)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = headerMatch[2];
        const sizes = ['text-lg', 'text-base', 'text-sm'];
        return (
          <div key={idx} className={`mt-4 mb-2 font-bold text-slate-900 ${sizes[level-1] || 'text-base'}`}>
            {parseInline(content)}
          </div>
        );
      }

      // Bullet points
      const bulletMatch = line.match(/^[•\-\*]\s+(.+)/);
      if (bulletMatch) {
        return (
          <div key={idx} className="flex gap-2 my-1">
            <span className="flex-shrink-0 text-slate-400">•</span>
            <span>{parseInline(bulletMatch[1])}</span>
          </div>
        );
      }
      
      // Check if this line contains temperature and weather info (first line typically)
      const tempMatch = line.match(/(\d+)[°℃]/);
      const hasWeatherInfo = tempMatch && weatherCondition && idx === 0;
      
      // Regular line
      return line.trim() ? (
        <div key={idx} className="my-1 flex items-center gap-2 flex-wrap">
          <span>{parseInline(line)}</span>
          {hasWeatherInfo && !isUser && (
            <WeatherIcon condition={weatherCondition} size={18} inline={true} />
          )}
        </div>
      ) : (
        <div key={idx} className="h-2" />
      );
    });
  };

  return (
    <div className={`flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar with Gradient */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md border
        ${isUser ? 'gradient-primary border-purple-200 text-white' : 'glass border-white/40 text-slate-600'}`}>
        {isUser ? <User size={16} /> : <MapPin size={16} />}
      </div>

      {/* Bubble with Gradient and Glassmorphism */}
      <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-lg hover:shadow-xl transition-all
        ${isUser 
          ? 'glass-dark text-white rounded-tr-sm border border-white/20' 
          : 'glass text-slate-800 border border-white/40 rounded-tl-sm'
        }`}>
        {!isUser && isTyping ? (
          <TypingText text={content} speed={15} onComplete={onTypingComplete} />
        ) : (
          formatContent(content)
        )}
      </div>
    </div>
  );
}