'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp } from 'lucide-react';
// import api from '@/lib/api';

interface Badge {
    name: string;
    description: string;
    icon_name: string;
}

interface KarmaStats {
    total_points: number;
    badges: Badge[];
    rank: number;
}

export default function KarmaCard() {
    const [stats, setStats] = React.useState<KarmaStats>({ total_points: 0, badges: [], rank: 0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchKarma = async () => {
            try {
                // In a real scenario, this fetches from /api/v1/karma/my-karma
                // Simulating response for UI dev immediately
                // const res = await api.get('/karma/my-karma');
                // setStats(res.data);

                // MOCK DATA for immediate visual feedback
                setTimeout(() => {
                    setStats({
                        total_points: 1250,
                        badges: [
                            { name: 'Early Bird', description: 'Always on time', icon_name: 'Sun' },
                            { name: 'Top Scorer', description: 'Ace exams', icon_name: 'Award' }
                        ],
                        rank: 4
                    });
                    setLoading(false);
                }, 800);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchKarma();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 md:col-span-4 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-4 text-white relative overflow-hidden shadow-xl min-h-[140px] flex flex-col justify-between"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/10 rounded-full blur-xl -ml-4 -mb-4" />

            <div className="relative z-10 w-full">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                        <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                        <span className="text-xs font-bold">Reputation Score</span>
                    </div>
                </div>

                <div className="flex items-baseline space-x-1 mb-4">
                    {loading ? (
                        <div className="h-8 w-20 bg-white/20 animate-pulse rounded-lg" />
                    ) : (
                        <h2 className="text-4xl font-black tracking-tighter leading-none text-white">
                            {stats.total_points.toLocaleString()}
                        </h2>
                    )}
                    <span className="text-violet-200 text-sm font-medium">pts</span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex -space-x-2">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />)
                        ) : (
                            stats.badges.map((b: Badge, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-purple-400 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform cursor-help" title={b.name}>
                                    <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                                </div>
                            ))
                        )}
                    </div>

                    {stats.rank > 0 && (
                        <div className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                            #{stats.rank} Rank
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
