import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmModalProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
}: ConfirmModalProps) {
    const Icon = variant === 'destructive' ? AlertTriangle : Info;
    const iconColor = variant === 'destructive' ? 'text-destructive' : 'text-primary';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`mx-auto flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Icon className={`h-7 w-7 ${iconColor}`} aria-hidden="true" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description || <span className="sr-only">{title}</span>}
                        </DialogDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full pt-4">
                        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
                            {cancelText}
                        </Button>
                        <Button variant={variant} size="lg" className="w-full" onClick={onConfirm}>
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
