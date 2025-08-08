import { Skeleton } from '@/components/ui/skeleton'

// Skeleton for template list page
export function TemplateListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton variant="text" width="200px" height="32px" />
                <Skeleton variant="button" width="140px" height="40px" />
            </div>

            {/* Template cards */}
            <div className="grid gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="p-4 border border-stone-800 rounded-xl bg-card/50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="text" width="60%" height="20px" />
                                <Skeleton variant="text" width="30%" height="16px" />
                            </div>
                            <div className="flex items-center gap-1">
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Skeleton for treino page
export function TreinoPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <Skeleton variant="text" width="120px" height="32px" className="mx-auto" />
                <Skeleton variant="text" width="280px" height="20px" className="mx-auto" />
            </div>

            {/* Template cards grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="p-6 border border-stone-800 rounded-xl bg-card/50">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 space-y-2">
                                <Skeleton variant="text" width="70%" height="24px" />
                                <Skeleton variant="text" width="40%" height="16px" />
                            </div>
                            <Skeleton variant="avatar" className="h-10 w-10 rounded-full" />
                        </div>

                        <div className="space-y-2 mb-4">
                            <Skeleton variant="text" width="80%" height="12px" />
                            <Skeleton variant="text" width="75%" height="12px" />
                            <Skeleton variant="text" width="60%" height="12px" />
                        </div>

                        <div className="flex gap-2">
                            <Skeleton variant="button" className="flex-1 h-10" />
                            <Skeleton variant="avatar" className="h-10 w-10 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom button */}
            <div className="flex justify-center">
                <Skeleton variant="button" width="180px" height="40px" />
            </div>
        </div>
    )
}

// Skeleton for template editor
export function TemplateEditorSkeleton() {
    return (
        <div className="space-y-4">
            {/* Sticky header */}
            <div className="sticky top-2 z-10 p-3 border border-stone-800 rounded-xl bg-card/50 flex items-center justify-between gap-3">
                <Skeleton variant="text" width="300px" height="40px" />
                <div className="flex items-center gap-2">
                    <Skeleton variant="button" width="80px" height="40px" />
                    <Skeleton variant="button" width="80px" height="40px" />
                </div>
            </div>

            {/* Exercise cards */}
            <div className="grid gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="p-4 border border-stone-800 rounded-xl bg-card/50">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton variant="button" width="200px" height="40px" />
                            <div className="flex items-center gap-1">
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                                <Skeleton variant="avatar" className="h-8 w-8 rounded-md" />
                            </div>
                        </div>

                        {/* Sets section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton variant="text" width="60px" height="16px" />
                                <Skeleton variant="button" width="120px" height="32px" />
                            </div>

                            {/* Set rows */}
                            {Array.from({ length: 3 }, (_, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-12 items-end gap-2">
                                    <div className="col-span-3">
                                        <Skeleton variant="text" width="40px" height="12px" className="mb-1" />
                                        <Skeleton variant="button" height="40px" className="w-full" />
                                    </div>
                                    <div className="col-span-3">
                                        <Skeleton variant="text" width="40px" height="12px" className="mb-1" />
                                        <Skeleton variant="button" height="40px" className="w-full" />
                                    </div>
                                    <div className="col-span-4">
                                        <Skeleton variant="text" width="80px" height="12px" className="mb-1" />
                                        <Skeleton variant="button" height="40px" className="w-full" />
                                    </div>
                                    <div className="col-span-2 flex items-end">
                                        <Skeleton variant="avatar" className="h-10 w-10 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Add exercise button */}
                <div className="flex">
                    <Skeleton variant="button" className="flex-1 h-12" />
                </div>
            </div>
        </div>
    )
}

// Skeleton for exercise picker modal
export function ExercisePickerSkeleton() {
    return (
        <div className="space-y-4 p-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton variant="text" width="180px" height="24px" />
                <Skeleton variant="text" width="280px" height="16px" />
            </div>

            {/* Search and filter */}
            <div className="flex gap-2">
                <Skeleton variant="button" className="flex-1 h-10" />
                <Skeleton variant="button" width="120px" height="40px" />
            </div>

            {/* Exercise list */}
            <div className="space-y-2 max-h-[50vh] overflow-hidden">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="p-3 border border-stone-800 rounded-lg bg-card/30">
                        <div className="flex items-center justify-between">
                            <Skeleton variant="text" width="60%" height="16px" />
                            <Skeleton variant="text" width="20%" height="12px" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between gap-2 pt-4">
                <Skeleton variant="button" width="80px" height="40px" />
                <div className="flex gap-2">
                    <Skeleton variant="button" width="140px" height="40px" />
                    <Skeleton variant="button" width="100px" height="40px" />
                </div>
            </div>
        </div>
    )
}

// Skeleton for session/workout page
export function SessionSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-14 md:top-[73px] bg-background/95 backdrop-blur-md z-30 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Skeleton variant="avatar" className="h-10 w-10 rounded-md" />
                    <div className="space-y-1">
                        <Skeleton variant="text" width="160px" height="20px" />
                        <Skeleton variant="text" width="80px" height="16px" />
                    </div>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="p-4 border border-stone-800 rounded-xl bg-card/50">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton variant="text" width="120px" height="20px" />
                        <Skeleton variant="text" width="80px" height="16px" />
                    </div>
                    <Skeleton variant="button" height="8px" className="w-full rounded-full" />
                    <Skeleton variant="text" width="140px" height="12px" />
                </div>
            </div>

            {/* Exercise cards */}
            <div className="space-y-4">
                {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="p-4 border border-stone-800 rounded-xl bg-card/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Skeleton variant="avatar" className="h-5 w-5 rounded-full" />
                                <div className="space-y-1">
                                    <Skeleton variant="text" width="140px" height="18px" />
                                    <Skeleton variant="text" width="60px" height="12px" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton variant="text" width="80px" height="12px" />
                                <Skeleton variant="avatar" className="h-6 w-6 rounded-md" />
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                            <Skeleton variant="button" height="8px" className="w-full rounded-full" />
                            <Skeleton variant="text" width="120px" height="12px" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
                <Skeleton variant="button" className="w-full h-10" />
                <Skeleton variant="button" className="w-full h-12" />
            </div>
        </div>
    )
}

// Skeleton for history page
export function HistorySkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton variant="text" width="100px" height="28px" />
            <div className="grid gap-3">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="p-4 border border-stone-800 rounded-xl bg-card/50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton variant="text" width="160px" height="18px" />
                                <Skeleton variant="text" width="280px" height="12px" />
                            </div>
                            <Skeleton variant="text" width="60px" height="16px" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Skeleton for settings page
export function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton variant="text" width="140px" height="28px" />
                <Skeleton variant="button" width="80px" height="40px" />
            </div>

            {/* Exercises section */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton variant="text" width="80px" height="20px" />
                    <Skeleton variant="button" width="100px" height="36px" />
                </div>
                <div className="grid gap-2">
                    {Array.from({ length: 8 }, (_, i) => (
                        <div key={i} className="p-4 border border-stone-800 rounded-xl bg-card/50">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Skeleton variant="text" width="120px" height="18px" />
                                    <Skeleton variant="text" width="60px" height="12px" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton variant="button" width="60px" height="32px" />
                                    <Skeleton variant="button" width="60px" height="32px" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Danger zone */}
            <section className="space-y-3">
                <Skeleton variant="text" width="120px" height="20px" />
                <Skeleton variant="button" width="140px" height="36px" />
            </section>
        </div>
    )
}
