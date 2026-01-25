import { Copy, CheckCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ShareLinkButtonProps {
    studentId: string;
    admissionNumber: string;
}

export default function ShareIDCardLink({ studentId, admissionNumber }: ShareLinkButtonProps) {
    const [copied, setCopied] = useState(false);
    const [showLink, setShowLink] = useState(false);

    const generateLink = () => {
        // Generate a secure token (in production, this should be done on backend)
        const token = btoa(studentId); // Simple encoding for demo
        const link = `${window.location.origin}/id-card/${token}`;

        setShowLink(true);

        // Copy to clipboard
        navigator.clipboard.writeText(link);
        setCopied(true);

        setTimeout(() => setCopied(false), 3000);
    };

    const shareLink = async () => {
        const token = btoa(studentId);
        const link = `${window.location.origin}/id-card/${token}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `ID Card Review for ${admissionNumber}`,
                    text: 'Please review and approve your ID card information',
                    url: link
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            // Fallback to copy
            generateLink();
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Button
                    onClick={generateLink}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                    {copied ? (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Link Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                        </>
                    )}
                </Button>
                <Button
                    onClick={shareLink}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                </Button>
            </div>

            {showLink && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <p className="font-semibold text-blue-900 mb-1">Shareable Link:</p>
                    <p className="text-blue-700 break-all font-mono">
                        {`${window.location.origin}/id-card/${btoa(studentId)}`}
                    </p>
                    <p className="text-blue-600 mt-2 text-xs">
                        Send this link to student/parent for review and approval
                    </p>
                </div>
            )}
        </div>
    );
}
