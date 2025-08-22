import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, LogIn } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            await login(email, password)
            navigate("/")
        } catch (error) {
            setError("Credenciais inválidas. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <LogIn className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-display mb-3">Bem-vindo</h1>
                    <p className="text-body text-muted-foreground">Entre na sua conta para continuar</p>
                </div>

                {/* Login Card */}
                <div className="login-card p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive text-center">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="email"
                                className="text-sm font-medium flex items-center gap-2"
                            >
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="seu@email.com"
                                    className="pl-12 h-12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="pl-12 h-12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Entrando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <LogIn className="w-4 h-4" />
                                    Entrar
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground">
                            Não tem uma conta?{" "}
                            <Link
                                to="/signup"
                                className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <p className="text-caption text-muted-foreground">
                        Oldschool Log - Seu parceiro de treinos
                    </p>
                </div>
            </div>
        </div>
    )
}
