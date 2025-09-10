import { Outlet, Link, useLocation } from 'react-router-dom'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { cn } from '@/lib/utils'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import NotificationPrompt from '@/components/NotificationPrompt'

function App() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const isSignupPage = location.pathname === '/signup'
  const isRecoveryPage = location.pathname === '/recovery'

  // Track user interaction for notification prompt
  const handleUserInteraction = () => {
    localStorage.setItem('user-interacted', 'true')
  }

  if (isLoginPage || isSignupPage || isRecoveryPage) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 hidden md:block">
        <div className="container-app flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-colors duration-200 hover:opacity-80"
          >
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">W</span>
            </div>
            <span className="text-base font-medium text-foreground">
              Workout Online
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {[
              { to: '/treino', label: 'Treino' },
              { to: '/templates', label: 'Templates' },
              { to: '/history', label: 'Histórico' },
              { to: '/analytics', label: 'Analytics' },
              { to: '/settings', label: 'Configurações' },
            ].map((item) => {
              const isActive = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    relative px-3 py-2 text-sm font-medium
                    transition-colors duration-200
                    ${isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              )
            })}
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
