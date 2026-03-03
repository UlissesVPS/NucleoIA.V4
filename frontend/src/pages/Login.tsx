import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputWithIcon from '@/components/InputWithIcon';
import Logo from '@/components/Logo';
import FloatingIcons from '@/components/FloatingIcons';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      if (data.success && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        await refreshUser();
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      const errData = err.response?.data;
      const code = errData?.error?.code;

      if (code === 'PASSWORD_RESET_REQUIRED') {
        setErrorMsg('Voce precisa definir sua senha. Verifique seu email de boas-vindas.');
      } else if (code === 'AUTH_USER_INACTIVE') {
        setErrorMsg('Sua conta esta inativa. Entre em contato com o suporte.');
      } else if (code === 'AUTH_INVALID_CREDENTIALS') {
        setErrorMsg('Email ou senha incorretos.');
      } else if (code === 'AUTH_PENDING_APPROVAL') {
        setErrorMsg('Seu cadastro esta aguardando aprovacao do administrador. Voce sera notificado por email quando sua conta for ativada.');
      } else {
        setErrorMsg(errData?.error?.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Floating AI Icons */}
      <FloatingIcons />

      {/* Top gradient decoration */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent pointer-events-none" />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">
            Acesse seu hub de inteligencia
          </p>
        </div>

        <div className="glass-card-gradient rounded-2xl p-8">
          {errorMsg && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-5">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <InputWithIcon
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <Link to="/esqueci-senha" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <InputWithIcon
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ENTRANDO...
                </>
              ) : (
                'ENTRAR'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nao tem uma conta?{' '}
              <Link
                to="/solicitar-acesso"
                className="text-primary hover:underline font-medium"
              >
                Solicitar acesso
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/termos"
              className="hover:text-foreground transition-colors"
            >
              Termos de Uso
            </Link>
            <span>|</span>
            <Link
              to="/privacidade"
              className="hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
            <span>|</span>
            <Link
              to="/suporte"
              className="hover:text-foreground transition-colors"
            >
              Suporte
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nucleo IA. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
