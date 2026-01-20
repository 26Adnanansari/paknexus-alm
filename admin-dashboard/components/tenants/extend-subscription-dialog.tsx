'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { tenantsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, addDays } from 'date-fns';

interface ExtendSubscriptionDialogProps {
    tenantId: string;
    tenantName: string;
    currentExpiry: string;
    onSuccess: () => void;
}

export function ExtendSubscriptionDialog({
    tenantId,
    tenantName,
    currentExpiry,
    onSuccess,
}: ExtendSubscriptionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [extendBy, setExtendBy] = useState('1'); // Months
    const [reason, setReason] = useState('Renewal');

    const handleExtend = async () => {
        setIsSubmitting(true);
        try {
            const months = parseInt(extendBy);
            const days = months * 30; // Simple approximation for now

            await tenantsApi.extend(tenantId, {
                extension_days: days,
                payment_reference: reason, // Using reason as reference for now
                amount: months * 50, // Mock amount: $50/month
                notes: `Extended by ${months} months. Reason: ${reason}`
            });

            toast.success(`Subscription extended for ${tenantName}`);
            setIsOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to extend subscription');
        } finally {
            setIsSubmitting(false);
        }
    };

    const newExpiryDate = addDays(new Date(currentExpiry), parseInt(extendBy) * 30);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Extend Subscription
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Extend Subscription</DialogTitle>
                    <DialogDescription>
                        Manually extend the subscription for {tenantName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid items-center gap-4">
                        <Label htmlFor="current-expiry">Current Expiry</Label>
                        <Input
                            id="current-expiry"
                            value={format(new Date(currentExpiry), 'PPP')}
                            disabled
                            className="bg-gray-50"
                        />
                    </div>
                    <div className="grid items-center gap-4">
                        <Label htmlFor="extend-by">Extend By (Months)</Label>
                        <Input
                            id="extend-by"
                            type="number"
                            min="1"
                            max="120"
                            value={extendBy}
                            onChange={(e) => setExtendBy(e.target.value)}
                        />
                    </div>
                    <div className="grid items-center gap-4">
                        <Label htmlFor="reason">Reason</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Annual Renewal, Promotion"
                        />
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-xs text-blue-700 font-medium">New Expiry Date:</p>
                        <p className="text-sm font-bold text-blue-900">{format(newExpiryDate, 'PPP')}</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleExtend}
                        disabled={isSubmitting || !extendBy}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? 'Extending...' : 'Confirm Extension'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
