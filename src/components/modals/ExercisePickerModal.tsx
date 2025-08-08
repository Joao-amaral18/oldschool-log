import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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

export function ExercisePickerModal({ open, onClose, title, description, exercises, onSelect, onCreateNew }: ExercisePickerModalProps) {
    const [query, setQuery] = useState('')
    const [group, setGroup] = useState<MuscleGroup | 'all'>('all')
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return exercises.filter((ex) => {
            const byGroup = group === 'all' || ex.muscleGroup === group
            const byText = q.length === 0 || ex.name.toLowerCase().includes(q)
            return byGroup && byText
        })
    }, [exercises, query, group])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                    {description && <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>}
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Buscar exercício..." value={query} onChange={(e) => setQuery(e.target.value)} />
                        <select className="rounded-md border border-stone-800 px-3 py-2 text-sm" value={group} onChange={(e) => setGroup(e.target.value as any)}>
                            {muscleFilters.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto space-y-2">
                        {filtered.map((ex) => {
                            const isSelected = selectedId === ex.id
                            return (
                                <Card
                                    key={ex.id}
                                    role="option"
                                    aria-selected={isSelected}
                                    className={
                                        `p-3 cursor-pointer transition-all duration-200 border ${isSelected ? 'border-zinc-500 bg-accent/70' : 'hover:border-zinc-500 hover:bg-accent/60'
                                        }`
                                    }
                                    onClick={() => setSelectedId(ex.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium text-sm">{ex.name}</div>
                                        {group === 'all' && (
                                            <div className="text-xs text-muted-foreground">{ex.muscleGroup}</div>
                                        )}
                                    </div>
                                </Card>
                            )
                        })}
                        {filtered.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-6">Nenhum exercício encontrado</div>
                        )}
                    </div>
                </div>
                <DialogFooter className="items-center gap-2 sm:justify-between">
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


