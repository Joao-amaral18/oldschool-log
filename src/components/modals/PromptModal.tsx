import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PromptModalProps } from './types'

export function PromptModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    placeholder = '',
    defaultValue = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    inputType = 'text',
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue)

    useEffect(() => {
        if (open) {
            setValue(defaultValue)
        }
    }, [open, defaultValue])

    const handleConfirm = () => {
        if (value.trim()) {
            onConfirm(value.trim())
            onClose()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim()) {
            handleConfirm()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="prompt-input" className="sr-only">
                        {title}
                    </Label>
                    <Input
                        id="prompt-input"
                        type={inputType}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full"
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} className="min-w-20">
                        {cancelText}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!value.trim()}
                        className="min-w-20"
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
