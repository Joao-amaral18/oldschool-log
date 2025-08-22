// Notification utilities for PWA

export const notificationUtils = {
    // Request notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications')
            return 'denied'
        }

        const permission = await Notification.requestPermission()
        return permission
    },

    // Check if notifications are supported and permitted
    isSupported(): boolean {
        return 'Notification' in window
    },

    // Get current permission status
    getPermission(): NotificationPermission {
        return Notification.permission
    },

    // Send a test notification
    async sendTestNotification(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Notifications not supported')
            return false
        }

        if (this.getPermission() !== 'granted') {
            const permission = await this.requestPermission()
            if (permission !== 'granted') {
                console.warn('Notification permission not granted')
                return false
            }
        }

        const notification = new Notification('Workout Online', {
            body: 'Teste de notificação! Seu app está funcionando corretamente.',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'test-notification',
            requireInteraction: false
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close()
        }, 5000)

        return true
    },

    // Send workout reminder notification
    async sendWorkoutReminder(message: string = 'Hora de treinar!'): Promise<boolean> {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return false
        }

        new Notification('Lembrete de Treino', {
            body: message,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'workout-reminder',
            requireInteraction: true
            // Note: actions are not supported in all browsers
        })

        return true
    },

    // Send progress notification
    async sendProgressNotification(message: string): Promise<boolean> {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return false
        }

        const notification = new Notification('Progresso no Treino', {
            body: message,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'progress-notification',
            requireInteraction: false
        })

        // Auto-close after 3 seconds
        setTimeout(() => {
            notification.close()
        }, 3000)

        return true
    },

    // Send offline sync notification
    async sendSyncNotification(): Promise<boolean> {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return false
        }

        const notification = new Notification('Sincronização Completa', {
            body: 'Seus dados foram sincronizados com a nuvem!',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'sync-notification',
            requireInteraction: false
        })

        // Auto-close after 2 seconds
        setTimeout(() => {
            notification.close()
        }, 2000)

        return true
    }
}

// Helper to check if user has seen notification prompt before
export const hasSeenNotificationPrompt = (): boolean => {
    return localStorage.getItem('notification-prompt-shown') === 'true'
}

// Helper to check if notifications are disabled
export const areNotificationsDisabled = (): boolean => {
    return localStorage.getItem('notifications-disabled') === 'true'
}
