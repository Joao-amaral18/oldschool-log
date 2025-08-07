import { Link, useLocation } from 'react-router-dom'
import { Dumbbell, FileText, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrollDirection } from '@/hooks/useScrollDirection'
import { Card } from '@/components/ui/card'

const tabs = [
    {
        id: 'treino',
        label: 'Treino',
        icon: Dumbbell,
        path: '/treino'
    },
    {
        id: 'templates',
        label: 'Templates',
        icon: FileText,
        path: '/templates'
    },
    {
        id: 'history',
        label: 'Histórico',
        icon: History,
        path: '/history'
    }
]

export function BottomTabBar() {
    const location = useLocation()
    const { isVisible } = useScrollDirection()

    // Hide navbar in session page
    const isSessionPage = location.pathname.startsWith('/session/')

    // Find active tab index for pill animation
    const activeTabIndex = tabs.findIndex(tab =>
        location.pathname === tab.path ||
        (tab.path === '/treino' && location.pathname === '/') ||
        (tab.path === '/templates' && location.pathname.startsWith('/templates'))
    )

    if (isSessionPage) {
        return null
    }

    return (
        <nav
            className={cn(
                'fixed bottom-4 left-4 right-4 z-50 md:hidden liquid-float-3 transition-[transform,opacity] duration-300 ease-out will-change-transform',
                isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
            )}
        >
            <Card className="liquid-navbar px-2 py-2">
                <div className="flex relative">
                    {/* Animated pill background */}
                    <div
                        className="absolute top-2 bottom-2 liquid-pill transition-all duration-300 ease-out"
                        style={{
                            width: `calc(33.333% - 8px)`,
                            left: `calc(${activeTabIndex * 33.333}% + 4px)`,
                            opacity: activeTabIndex >= 0 ? 1 : 0
                        }}
                    />

                    {tabs.map((tab, index) => {
                        const Icon = tab.icon
                        const isActive = index === activeTabIndex

                        return (
                            <Link
                                key={tab.id}
                                to={tab.path}
                                className="flex-1 flex flex-col items-center justify-center py-3 px-2 min-h-[56px] relative z-10 transition-all duration-300"
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 mb-1 transition-all duration-300',
                                        isActive
                                            ? 'text-primary-foreground scale-110'
                                            : 'text-muted-foreground hover:text-foreground hover:scale-105'
                                    )}
                                />
                                <span
                                    className={cn(
                                        'text-xs font-medium transition-all duration-300',
                                        isActive
                                            ? 'text-primary-foreground font-semibold'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    {tab.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </Card>
        </nav>
    )
}
