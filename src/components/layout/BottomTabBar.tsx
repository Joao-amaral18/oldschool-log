import { Dumbbell, LayoutGrid, History } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useScrollDirection } from '@/hooks/useScrollDirection'

const tabs = [
    { path: '/treino', label: 'Treino', icon: Dumbbell },
    { path: '/templates', label: 'Templates', icon: LayoutGrid },
    { path: '/history', label: 'Histórico', icon: History },
]

export function BottomTabBar() {
    const location = useLocation()
    const { scrollDirection } = useScrollDirection()

    const isSessionPage = location.pathname.includes('/session/')

    if (isSessionPage) {
        return null
    }

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-md border-t border-border transition-transform duration-300 md:hidden ${scrollDirection === 'down'
                ? 'translate-y-full'
                : 'translate-y-0'
                }`}
        >
            <div className="flex justify-around items-center h-16 px-2 safe-padded">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors duration-200 min-h-[44px] ${isActive ||
                                (location.pathname === '/' &&
                                    tab.path === '/treino')
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            }`
                        }
                    >
                        <tab.icon className="w-5 h-5 mb-1" aria-hidden="true" />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
