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
            className={`fixed bottom-4 left-4 right-4 z-10 overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-xl transition-transform duration-300 md:hidden ${
                scrollDirection === 'down'
                    ? 'translate-y-[calc(100%+2rem)]'
                    : 'translate-y-0'
            }`}
        >
            <div className="flex justify-around items-center h-16">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `relative z-20 flex-1 flex flex-col items-center justify-center text-center transition-colors duration-200 ${
                                isActive ||
                                (location.pathname === '/' &&
                                    tab.path === '/treino')
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`
                        }
                    >
                        <tab.icon className="w-6 h-6 mb-1" aria-hidden="true" />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
