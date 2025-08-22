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
    },

    // Send rest timer notification (live activity style for iOS)
    async sendRestTimerNotification(exerciseName: string, setNumber: number, remainingSeconds: number, totalSeconds: number): Promise<Notification | null> {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return null
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

        // Calculate progress percentage
        const progress = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)

        // Format time display
        const formatTime = (seconds: number): string => {
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
        }

        const notification = new Notification('⏱️ Descanso em Andamento', {
            body: `${exerciseName} - Série ${setNumber}\n${formatTime(remainingSeconds)} restantes (${progress}%)`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'rest-timer-notification',
            requireInteraction: true,
            // iOS specific options
            ...(isIOS && {
                silent: false,
                data: { type: 'rest-timer', exerciseName, setNumber, remainingSeconds }
            })
        })

        // Add click handler to bring user back to app
        notification.onclick = () => {
            window.focus()
            notification.close()
        }

        return notification
    },

    // Update existing rest timer notification
    async updateRestTimerNotification(notification: Notification, exerciseName: string, setNumber: number, remainingSeconds: number, totalSeconds: number): Promise<Notification | undefined> {
        if (!notification) return

        const progress = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)

        const formatTime = (seconds: number): string => {
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
        }

        // Close the old notification and create a new one with updated content
        // This is because the Notification API doesn't allow updating body content directly
        notification.close()

        const updatedNotification = new Notification('⏱️ Descanso em Andamento', {
            body: `${exerciseName} - Série ${setNumber}\n${formatTime(remainingSeconds)} restantes (${progress}%)`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'rest-timer-notification',
            requireInteraction: true,
            silent: false
        })

        // Add click handler to the new notification
        updatedNotification.onclick = () => {
            window.focus()
            updatedNotification.close()
        }

        return updatedNotification
    },

    // Send rest timer completion notification
    async sendRestTimerCompleteNotification(exerciseName: string, setNumber: number): Promise<boolean> {
        if (!this.isSupported() || this.getPermission() !== 'granted') {
            return false
        }

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

        const notification = new Notification('✅ Descanso Concluído!', {
            body: `${exerciseName} - Série ${setNumber} terminou. Pronto para continuar!`,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'rest-timer-complete',
            requireInteraction: true,
            // iOS specific options
            ...(isIOS && {
                silent: false,
                vibrate: [200, 100, 200] // iOS haptic feedback pattern
            })
        })

        // Add click handler to bring user back to app
        notification.onclick = () => {
            window.focus()
            notification.close()
        }

        // Auto-close after 10 seconds
        setTimeout(() => {
            notification.close()
        }, 10000)

        // Try to trigger vibration on iOS if supported
        if ('vibrate' in navigator) {
            // Enhanced vibration pattern for timer completion
            navigator.vibrate([200, 100, 200, 100, 300])
        }

        return true
    },

    // Close all rest timer notifications
    closeRestTimerNotifications(): void {
        // Close any existing rest timer notifications
        // Note: This is a simplified approach since we can't directly access existing notifications
        // In a production app, you'd want to keep track of active notifications
        if ('serviceWorker' in navigator && 'getNotifications' in window.ServiceWorkerRegistration?.prototype) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.getNotifications({ tag: 'rest-timer-notification' }).then(notifications => {
                        notifications.forEach(notification => notification.close())
                    })
                }
            })
        }
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

// Audio utilities for rest timer alarm
export const audioUtils = {
    // Play rest timer completion alarm
    async playRestAlarm(): Promise<boolean> {
        try {
            // Try to play custom alarm.mp3 first
            const audio = new Audio('/alarm.mp3')

            // Set up event handlers
            audio.volume = 0.8 // 80% volume to not be too loud

            return new Promise((resolve) => {
                audio.oncanplay = async () => {
                    try {
                        // iOS Safari requires user interaction before playing audio
                        // This will work if called from a user interaction context
                        await audio.play()
                        resolve(true)
                    } catch (error) {
                        console.warn('Custom alarm playback failed, trying fallback:', error)
                        resolve(await this.playFallbackAlarm())
                    }
                }

                audio.onerror = async () => {
                    console.warn('Custom alarm file not found, using fallback')
                    resolve(await this.playFallbackAlarm())
                }

                audio.onended = () => {
                    // Clean up audio element
                    audio.remove()
                }

                // Start loading
                audio.load()
            })
        } catch (error) {
            console.warn('Audio playback failed, using fallback:', error)
            return await this.playFallbackAlarm()
        }
    },

    // Fallback alarm using Web Audio API (beep sound)
    async playFallbackAlarm(): Promise<boolean> {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            // Create a pleasant beep sound (800Hz for 200ms, then 1000Hz for 200ms)
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.4)

            return true
        } catch (error) {
            console.warn('Fallback alarm also failed:', error)
            return false
        }
    },

    // Test if custom alarm file exists
    async testAlarmFile(): Promise<boolean> {
        return new Promise((resolve) => {
            const audio = new Audio('/alarm.mp3')

            audio.oncanplay = () => resolve(true)
            audio.onerror = () => resolve(false)

            audio.load()
        })
    },

    // Create a simple beep alarm programmatically (for testing)
    async playTestBeep(): Promise<boolean> {
        return await this.playFallbackAlarm()
    },

    // Get alarm status information
    async getAlarmStatus(): Promise<{
        hasCustomAlarm: boolean
        canPlayAudio: boolean
        audioContextState?: string
        canVibrate: boolean
    }> {
        const hasCustomAlarm = await this.testAlarmFile()

        let canPlayAudio = false
        let audioContextState: string | undefined

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            audioContextState = audioContext.state
            canPlayAudio = true
        } catch (error) {
            canPlayAudio = false
            console.warn('Audio context not available:', error)
        }

        return {
            hasCustomAlarm,
            canPlayAudio,
            audioContextState,
            canVibrate: this.isVibrationSupported()
        }
    },

    // Vibration utilities for rest timer alerts
    vibrateForRestTimer(): boolean {
        if (!('vibrate' in navigator)) {
            console.warn('Vibration not supported on this device')
            return false
        }

        try {
            // iOS/Android compatible vibration pattern
            // Pattern: 200ms vibrate, 100ms pause, 200ms vibrate, 100ms pause, 300ms vibrate
            const pattern = [200, 100, 200, 100, 300]

            navigator.vibrate(pattern)
            return true
        } catch (error) {
            console.warn('Vibration failed:', error)
            return false
        }
    },

    vibrateForTimerWarning(): boolean {
        if (!('vibrate' in navigator)) {
            return false
        }

        try {
            // Short warning vibration (just before timer ends)
            navigator.vibrate(150)
            return true
        } catch (error) {
            console.warn('Warning vibration failed:', error)
            return false
        }
    },

    stopVibration(): void {
        if ('vibrate' in navigator) {
            navigator.vibrate(0) // Stop any ongoing vibration
        }
    },

    // Check if vibration is supported
    isVibrationSupported(): boolean {
        return 'vibrate' in navigator
    }
}
