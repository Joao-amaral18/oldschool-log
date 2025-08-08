import { Outlet, Link, useLocation } from 'react-router-dom'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { cn } from '@/lib/utils'

function App() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return (
      <div className="min-h-full">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 hidden md:block">
        <div className="container-app flex items-center justify-between py-3">
          <Link to="/" className="text-base font-bold tracking-tight">oldschool log</Link>
          <nav className="flex items-center gap-6 text-sm">
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
                  'rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-accent-foreground ' +
                  (location.pathname.startsWith(item.to) ? 'bg-accent/60 text-foreground' : 'text-foreground/70')
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
      <main className={cn(
        "container-app pt-2 pb-24 md:py-6",
        location.pathname.startsWith('/session/') ? "pb-6" : "pb-24"
      )}>
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  )
}

export default App
