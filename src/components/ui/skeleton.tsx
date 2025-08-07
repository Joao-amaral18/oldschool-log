import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'avatar' | 'button' | 'card' | 'image'
    width?: string
    height?: string
    lines?: number
}

function Skeleton({
    className,
    variant = 'text',
    width,
    height,
    lines = 1,
    ...props
}: SkeletonProps) {
    const baseClasses = "animate-shimmer rounded-lg"

    const variantClasses = {
        text: "h-4 w-full",
        avatar: "h-10 w-10 rounded-full",
        button: "h-10 w-24 rounded-md",
        card: "h-32 w-full rounded-xl",
        image: "h-48 w-full rounded-lg"
    }

    if (variant === 'text' && lines > 1) {
        return (
            <div className="space-y-3">
                {Array.from({ length: lines }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            baseClasses,
                            variantClasses.text,
                            i === lines - 1 && "w-3/4", // Last line is shorter
                            className
                        )}
                        style={{ width, height }}
                        {...props}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                className
            )}
            style={{ width, height }}
            {...props}
        />
    )
}

// Specific skeleton components for common patterns
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-6 border border-stone-800 rounded-xl bg-card/50", className)} {...props}>
            <div className="flex items-start space-x-4">
                <Skeleton variant="avatar" />
                <div className="flex-1 space-y-3">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" lines={2} />
                </div>
            </div>
            <div className="mt-6 flex gap-2">
                <Skeleton variant="button" />
                <Skeleton variant="button" width="80px" />
            </div>
        </div>
    )
}

function SkeletonList({ items = 3, className, ...props }: { items?: number } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("space-y-4", className)} {...props}>
            {Array.from({ length: items }, (_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-stone-800 rounded-lg bg-card/30">
                    <Skeleton variant="avatar" className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="text" width="60%" />
                    </div>
                    <Skeleton variant="button" className="h-8 w-16" />
                </div>
            ))}
        </div>
    )
}

function SkeletonTable({ rows = 5, cols = 4, className, ...props }: { rows?: number; cols?: number } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("space-y-4", className)} {...props}>
            {/* Header */}
            <div className="grid gap-4 p-4 border border-stone-800 rounded-lg bg-card/50" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }, (_, i) => (
                    <Skeleton key={`header-${i}`} variant="text" height="20px" />
                ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
                {Array.from({ length: rows }, (_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="grid gap-4 p-3 border border-stone-800/50 rounded-md" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                        {Array.from({ length: cols }, (_, colIndex) => (
                            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height="16px" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

function SkeletonForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("space-y-6 p-6 border border-stone-800 rounded-xl bg-card/50", className)} {...props}>
            <div className="space-y-2">
                <Skeleton variant="text" width="25%" height="20px" />
                <Skeleton variant="button" height="40px" className="w-full rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton variant="text" width="30%" height="20px" />
                <Skeleton variant="button" height="40px" className="w-full rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Skeleton variant="text" width="40%" height="20px" />
                    <Skeleton variant="button" height="40px" className="w-full rounded-md" />
                </div>
                <div className="space-y-2">
                    <Skeleton variant="text" width="35%" height="20px" />
                    <Skeleton variant="button" height="40px" className="w-full rounded-md" />
                </div>
            </div>
            <div className="flex gap-3 pt-4">
                <Skeleton variant="button" width="100px" height="40px" />
                <Skeleton variant="button" width="80px" height="40px" />
            </div>
        </div>
    )
}

export {
    Skeleton,
    SkeletonCard,
    SkeletonList,
    SkeletonTable,
    SkeletonForm
}
