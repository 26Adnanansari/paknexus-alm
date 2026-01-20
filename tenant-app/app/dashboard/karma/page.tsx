'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

export default function KarmaPage() {
    // Mock Data for "Mobile Responsive" Demo
    const leaderboard = [
        { rank: 1, name: "Zara Ali", class: "Grade 10-A", points: 2450, badge: "Legend" },
        { rank: 2, name: "Ahmed Khan", class: "Grade 9-B", points: 2100, badge: "Master" },
        { rank: 3, name: "Sara Smith", class: "Grade 10-A", points: 1950, badge: "Expert" },
        { rank: 4, name: "John Doe", class: "Grade 8-C", points: 1250, badge: "Rising Star" },
        { rank: 5, name: "Fatima Noor", class: "Grade 9-A", points: 1100, badge: "Rookie" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Karma Leaderboard</h1>
                    <p className="text-muted-foreground">Top performing students this month.</p>
                </div>
            </div>

            {/* Podium (Top 3) */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 items-end mb-12 h-64">
                {/* 2nd Place */}
                <motion.div
                    initial={{ height: 0 }} animate={{ height: '70%' }}
                    className="bg-slate-100 dark:bg-slate-800 rounded-t-3xl p-4 flex flex-col items-center justify-end shadow-lg relative order-1 md:order-1"
                >
                    <div className="absolute -top-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-300 border-4 border-white shadow-xl mb-2" />
                        <span className="font-bold text-sm text-center">{leaderboard[1].name}</span>
                        <div className="bg-gray-200 px-2 py-0.5 rounded text-xs font-bold text-gray-600">{leaderboard[1].points} pts</div>
                    </div>
                    <div className="text-4xl font-black text-gray-300/50">2</div>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                    initial={{ height: 0 }} animate={{ height: '100%' }}
                    className="bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/20 border-t-4 border-yellow-400 rounded-t-3xl p-4 flex flex-col items-center justify-end shadow-2xl relative z-10 order-2 md:order-2"
                >
                    <Crown className="w-8 h-8 text-yellow-500 absolute top-4 animate-bounce" />
                    <div className="absolute -top-12 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-white shadow-xl mb-2 relative">
                            <div className="absolute -bottom-2 -right-2 bg-black text-white text-xs px-1.5 py-0.5 rounded-full border-2 border-white">#1</div>
                        </div>
                        <span className="font-bold text-base text-center">{leaderboard[0].name}</span>
                        <div className="bg-yellow-100 px-3 py-1 rounded-full text-xs font-bold text-yellow-700">{leaderboard[0].points} pts</div>
                    </div>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                    initial={{ height: 0 }} animate={{ height: '60%' }}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-t-3xl p-4 flex flex-col items-center justify-end shadow-md relative order-3 md:order-3"
                >
                    <div className="absolute -top-10 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-orange-200 border-4 border-white shadow-xl mb-2" />
                        <span className="font-bold text-sm text-center">{leaderboard[2].name}</span>
                        <div className="bg-orange-100 px-2 py-0.5 rounded text-xs font-bold text-orange-600">{leaderboard[2].points} pts</div>
                    </div>
                    <div className="text-4xl font-black text-orange-300/50">3</div>
                </motion.div>
            </div>

            {/* List View */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                {leaderboard.slice(3).map((user, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={user.rank}
                        className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <div className="flex items-center space-x-4">
                            <span className="text-xl font-bold text-slate-400 w-8 text-center">{user.rank}</span>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold">{user.name}</h3>
                                <p className="text-xs text-muted-foreground">{user.class}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white">{user.points}</div>
                            <div className="text-xs text-slate-500">pts</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
