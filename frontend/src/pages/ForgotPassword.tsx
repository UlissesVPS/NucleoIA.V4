import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputWithIcon from '@/components/InputWithIcon';
import Logo from '@/components/Logo';
import FloatingIcons from '@/components/FloatingIcons';
import api from '@/lib/api';

type UIState = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [uiState, setUiState] = useState<UIState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setUiState('loading');
    setErrorMsg('');

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setUiState('success');
    } catch (err: any) {
      setUiState('error');
      setErrorMsg(
        err.response?.data?.error?.message || 'Erro ao processar solicitacao. Tente novamente.'
      );
    }
  };

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
            Recuperar senha
          </p>
        </div>

        <div className="glass-card-gradient rounded-2xl p-8">
          {uiState === 'success' ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground text-center">
                Email Enviado!
              </p>
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Se o email <strong className="text-foreground">{email}</strong> estiver
                cadastrado, voce recebera um link de recuperacao.
                Verifique sua caixa de entrada e spam.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                O link expira em 1 hora.
              </p>
              <Link to="/login" className="w-full mt-2">
                <Button variant="gradient" className="w-full">
                  Voltar para Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Esqueceu sua senha?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Digite seu email e enviaremos um link para redefinir sua senha
                </p>
                <div className="flex items-start gap-2 bg-primary/5 border border-primary/10 rounded-lg p-2.5 mt-3">
                  <Info className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground/80">Comprou acesso e nunca definiu senha?</strong>{' '}
                    Use o email da compra aqui para criar sua senha de acesso.
                  </p>
                </div>
              </div>

              {uiState === 'error' && errorMsg && (
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-5">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <InputWithIcon
                    icon={Mail}
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  disabled={uiState === 'loading'}
                >
                  {uiState === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ENVIANDO...
                    </>
                  ) : (
                    'ENVIAR LINK DE RECUPERACAO'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
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
