import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableSetProps {
    setId: number
    load: string
    reps: string
    isCompleted: boolean
    onUpdate: (field: 'reps' | 'load', value: string) => void
    onToggleComplete: () => void
    onDelete: () => void
    onDuplicate: () => void
}

export const SwipeableSet: React.FC<SwipeableSetProps> = ({
    setId,
    load,
    reps,
    isCompleted,
    onUpdate,
    onToggleComplete,
    onDelete,
    onDuplicate,
}) => {
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const constraintsRef = useRef<HTMLDivElement>(null)
    const SWIPE_THRESHOLD = 60 // pixels to trigger action
    const MAX_SWIPE = 80 // maximum swipe distance

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        setIsDragging(false)

        // Check if swipe passed threshold
        if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
            if (dragOffset > 0) {
                // Swiped right - delete action
                onDelete()
            } else {
                // Swiped left - duplicate action
                onDuplicate()
            }
            // Reset position after action
            setDragOffset(0)
        } else {
            // Return to original position
            setDragOffset(0)
        }
    }

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const newOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, info.offset.x))
        setDragOffset(newOffset)
    }

    const opacity = Math.min(Math.abs(dragOffset) / SWIPE_THRESHOLD, 1)

    return (
        <div className="relative overflow-hidden" ref={constraintsRef}>
            {/* Action backgrounds */}
            <div className="absolute inset-0 flex">
                {/* Left side - Delete action */}
                <div
                    className="flex items-center justify-center w-16 bg-destructive/10 text-destructive transition-all duration-200"
                    style={{ opacity: dragOffset > 0 ? opacity : 0 }}
                >
                    <Trash2 className="w-4 h-4" />
                </div>

                {/* Spacer to keep main content visible */}
                <div className="flex-1" />

                {/* Right side - Duplicate action */}
                <div
                    className="flex items-center justify-center w-16 bg-green-500/10 text-green-600 transition-all duration-200"
                    style={{ opacity: dragOffset < 0 ? opacity : 0 }}
                >
                    <Plus className="w-4 h-4" />
                </div>
            </div>

            {/* Swipeable content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x: dragOffset }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                    opacity: { duration: 0.15 }
                }}
                className={cn(
                    "relative z-10 grid grid-cols-4 gap-3 items-center p-3 rounded-xl transition-colors bg-card",
                    isCompleted ? "bg-primary/5" : "bg-muted/30"
                )}
                style={{
                    boxShadow: isDragging ? '0 2px 8px rgba(0, 0, 0, 0.08)' : undefined,
                }}
            >
                <div className="text-center">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm mx-auto transition-colors",
                        isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                    )}>
                        {setId}
                    </div>
                </div>

                <div>
                    <Input
                        type="number"
                        placeholder="0"
                        value={load}
                        onChange={(e) => onUpdate('load', e.target.value)}
                        className={cn(
                            "h-12 text-center font-medium transition-colors",
                            isCompleted ? "bg-primary/8 border-primary/15" : ""
                        )}
                        disabled={isDragging}
                    />
                </div>

                <div>
                    <Input
                        type="number"
                        placeholder="0"
                        value={reps}
                        onChange={(e) => onUpdate('reps', e.target.value)}
                        className={cn(
                            "h-12 text-center font-medium transition-colors",
                            isCompleted ? "bg-primary/8 border-primary/15" : ""
                        )}
                        disabled={isDragging}
                    />
                </div>

                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleComplete}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                            isCompleted
                                ? "bg-primary border-primary"
                                : "border-muted-foreground hover:border-primary"
                        )}
                        disabled={isDragging}
                    >
                        {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
