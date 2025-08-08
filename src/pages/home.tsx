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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Iniciar Treino</h1>
        <Link to="/templates">
          <Button variant="outline">Gerenciar Templates</Button>
        </Link>
      </div>
      <div className="grid gap-3">
        {templates.length === 0 && (
          <div className="surface p-4 text-sm text-muted-foreground">Crie um template para começar.</div>
        )}
        {templates.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.exercises.length} exercícios</div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/templates/editor/${t.id}`}>
                  <Button variant="outline" size="sm">Editar</Button>
                </Link>
                <Link to={`/session/${t.id}`}>
                  <Button size="sm">Iniciar</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


