import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';
import FloatingIcons from '@/components/FloatingIcons';
import api from '@/lib/api';

type UIState = 'validating' | 'idle' | 'loading' | 'success' | 'error' | 'invalid';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [uiState, setUiState] = useState<UIState>('validating');
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const hasMinLength = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = hasMinLength && passwordsMatch;

  useEffect(() => {
    if (!token) {
      setErrorMsg('Link invalido. Solicite uma nova recuperacao de senha.');
      setUiState('invalid');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data } = await api.get(`/auth/reset-password/${token}`);
      if (data.success) {
        setUserEmail(data.data.email);
        setUiState('idle');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Link invalido ou expirado.');
      setUiState('invalid');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setUiState('loading');
    setErrorMsg('');

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      if (data.success) {
        setUiState('success');
        setTimeout(() => navigate('/login'), 4000);
      }
    } catch (err: any) {
      setUiState('error');
      setErrorMsg(err.response?.data?.error?.message || 'Erro ao redefinir senha.');
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm transition-colors ${valid ? 'text-emerald-400' : 'text-muted-foreground'}`}>
      {valid ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {text}
    </div>
  );

  if (uiState === 'validating') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
        <FloatingIcons />
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validando seu link...</p>
        </div>
      </div>
    );
  }

  if (uiState === 'invalid' || uiState === 'success') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
        <FloatingIcons />
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="xl" />
            </div>
          </div>

          <div className="glass-card-gradient rounded-2xl p-8">
            {uiState === 'success' ? (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  Senha Atualizada!
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Sua senha foi redefinida com sucesso. Voce sera redirecionado para o login em instantes...
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  variant="gradient"
                  className="w-full mt-2"
                >
                  Ir para Login
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  Link Invalido
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {errorMsg}
                </p>
                <Button
                  onClick={() => navigate('/esqueci-senha')}
                  variant="gradient"
                  className="w-full mt-2"
                >
                  Solicitar Novo Link
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                >
                  Voltar para Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
      <FloatingIcons />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">
            Nova senha
          </p>
        </div>

        <div className="glass-card-gradient rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Redefinir Senha
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Crie uma nova senha para <strong className="text-foreground">{userEmail}</strong>
            </p>
          </div>

          {uiState === 'error' && errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-destructive text-sm text-center">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nova Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Sua senha deve conter:</p>
              <ValidationItem valid={hasMinLength} text="Minimo 6 caracteres" />
              <ValidationItem valid={passwordsMatch} text="Senhas coincidem" />
            </div>

            <Button
              type="submit"
              disabled={!isPasswordValid || uiState === 'loading'}
              variant="gradient"
              size="xl"
              className="w-full"
            >
              {uiState === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  REDEFININDO...
                </>
              ) : (
                'REDEFINIR SENHA'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nucleo IA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
