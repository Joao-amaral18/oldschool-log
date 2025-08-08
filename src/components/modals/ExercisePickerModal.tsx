import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MuscleGroup } from '@/types'
import type { ExercisePickerModalProps } from './types'

const muscleFilters: { value: MuscleGroup | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'chest', label: 'Peito' },
    { value: 'back', label: 'Costas' },
    { value: 'legs', label: 'Pernas' },
    { value: 'shoulders', label: 'Ombros' },
    { value: 'biceps', label: 'Bíceps' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'glutes', label: 'Glúteos' },
    { value: 'core', label: 'Core' },
    { value: 'full-body', label: 'Corpo inteiro' },
    { value: 'other', label: 'Outros' },
]

const muscleGroupLabels: Record<MuscleGroup, string> = {
    chest: 'Peito',
    back: 'Costas',
    legs: 'Pernas',
    shoulders: 'Ombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    glutes: 'Glúteos',
    core: 'Core',
    'full-body': 'Corpo inteiro',
    other: 'Outros',
}

export function ExercisePickerModal({ open, onClose, title, description, exercises, onSelect, onCreateNew }: ExercisePickerModalProps) {
    const [query, setQuery] = useState('')
    const [group, setGroup] = useState<MuscleGroup | 'all'>('all')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [highlightIndex, setHighlightIndex] = useState<number>(-1)
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return exercises.filter((ex) => {
            const byGroup = group === 'all' || ex.muscleGroup === group
            const byText = q.length === 0 || ex.name.toLowerCase().includes(q)
            return byGroup && byText
        })
    }, [exercises, query, group])

    // Focus search when modal opens
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    // Keep highlight aligned with selection/filtered list
    useEffect(() => {
        if (!open) return
        if (selectedId) {
            const idx = filtered.findIndex((x) => x.id === selectedId)
            setHighlightIndex(idx)
        } else {
            setHighlightIndex(filtered.length > 0 ? 0 : -1)
        }
    }, [open, filtered, selectedId])

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (filtered.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : i))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex((i) => (i > 0 ? i - 1 : i))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const id = filtered[highlightIndex]?.id
            if (id) {
                setSelectedId(id)
                onSelect(id)
                onClose()
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-xl border border-stone-800 bg-background" onKeyDown={handleKeyDown}>
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b p-4 space-y-3">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base md:text-lg font-semibold tracking-tight">{title}</DialogTitle>
                        {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
                    </DialogHeader>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input ref={inputRef} placeholder="Buscar exercício..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {muscleFilters.map((m) => (
                            <button
                                key={m.value}
                                type="button"
                                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors ${group === m.value ? 'border-zinc-500 bg-accent/70' : 'border-stone-800 hover:border-zinc-500 hover:bg-accent/60'
                                    }`}
                                onClick={() => setGroup(m.value)}
                            >
                                {m.label}
                            </button>
                        ))}
                        <div className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
                    {filtered.map((ex) => {
                        const isSelected = selectedId === ex.id
                        const isActive = filtered[highlightIndex]?.id === ex.id
                        return (
                            <button
                                key={ex.id}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={`w-full text-left p-3 cursor-pointer transition-colors duration-150 border rounded-lg ${isSelected
                                        ? 'border-zinc-500 bg-accent/70'
                                        : isActive
                                            ? 'border-zinc-500/60 bg-accent/40'
                                            : 'hover:border-zinc-500 hover:bg-accent/60'
                                    }`}
                                onClick={() => setSelectedId(ex.id)}
                                onDoubleClick={() => { setSelectedId(ex.id); onSelect(ex.id); onClose() }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                                        <div className="font-medium text-sm tracking-tight">{ex.name}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground px-2 py-0.5 rounded-md border border-stone-800 bg-muted/30">{muscleGroupLabels[ex.muscleGroup]}</div>
                                </div>
                            </button>
                        )
                    })}
                    {filtered.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-6">Nenhum exercício encontrado</div>
                    )}
                </div>
                <DialogFooter className="items-center gap-2 sm:justify-between border-t p-3">
                    <Button type="button" variant="link" onClick={onClose}>Cancelar</Button>
                    <div className="flex gap-2">
                        {onCreateNew && (
                            <Button type="button" variant="outline" onClick={async () => { await onCreateNew(); onClose() }}>+ Criar novo exercício</Button>
                        )}
                        <Button type="button" onClick={() => { if (selectedId) { onSelect(selectedId); onClose() } }} disabled={!selectedId}>Selecionar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


