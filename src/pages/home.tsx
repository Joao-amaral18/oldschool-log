import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { storage, userKey } from '@/lib/storage'
import type { WorkoutTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const key = useMemo(() => (session ? userKey(session.userId, 'templates') : ''), [session])

  useEffect(() => {
    if (!session) {
      navigate('/login')
      return
    }
    setTemplates(storage.get<WorkoutTemplate[]>(key, []))
  }, [key, navigate, session])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-2">Iniciar Treino</h1>
        <Link to="/templates">
          <Button variant="outline">Gerenciar Templates</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {templates.length === 0 && (
          <div className="surface p-8 text-center">
            <p className="text-body text-muted-foreground mb-4">Crie um template para começar seus treinos</p>
            <Link to="/templates">
              <Button>Criar Primeiro Template</Button>
            </Link>
          </div>
        )}

        {templates.map((t) => (
          <Card key={t.id} className="hover:bg-card/80 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-heading-3 font-medium">{t.name}</h3>
                  <p className="text-body-small text-muted-foreground">
                    {t.exercises.length} exercício{t.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/templates/editor/${t.id}`}>
                    <Button variant="outline" size="sm">Editar</Button>
                  </Link>
                  <Link to={`/session/${t.id}`}>
                    <Button size="sm">Iniciar</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


