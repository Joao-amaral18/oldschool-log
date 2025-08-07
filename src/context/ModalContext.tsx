import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { ConfirmModal, PromptModal, AlertModal, SelectModal, ExercisePickerModal, CreateExerciseModal } from '@/components/modals'


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
    pickExercise: (options: { title: string; description?: string; exercises: Array<{ id: string; name: string; muscleGroup: any }>; allowCreate?: boolean; onCreate?: (payload: { name: string; muscleGroup: string }) => Promise<void> | void }) => Promise<string | null>
    createExercise: (options: { title: string; description?: string; defaultName?: string }) => Promise<{ name: string; muscleGroup: string } | null>
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

    const [exercisePickerState, setExercisePickerState] = useState<{
        open: boolean
        options: { title: string; description?: string; exercises: Array<{ id: string; name: string; muscleGroup: any }>; allowCreate?: boolean; onCreate?: (payload: { name: string; muscleGroup: string }) => Promise<void> | void }
        resolve?: (value: string | null) => void
    }>({
        open: false,
        options: { title: '', exercises: [] },
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

    const pickExercise = useCallback((options: { title: string; description?: string; exercises: Array<{ id: string; name: string; muscleGroup: any }>; allowCreate?: boolean; onCreate?: (payload: { name: string; muscleGroup: string }) => Promise<void> | void }): Promise<string | null> => {
        return new Promise((resolve) => {
            setExercisePickerState({ open: true, options, resolve })
        })
    }, [])

    const [createExerciseState, setCreateExerciseState] = useState<{
        open: boolean
        options: { title: string; description?: string; defaultName?: string }
        resolve?: (value: { name: string; muscleGroup: string } | null) => void
    }>({ open: false, options: { title: '' } })

    const createExercise = useCallback((options: { title: string; description?: string; defaultName?: string }): Promise<{ name: string; muscleGroup: string } | null> => {
        return new Promise((resolve) => {
            setCreateExerciseState({ open: true, options, resolve })
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

    const closeExercisePicker = useCallback((value: string | null = null) => {
        if (exercisePickerState.resolve) {
            exercisePickerState.resolve(value)
        }
        setExercisePickerState(prev => ({ ...prev, open: false, resolve: undefined }))
    }, [exercisePickerState.resolve])

    const value: ModalContextValue = {
        confirm,
        prompt,
        alert,
        select,
        pickExercise,
        createExercise,
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

                        <ExercisePickerModal
                            open={exercisePickerState.open}
                            onClose={() => closeExercisePicker(null)}
                            title={exercisePickerState.options.title}
                            description={exercisePickerState.options.description}
                            exercises={exercisePickerState.options.exercises as any}
                            onSelect={(value: string) => closeExercisePicker(value)}
                            onCreateNew={exercisePickerState.options.allowCreate ? (async () => {
                                const result = await createExercise({ title: 'Novo Exercício', description: 'Defina o nome e grupo muscular:' })
                                if (result) {
                                    await exercisePickerState.options.onCreate?.(result)
                                }
                            }) : undefined}
                        />

                        <CreateExerciseModal
                            open={createExerciseState.open}
                            onClose={() => {
                                if (createExerciseState.resolve) createExerciseState.resolve(null)
                                setCreateExerciseState((prev) => ({ ...prev, open: false, resolve: undefined }))
                            }}
                            title={createExerciseState.options.title}
                            description={createExerciseState.options.description}
                            onConfirm={(payload) => {
                                if (createExerciseState.resolve) createExerciseState.resolve(payload)
                                setCreateExerciseState((prev) => ({ ...prev, open: false, resolve: undefined }))
                            }}
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
