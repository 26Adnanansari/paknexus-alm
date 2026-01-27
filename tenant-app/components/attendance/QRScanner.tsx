'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        let scanner: Html5QrcodeScanner | null = null;

        // Add a small delay to ensure DOM is ready
        const initScanner = setTimeout(() => {
            const readerElement = document.getElementById("reader");
            if (!readerElement) {
                console.error("QR reader element not found");
                return;
            }

            scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    if (scanner) {
                        scanner.clear().catch(err => console.error("Clear error:", err));
                    }
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // parse error, ignore it.
                    // setScanError(errorMessage);
                }
            );
        }, 100);

        return () => {
            clearTimeout(initScanner);
            if (scanner) {
                scanner.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
            }
        };
    }, [onScan]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        >
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Scan Student ID</h3>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                <div className="p-6 bg-slate-900 flex justify-center min-h-[400px]">
                    <div id="reader" className="w-full max-w-[350px] overflow-hidden rounded-xl border-2 border-slate-700"></div>
                </div>

                <div className="p-4 bg-white text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Point camera at the QR code on the Student ID Card.
                        <br />Works with PC Webcam or Mobile Camera.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
