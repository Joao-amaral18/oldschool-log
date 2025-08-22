import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function NotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            return
        }

        const checkPermission = async () => {
            const result = await Notification.requestPermission()
            setPermission(result)
        }

        // Only show prompt if permission is default and user has interacted with the app
        const hasUserInteracted = localStorage.getItem('user-interacted')
        const hasAskedBefore = localStorage.getItem('notification-prompt-shown')

        if (hasUserInteracted && !hasAskedBefore && permission === 'default') {
            // Small delay to avoid being too aggressive
            setTimeout(() => {
                setShowPrompt(true)
            }, 3000)
        }

        checkPermission()
    }, [])

    const handleEnable = async () => {
        try {
            const result = await Notification.requestPermission()
            setPermission(result)

            if (result === 'granted') {
                toast.success('Notificações ativadas! Você receberá lembretes de treino.')
                // Register for push notifications
                if ('serviceWorker' in navigator && 'PushManager' in window) {
                    await navigator.serviceWorker.ready
                    // Note: For production, you would need a VAPID key
                    // const subscription = await registration.pushManager.subscribe({...})
                }
            } else {
                toast.error('Permissão de notificação negada.')
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error)
            toast.error('Erro ao solicitar permissão de notificação.')
        }

        setShowPrompt(false)
        localStorage.setItem('notification-prompt-shown', 'true')
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('notification-prompt-shown', 'true')
    }

    const handleDisable = () => {
        setShowPrompt(false)
        localStorage.setItem('notification-prompt-shown', 'true')
        localStorage.setItem('notifications-disabled', 'true')
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/20 p-2">
                                <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Ativar Notificações</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Receba lembretes para seus treinos e acompanhe seu progresso!
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismiss}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={handleEnable} className="flex-1">
                            <Bell className="h-3 w-3 mr-1" />
                            Ativar
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDisable}>
                            <BellOff className="h-3 w-3 mr-1" />
                            Agora Não
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
