'use client';

import { useState, useEffect } from 'react';
import { Calendar, Heart, Share2, ImageIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Moment {
    id: string;
    image_url: string;
    caption: string;
    created_at: string;
}

export default function MomentsPage() {
    const { data: session } = useSession();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMoments = async () => {
            try {
                // In a real scenario, this fetches from the backend
                // dependent on the user's tenant context.
                // Using a relative URL assuming the Tenant App has a proxy 
                // set up or we call the API directly using env var.

                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/v1/moments`, {
                    headers: {
                        // Pass the token if available to get context
                        'Authorization': `Bearer ${(session?.user as any)?.accessToken || ''}`,
                        'X-Tenant-ID': (session?.user as any)?.tenantId || ''
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setMoments(data);
                } else {
                    console.error("Failed to fetch moments:", res.status);
                    // Fallback for demo/local testing if CORS fails
                    if (window.location.hostname === 'localhost') {
                        throw new Error("Force mock on local fetch failure");
                    }
                }
            } catch (error) {
                console.error("Error loading moments:", error);
                // Show mock data locally so we can verify UI structure even if API fails
                if (window.location.hostname === 'localhost') {
                    setMoments([
                        {
                            id: '1',
                            image_url: 'https://images.unsplash.com/photo-1544456041-35b912165b4f?auto=format&fit=crop&q=80&w=1000',
                            caption: 'What an amazing Sports Day! 🏃‍♂️🏆 So proud of all our students who participated.',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: '2',
                            image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
                            caption: 'Science Fair 2024 was a blast. Look at these incredible projects!',
                            created_at: new Date().toISOString()
                        }
                    ]);
                }
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchMoments();
        } else {
            // Fallback if no session locally
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                fetchMoments();
            } else {
                setLoading(false);
            }
        }
    }, [session]);

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
            <div className="text-center md:text-left space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">School Moments</h1>
                <p className="text-slate-500">Highlights and memories from our campus.</p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {moments.map((moment, i) => (
                        <div
                            key={moment.id}
                            className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
                        >
                            <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                {moment.image_url ? (
                                    <img
                                        src={moment.image_url}
                                        alt="Moment"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <div className="flex gap-4 text-white">
                                        <button className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors">
                                            <Heart size={20} />
                                        </button>
                                        <button className="p-2 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors">
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
                                    <Calendar size={14} />
                                    {new Date(moment.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                                <p className="text-slate-700 leading-relaxed font-medium">
                                    {moment.caption}
                                </p>
                            </div>
                        </div>
                    ))}

                    {moments.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No moments shared yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
