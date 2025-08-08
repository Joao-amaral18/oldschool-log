import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, User, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'

const getPageTitle = (pathname: string): string => {
    if (pathname === '/' || pathname === '/treino') return 'Treino'
    if (pathname === '/templates') return 'Templates'
    if (pathname.startsWith('/templates/')) return 'Editar Template'
    if (pathname.startsWith('/session/')) return 'Sessão de Treino'
    if (pathname === '/history') return 'Histórico'
    if (pathname === '/analytics') return 'Analytics'
    if (pathname.startsWith('/analytics/exercise')) return 'Progresso por Exercício'
    if (pathname.startsWith('/analytics/volume')) return 'Análise de Volume'
    if (pathname.startsWith('/analytics/habits')) return 'Hábitos'
    if (pathname.startsWith('/analytics/prs')) return 'Meus Recordes'
    if (pathname === '/settings') return 'Configurações'
    if (pathname === '/login') return 'Login'
    return 'Oldschool Log'
}

export function MobileHeader() {
    const location = useLocation()
    const navigate = useNavigate()
    const { session, logout } = useAuth()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [templateName, setTemplateName] = useState('')
    const [canSaveTemplate, setCanSaveTemplate] = useState(false)

    const pageTitle = getPageTitle(location.pathname)
    const isEditingTemplate = location.pathname.startsWith('/templates/')

    const handleLogout = () => {
        logout()
        setIsMenuOpen(false)
        navigate('/login')
    }

    const handleMenuItemClick = (path: string) => {
        navigate(path)
        setIsMenuOpen(false)
    }

    useEffect(() => {
        if (!isEditingTemplate) return
        const onState = (e: Event) => {
            const detail = (e as CustomEvent).detail as { name?: string; canSave?: boolean } | undefined
            if (detail?.name !== undefined) setTemplateName(detail.name)
            if (typeof detail?.canSave === 'boolean') setCanSaveTemplate(!!detail.canSave)
        }
        window.addEventListener('template:state', onState as EventListener)
        return () => {
            window.removeEventListener('template:state', onState as EventListener)
        }
    }, [isEditingTemplate])

    const handleTemplateNameChange = (value: string) => {
        setTemplateName(value)
        window.dispatchEvent(new CustomEvent('template:setName', { detail: { name: value } }))
    }

    const handleTemplateSave = () => {
        if (!canSaveTemplate) return
        window.dispatchEvent(new Event('template:save'))
    }

    if (location.pathname === '/login' || location.pathname.startsWith('/session/')) {
        return null
    }

    if (isEditingTemplate) {
        return (
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
                <div className="flex h-14 items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => navigate('/templates')}
                    >
                        <X className="h-5 w-5" />
                        <span className="sr-only">Cancelar</span>
                    </Button>
                    <h1 className="font-semibold text-foreground">Editar Template</h1>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 ${canSaveTemplate ? 'text-emerald-400' : 'text-muted-foreground'}`}
                        onClick={handleTemplateSave}
                        disabled={!canSaveTemplate}
                    >
                        <Check className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                </div>
                <div className="px-4 pb-2">
                    <Input
                        value={templateName}
                        onChange={(e) => handleTemplateNameChange(e.target.value)}
                        placeholder="Nome do template"
                        className="h-9 text-base font-medium"
                    />
                </div>
            </header>
        )
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-14 items-center justify-between px-4">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Abrir menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72">
                        <SheetHeader>
                            <SheetTitle className="text-left">Oldschool Log</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-2">
                            {session && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium">{session.username}</div>
                                        <div className="text-xs text-muted-foreground">Usuário logado</div>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-11"
                                onClick={() => handleMenuItemClick('/settings')}
                            >
                                <Settings className="h-5 w-5" />
                                Configurações
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5" />
                                Sair
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <h1 className="font-semibold text-foreground">{pageTitle}</h1>

                {/* Spacer para balancear o layout */}
                <div className="w-9" />
            </div>
        </header>
    )
}
