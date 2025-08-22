import React, { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useVelocity } from 'framer-motion'
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
    const [showActions, setShowActions] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Use motion values for better performance
    const x = useMotionValue(0)
    const velocity = useVelocity(x)

    const constraintsRef = useRef<HTMLDivElement>(null)
    const SWIPE_THRESHOLD = 40 // pixels to show action buttons
    const MAX_SWIPE = 80 // maximum swipe distance
    const VELOCITY_THRESHOLD = 500 // pixels per second for quick actions

    // Detect if we're on a mobile device
    const isMobile = typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Transform motion values for better visual feedback
    const deleteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
    const deleteScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1.1])
    const duplicateOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
    const duplicateScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.1, 0.8])

    const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        setIsDragging(false)

        const currentX = x.get()
        const currentVelocity = Math.abs(velocity.get())

        // Quick, decisive swipe (high velocity) - execute action immediately
        if (currentVelocity > VELOCITY_THRESHOLD) {
            if (currentX > SWIPE_THRESHOLD) {
                // Quick swipe right - delete immediately
                onDelete()
                x.set(0)
                setShowActions(false)
                return
            } else if (currentX < -SWIPE_THRESHOLD) {
                // Quick swipe left - duplicate immediately
                onDuplicate()
                x.set(0)
                setShowActions(false)
                return
            }
        }

        // Slow drag - show action buttons
        if (Math.abs(currentX) > SWIPE_THRESHOLD) {
            setShowActions(true)
            // Add haptic feedback on mobile
            if (isMobile && 'vibrate' in navigator) {
                navigator.vibrate(50)
            }
        } else {
            // Return to original position
            x.set(0)
            setShowActions(false)
        }
    }, [x, velocity, VELOCITY_THRESHOLD, SWIPE_THRESHOLD, onDelete, onDuplicate, isMobile])

    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onDelete()
        setShowActions(false)
        x.set(0)
    }, [onDelete, x])

    const handleDuplicateClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onDuplicate()
        setShowActions(false)
        x.set(0)
    }, [onDuplicate, x])

    const handleHideActions = useCallback(() => {
        setShowActions(false)
        x.set(0)
    }, [x])

    const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Update motion value directly for better performance
        x.set(Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, info.offset.x)))
    }, [x, MAX_SWIPE])

    const handleDragStart = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
        setIsDragging(true)
    }, [])

    // Calculate current x position
    const currentX = x.get()

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
                <motion.div
                    className={`flex items-center justify-center w-16 transition-all duration-200 ${showActions && currentX > 0
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-destructive/10 text-destructive'
                        }`}
                    style={{
                        opacity: showActions && currentX > 0 ? 1 : deleteOpacity,
                        scale: showActions && currentX > 0 ? 1 : deleteScale
                    }}
                >
                    {showActions && currentX > 0 ? (
                        <motion.button
                            onClick={handleDeleteClick}
                            className="w-full h-full flex items-center justify-center hover:bg-destructive/30 rounded-full transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Trash2 className="w-5 h-5" />
                        </motion.button>
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </motion.div>

                {/* Spacer to keep main content visible */}
                <div className="flex-1" />

                {/* Right side - Duplicate action */}
                <motion.div
                    className={`flex items-center justify-center w-16 transition-all duration-200 ${showActions && currentX < 0
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-green-500/10 text-green-600'
                        }`}
                    style={{
                        opacity: showActions && currentX < 0 ? 1 : duplicateOpacity,
                        scale: showActions && currentX < 0 ? 1 : duplicateScale
                    }}
                >
                    {showActions && currentX < 0 ? (
                        <motion.button
                            onClick={handleDuplicateClick}
                            className="w-full h-full flex items-center justify-center hover:bg-green-500/30 rounded-full transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus className="w-5 h-5" />
                        </motion.button>
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                </motion.div>
            </div>

            {/* Swipeable content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
                dragElastic={isMobile ? 0.05 : 0.1} // Much less elasticity on mobile
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{
                    x,
                    boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : undefined,
                    touchAction: 'pan-y pinch-zoom', // Allow vertical scrolling while preventing horizontal scroll conflicts
                    // Improve touch responsiveness on mobile
                    WebkitTapHighlightColor: 'transparent',
                }}
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
