'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

interface User {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    tenantStatus: 'onboarding' | 'active' | 'pending_join';
    role: 'MAIN_OWNER' | 'FRANCHISE_OWNER' | 'MANAGER' | 'MEMBER';
    workspaceType: 'MAIN' | 'FRANCHISE';
    onboardingRequired?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (email: string, password: string, redirectPath?: string) => Promise<void>;
    signup: (email: string, password: string, tenantName: string, firstName?: string, lastName?: string, redirectPath?: string) => Promise<void>;
    logout: () => Promise<void>;
    handleAuthSuccess: (data: any, emailOverride?: string) => User;
    refreshUserStatus: () => Promise<void>;
    updateUserContext: (updates: Partial<User>) => void;
    switchWorkspace: (tenantId: string) => Promise<void>;
    silentRefresh: () => Promise<string | null>;
    /** Immediately updates the UI theme and debounces the backend save */
    setThemePref: (theme: 'light' | 'dark' | 'system') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_THEMES = new Set(['light', 'dark', 'system']);

const computeUIRole = (dbRole?: string | null, workspaceType?: string | null): 'MAIN_OWNER' | 'FRANCHISE_OWNER' | 'MANAGER' | 'MEMBER' => {
    const role = (dbRole || 'member').toLowerCase();
    const type = workspaceType || 'MAIN';
    
    if (role === 'main_owner' || (role === 'owner' && type === 'MAIN')) return 'MAIN_OWNER';
    if (role === 'franchise_owner' || (role === 'owner' && type === 'FRANCHISE')) return 'FRANCHISE_OWNER';
    if (role === 'manager' || role === 'admin') return 'MANAGER';
    return 'MEMBER';
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRefreshing = useRef<boolean>(false);

    const handleAuthSuccess = useCallback((data: any, emailOverride?: string): User => {
        const userData: User = {
            userId: data.user_id || '',
            email: data.email || emailOverride || '',
            fullName: data.full_name || (data.email || emailOverride || '').split('@')[0] || 'User',
            tenantId: data.tenant_id || '',
            tenantStatus: (data.tenant_status || 'active') as User['tenantStatus'],
            onboardingRequired: data.onboarding_required === true || data.onboarding_required === 'true',
            workspaceType: (data.workspace_type || 'MAIN').toUpperCase() as 'MAIN' | 'FRANCHISE',
            role: (data.ui_role || computeUIRole(data.role || 'owner', data.workspace_type)) as User['role'],
        };

        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }
        
        if (data.tenant_status) {
            document.cookie = `tenant_status=${data.tenant_status}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }

        localStorage.setItem('user_data', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
    }, []);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            const userDataStr = localStorage.getItem('user_data');

            if (token) {
                try {
                    // 1. Initial hydration from localStorage (fast UI)
                    if (userDataStr) {
                        const parsedUser = JSON.parse(userDataStr);
                        // IMPORTANT: Use the stored user as is (it already has UI roles)
                        setUser(parsedUser);
                        setIsAuthenticated(true);
                    }

                    // 2. Verification & Refresh from backend (Source of Truth)
                    const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (meRes.ok) {
                        const meData = await meRes.json();
                        
                        // Sync theme
                        if (VALID_THEMES.has(meData.theme_preference)) {
                            setTheme(meData.theme_preference);
                        }

                        // Re-hydrate session with fresh DB data
                        handleAuthSuccess({
                            ...meData,
                            token: token // Keep existing token
                        });
                    } else if (meRes.status === 401) {
                        logout();
                    }
                } catch (e) {
                    console.error('Auth hydration error:', e);
                    logout();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleAuthSuccess]);



    // Protect routes
    useEffect(() => {
        if (isLoading) return;

        const publicRoutes = ['/', '/login', '/signup', '/docs', '/forgot-password', '/reset-password', '/verify-email', '/waiting-room', '/team/join', '/contact', '/pricing', '/auth/callback', '/unsubscribe'];
        const isPublicRoute = publicRoutes.includes(pathname || '');
        const isOnboardingRoute = pathname?.startsWith('/onboarding');

        if (isOnboardingRoute && isAuthenticated) return;

        if (!isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
            if (pathname !== '/login') router.push('/login');
            return;
        }

        if (isAuthenticated && user?.tenantStatus === 'onboarding' && !isOnboardingRoute && !isPublicRoute) {
            if (pathname !== '/onboarding/workspace') router.push('/onboarding/workspace');
            return;
        }

        if (isAuthenticated && user?.tenantStatus === 'pending_join' && pathname !== '/waiting-room' && !isPublicRoute) {
            router.push('/waiting-room');
            return;
        }

        if (isAuthenticated && user?.tenantStatus === 'active' && (pathname === '/login' || pathname === '/signup')) {
            router.push('/dashboard');
            return;
        }
    }, [isLoading, isAuthenticated, pathname, user]);

    const login = async (email: string, password: string, redirectPath?: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Login failed');
            }

            const data = await response.json();
            const userData = handleAuthSuccess(data, email);

            if (userData.tenantStatus === 'pending_join') {
                router.push('/waiting-room');
            } else if (userData.tenantStatus === 'onboarding') {
                router.push('/onboarding/workspace');
            } else {
                router.push(redirectPath || '/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string, tenantName: string, firstName?: string, lastName?: string, redirectPath?: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0],
                    ...(tenantName ? { tenant_name: tenantName } : {})
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Signup failed');
            }

            await login(email, password, redirectPath);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const silentRefresh = async (): Promise<string | null> => {
        if (isRefreshing.current) return null;
        isRefreshing.current = true;
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('auth_token', data.token);
                document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
                return data.token;
            } else {
                throw new Error('Refresh failed');
            }
        } catch (err) {
            console.error('Silent refresh failed:', err);
            logout();
            return null;
        } finally {
            isRefreshing.current = false;
        }
    };

    const logout = async () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            console.warn('Logout API failed', err);
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'tenant_status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/login';
    };

    const setThemePref = (theme: 'light' | 'dark' | 'system') => {
        if (!VALID_THEMES.has(theme)) return;
        setTheme(theme);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/theme`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ theme }),
                });
            } catch {}
        }, 500);
    };

    const refreshUserStatus = async () => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            parsedUser.tenantStatus = 'active';
            parsedUser.role = computeUIRole(parsedUser.role, parsedUser.workspaceType);
            localStorage.setItem('user_data', JSON.stringify(parsedUser));
            setUser(parsedUser);
        }
    };

    const updateUserContext = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates, role: computeUIRole(updates.role ?? user.role, updates.workspaceType ?? user.workspaceType) };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
    };

    const switchWorkspace = async (tenantId: string) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error("No token found");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/switch-workspace`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tenant_id: tenantId }),
            });

            if (!response.ok) throw new Error('Failed to switch workspace');

            const data = await response.json();
            handleAuthSuccess(data);
            router.push('/dashboard');
        } catch (error) {
            console.error('Workspace switch error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
                login,
                signup,
                logout,
                handleAuthSuccess,
                refreshUserStatus,
                updateUserContext,
                switchWorkspace,
                setThemePref,
                silentRefresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
