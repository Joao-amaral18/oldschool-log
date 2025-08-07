import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ConfirmModal, PromptModal, AlertModal, SelectModal } from '@/components/modals'


interface ConfirmOptions {
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
}

interface PromptOptions {
    title: string
    description?: string
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    cancelText?: string
    inputType?: 'text' | 'number'
}

interface AlertOptions {
    title: string
    description?: string
    variant?: 'default' | 'destructive' | 'warning'
    buttonText?: string
}

interface SelectOptions {
    title: string
    description?: string
    options: Array<{ value: string; label: string; description?: string }>
    cancelText?: string
}

interface ModalContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>
    prompt: (options: PromptOptions) => Promise<string | null>
    alert: (options: AlertOptions) => Promise<void>
    select: (options: SelectOptions) => Promise<string | null>
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
    const [confirmState, setConfirmState] = useState<{
        open: boolean
        options: ConfirmOptions
        resolve?: (value: boolean) => void
    }>({
        open: false,
        options: { title: '' },
    })

    const [promptState, setPromptState] = useState<{
        open: boolean
        options: PromptOptions
        resolve?: (value: string | null) => void
    }>({
        open: false,
        options: { title: '' },
    })

    const [alertState, setAlertState] = useState<{
        open: boolean
        options: AlertOptions
    }>({
        open: false,
        options: { title: '' },
    })

    const [selectState, setSelectState] = useState<{
        open: boolean
        options: SelectOptions
        resolve?: (value: string | null) => void
    }>({
        open: false,
        options: { title: '', options: [] },
    })

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                open: true,
                options,
                resolve,
            })
        })
    }, [])

    const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setPromptState({
                open: true,
                options,
                resolve,
            })
        })
    }, [])

    const alert = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            setAlertState({
                open: true,
                options,
            })
            // Auto-resolve after modal is shown
            setTimeout(resolve, 100)
        })
    }, [])

    const select = useCallback((options: SelectOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setSelectState({
                open: true,
                options,
                resolve,
            })
        })
    }, [])

    const closeConfirm = useCallback((confirmed = false) => {
        if (confirmState.resolve) {
            confirmState.resolve(confirmed)
        }
        setConfirmState(prev => ({ ...prev, open: false, resolve: undefined }))
    }, [confirmState.resolve])

    const closePrompt = useCallback((value: string | null = null) => {
        if (promptState.resolve) {
            promptState.resolve(value)
        }
        setPromptState(prev => ({ ...prev, open: false, resolve: undefined }))
    }, [promptState.resolve])

    const closeAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, open: false }))
    }, [])

    const closeSelect = useCallback((value: string | null = null) => {
        if (selectState.resolve) {
            selectState.resolve(value)
        }
        setSelectState(prev => ({ ...prev, open: false, resolve: undefined }))
    }, [selectState.resolve])

    const value: ModalContextValue = {
        confirm,
        prompt,
        alert,
        select,
    }

    return (
        <ModalContext.Provider value={value}>
            {children}

            {/* Import components here to avoid circular dependencies */}
            {(() => {
                return (
                    <>
                        <ConfirmModal
                            open={confirmState.open}
                            onClose={() => closeConfirm(false)}
                            onConfirm={() => closeConfirm(true)}
                            title={confirmState.options.title}
                            description={confirmState.options.description}
                            confirmText={confirmState.options.confirmText}
                            cancelText={confirmState.options.cancelText}
                            variant={confirmState.options.variant}
                        />

                        <PromptModal
                            open={promptState.open}
                            onClose={() => closePrompt(null)}
                            onConfirm={(value: string) => closePrompt(value)}
                            title={promptState.options.title}
                            description={promptState.options.description}
                            placeholder={promptState.options.placeholder}
                            defaultValue={promptState.options.defaultValue}
                            confirmText={promptState.options.confirmText}
                            cancelText={promptState.options.cancelText}
                            inputType={promptState.options.inputType}
                        />

                        <AlertModal
                            open={alertState.open}
                            onClose={closeAlert}
                            title={alertState.options.title}
                            description={alertState.options.description}
                            variant={alertState.options.variant}
                            buttonText={alertState.options.buttonText}
                        />

                        <SelectModal
                            open={selectState.open}
                            onClose={() => closeSelect(null)}
                            onSelect={(value: string) => closeSelect(value)}
                            title={selectState.options.title}
                            description={selectState.options.description}
                            options={selectState.options.options}
                            cancelText={selectState.options.cancelText}
                        />
                    </>
                )
            })()}
        </ModalContext.Provider>
    )
}

export function useModal(): ModalContextValue {
    const context = useContext(ModalContext)
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider')
    }
    return context
}
