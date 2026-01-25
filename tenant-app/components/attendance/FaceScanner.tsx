'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

interface MatchResult {
    match: boolean;
    user_id?: string;
    name?: string;
    user_type?: string;
    detail?: string;
}

interface FaceScannerProps {
    onMatch: (result: MatchResult) => void;
}

export default function FaceScanner({ onMatch }: FaceScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            toast.error("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureAndIdentify = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsScanning(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dims to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw frame
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsScanning(false);
                    return;
                }

                const formData = new FormData();
                formData.append('file', blob, 'capture.jpg');
                formData.append('role', 'all'); // Check both students and staff

                try {
                    const res = await api.post('/biometrics/identify', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (res.data.match) {
                        setLastMatch(res.data);
                        onMatch(res.data);
                        toast.success(`Identified: ${res.data.name} (${res.data.user_type})`);
                    } else {
                        setLastMatch(null);
                        toast.error("Face not recognized");
                    }
                } catch (e) {
                    console.error("Identification failed", e);
                    toast.error("Identification failed. Please try again.");
                } finally {
                    setIsScanning(false);
                }
            }, 'image/jpeg', 0.8);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full h-full max-w-md mx-auto">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-green-400 font-mono flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            LIVE FEED
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-48 h-48 border-2 border-white/20 rounded-full relative">
                            <div className="absolute inset-0 border-t-2 border-green-500 rounded-full animate-spin duration-[3000ms]" />
                        </div>
                    </div>

                    <div className="text-center">
                        {isScanning ? (
                            <span className="bg-black/70 text-white px-3 py-1 rounded-full text-sm animate-pulse">Processing...</span>
                        ) : lastMatch ? (
                            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center justify-center gap-2">
                                <UserCheck size={14} /> {lastMatch.name}
                            </span>
                        ) : (
                            <span className="text-white/50 text-xs">Align face within circle</span>
                        )}
                    </div>
                </div>
            </div>

            <Button
                onClick={captureAndIdentify}
                disabled={isScanning}
                className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
            >
                {isScanning ? (
                    <>Processing...</>
                ) : (
                    <><Camera className="mr-2" /> Scan Face</>
                )}
            </Button>
        </div>
    );
}
