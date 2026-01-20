'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Medal, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

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
            className="col-span-12 md:col-span-4 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl"
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                        <Trophy className="h-4 w-4 text-yellow-300" />
                        <span className="text-sm font-bold">Karma Points</span>
                    </div>
                    {stats.rank > 0 && (
                        <div className="text-sm font-medium opacity-90">
                            Rank #{stats.rank}
                        </div>
                    )}
                </div>

                <div className="flex items-baseline space-x-1 mb-8">
                    {loading ? (
                        <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg" />
                    ) : (
                        <h2 className="text-5xl font-black tracking-tighter">
                            {stats.total_points.toLocaleString()}
                        </h2>
                    )}
                    <span className="text-violet-200 font-medium">pts</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex -space-x-3">
                        {loading ? (
                            [1, 2].map(i => <div key={i} className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />)
                        ) : (
                            stats.badges.map((b: any, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/10 border-2 border-purple-500 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform cursor-help" title={b.name}>
                                    <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                                </div>
                            ))
                        )}
                        {stats.badges.length > 3 && (
                            <div className="w-10 h-10 rounded-full bg-slate-900/50 border-2 border-purple-500 flex items-center justify-center text-xs font-bold">
                                +{stats.badges.length - 3}
                            </div>
                        )}
                    </div>

                    <a href="/dashboard/karma" className="flex items-center space-x-1 text-sm font-bold text-yellow-300 hover:text-yellow-200 transition-colors">
                        <span>Leaderboard</span>
                        <TrendingUp className="h-4 w-4" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
