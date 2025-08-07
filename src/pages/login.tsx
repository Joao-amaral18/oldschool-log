import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { defaults } from '@/types'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const { login, signup, session } = useAuth()
  const navigate = useNavigate()
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/treino', { replace: true })
    }
  }, [session, navigate])

  // Helper function to check if input is email
  const isEmail = (input: string) => {
    return input.includes('@') && input.includes('.')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos')
      return
    }
    if (isSignup && !username.trim()) {
      setError('Por favor, digite seu nome de usuário')
      return
    }

    try {
      setLoading(true)

      if (isSignup) {
        // For signup, emailOrUsername should be email
        if (!isEmail(emailOrUsername)) {
          setError('Por favor, digite um email válido para cadastro')
          return
        }
        await signup(emailOrUsername.trim(), password, username.trim())
        await api.upsertProfile(username.trim())
        await api.seedDefaultExercises(defaults.exercises as any)
        toast.success('Conta criada com sucesso!')
      } else {
        // For login, try to determine if it's email or username
        let emailToUse = emailOrUsername.trim()

        if (!isEmail(emailOrUsername)) {
          // It's a username, find the associated email
          const foundEmail = await api.findEmailByUsername(emailOrUsername.trim())
          if (!foundEmail) {
            setError('Usuário não encontrado')
            return
          }
          emailToUse = foundEmail
        }

        await login(emailToUse, password)
        toast.success('Bem-vindo!')
      }
      navigate('/treino')
    } catch (err: any) {
      const message = err?.message || (isSignup ? 'Falha no cadastro' : 'Falha no login')
      if (message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos')
      } else if (message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">oldschool log</h1>
        </div>

        {/* Título e Subtítulo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSignup ? 'Bem-vindo!' : 'Bem-vindo de volta.'}
          </h1>
          <h2 className="text-gray-400 text-base font-normal">
            {isSignup ? 'Crie sua conta para começar' : 'Acesse sua conta para continuar.'}
          </h2>
        </div>

        {/* Formulário */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Campo Email/Username */}
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-gray-300">
              {isSignup ? 'Email' : 'Email ou usuário'}
            </Label>
            <div className="relative">
              <Mail className="login-icon w-5 h-5" />
              <Input
                id="emailOrUsername"
                type={isSignup ? "email" : "text"}
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder={isSignup ? "Digite seu email" : "Digite seu email ou usuário"}
                autoComplete="email"
                autoFocus
                className="pl-12"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Senha</Label>
            <div className="relative">
              <Lock className="login-icon w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Campo Username (apenas signup) */}
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">Nome de usuário</Label>
              <div className="relative">
                <Mail className="login-icon w-5 h-5" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu nome de usuário"
                  autoComplete="username"
                  className="pl-12"
                />
              </div>
            </div>
          )}

          {/* Link Esqueci minha senha */}
          {!isSignup && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="login-error">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Botão Principal */}
          <Button
            type="submit"
            disabled={loading || !emailOrUsername.trim() || !password.trim() || (isSignup && !username.trim())}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignup ? 'Criando conta...' : 'Entrando...'}
              </>
            ) : (
              isSignup ? 'Criar conta' : 'Entrar'
            )}
          </Button>

          {/* Link de Cadastro */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup)
                setError('')
              }}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {isSignup ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
              <span className="text-primary font-semibold">
                {isSignup ? 'Fazer login' : 'Cadastre-se'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


