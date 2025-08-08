import React from 'react'

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean; message?: string }> {
    constructor(props: React.PropsWithChildren) {
        super(props)
        this.state = { hasError: false }
    }
    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, message: (error as any)?.message || 'Algo deu errado.' }
    }
    componentDidCatch(error: unknown) {
        // log if needed
        console.error(error)
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="container-app py-10">
                    <div className="surface p-6">
                        <h1 className="text-xl font-semibold mb-2">Ocorreu um erro</h1>
                        <p className="text-sm text-muted-foreground mb-4">{this.state.message}</p>
                        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => location.reload()}>Recarregar</button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}


