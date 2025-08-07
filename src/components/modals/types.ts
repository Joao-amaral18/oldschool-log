export interface BaseModalProps {
    open: boolean
    onClose: () => void
    title: string
    description?: string
}

export interface ConfirmModalProps extends BaseModalProps {
    onConfirm: () => void
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

export interface PromptModalProps extends BaseModalProps {
    onConfirm: (value: string) => void
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    cancelText?: string
    inputType?: 'text' | 'number'
}

export interface AlertModalProps extends BaseModalProps {
    variant?: 'default' | 'destructive' | 'warning'
    buttonText?: string
}

export interface SelectModalProps extends BaseModalProps {
    options: Array<{ value: string; label: string; description?: string }>
    onSelect: (value: string) => void
    cancelText?: string
}

import type { Exercise } from '@/types'

export interface ExercisePickerModalProps extends BaseModalProps {
    exercises: Exercise[]
    onSelect: (exerciseId: string) => void
    onCreateNew?: () => void
}
