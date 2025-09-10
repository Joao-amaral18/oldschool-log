import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, ArrowLeft, Shield } from "lucide-react"

export default function RecoveryPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { resetPassword } = useAuth()
    const navigate = useNavigate()

    const handleRecovery = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        try {
            await resetPassword(email)
            setSuccess("Email de recuperação enviado! Verifique sua caixa de entrada.")
        } catch (error) {
            setError("Erro ao enviar email de recuperação. Tente novamente.")
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
                        <Shield className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-display mb-3">Recuperar senha</h1>
                    <p className="text-body text-muted-foreground">Digite seu email para receber instruções de recuperação</p>
                </div>

                {/* Recovery Card */}
                <div className="login-card p-8">
                    <form onSubmit={handleRecovery} className="space-y-6">
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

                        <Button
                            type="submit"
                            className="login-button"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Enviando...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Enviar email de recuperação
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-border text-center">
                        <p className="text-sm text-muted-foreground">
                            Lembrou sua senha?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Fazer login
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar ao login
                        </Link>
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
