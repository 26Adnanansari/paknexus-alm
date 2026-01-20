'use client';

import React from 'react';
import MomentsFeed from '@/components/social/MomentsFeed';


export default function MomentsPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Moments</h1>
                    <p className="text-slate-500">Highlights and memories from our campus.</p>
                </div>
                {/* 
                <button className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200">
                    <Camera size={20} />
                    <span>Share Moment</span>
                </button>
                */}
            </div>

            <MomentsFeed />
        </div>
    );
}

