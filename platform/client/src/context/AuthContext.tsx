'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

interface User {
    userId: string;
    email: string;
    fullName: string;
    tenantId: string;
    tenantStatus: 'onboarding' | 'active' | 'pending_join';
    role: string;
    onboardingRequired?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (email: string, password: string, redirectPath?: string) => Promise<void>;
    signup: (email: string, password: string, tenantName: string, firstName?: string, lastName?: string, redirectPath?: string) => Promise<void>;
    logout: () => void;
    refreshUserStatus: () => Promise<void>;
    updateUserContext: (updates: Partial<User>) => void;
    switchWorkspace: (tenantId: string) => Promise<void>;
    /** Immediately updates the UI theme and debounces the backend save */
    setThemePref: (theme: 'light' | 'dark' | 'system') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_THEMES = new Set(['light', 'dark', 'system']);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const { setTheme } = useTheme();
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            const userData = localStorage.getItem('user_data');

            if (token && userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    setIsAuthenticated(true);

                    // ── Theme Sync ────────────────────────────────────────────
                    // Step 1: localStorage was already applied by next-themes (instant, no flicker).
                    // Step 2: Hydrate from backend — backend wins after login.
                    try {
                        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (meRes.ok) {
                            const meData = await meRes.json();
                            const backendTheme = meData.theme_preference as string;
                            // Strict whitelist — never pass arbitrary strings to setTheme
                            if (VALID_THEMES.has(backendTheme)) {
                                setTheme(backendTheme);
                            }
                        }
                    } catch {
                        // Silent: network errors should not break auth
                    }
                    // ─────────────────────────────────────────────────────────

                    // Redirect based on tenant status
                    if (parsedUser.tenantStatus === 'pending_join' && pathname !== '/waiting-room') {
                        router.push('/waiting-room');
                    } else if (parsedUser.tenantStatus === 'onboarding' && !pathname?.startsWith('/onboarding')) {
                        router.push('/onboarding/workspace');
                    }
                } catch (e) {
                    console.error('Auth check error:', e);
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    // Protect routes
    useEffect(() => {
        if (isLoading) return;

        const publicRoutes = ['/', '/login', '/signup', '/docs', '/forgot-password', '/reset-password', '/verify-email', '/waiting-room', '/team/join', '/contact', '/pricing'];
        const isPublicRoute = publicRoutes.includes(pathname || '');
        const isOnboardingRoute = pathname?.startsWith('/onboarding');

        console.log('Auth check:', { isAuthenticated, tenantStatus: user?.tenantStatus, pathname, cookie: document.cookie });

        // Allow onboarding routes if authenticated
        if (isOnboardingRoute && isAuthenticated) {
            return;
        }

        // If not authenticated and trying to access protected route
        if (!isAuthenticated && !isPublicRoute && !isOnboardingRoute) {
            if (pathname !== '/login') { // Only navigate if not already on login
                router.push('/login');
            }
            return;
        }

        // If authenticated but in onboarding status, force onboarding
        if (isAuthenticated && user?.tenantStatus === 'onboarding' && !isOnboardingRoute && !isPublicRoute) {
            console.log('Redirecting to onboarding (AuthContext)');
            if (pathname !== '/onboarding/workspace') { // Only navigate if not already there
                router.push('/onboarding/workspace');
            }
            return;
        }

        // If authenticated but in pending_join status, force waiting room
        if (isAuthenticated && user?.tenantStatus === 'pending_join' && pathname !== '/waiting-room' && !isPublicRoute) {
            console.log('Redirecting to waiting room (AuthContext)');
            router.push('/waiting-room');
            return;
        }

        // If authenticated and active, redirect away from auth pages
        if (isAuthenticated && user?.tenantStatus === 'active' && (pathname === '/login' || pathname === '/signup')) {
            router.push('/dashboard');
            return;
        }
    }, [isLoading, isAuthenticated, pathname, user]); // Removed 'router' to prevent re-render loop

    const login = async (email: string, password: string, redirectPath?: string) => {
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Login failed:', err);
                throw new Error(err.detail || 'Login failed');
            }

            const data = await response.json();

            // Store JWT token in both localStorage AND cookies
            localStorage.setItem('auth_token', data.token);

            // Set cookie for middleware (expires in 7 days)
            document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            document.cookie = `email_verified=${data.email_verified ? 'true' : 'false'}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            // Store user data
            const userData = {
                userId: data.user_id,
                email: email,
                fullName: data.full_name || email.split('@')[0],
                tenantId: data.tenant_id,
                tenantStatus: data.tenant_status,
                emailVerified: data.email_verified,
                role: data.role || 'owner',
            };
            localStorage.setItem('user_data', JSON.stringify(userData));

            // Set tenant_status cookie for middleware
            document.cookie = `tenant_status=${data.tenant_status}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            setUser(userData);
            setIsAuthenticated(true);

            // Redirect based on tenant status
            if (data.tenant_status === 'pending_join') {
                router.push('/waiting-room');
            } else if (data.tenant_status === 'onboarding') {
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
                    // If tenantName is empty (invite flow), don't create a default workspace
                    ...(tenantName ? { tenant_name: tenantName } : {})
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Signup failed');
            }

            // After successful signup, immediately log them in (and redirect appropriately)
            await login(email, password, redirectPath);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'tenant_status=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/login';
    };

    /**
     * setThemePref
     * 1. Applies the theme to the UI instantly (next-themes handles localStorage).
     * 2. Debounces the backend PATCH call by 500ms to avoid API spam.
     * Never passes raw user input to setTheme — always validates first.
     */
    const setThemePref = (theme: 'light' | 'dark' | 'system') => {
        if (!VALID_THEMES.has(theme)) return;
        setTheme(theme); // Instant UI update

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
            } catch {
                // Silent: theme change still applied locally even if API fails
            }
        }, 500);
    };

    const refreshUserStatus = async () => {
        // Update user status after completing onboarding
        const userData = localStorage.getItem('user_data');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            parsedUser.tenantStatus = 'active';
            localStorage.setItem('user_data', JSON.stringify(parsedUser));
            setUser(parsedUser);
        }
    };

    const updateUserContext = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
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

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Failed to switch workspace');
            }

            const data = await response.json();

            // Structure matches the data we get on login
            const userData: User = {
                userId: data.user_id,
                tenantId: data.tenant_id,
                email: user?.email || '', // email doesn't change
                tenantStatus: data.tenant_status,
                onboardingRequired: data.onboarding_required,
                // preserve old data for things like full_name or avatar
                role: data.role || 'member',
                fullName: user?.fullName || '',
            };

            // 1. Update localStorage
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_data', JSON.stringify(userData));

            // 2. Update cookies for Next.js middleware
            document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            document.cookie = `tenant_status=${data.tenant_status}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

            // 3. Force a hard reload to clear any cached states in memory and re-render everything
            window.location.href = '/dashboard';
            
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
                refreshUserStatus,
                updateUserContext,
                switchWorkspace,
                setThemePref,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
