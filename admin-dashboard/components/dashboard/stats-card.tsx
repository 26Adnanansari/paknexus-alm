import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    trend,
    trendUp,
    className,
}: StatsCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className={cn("text-3xl font-bold mt-2", className)}>{value}</p>
                        {trend && (
                            <p className={cn(
                                "text-sm mt-2",
                                trendUp ? "text-green-600" : "text-red-600"
                            )}>
                                {trend}
                            </p>
                        )}
                    </div>
                    <div className={cn("p-3 rounded-full bg-gray-100", className)}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
