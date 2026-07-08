import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sendChatMessage } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import '../styles/chat.css';

const Chat = () => {
  const { symbol } = useParams();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (symbol) {
      setMessages([
        { role: 'ai', text: `I have the research report for ${symbol}. What would you like to know about this company?` }
      ]);
    } else {
      setMessages([
        { role: 'ai', text: 'Hello! I can answer questions about any company you have researched. Please search for a company first, or ask me about a specific ticker symbol.' }
      ]);
    }
  }, [symbol]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = symbol
    ? ['Why should I invest?', 'What are the risks?', 'Explain the PE ratio', 'Compare with competitors', 'Future outlook?']
    : ['Analyze AAPL', 'What is TSLA PE ratio?', 'Compare MSFT and GOOGL'];

  const handleSend = async (msg) => {
    const message = msg || input;
    if (!message.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(message, symbol || '');
      setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to get response';
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${errorMsg}` }]);
      addToast(errorMsg, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <FiMessageSquare className="chat-header-icon" />
        <div>
          <h1>AI Chat</h1>
          <p className="page-subtitle">{symbol ? `Discussing ${symbol}` : 'Ask about any company report'}</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'ai' ? 'AI' : 'U'}
              </div>
              <div className="message-content">
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message ai">
              <div className="message-avatar">AI</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="chat-suggestions">
            <p>Try asking:</p>
            <div className="suggestion-chips">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Ask about the company..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
