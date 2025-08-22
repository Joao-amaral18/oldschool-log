import React, { useRef, useState, useCallback } from 'react'
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
    const [showActions, setShowActions] = useState(false)

    const constraintsRef = useRef<HTMLDivElement>(null)
    const SWIPE_THRESHOLD = 40 // pixels to show action buttons
    const MAX_SWIPE = 80 // maximum swipe distance

    // Detect if we're on a mobile device
    const isMobile = typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        setIsDragging(false)

        // Check if swipe passed threshold to show actions
        if (Math.abs(dragOffset) > SWIPE_THRESHOLD) {
            setShowActions(true)
            // Auto-hide actions after 3 seconds if no action is taken
            setTimeout(() => {
                setShowActions(false)
                setDragOffset(0)
            }, 3000)
        } else {
            // Return to original position
            setDragOffset(0)
            setShowActions(false)
        }
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete()
        setShowActions(false)
        setDragOffset(0)
    }

    const handleDuplicateClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onDuplicate()
        setShowActions(false)
        setDragOffset(0)
    }

    const handleHideActions = () => {
        setShowActions(false)
        setDragOffset(0)
    }

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Improve drag handling for mobile
        const newOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, info.offset.x))

        // Add some resistance at the edges
        if (Math.abs(newOffset) === MAX_SWIPE) {
            setDragOffset(newOffset * 0.95) // Reduce resistance at max
        } else {
            setDragOffset(newOffset)
        }
    }

    const handleDragStart = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        setIsDragging(true)
    }, [])

    const opacity = Math.min(Math.abs(dragOffset) / SWIPE_THRESHOLD, 1)

    return (
        <div className="relative overflow-hidden" ref={constraintsRef}>
            {/* Overlay to close actions when clicking outside */}
            {showActions && (
                <div
                    className="absolute inset-0 z-20"
                    onClick={handleHideActions}
                />
            )}
            {/* Action backgrounds */}
            <div className={`absolute inset-0 flex ${showActions ? "z-30" : "z-10"}`}>
                {/* Left side - Delete action */}
                <div
                    className={`flex items-center justify-center w-16 transition-all duration-200 ${showActions && dragOffset > 0
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                    style={{ opacity: (dragOffset > 0 || (showActions && dragOffset > 0)) ? (showActions ? 1 : opacity) : 0 }}
                >
                    {showActions && dragOffset > 0 ? (
                        <button
                            onClick={handleDeleteClick}
                            className="w-full h-full flex items-center justify-center hover:bg-destructive/30 rounded-full transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </div>

                {/* Spacer to keep main content visible */}
                <div className="flex-1" />

                {/* Right side - Duplicate action */}
                <div
                    className={`flex items-center justify-center w-16 transition-all duration-200 ${showActions && dragOffset < 0
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-green-500/10 text-green-600'
                        }`}
                    style={{ opacity: (dragOffset < 0 || (showActions && dragOffset < 0)) ? (showActions ? 1 : opacity) : 0 }}
                >
                    {showActions && dragOffset < 0 ? (
                        <button
                            onClick={handleDuplicateClick}
                            className="w-full h-full flex items-center justify-center hover:bg-green-500/30 rounded-full transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                </div>
            </div>

            {/* Swipeable content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
                dragElastic={isMobile ? 0.05 : 0.1} // Much less elasticity on mobile
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x: dragOffset }}
                transition={{
                    type: "spring",
                    stiffness: isMobile ? 250 : 300, // Even less stiffness on mobile
                    damping: isMobile ? 30 : 35,    // More damping on mobile for stability
                    opacity: { duration: isMobile ? 0.15 : 0.2 }
                }}
                className={cn(
                    `relative transition-colors bg-card`,
                    showActions ? "z-30" : "z-10",
                    "grid grid-cols-4 gap-3 items-center p-3 rounded-xl",
                    isCompleted ? "bg-primary/5" : "bg-muted/30"
                )}
                style={{
                    boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.12)' : undefined,
                    touchAction: 'pan-y pinch-zoom', // Allow vertical scrolling while preventing horizontal scroll conflicts
                    // Improve touch responsiveness on mobile
                    WebkitTapHighlightColor: 'transparent',
                }}
                // Improve touch handling
                dragMomentum={false} // Disable momentum for more controlled mobile interaction
                // Better drag detection for mobile
                dragDirectionLock={true} // Lock to horizontal dragging
                dragPropagation={false} // Prevent drag events from bubbling up
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
