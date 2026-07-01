import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FaRobot,
  FaPaperPlane,
  FaLightbulb,
  FaSyncAlt,
  FaSpinner
} from 'react-icons/fa';

const SUGGESTIONS = [
  "Analyze my budget leaks",
  "Is my savings goal realistic?",
  "Review my risk tolerance and asset allocation",
  "Am I covered adequately by insurance?",
  "How can I save more money?"
];

function AIAdvisor() {
  const { API_URL, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        sender: 'advisor',
        text: `Hello ${user?.name || 'there'}! I am your personal FinBuddy AI Advisor. 

I have synchronized your active monthly income (₹${(user?.monthlyIncome || 0).toLocaleString()}), goals, holdings, and risk profile. 

Ask me anything about your budgeting, investments, protection coverages, or strategy calculations!`
      }
    ]);
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) setInputText('');

    const userMessage = { sender: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/advisor/chat`,
        {
          message: text,
          chatHistory: messages.slice(-10) // Send last 10 messages for conversational context
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data && res.data.reply) {
        setMessages(prev => [...prev, { sender: 'advisor', text: res.data.reply }]);
      } else {
        throw new Error('Empty reply');
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'advisor',
          text: "I apologize, but I encountered a temporary connection issue. Please check your network and try again."
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (!window.confirm('Reset conversation?')) return;
    setMessages([
      {
        sender: 'advisor',
        text: `Welcome back! Conversation logs refreshed. Ask me anything about your current budget leaks, investment gaps, or insurance coverage policies!`
      }
    ]);
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-900 shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <FaRobot className="text-teal-400 animate-pulse" /> AI Financial Advisor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Converse with your dedicated finance coach. Ask strategy questions personalized to your financial profile.
          </p>
        </div>

        <button
          onClick={handleClearChat}
          className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FaSyncAlt size={10} /> Clear Logs
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8 min-h-0">
        {/* Suggestion Sidebar (1-Col) */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit space-y-4">
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <FaLightbulb className="text-yellow-500" /> Prompt Suggestions
          </h3>
          
          <div className="flex flex-col gap-2.5">
            {SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sug)}
                disabled={sending}
                className="w-full text-left p-3 bg-slate-950 hover:bg-slate-850 border border-slate-855 rounded-xl text-slate-400 hover:text-slate-200 transition-all text-xs font-medium leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                "{sug}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat Terminal Area (3-Cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[550px] overflow-hidden relative">
          
          {/* Messages Log Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-855 text-slate-300 rounded-bl-none font-light whitespace-pre-wrap'
                  }`}>
                    {/* Render message formatting bold text cleanly */}
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-855 text-slate-500 rounded-2xl rounded-bl-none p-4 text-xs flex items-center gap-2">
                  <FaSpinner className="animate-spin text-teal-400" />
                  <span>Advisor is analyzing your records...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Footer Input */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
              placeholder="Ask Advisor (e.g. Explain the 50/30/20 rule)..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl px-4 py-3 text-xs font-medium text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !inputText.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaPaperPlane size={12} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AIAdvisor;
