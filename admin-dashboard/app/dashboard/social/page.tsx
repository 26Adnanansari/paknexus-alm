'use client';

import MomentEditor from '@/components/social/MomentEditor';
import { Card, CardContent } from '@/components/ui/card';

export default function SocialPage() {
    return (
        <div className="space-y-6 p-6 md:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Moments</h1>
                    <p className="text-muted-foreground mt-2">Share memories and build your school&apos;s digital community.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Create New Moment</h2>
                    <MomentEditor onSuccess={() => alert("Moment Shared!")} />
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Ready to Publish</h2>
                    {/* Placeholder for Moments List */}
                    <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <p>No published moments yet.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
