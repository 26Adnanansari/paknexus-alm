'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageCircle, Clock, Plus, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import StudentSelector, { StudentCompact } from '@/components/ui/student-selector';
import StudentAvatar from '@/components/ui/student-avatar';
import { cn } from '@/lib/utils';

interface Message {
    message_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

interface Conversation {
    other_id: string;
    other_name: string;
    other_photo?: string;
    content: string; // Last message
    created_at: string; // Last message time
    is_read: boolean;
}

export default function ChatWindow() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // New Chat State
    const [showNewChat, setShowNewChat] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Load Messages when Active Chat changes
    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.other_id);
            const interval = setInterval(() => fetchMessages(activeChat.other_id), 5000); // Poll active chat every 5s
            return () => clearInterval(interval);
        }
    }, [activeChat]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async (userId: string) => {
        try {
            const res = await api.get(`/chat/history/${userId}`);
            setMessages(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const tempMsg: Message = {
            message_id: 'temp-' + Date.now(),
            sender_id: 'me', // Placeholder
            receiver_id: activeChat.other_id,
            content: newMessage,
            is_read: false,
            created_at: new Date().toISOString()
        };

        // Optimistic UI
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            await api.post('/chat/send', {
                receiver_id: activeChat.other_id,
                receiver_type: 'student', // Default for now
                content: tempMsg.content
            });
            fetchMessages(activeChat.other_id); // Refresh to get real ID
            fetchConversations(); // Refresh sidebar list
        } catch (error) {
            toast.error('Failed to send');
            setMessages(prev => prev.filter(m => m.message_id !== tempMsg.message_id));
        }
    };

    const startNewChat = (students: StudentCompact[]) => {
        if (students.length === 0) return;
        const student = students[0];

        // Check if exists
        const existing = conversations.find(c => c.other_id === student.student_id);
        if (existing) {
            setActiveChat(existing);
        } else {
            // Create temporary conversation object
            const newConv: Conversation = {
                other_id: student.student_id,
                other_name: student.full_name,
                other_photo: student.photo_url,
                content: '',
                created_at: new Date().toISOString(),
                is_read: true
            };
            setActiveChat(newConv);
            setConversations(prev => [newConv, ...prev]);
        }
        setShowNewChat(false);
    };

    return (
        <div className="flex h-[700px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageCircle size={20} className="text-purple-600" />
                        Messages
                    </h3>
                    <button
                        onClick={() => setShowNewChat(true)}
                        className="p-2 hover:bg-slate-100 rounded-full text-purple-600 transition-colors"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 && (
                        <div className="text-center p-8 text-slate-400 text-sm">
                            No conversations yet. Start a new chat!
                        </div>
                    )}
                    {conversations.map(conv => (
                        <div
                            key={conv.other_id}
                            onClick={() => setActiveChat(conv)}
                            className={cn(
                                "p-4 cursor-pointer hover:bg-white transition-all border-b border-transparent hover:border-slate-100",
                                activeChat?.other_id === conv.other_id ? "bg-white border-l-4 border-l-purple-600 shadow-sm" : "border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <StudentAvatar name={conv.other_name} photoUrl={conv.other_photo || null} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{conv.other_name}</h4>
                                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">
                                            {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className={cn("text-xs truncate mt-1", !conv.is_read ? "font-bold text-slate-900" : "text-slate-500")}>
                                        {conv.content || 'Start a conversation...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                            <StudentAvatar name={activeChat.other_name} photoUrl={activeChat.other_photo || null} />
                            <div>
                                <h3 className="font-bold text-slate-900">{activeChat.other_name}</h3>
                                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Online
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender_id !== activeChat.other_id && msg.sender_id !== 'student'; // Assuming 'student' is the other side's type usually, but we check ID
                                // Better logic:
                                // In get_history, we return sender_id.
                                // If sender_id == current_user.id (BUT we don't have current user id here easily without context).
                                // Wait, the API returns "sender_id".
                                // We know "activeChat.other_id" is the other person.
                                // So if msg.sender_id === activeChat.other_id, it is THEM. Else it is ME.
                                const isThem = msg.sender_id === activeChat.other_id;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg.message_id || idx}
                                        className={cn(
                                            "flex w-full",
                                            isThem ? "justify-start" : "justify-end"
                                        )}
                                    >
                                        <div className={cn(
                                            "max-w-[70%] p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed relative group",
                                            isThem ? "bg-white text-slate-700 rounded-tl-none border border-slate-100" : "bg-purple-600 text-white rounded-tr-none"
                                        )}>
                                            {msg.content}
                                            <span className={cn(
                                                "block text-[10px] mt-2 opacity-70",
                                                isThem ? "text-slate-400" : "text-purple-200"
                                            )}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-2 items-end bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                                <textarea
                                    className="flex-1 bg-transparent border-none outline-none p-2 text-sm font-medium resize-none max-h-32 min-h-[44px]"
                                    placeholder="Type your message..."
                                    rows={1}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <MessageCircle size={64} className="mb-4 opacity-20" />
                        <p className="font-bold text-slate-400">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewChat(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-lg mb-4">Start New Message</h3>
                            <StudentSelector
                                onSelect={(s) => startNewChat(s)}
                                className="h-96 border-0 shadow-none p-0"
                            />
                            <button
                                onClick={() => setShowNewChat(false)}
                                className="mt-4 w-full py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
