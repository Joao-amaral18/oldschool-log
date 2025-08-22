import { useRef, useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { WorkoutTemplate } from '@/types'

type ImportStatus = 'idle' | 'validating' | 'importing' | 'success' | 'error'

interface ImportWorkoutModalProps {
    onClose: () => void
    onImport: (templates: WorkoutTemplate[]) => Promise<void>
}

interface ValidationResult {
    isValid: boolean
    errors: string[]
    templates: WorkoutTemplate[]
}

export default function ImportWorkoutModal({ onClose, onImport }: ImportWorkoutModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [status, setStatus] = useState<ImportStatus>('idle')
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
    const [error, setError] = useState<string>('')

    const validateJSON = (json: any): ValidationResult => {
        const errors: string[] = []

        if (!Array.isArray(json)) {
            errors.push('JSON deve ser um array de templates')
            return { isValid: false, errors, templates: [] }
        }

        const templates: WorkoutTemplate[] = []

        for (let i = 0; i < json.length; i++) {
            const template = json[i]

            // Validate template structure
            if (!template.name || typeof template.name !== 'string') {
                errors.push(`Template ${i + 1}: nome é obrigatório`)
                continue
            }

            if (!Array.isArray(template.exercises)) {
                errors.push(`Template ${i + 1}: exercícios deve ser um array`)
                continue
            }

            const exercises: any[] = []

            for (let j = 0; j < template.exercises.length; j++) {
                const exercise = template.exercises[j]

                // Validate exercise structure
                if (!exercise.exerciseName || typeof exercise.exerciseName !== 'string') {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: nome do exercício é obrigatório`)
                    continue
                }

                if (!exercise.muscleGroup || typeof exercise.muscleGroup !== 'string') {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: grupo muscular é obrigatório`)
                    continue
                }

                // Validate muscle group (required for exercise creation)
                const validMuscleGroups = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'glutes', 'core', 'full-body', 'other']
                if (!validMuscleGroups.includes(exercise.muscleGroup)) {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: grupo muscular inválido: ${exercise.muscleGroup}. Grupos válidos: ${validMuscleGroups.join(', ')}`)
                    continue
                }

                // Validate numeric fields
                if (typeof exercise.sets !== 'number' || exercise.sets <= 0) {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: séries deve ser um número maior que 0`)
                    continue
                }

                // Validate reps (can be number or string like "10-12" or "12")
                const validateReps = (reps: any): boolean => {
                    if (typeof reps === 'number') {
                        return reps > 0
                    }
                    if (typeof reps === 'string') {
                        // Accept formats like "12", "10-12", "8-12-15"
                        const repsPattern = /^(\d+)(-\d+)*$/
                        return repsPattern.test(reps) && reps.length > 0
                    }
                    return false
                }

                if (!validateReps(exercise.reps)) {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: repetições deve ser um número maior que 0 ou uma string no formato "12" ou "10-12"`)
                    continue
                }

                // Load is optional - can be number >= 0 or undefined/null
                if (exercise.load !== undefined && exercise.load !== null && (typeof exercise.load !== 'number' || exercise.load < 0)) {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: carga deve ser um número maior ou igual a 0 (ou pode ser omitida)`)
                    continue
                }

                // Validate restSec (can be number or string like "120-180")
                const validateRestSec = (restSec: any): boolean => {
                    if (typeof restSec === 'number') {
                        return restSec >= 0
                    }
                    if (typeof restSec === 'string') {
                        // Accept formats like "120", "120-180", "90-120-180"
                        const restSecPattern = /^(\d+)(-\d+)*$/
                        return restSecPattern.test(restSec) && restSec.length > 0
                    }
                    return false
                }

                if (!validateRestSec(exercise.restSec)) {
                    errors.push(`Template ${i + 1}, Exercício ${j + 1}: descanso deve ser um número maior ou igual a 0 ou uma string no formato "120" ou "120-180"`)
                    continue
                }

                exercises.push({
                    id: '', // Will be generated
                    exerciseId: '', // Will be generated
                    sets: exercise.sets,
                    reps: exercise.reps,
                    load: exercise.load,
                    restSec: exercise.restSec,
                })
            }

            if (exercises.length > 0) {
                // Convert exercises to the format expected by the import API
                const importExercises = exercises.map(exercise => ({
                    id: exercise.id,
                    exerciseId: exercise.exerciseId,
                    exerciseName: (exercise as any).exerciseName || '',
                    muscleGroup: (exercise as any).muscleGroup || 'other',
                    sets: exercise.sets,
                    reps: exercise.reps,
                    load: exercise.load,
                    restSec: exercise.restSec,
                }))

                templates.push({
                    id: '', // Will be generated
                    name: template.name,
                    exercises: importExercises,
                    created_at: new Date().toISOString(),
                })
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            templates
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setStatus('validating')
        setError('')
        setValidationResult(null)

        try {
            const text = await file.text()
            const json = JSON.parse(text)
            const result = validateJSON(json)
            setValidationResult(result)
            setStatus('idle')
        } catch (err) {
            setError('Arquivo JSON inválido ou corrompido')
            setStatus('error')
        }
    }

    const handleImport = async () => {
        if (!validationResult?.isValid) return

        setStatus('importing')
        try {
            await onImport(validationResult.templates)
            setStatus('success')
            setTimeout(() => {
                onClose()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Erro ao importar templates')
            setStatus('error')
        }
    }

    const resetFile = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        setValidationResult(null)
        setError('')
        setStatus('idle')
    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto surface">
                <CardContent className="pt-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Importar Templates de Treino</h2>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            ✕
                        </Button>
                    </div>

                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium">
                                Selecione arquivo JSON
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
                            />
                        </div>

                        {/* Status Messages */}
                        {status === 'validating' && (
                            <div className="flex items-center gap-2 p-4 border rounded-lg bg-background">
                                <FileText className="h-4 w-4" />
                                <span>Validando arquivo...</span>
                            </div>
                        )}

                        {status === 'importing' && (
                            <div className="flex items-center gap-2 p-4 border rounded-lg bg-background">
                                <Upload className="h-4 w-4" />
                                <span>Importando templates...</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex items-center gap-2 p-4 border border-green-200 bg-green-50 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-800">Templates importados com sucesso!</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex items-center gap-2 p-4 border border-destructive/50 bg-background rounded-lg">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">{error}</span>
                            </div>
                        )}

                        {/* Validation Results */}
                        {validationResult && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Resultado da validação</h3>
                                    {validationResult.isValid ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>

                                {validationResult.errors.length > 0 && (
                                    <div className="border border-destructive/50 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                            <p className="font-medium text-destructive">Erros encontrados:</p>
                                        </div>
                                        <ul className="list-disc list-inside text-sm space-y-1 text-destructive">
                                            {validationResult.errors.slice(0, 10).map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                            {validationResult.errors.length > 10 && (
                                                <li>...e mais {validationResult.errors.length - 10} erros</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {validationResult.templates.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            {validationResult.templates.length} template(s) válido(s) encontrado(s):
                                        </p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {validationResult.templates.map((template, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                                                    <span className="font-medium">{template.name}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {template.exercises.length} exercícios
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-6">
                        <Button variant="outline" onClick={resetFile}>
                            Limpar
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancelar
                            </Button>

                            {validationResult?.isValid && (
                                <Button onClick={handleImport} disabled={status === 'importing'}>
                                    Importar Templates
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* JSON Format Help */}
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Formato esperado do JSON:</h4>
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                            <strong>💡 Dica:</strong> Se um exercício não existir na sua biblioteca, ele será criado automaticamente durante a importação!
                        </div>
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {`[
  {
    "name": "Nome do Template",
    "exercises": [
      {
        "exerciseName": "Supino Reto",
        "muscleGroup": "chest",
        "sets": 3,
        "reps": 12, // ou "10-12" para intervalos
        "load": 80.5, // opcional
        "restSec": 90 // ou "120-180" para intervalos de descanso
      }
    ]
  }
]`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
