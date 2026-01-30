import React, { useEffect, useState } from 'react';
import { useBranding } from '@/context/branding-context';
import api from '@/lib/api'; // Use lib/api for consistency
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeeReceiptProps {
    paymentId: string;
    onClose?: () => void;
}

interface ReceiptData {
    payment_id: string;
    payment_date: string;
    amount_paid: number;
    payment_method: string;
    remarks: string;
    student_name: string;
    admission_number: string;
    current_class: string;
    father_name: string;
    month_year: string;
}

export default function FeeReceipt({ paymentId, onClose }: FeeReceiptProps) {
    const { branding } = useBranding();
    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                const res = await api.get(`/fees/receipt/${paymentId}`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch receipt", error);
            } finally {
                setLoading(false);
            }
        };

        if (paymentId) fetchReceipt();
    }, [paymentId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (!data) return <div className="text-center text-red-500 p-8">Receipt not found</div>;

    return (
        <div className="bg-white rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Scrollable Receipt Area */}
            <div className="overflow-y-auto p-8" id="printable-receipt">
                <div className="border border-slate-900 p-8 max-w-2xl mx-auto bg-white text-slate-900 print:border-2 print:border-black">
                    {/* Header */}
                    <div className="text-center border-b border-slate-900 pb-6 mb-6">
                        <div className="flex items-center justify-center gap-4 mb-2">
                            {branding?.logo_url && <img src={branding.logo_url} className="h-16 w-16 object-contain" alt="Logo" />}
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-wider">{branding?.name || 'School Name'}</h1>
                                <p className="text-xs font-medium text-slate-600">Excellence in Education</p>
                            </div>
                        </div>
                        <div className="inline-block bg-slate-900 text-white px-4 py-1 text-sm font-bold uppercase tracking-widest mt-2">
                            Fee Receipt
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex justify-between text-sm mb-8">
                        <div>
                            <p className="text-slate-500">Receipt No</p>
                            <p className="font-mono font-bold">{data.payment_id.slice(0, 8)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-500">Date</p>
                            <p className="font-bold">{new Date(data.payment_date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Student Name</p>
                            <p className="font-bold text-lg">{data.student_name}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Admission No</p>
                            <p className="font-bold font-mono">{data.admission_number}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Father Name</p>
                            <p className="font-bold">{data.father_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs uppercase font-bold">Class</p>
                            <p className="font-bold">{data.current_class}</p>
                        </div>
                    </div>

                    {/* Payment Table */}
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-y border-slate-300">
                                <th className="text-left py-2 px-3 text-xs uppercase font-bold text-slate-600">Description</th>
                                <th className="text-right py-2 px-3 text-xs uppercase font-bold text-slate-600">Amount (PKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="py-3 px-3 font-medium">
                                    Monthly Fee ({data.month_year})
                                    {data.remarks && <p className="text-xs text-slate-500 italic mt-1">{data.remarks}</p>}
                                </td>
                                <td className="py-3 px-3 text-right font-bold">{data.amount_paid.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-900">
                                <td className="py-3 px-3">Total Paid</td>
                                <td className="py-3 px-3 text-right text-lg">{data.amount_paid.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Footer Info */}
                    <div className="flex justify-between items-end mt-12 pt-8">
                        <div className="text-xs text-slate-500">
                            <p>Payment Mode: <span className="font-bold uppercase text-slate-900">{data.payment_method}</span></p>
                            <p>Generated by Almsaas ERP</p>
                        </div>
                        <div className="text-center">
                            <div className="h-px w-32 bg-slate-400 mb-2"></div>
                            <p className="text-xs font-bold uppercase text-slate-600">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 print:hidden">
                {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
                <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                     /* A4 size simulation or fit logic if needed */
                     @page {
                        margin: 0;
                        size: auto; 
                     }
                }
            `}</style>
        </div>
    );
}
