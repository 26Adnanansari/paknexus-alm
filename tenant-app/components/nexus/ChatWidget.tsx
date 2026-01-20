'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { useSession } from 'next-auth/react'; // Optional: Use session to personalize greeting
import api from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Call Nexus API
            // Note: Ensure /api/v1/nexus/chat is accessible. 
            // If CORS issues persist locally, might need fallback or proxy.
            const res = await api.post('/nexus/chat', {
                message: userMsg,
                history: messages
            });

            setMessages(prev => [...prev, res.data]);
        } catch (error) {
            console.error("Nexus Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to the school servers right now. Please try again later."
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Launcher Button (FAB) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 md:p-5 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all group flex items-center justify-center"
                        aria-label="Open Nexus AI"
                    >
                        {messages.length === 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                        <MessageSquare className="h-6 w-6 md:h-7 md:w-7 group-hover:animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed z-[110] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col 
                            /* Mobile: Full Screen */
                            inset-0 md:inset-auto md:bottom-24 md:right-10 md:w-[400px] md:h-[600px] md:rounded-3xl border border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center space-x-3 text-white">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-none">Nexus AI</h3>
                                    <span className="text-blue-100 text-xs flex items-center gap-1 mt-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        Online Assistant
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                {window.innerWidth < 768 ? <ChevronDown className="h-6 w-6" /> : <X className="h-5 w-5" />}
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-800/50">
                            {/* Instruction / Welcome Box */}
                            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-2xl text-sm mb-6">
                                <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4" />
                                    How to use Nexus
                                </h4>
                                <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside ml-1">
                                    <li>Ask about <strong>student attendance</strong>.</li>
                                    <li>Check <strong>fee collection</strong> status.</li>
                                    <li>Find <strong>teacher details</strong>.</li>
                                    <li>Get help navigating the dashboard.</li>
                                </ul>
                            </div>

                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`
                                            max-w-[85%] p-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm
                                            ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-tl-none'}
                                        `}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your question..."
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-500 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-base"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || loading}
                                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
