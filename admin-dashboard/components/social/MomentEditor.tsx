'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, X, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const momentSchema = z.object({
    caption: z.string().max(280, "Caption too long"),
    status: z.enum(["DRAFT", "PUBLISHED"]),
});

type MomentFormValues = z.infer<typeof momentSchema>;

interface MomentEditorProps {
    orderId?: string;
    onSuccess?: (moment: MomentFormValues) => void;
}

export default function MomentEditor({ orderId, onSuccess }: MomentEditorProps) {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MomentFormValues>({
        resolver: zodResolver(momentSchema),
        defaultValues: {
            caption: '',
            status: 'DRAFT'
        }
    });

    const status = watch("status");
    const isPublished = status === "PUBLISHED";

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, upload to S3/Blob storage here.
            // For demo, we just use a local object URL or base64.
            const url = URL.createObjectURL(file);
            setImage(url);
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary configuration missing");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Image upload failed");
        }

        const data = await res.json();
        return data.secure_url;
    };

    const onSubmit = async (data: MomentFormValues) => {
        const fileInput = (document.getElementById('file-upload') as HTMLInputElement)?.files?.[0];
        if (!fileInput && !image) {
            setError("Please upload an image first.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            let uploadedUrl = image;

            // Only upload if verified file object (not just preview URL)
            // Ideally we store file in state, but accessing via DOM is okay for now or we update state
            if (fileInput) {
                uploadedUrl = await uploadToCloudinary(fileInput);
            }

            const payload = {
                ...data,
                image_url: uploadedUrl,
                order_id: orderId
            };

            console.log("Submitting Moment:", payload);

            // Real API Call
            const token = (window as any).__NEXT_DATA__?.props?.pageProps?.session?.accessToken;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/moments/`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to post");

            if (onSuccess) onSuccess(payload);

        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to share moment. Try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
            <CardContent className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Image Uploader */}
                    <div className="space-y-2">
                        <Label>Moment Image</Label>
                        <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 dark:border-gray-100/25 px-6 py-10 hover:bg-slate-100/50 transition-colors relative overflow-hidden group">

                            {image ? (
                                <div className="relative w-full h-64">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={image} alt="Preview" className="w-full h-full object-contain rounded" />
                                    <button
                                        type="button"
                                        onClick={() => setImage(null)}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                                        >
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Caption */}
                    <div className="space-y-2">
                        <Label>Caption</Label>
                        <Textarea
                            {...register("caption")}
                            placeholder="Share a memory about this order..."
                            className="resize-none"
                        />
                        {errors.caption && <p className="text-red-500 text-sm">{errors.caption.message as string}</p>}
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="publish-mode"
                                checked={isPublished}
                                onCheckedChange={(c) => setValue("status", c ? "PUBLISHED" : "DRAFT")}
                            />
                            <Label htmlFor="publish-mode" className="cursor-pointer">
                                {isPublished ? "Publish Immediately" : "Save as Draft"}
                            </Label>
                        </div>

                        <Button type="submit" disabled={loading} className={isPublished ? "bg-blue-600 hover:bg-blue-700" : ""}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPublished ? <><Share2 className="mr-2 h-4 w-4" /> Share Moment</> : "Save Draft"}
                        </Button>
                    </div>

                    {error && <p className="text-center text-red-500 text-sm">{error}</p>}

                </form>
            </CardContent>
        </Card>
    );
}
