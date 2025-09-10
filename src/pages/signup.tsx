import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, UserPlus, User } from "lucide-react"

export default function SignupPage() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.")
            setIsLoading(false)
            return
        }

        try {
            await signup(email, password, username)
            navigate("/")
        } catch (error: any) {
            if (error.message === 'EMAIL_CONFIRMATION_REQUIRED') {
                setSuccess("Conta criada com sucesso! Verifique seu email e clique no link de confirmação para ativar sua conta.")
            } else {
                setError("Erro ao criar conta. Tente novamente.")
            }
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
                        <UserPlus className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-display mb-3">Criar conta</h1>
                    <p className="text-body text-muted-foreground">Junte-se ao Oldschool Log</p>
                </div>

                {/* Signup Card */}
                <div className="login-card p-8">
                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive text-center">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                <p className="text-sm text-green-600 text-center">{success}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="username"
                                className="text-sm font-medium flex items-center gap-2"
                            >
                                <User className="w-4 h-4 text-muted-foreground" />
                                Nome de usuário
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="seu_nome"
                                    className="pl-12 h-12"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

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

                        <div className="space-y-2">
                            <label
                                htmlFor="confirmPassword"
                                className="text-sm font-medium flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    Criando conta...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Criar conta
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground">
                            Já tem uma conta?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Fazer login
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
