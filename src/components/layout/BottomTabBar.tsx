import {
    Home,
    Dumbbell,
    LayoutGrid,
    BarChart2,
    History,
    Settings,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useScrollDirection } from '@/hooks/useScrollDirection'

const tabs = [
    { path: '/treino', label: 'Treino', icon: Dumbbell },
    { path: '/templates', label: 'Templates', icon: LayoutGrid },
    { path: '/history', label: 'Histórico', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export function BottomTabBar() {
    const location = useLocation()
    const { scrollDirection } = useScrollDirection()

    const isSessionPage = location.pathname.includes('/session/')

    // Find active tab index for pill animation
    const activeTabIndex = tabs.findIndex(tab =>
        location.pathname === tab.path ||
        (tab.path === '/treino' && location.pathname === '/') ||
        (tab.path === '/templates' && location.pathname.startsWith('/templates')) ||
        (tab.path === '/history' && location.pathname.startsWith('/history'))
    )

    if (isSessionPage) {
        return null
    }

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-lg border-t border-border/60 transition-transform duration-300 ${scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
                }`}
        >
            <div className="relative flex justify-around items-center h-16">
                {/* Pill for active tab */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-12 w-[25%] bg-primary/10 rounded-full transition-transform duration-300 ease-in-out"
                    style={{
                        transform: `translateX(${activeTabIndex * 100}%) translateY(-50%)`,
                    }}
                />

                {tabs.map((tab, index) => (
                    <NavLink
                        key={tab.path}
                        to={tab.path}
                        className={({ isActive }) =>
                            `relative z-20 flex-1 flex flex-col items-center justify-center text-center transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'
                            }`
                        }
                    >
                        <tab.icon
                            className="w-6 h-6 mb-1"
                            aria-hidden="true"
                        />
                        <span className="text-xs font-medium">{tab.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    )
}
