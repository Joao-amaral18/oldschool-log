import { Outlet, Link, useLocation } from 'react-router-dom'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { cn } from '@/lib/utils'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import NotificationPrompt from '@/components/NotificationPrompt'

function App() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  // Track user interaction for notification prompt
  const handleUserInteraction = () => {
    localStorage.setItem('user-interacted', 'true')
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/90 hidden md:block">
        <div className="container-app flex items-center justify-between py-4">
          <Link to="/" className="text-heading-3 font-bold tracking-tight">Workout Online</Link>
          <nav className="flex items-center gap-8 text-body">
            {[
              { to: '/treino', label: 'Treino' },
              { to: '/templates', label: 'Templates' },
              { to: '/history', label: 'Histórico' },
              { to: '/analytics', label: 'Analytics' },
              { to: '/settings', label: 'Configurações' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  'px-3 py-2 rounded-lg transition-colors hover:bg-accent ' +
                  (location.pathname.startsWith(item.to)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main
        className={cn(
          "container-app flex-1 py-6 md:py-8",
          location.pathname.startsWith('/session/') ? "pb-6 pt-0" : "pb-24"
        )}
        onClick={handleUserInteraction}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Notification Prompt */}
      <NotificationPrompt />
    </div>
  )
}

export default App
