import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Info, XCircle } from 'lucide-react'
import type { AlertModalProps } from './types'

export function AlertModal({
    open,
    onClose,
    title,
    description,
    variant = 'default',
    buttonText = 'OK',
}: AlertModalProps) {
    const getIcon = () => {
        switch (variant) {
            case 'destructive':
                return <XCircle className="h-5 w-5 text-destructive" />
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            default:
                return <Info className="h-5 w-5 text-primary" />
        }
    }

    const getVariantStyles = () => {
        switch (variant) {
            case 'destructive':
                return 'border-destructive/20 bg-destructive/5'
            case 'warning':
                return 'border-yellow-500/20 bg-yellow-500/5'
            default:
                return 'border-primary/20 bg-primary/5'
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className={`max-w-md ${getVariantStyles()}`}>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <AlertDialogTitle className="text-lg font-semibold">
                            {title}
                        </AlertDialogTitle>
                    </div>
                    {description && (
                        <AlertDialogDescription className="text-sm text-muted-foreground pl-8">
                            {description}
                        </AlertDialogDescription>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onClose} className="min-w-20">
                        {buttonText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
