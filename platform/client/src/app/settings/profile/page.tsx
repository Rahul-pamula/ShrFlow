'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, ShieldCheck, HelpCircle, ArrowLeft, Save, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ProfileSettingsPage() {
    const { token, user: authUser, updateUserContext } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [fullName, setFullName] = useState('');
    const [timezone, setTimezone] = useState('');
    const [email, setEmail] = useState('');
    
    // Google Auth Check (simulated based on our auth knowledge)
    const isGoogleAuth = false;

    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFullName(data.full_name || '');
                setTimezone(data.timezone || 'UTC');
                setEmail(data.email || '');
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const res = await fetch(`${API_BASE}/settings/profile`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: fullName,
                    timezone: timezone
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (updateUserContext && data.data) {
                    updateUserContext({ fullName: data.data.full_name });
                }
            } else {
                alert('Failed to save profile.');
            }
        } catch (error) {
            console.error('Error saving profile', error);
            alert('An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    const initials = (fullName || email || 'U').charAt(0).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto p-8 animate-fadeIn">
            {/* Header */}
            <div className="mb-8 mt-4">
                <div className="mb-4">
                    <a href="/settings" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm font-medium">
                        <ArrowLeft size={16} className="mr-2" /> Back to Settings
                    </a>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
                    Profile Settings
                </h1>
                <p className="text-[var(--text-muted)] text-base">
                    Manage your personal details, avatar, and security preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Form & Info */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Basic Information Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[var(--accent)]" /> 
                            Basic Information
                        </h2>
                        
                        <form onSubmit={handleSave} className="space-y-5 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--text-primary)]">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--text-primary)]">Timezone</label>
                                    <select 
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all appearance-none"
                                    >
                                        <option value="UTC">UTC (Default)</option>
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                        <option value="Europe/London">London (GMT+0)</option>
                                        <option value="Europe/Paris">Central Europe (CET)</option>
                                        <option value="Asia/Kolkata">India (IST)</option>
                                        <option value="Asia/Tokyo">Japan (JST)</option>
                                        <option value="Australia/Sydney">Sydney (AEDT)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="pt-2">
                                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Email & Security Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" /> 
                            Security & Login
                        </h2>

                        <div className="space-y-6">
                            {/* Email Address (Read-Only) */}
                            <div>
                                <label className="text-sm font-medium text-[var(--text-primary)] block mb-2">Account Email</label>
                                <div className="flex bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden opacity-80 cursor-not-allowed">
                                    <div className="flex items-center justify-center px-4 border-r border-[var(--border)] bg-black/10">
                                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={email}
                                        readOnly
                                        disabled
                                        className="w-full bg-transparent px-4 py-2.5 text-sm text-[var(--text-muted)] focus:outline-none"
                                    />
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-2">Email addresses cannot be changed for security reasons.</p>
                            </div>

                            <hr className="border-[var(--border)]" />

                            {/* Password Section */}
                            <div>
                                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Change Password</h3>
                                
                                {isGoogleAuth ? (
                                    <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/10 text-sm">
                                        <p className="font-semibold text-blue-400 mb-1 flex items-center gap-2">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Signed in with Google
                                        </p>
                                        <p className="text-[var(--text-muted)]">You're using Google credentials to sign in. Change your password in your Google account settings.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <input 
                                                type="password" 
                                                placeholder="Current Password"
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input 
                                                type="password" 
                                                placeholder="New Password"
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                            />
                                            <input 
                                                type="password" 
                                                placeholder="Confirm New Password"
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                            />
                                        </div>
                                        <Button variant="secondary" className="w-full sm:w-auto mt-2">Update Password</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Avatar & Extras */}
                <div className="space-y-6">
                    {/* Avatar Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-indigo-500/20 ring-4 ring-[var(--bg-primary)]">
                                {initials}
                            </div>
                            <button className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <Camera className="w-6 h-6 text-white mb-1" />
                                <span className="text-[10px] text-white font-medium uppercase tracking-wider">Change</span>
                            </button>
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] text-lg">{fullName || 'Unknown User'}</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-6">{email}</p>
                        
                        <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-2 rounded-lg border border-[var(--border)] w-full">
                            Avatars should be at least 300x300px.
                        </p>
                    </div>

                    {/* Support Block */}
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-[var(--radius-lg)] p-5">
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-2">
                            <HelpCircle className="w-4 h-4 text-blue-500" /> Need Help?
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                            If you're having trouble logging in or need to reset 2FA, contact our support team.
                        </p>
                        <a href="mailto:support@emailengine.com" className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                            Contact Support &rarr;
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
