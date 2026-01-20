/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import api from '@/lib/api';

interface Moment {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
    status: string;
    // Add User info if we join it in backend, currently not in simple schema
    // assuming we might fetch logic to show who posted it later.
}

export default function MomentsFeed() {
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMoments();
    }, []);

    const fetchMoments = async () => {
        try {
            const res = await api.get('/moments/');
            setMoments(res.data);
        } catch (error) {
            console.error("Failed to fetch moments:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-3xl h-96 animate-pulse bg-slate-100" />
                ))}
            </div>
        );
    }

    if (moments.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-slate-500">No moments shared yet. Be the first!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moments.map((moment, index) => (
                <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                    <div className="relative aspect-[4/3] bg-slate-100">
                        <img
                            src={moment.image_url}
                            alt={moment.caption}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-white text-sm line-clamp-2">{moment.caption}</p>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-pink-500 transition-colors">
                                    <Heart size={20} />
                                    <span className="text-xs font-medium">0</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors">
                                    <MessageCircle size={20} />
                                    <span className="text-xs font-medium">0</span>
                                </button>
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <Share2 size={20} />
                            </button>
                        </div>
                        {moment.caption && (
                            <p className="mt-3 text-sm text-slate-700 line-clamp-2">{moment.caption}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                            {new Date(moment.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
