import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputWithIcon from '@/components/InputWithIcon';
import Logo from '@/components/Logo';
import FloatingIcons from '@/components/FloatingIcons';
import { toast } from 'sonner';
import api from '@/lib/api';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    if (errorMsg) setErrorMsg('');
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'O nome e obrigatorio.';
    }
    if (!formData.email.trim()) {
      return 'O email e obrigatorio.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Formato de email invalido.';
    }
    if (!formData.password) {
      return 'A senha e obrigatoria.';
    }
    if (formData.password.length < 6) {
      return 'A senha deve ter no minimo 6 caracteres.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'As senhas nao coincidem.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data } = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (data.success) {
        setIsSuccess(true);
        toast.success('Conta criada com sucesso!');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      const errData = err.response?.data;
      const code = errData?.error?.code;

      if (code === 'REGISTER_EMAIL_EXISTS') {
        setErrorMsg('Este email ja esta cadastrado. Tente fazer login.');
      } else if (code === 'REGISTER_INVALID_EMAIL') {
        setErrorMsg('Formato de email invalido.');
      } else if (code === 'REGISTER_WEAK_PASSWORD') {
        setErrorMsg('A senha deve ter no minimo 6 caracteres.');
      } else {
        setErrorMsg(errData?.error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden">
        <FloatingIcons />

        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-accent/5 to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="glass-card-gradient rounded-2xl p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3">
              Conta Criada com Sucesso!
            </h2>

            <p className="text-muted-foreground mb-6">
              Sua conta foi criada. Voce sera redirecionado para a pagina de login em instantes...
            </p>

            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                E-mail cadastrado:
              </p>
              <p className="text-foreground font-medium">{formData.email}</p>
            </div>

            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            &copy; {new Date().getFullYear()} Nucleo IA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background overflow-hidden py-8">
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
            Criar Conta
          </p>
        </div>

        <div className="glass-card-gradient rounded-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Crie sua conta</h2>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para criar sua conta na plataforma
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-5">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome Completo</label>
              <InputWithIcon
                icon={User}
                type="text"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={handleChange('name')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">E-mail</label>
              <InputWithIcon
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange('email')}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <InputWithIcon
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange('password')}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirmar Senha</label>
              <div className="relative">
                <InputWithIcon
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  CRIANDO CONTA...
                </>
              ) : (
                'CRIAR CONTA'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ja tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/termos" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <span>|</span>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <span>|</span>
            <Link to="/suporte" className="hover:text-foreground transition-colors">
              Suporte
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nucleo IA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
