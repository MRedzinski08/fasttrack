import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { streamChat } from '../services/api.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import ReactMarkdown from 'react-markdown';

export default function ChatPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi — I'm your FastTrack Auto-Coach. Ask me anything about your nutrition, fasting, or goals and I'll give you specific, actionable advice." },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setStreaming(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      await streamChat(userMessage, history, (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="bg-[#050505] border-white/[0.06] p-0 flex flex-col w-full sm:max-w-sm"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-white/[0.06] gap-0" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div className="w-4 h-[2px] bg-primary-500" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }} />
              <SheetTitle className="text-xs uppercase tracking-[0.2em] text-primary-500 font-normal">Auto-Coaching</SheetTitle>
            </div>
            <SheetDescription className="sr-only">FastTrack Auto-Coaching chat panel</SheetDescription>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-500/10 text-white'
                    : 'bg-white/[0.03] text-white'
                }`}
              >
                {msg.content ? (
                  msg.role === 'assistant' ? (
                    <div className="prose-chat">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content
                ) : (streaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </span>
                ) : '')}
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-white/[0.06]">
          <div className="flex gap-3 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your auto-coach..."
              disabled={streaming}
              className="flex-1 bg-transparent border-b border-white/[0.1] text-white py-2 text-sm focus:border-primary-500 outline-none transition-all placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="text-primary-500 hover:text-primary-400 disabled:text-white/10 transition-colors duration-300 shrink-0 pb-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
