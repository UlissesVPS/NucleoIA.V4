import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  plan?: string;
  subscriptionStatus?: string;
}

type ViewMode = 'admin' | 'member';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  toggleAdminDemo: () => void;
  refreshUser: () => Promise<void>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  effectiveRole: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/solicitar-acesso', '/auth/magic', '/primeiro-acesso'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (sessionStorage.getItem('viewMode') as ViewMode) || 'admin';
  });
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicPath = PUBLIC_PATHS.some((p) =>
    location.pathname.startsWith(p)
  );

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.data);
        // Load language preference from profile into localStorage
        if (data.data?.language) {
          localStorage.setItem('language', data.data.language);
        }
      } else {
        setUser(null);
        localStorage.removeItem('accessToken');
      }
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, isPublicPath, navigate]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout errors
    }
    setUser(null);
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('viewMode');
    navigate('/login', { replace: true });
  }, [navigate]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    sessionStorage.setItem('viewMode', mode);
  }, []);

  const toggleAdminDemo = useCallback(() => {
    // Toggle viewMode for super admins
    if (user?.role === 'SUPER_ADMIN') {
      setViewMode(viewMode === 'admin' ? 'member' : 'admin');
    }
  }, [user, viewMode, setViewMode]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const realIsAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const realIsSuperAdmin = user?.role === 'SUPER_ADMIN';

  // effectiveRole: when SUPER_ADMIN is in member viewMode, treat as MEMBER
  const effectiveRole = realIsSuperAdmin && viewMode === 'member' ? 'MEMBER' : (user?.role || 'MEMBER');
  const isAdmin = effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN';
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSuperAdmin,
        isAuthenticated,
        isLoading,
        logout,
        toggleAdminDemo,
        refreshUser,
        viewMode,
        setViewMode,
        effectiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
