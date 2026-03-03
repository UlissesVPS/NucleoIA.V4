import { Lock, Crown, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface UpgradeScreenProps {
  feature?: string;
}

const UpgradeScreen = ({ feature }: UpgradeScreenProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <GlassCard className="max-w-md w-full text-center p-8 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Funcionalidade Exclusiva
          </h2>
          <p className="text-white/60 text-sm">
            {feature
              ? `O acesso a ${feature} esta disponivel apenas no Plano Diamante.`
              : 'Esta funcionalidade esta disponivel apenas no Plano Diamante.'}
          </p>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <span className="text-amber-400 font-semibold">Plano Diamante</span>
          </div>
          <p className="text-white/50 text-xs">
            Acesso completo a Prompts, Agentes e todas as funcionalidades da plataforma.
          </p>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold"
          onClick={() => window.open('https://wa.me/5511999999999?text=Quero%20fazer%20upgrade%20para%20o%20Plano%20Diamante', '_blank')}
        >
          Fazer Upgrade
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </GlassCard>
    </div>
  );
};

export default UpgradeScreen;
