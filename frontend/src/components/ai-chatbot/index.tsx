import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendChatMessage, ChatMessage } from '@/lib/chat-api';
import useWorkspaceId from '@/hooks/use-workspace-id';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AiChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Orbiit AI. Ask me to list tasks, create a task, or update a status.",
    },
  ]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isPending, setIsPending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceId = useWorkspaceId();

  useEffect(() => {
    const show = setTimeout(() => setShowGreeting(true), 1500);
    const hide = setTimeout(() => setShowGreeting(false), 7000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  useEffect(() => {
    if (isOpen) setShowGreeting(false);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isPending || !workspaceId) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsPending(true);

    try {
      const data = await sendChatMessage(text, workspaceId, history);
      setHistory(data.history);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsPending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div className="flex flex-col w-80 sm:w-96 h-[480px] rounded-2xl border bg-background shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Orbiit AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-sm opacity-80 hover:opacity-100 transition-opacity"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isPending && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Orbiit AI..."
              className="flex-1 h-9 text-sm"
              disabled={isPending}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={sendMessage}
              disabled={isPending || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Greeting bubble */}
      {!isOpen && showGreeting && (
        <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="relative max-w-[220px] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-lg">
            Hi! I&apos;m Orbiit AI 👋
            <button
              onClick={() => setShowGreeting(false)}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80"
              aria-label="Dismiss"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95',
          isOpen && 'rotate-0'
        )}
        aria-label="Toggle Orbiit AI"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default AiChatbot;
