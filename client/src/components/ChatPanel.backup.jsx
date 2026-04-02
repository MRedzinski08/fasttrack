import { useState, useRef, useEffect } from 'react';
import { streamChat } from '../services/api.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your FastTrack AI coach. Ask me anything about your fasting, nutrition, or goals!" },
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
        className="bg-[#1A1810] border-[#2E2B20] p-0 flex flex-col w-full sm:max-w-sm"
      >
        <SheetHeader className="px-4 py-3 border-b border-primary-300 bg-primary-500 rounded-none gap-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <SheetTitle className="font-medium text-sm text-gray-900">AI Coach</SheetTitle>
              <SheetDescription className="text-xs text-primary-800">FastTrack Assistant</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-gray-900 rounded-br-sm'
                    : 'bg-[#22201A] text-primary-50 rounded-bl-sm'
                }`}
              >
                {msg.content || (streaming && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#5A5228] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#5A5228] rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-1.5 bg-[#5A5228] rounded-full animate-bounce [animation-delay:0.2s]" />
                  </span>
                ) : '')}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-[#2E2B20]">
          <div className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach..."
              disabled={streaming}
              className="flex-1 bg-[#22201A] border-[#2E2B20] text-primary-50 placeholder:text-[#5A5228] h-9 rounded-full px-4"
            />
            <Button
              type="submit"
              disabled={!input.trim() || streaming}
              size="icon"
              className="bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-full shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
