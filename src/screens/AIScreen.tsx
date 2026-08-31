import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, MessageSquare, Zap, Droplet, Moon, Dumbbell, UtensilsCrossed, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AIMessage } from '@/lib/types';

export function AIScreen() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(50);
    setMessages((data as AIMessage[]) || []);
  }, [session?.user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || !session?.user || loading) return;
    setInput('');

    const tempMsg: AIMessage = {
      id: crypto.randomUUID(),
      conversation_id: '',
      user_id: session.user.id,
      role: 'user',
      content: userMessage,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            message: userMessage,
            history: [...messages, tempMsg].slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();

      const aiMsg: AIMessage = {
        id: crypto.randomUUID(),
        conversation_id: '',
        user_id: session.user.id,
        role: 'assistant',
        content: data.response || 'Sorry, I could not process that.',
        metadata: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Persist both messages to the database
      await supabase.from('ai_messages').insert([
        { ...tempMsg, id: undefined },
        { ...aiMsg, id: undefined },
      ]);
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        conversation_id: '',
        user_id: session.user.id,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        metadata: null,
        created_at: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const suggestions = [
    { label: 'Analyze my meals today', icon: UtensilsCrossed },
    { label: 'How many calories do I have left?', icon: Sparkles },
    { label: 'How much protein have I had?', icon: Zap },
    { label: 'Suggest a meal within my remaining calories', icon: MessageSquare },
    { label: 'How much water have I drunk?', icon: Droplet },
    { label: 'How did I sleep last night?', icon: Moon },
    { label: 'How active was I today?', icon: Dumbbell },
    { label: 'Show my 7-day trends', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-float">
            <Bot className="w-6 h-6 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success-500 border-2 border-white dark:border-zinc-950" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-zinc-900 dark:text-white">LeanMorph AI Coach</h1>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              Online · Your personal nutrition & fitness coach
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center animate-float">
                <Sparkles className="w-10 h-10 text-brand-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-500/20 animate-pulse" />
            </div>
            <h3 className="font-display font-semibold text-lg text-zinc-900 dark:text-white mb-2">Your personal nutrition coach</h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6">I can analyze your meals, suggest improvements, calculate nutrition, and give personalized advice based on your data.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {suggestions.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    onClick={() => sendMessage(s.label)}
                    className="group flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 hover:text-brand-600 dark:hover:text-brand-400 transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                      <Icon className="w-4 h-4 text-brand-500" />
                    </div>
                    {s.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2.5 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-md'
                    : 'bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-tl-md border border-zinc-200/60 dark:border-zinc-700/60'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-zinc-800/80 rounded-2xl rounded-tl-md border border-zinc-200/60 dark:border-zinc-700/60 px-5 py-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 typing-dot" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 rounded-full bg-zinc-400 typing-dot" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-zinc-400 typing-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask your nutrition coach anything..."
            className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-3 text-white transition-all active:scale-95 hover:shadow-float"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
