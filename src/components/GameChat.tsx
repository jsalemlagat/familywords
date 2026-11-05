/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage, ThemeMode, THEME_CONFIGS } from '../types/game';

interface GameChatProps {
  messages: ChatMessage[];
  myPlayerId: string;
  theme: ThemeMode;
  onSendMessage: (text: string) => void;
}

export const GameChat: React.FC<GameChatProps> = ({
  messages = [],
  myPlayerId,
  theme,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const themeCfg = THEME_CONFIGS[theme];

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      if (!isOpen) {
        setUnreadCount((prev) => prev + (messages.length - prevMessagesLengthRef.current));
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="fixed bottom-4 right-4 z-40 p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white shadow-xl flex items-center justify-center transition active:scale-95 cursor-pointer border border-amber-400/40"
          title="Open Room Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-3xl backdrop-blur-xl border shadow-2xl flex flex-col overflow-hidden max-h-[500px] transition-colors ${
            themeCfg.isLight
              ? 'bg-white/95 border-amber-900/15 text-stone-900 shadow-stone-900/20'
              : 'bg-[#22150D]/95 border-amber-900/60 text-white shadow-black/60'
          }`}
        >
          {/* Chat Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${
              themeCfg.isLight ? 'bg-amber-50/80 border-stone-200' : 'bg-black/40 border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-4 h-4 ${themeCfg.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${themeCfg.isLight ? 'text-stone-800' : 'text-amber-100'}`}>
                Multiplayer Room Chat
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                themeCfg.isLight ? 'text-stone-500 hover:bg-stone-200' : 'text-amber-300 hover:bg-white/10'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[340px]">
            {messages.length === 0 ? (
              <div className={`text-center py-12 text-xs ${themeCfg.isLight ? 'text-stone-400' : 'text-amber-200/40'}`}>
                No chat messages yet. Say hello to your opponents!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.playerId === myPlayerId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      <span
                        className={`text-[10px] font-bold ${
                          themeCfg.isLight ? (isMe ? 'text-amber-800' : 'text-stone-600') : 'text-amber-300/80'
                        }`}
                      >
                        {isMe ? 'You' : msg.playerName}
                      </span>
                      <span className={`text-[9px] font-mono ${themeCfg.isLight ? 'text-stone-400' : 'text-white/30'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed break-words ${
                        isMe
                          ? 'bg-amber-600 text-white rounded-tr-none shadow-xs'
                          : themeCfg.isLight
                          ? 'bg-stone-100 text-stone-800 rounded-tl-none border border-stone-200/80'
                          : 'bg-white/10 text-amber-50 rounded-tl-none border border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleSend}
            className={`p-3 border-t flex items-center gap-2 ${
              themeCfg.isLight ? 'bg-stone-50 border-stone-200' : 'bg-black/50 border-white/10'
            }`}
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              maxLength={200}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-amber-500 border transition ${
                themeCfg.isLight
                  ? 'bg-white border-stone-300 text-stone-900 placeholder-stone-400'
                  : 'bg-white/5 border-white/15 text-white placeholder-white/40'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
