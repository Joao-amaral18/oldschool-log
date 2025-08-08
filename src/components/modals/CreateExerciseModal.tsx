import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreateExerciseModalProps } from './types'
import type { MuscleGroup } from '@/types'

const groups: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'legs', label: 'Pernas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'core', label: 'Core/Abdômen' },
  { value: 'full-body', label: 'Corpo inteiro' },
  { value: 'other', label: 'Outro' },
]

export function CreateExerciseModal({ open, onClose, title, description, onConfirm, confirmText = 'Criar', cancelText = 'Cancelar', defaultName = '', defaultGroup = 'other' }: CreateExerciseModalProps) {
  const [name, setName] = useState(defaultName)
  const [group, setGroup] = useState<MuscleGroup>(defaultGroup)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setGroup(defaultGroup)
    }
  }, [open, defaultName, defaultGroup])

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      onConfirm({ name: trimmed, muscleGroup: group })
      onClose()
    } catch {
      // fallback: keep modal open for user correction
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-ex-name">Nome do exercício</Label>
            <Input id="new-ex-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Agachamento livre" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-ex-group">Grupo muscular</Label>
            <select
              id="new-ex-group"
              className="mt-1 w-full rounded-md border border-stone-700 px-3 py-2 text-sm"
              value={group}
              onChange={(e) => setGroup(e.target.value as MuscleGroup)}
            >
              {groups.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{cancelText}</Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


