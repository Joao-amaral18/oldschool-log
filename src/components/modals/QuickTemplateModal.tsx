import { useState } from 'react'
import { Dumbbell, Zap, Heart, Target, Flame } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { TemplateExercise } from '@/types'

interface QuickTemplate {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    exercises: Omit<TemplateExercise, 'id'>[]
}

const quickTemplates: QuickTemplate[] = [
    {
        id: 'push-pull-legs',
        name: 'Push/Pull/Legs',
        description: 'Divisão clássica para ganho de força e hipertrofia',
        icon: Dumbbell,
        color: 'from-blue-500 to-blue-600',
        exercises: [
            // Push Day
            { exerciseId: '', sets: 4, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 4, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            // Pull Day
            { exerciseId: '', sets: 4, reps: '6-10', load: 0, restSec: '120-180' },
            { exerciseId: '', sets: 4, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-12', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            // Legs Day
            { exerciseId: '', sets: 4, reps: '6-8', load: 0, restSec: '150-180' },
            { exerciseId: '', sets: 4, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-12', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            { exerciseId: '', sets: 3, reps: '20-25', load: 0, restSec: '30-45' }
        ]
    },
    {
        id: 'upper-lower',
        name: 'Upper/Lower',
        description: 'Divisão superior/inferior para treino frequente',
        icon: Target,
        color: 'from-green-500 to-green-600',
        exercises: [
            // Upper Day
            { exerciseId: '', sets: 3, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            // Lower Day
            { exerciseId: '', sets: 3, reps: '6-8', load: 0, restSec: '120-150' },
            { exerciseId: '', sets: 3, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-12', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            { exerciseId: '', sets: 3, reps: '20-25', load: 0, restSec: '30-45' }
        ]
    },
    {
        id: 'full-body',
        name: 'Corpo Inteiro',
        description: 'Treino completo para iniciantes ou alta frequência',
        icon: Flame,
        color: 'from-orange-500 to-orange-600',
        exercises: [
            { exerciseId: '', sets: 3, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-12', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '45-60' },
            { exerciseId: '', sets: 3, reps: '20-25', load: 0, restSec: '30-45' }
        ]
    },
    {
        id: 'strength',
        name: 'Força',
        description: 'Foco em força com séries pesadas e baixa repetição',
        icon: Zap,
        color: 'from-purple-500 to-purple-600',
        exercises: [
            { exerciseId: '', sets: 5, reps: '3-5', load: 0, restSec: '180-240' },
            { exerciseId: '', sets: 4, reps: '5-8', load: 0, restSec: '120-180' },
            { exerciseId: '', sets: 3, reps: '8-10', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 3, reps: '10-12', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '45-60' }
        ]
    },
    {
        id: 'hypertrophy',
        name: 'Hipertrofia',
        description: 'Foco em volume muscular com repetições moderadas',
        icon: Heart,
        color: 'from-pink-500 to-pink-600',
        exercises: [
            { exerciseId: '', sets: 4, reps: '8-12', load: 0, restSec: '90-120' },
            { exerciseId: '', sets: 4, reps: '10-15', load: 0, restSec: '60-90' },
            { exerciseId: '', sets: 3, reps: '12-15', load: 0, restSec: '45-60' },
            { exerciseId: '', sets: 3, reps: '15-20', load: 0, restSec: '30-45' },
            { exerciseId: '', sets: 3, reps: '20-25', load: 0, restSec: '30-45' }
        ]
    }
]

interface QuickTemplateModalProps {
    open: boolean
    onClose: () => void
    onSelectTemplate: (templateName: string, exercises: Omit<TemplateExercise, 'id'>[]) => void
}

export function QuickTemplateModal({ open, onClose, onSelectTemplate }: QuickTemplateModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<QuickTemplate | null>(null)
    const [customName, setCustomName] = useState('')

    const handleTemplateSelect = (template: QuickTemplate) => {
        setSelectedTemplate(template)
        setCustomName(template.name)
    }

    const handleConfirm = () => {
        if (!selectedTemplate) return
        const name = customName.trim() || selectedTemplate.name
        onSelectTemplate(name, selectedTemplate.exercises)
        onClose()
        setSelectedTemplate(null)
        setCustomName('')
    }

    const handleBack = () => {
        setSelectedTemplate(null)
        setCustomName('')
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden rounded-xl border border-stone-700 bg-background">
                {!selectedTemplate ? (
                    // Template selection
                    <div className="p-6 space-y-6">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-xl font-bold tracking-tight">Escolher Modelo</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Comece com um template pré-configurado ou crie do zero
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {quickTemplates.map((template) => {
                                const Icon = template.icon
                                return (
                                    <Card
                                        key={template.id}
                                        className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover-scale"
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <CardContent className="p-4 space-y-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-sm tracking-tight">{template.name}</h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Template configuration
                    <div className="p-6 space-y-6">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
                                <selectedTemplate.icon className={`h-6 w-6 bg-gradient-to-br ${selectedTemplate.color} rounded-lg p-1`} />
                                {selectedTemplate.name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Configure o nome do seu template e confirme para começar
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Nome do Template</label>
                                <Input
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="Ex: Meu Treino Push/Pull/Legs"
                                    className="h-11"
                                />
                            </div>

                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                <h4 className="font-medium text-sm">Este template inclui:</h4>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• {selectedTemplate.exercises.length} exercícios configurados</li>
                                    <li>• Séries e repetições otimizadas</li>
                                    <li>• Tempos de descanso apropriados</li>
                                    <li>• Estrutura pronta para uso</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Button variant="outline" onClick={handleBack}>
                                Voltar
                            </Button>
                            <Button onClick={handleConfirm} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                Criar Template
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
