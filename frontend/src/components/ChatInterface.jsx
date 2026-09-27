import React, { useState } from 'react';
import { Send, Trash2, Bot, Sparkles } from 'lucide-react';
import { queryRAG } from '../services/api';

/**
 * Strips robotic inline citation brackets like [Source: filename.md, Page: 1, Section: ...]
 * to keep the output natural and clean like ChatGPT.
 */
function cleanAnswerText(text) {
  if (!text) return '';
  if (text.includes('Unable to synthesize grounded answer') || text.includes('HTTPSConnectionPool') || text.includes('Read timed out')) {
    return "I'm sorry, I encountered a temporary connection delay reaching the language model. Please try asking again in a moment.";
  }
  return text
    .replace(/\[Source:[^\]]+\]/gi, '')
    .replace(/^Based on the provided evidence,?\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}


export default function ChatInterface() {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI assistant. Ask me anything grounded in your uploaded knowledge base.'
    }
  ]);

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Chat history cleared. How can I help you today?'
      }
    ]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!queryText.trim() || loading) return;

    const userPrompt = queryText.trim();
    setQueryText('');

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: userPrompt
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await queryRAG(userPrompt);

      const cleanedText = cleanAnswerText(response.answer) || 
        "I don't have sufficient information about this topic in the available knowledge base.";

      // Extract unique source document names for a subtle footnote
      const uniqueSources = Array.from(
        new Set(
          (response.sources || [])
            .map((s) => s.document_name)
            .filter(Boolean)
        )
      );

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: cleanedText,
        sources: uniqueSources
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        text: `Error: ${err.message || 'Unable to process query.'}`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Top Header */}
      <div className="chat-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Grounded Assistant
          </span>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="btn-secondary"
          style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Clear conversation"
        >
          <Trash2 size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="message-user">
                {msg.text}
              </div>
            );
          }

          // Assistant Message - Clean ChatGPT Style
          return (
            <div key={msg.id} className="message-assistant">
              <div className="message-assistant-content">
                {/* Clean Message Body */}
                <div style={{ fontSize: '0.9375rem', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>

                {/* Subtle Sources Footnote (minimal, like Perplexity/ChatGPT) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ 
                    marginTop: '14px', 
                    paddingTop: '8px', 
                    borderTop: '1px solid var(--border-muted)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span 
                        key={i} 
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-muted)',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ChatGPT Style Typing Indicator */}
        {loading && (
          <div className="message-assistant">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, padding: '10px 14px', fontSize: '0.875rem' }}
          placeholder="Message Grounded Assistant..."
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!queryText.trim() || loading}
          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Send size={15} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

