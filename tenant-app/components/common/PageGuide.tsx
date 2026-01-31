import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageGuideProps {
    title: string;
    description: string;
    steps?: string[];
}

export default function PageGuide({ title, description, steps }: PageGuideProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 relative"
            >
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Info size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900 text-sm mb-1">{title}</h3>
                        <p className="text-sm text-blue-700 leading-relaxed mb-2">{description}</p>
                        {steps && steps.length > 0 && (
                            <ul className="list-disc list-inside text-xs text-blue-800 space-y-1 ml-1 opacity-80">
                                {steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
