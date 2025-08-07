import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { SelectModalProps } from './types'

export function SelectModal({
    open,
    onClose,
    onSelect,
    title,
    description,
    options,
    cancelText = 'Cancelar',
}: SelectModalProps) {
    const handleSelect = (value: string) => {
        onSelect(value)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-hidden">
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
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {options.map((option, index) => (
                        <Card
                            key={option.value}
                            className="p-3 cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
                            onClick={() => handleSelect(option.value)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {index + 1}. {option.label}
                                    </div>
                                    {option.description && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {option.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="min-w-20">
                        {cancelText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
