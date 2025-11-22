import { User, MapPin } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  // Format content: preserve line breaks and handle bullet points
  const formatContent = (text: string) => {
    return text.split('\n').map((line, idx) => {
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
    <div className={`flex w-full gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm border
        ${isUser ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
        {isUser ? <User size={16} /> : <MapPin size={16} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm
        ${isUser 
          ? 'bg-slate-900 text-white rounded-tr-sm' 
          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
        }`}>
        {formatContent(content)}
      </div>
    </div>
  );
}