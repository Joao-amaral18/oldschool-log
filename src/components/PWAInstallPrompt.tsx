import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
    platforms: string[]
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    prompt(): Promise<void>
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault()
            setDeferredPrompt(event as BeforeInstallPromptEvent)

            // Show prompt after a short delay to avoid being too aggressive
            setTimeout(() => setShowPrompt(true), 2000)
        }

        const handleAppInstalled = () => {
            setDeferredPrompt(null)
            setShowPrompt(false)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        try {
            await deferredPrompt.prompt()
            const choice = await deferredPrompt.userChoice

            if (choice.outcome === 'accepted') {
                console.log('User accepted the install prompt')
            } else {
                console.log('User dismissed the install prompt')
            }

            setDeferredPrompt(null)
            setShowPrompt(false)
        } catch (error) {
            console.error('Error during installation:', error)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Store dismissal to avoid showing again too soon
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    if (!showPrompt || !deferredPrompt) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/20 p-2">
                                <Download className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">Install Oldschool Log</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Install this app on your device for a better experience
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
                        <Button size="sm" onClick={handleInstall} className="flex-1">
                            Install App
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleDismiss}>
                            Later
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
