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
    const [error, setError] = useState<string | null>(null);

    const getBaseUrl = () => {
        if (typeof window === 'undefined') return '';
        return window.location.origin;
    };

    const generateLink = () => {
        try {
            setError(null);
            // Generate a secure token (in production, this should be done on backend)
            const token = btoa(studentId); // Simple encoding for demo
            const baseUrl = getBaseUrl();

            if (!baseUrl) {
                setError('Unable to generate link');
                return;
            }

            const link = `${baseUrl}/id-card/${token}`;

            setShowLink(true);

            // Copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
            } else {
                setError('Clipboard not supported');
            }
        } catch (err) {
            console.error('Error generating link:', err);
            setError('Failed to generate link');
        }
    };

    const shareLink = async () => {
        try {
            setError(null);
            const token = btoa(studentId);
            const baseUrl = getBaseUrl();

            if (!baseUrl) {
                setError('Unable to generate link');
                return;
            }

            const link = `${baseUrl}/id-card/${token}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `ID Card Review for ${admissionNumber}`,
                        text: 'Please review and approve your ID card information',
                        url: link
                    });
                } catch (err) {
                    console.error('Error sharing:', err);
                    // User cancelled or error - fallback to copy
                    generateLink();
                }
            } else {
                // Fallback to copy
                generateLink();
            }
        } catch (err) {
            console.error('Error in shareLink:', err);
            setError('Failed to share link');
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

            {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    {error}
                </div>
            )}

            {showLink && !error && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <p className="font-semibold text-blue-900 mb-1">Shareable Link:</p>
                    <p className="text-blue-700 break-all font-mono">
                        {`${getBaseUrl()}/id-card/${btoa(studentId)}`}
                    </p>
                    <p className="text-blue-600 mt-2 text-xs">
                        Send this link to student/parent for review and approval
                    </p>
                </div>
            )}
        </div>
    );
}
