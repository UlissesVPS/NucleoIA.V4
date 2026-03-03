import { useAuth } from '@/contexts/AuthContext';

export const usePlanAccess = () => {
  const { user, isAdmin } = useAuth();
  const tier = user?.planTier || 'DIAMANTE';

  // Admin always has full access
  if (isAdmin) {
    return {
      canAccessPrompts: true,
      canAccessAgents: true,
      tier: 'DIAMANTE' as const,
      isPro: false,
      isDiamante: true,
    };
  }

  const isDiamante = tier === 'DIAMANTE';
  const isPro = tier === 'PRO';

  return {
    canAccessPrompts: isDiamante,
    canAccessAgents: isDiamante,
    tier,
    isPro,
    isDiamante,
  };
};
