'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([{
    role: 'bot' as const,
    text: "Hi! I'm Ava 👋 I can answer questions about our painting services — or help you fill out a free quote. How can I help today?",
  }]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionStorage.getItem('chatHintSeen')) {
      const t = setTimeout(() => setHintVisible(true), 2200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages]);

  const openChat = useCallback(() => {
    setOpen(true);
    setHintVisible(false);
    sessionStorage.setItem('chatHintSeen', '1');
  }, []);

  useEffect(() => {
    (window as Window & { openAvaChat?: () => void }).openAvaChat = openChat;
    return () => { delete (window as Window & { openAvaChat?: () => void }).openAvaChat; };
  }, [openChat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setSending(true);
    const typingId = Date.now();
    setMessages((m) => [...m, { role: 'bot', text: 'Ava is typing…' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();
      setMessages((m) => m.filter((msg) => msg.text !== 'Ava is typing…'));
      setMessages((m) => [...m, { role: 'bot', text: data.reply || 'Sorry, something went wrong.' }]);
      if (Array.isArray(data.history)) setHistory(data.history);
    } catch {
      setMessages((m) => m.filter((msg) => msg.text !== 'Ava is typing…'));
      setMessages((m) => [...m, { role: 'bot', text: 'Connection error. Please try again.' }]);
    } finally {
      setSending(false);
      void typingId;
    }
  }

  return (
    <>
      <div className="mobile-action-bar" aria-label="Quick actions">
        <a href="tel:7253181411" className="mab-btn mab-call">📞 Call</a>
        <a href="#contact" className="mab-btn mab-quote">📤 Quote</a>
        <button type="button" className="mab-btn mab-ava" onClick={openChat}>🤖 Ava</button>
      </div>

      {hintVisible && !open && (
        <button type="button" className="chat-hint visible" onClick={openChat} aria-label="Open Ava assistant">
          <span className="chat-hint-text">Ask Ava — AI assistant 24/7</span>
          <span className="chat-hint-sub">Answers FAQs &amp; helps with quotes</span>
        </button>
      )}

      <button
        type="button"
        className="chat-toggle"
        aria-label="Chat with Ava"
        onClick={() => { setOpen((o) => !o); setHintVisible(false); sessionStorage.setItem('chatHintSeen', '1'); }}
      >
        💬
      </button>

      <div className={`chat-window${open ? ' active' : ''}`}>
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-avatar">🎨</div>
            <div>
              <div className="chat-name">Ava</div>
              <div className="chat-status">AI Assistant · 24/7</div>
            </div>
          </div>
          <button type="button" className="close-chat" aria-label="Close chat" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="chat-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}-message`}>{msg.text}</div>
          ))}
        </div>
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            autoComplete="off"
          />
          <button type="submit" className="chat-send" aria-label="Send" disabled={sending}>➤</button>
        </form>
      </div>
    </>
  );
}
