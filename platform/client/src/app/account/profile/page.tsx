'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, User, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, InlineAlert, Input, useToast, UserAvatar } from '@/components/ui';

export default function PersonalDetailsPage() {
    const { token, user, updateUserContext } = useAuth();
    const { success, error } = useToast();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        if (user?.fullName) {
            const parts = user.fullName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        setPageError('');

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ full_name: fullName }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to update profile.');
            }

            if (updateUserContext) {
                updateUserContext({ fullName });
            }
            success('Profile updated successfully.');
        } catch (err: any) {
            setPageError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-[1280px] mx-auto space-y-12">
            {/* Top Bar */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/account" 
                    className="p-2 -ml-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Personal Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Visual Profile Card */}
                <div className="lg:col-span-1">
                    <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] text-center space-y-6 relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <UserAvatar email={user.email} name={user.fullName} size="xl" className="ring-4 ring-[var(--bg-primary)] shadow-2xl" />
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[var(--bg-card)] flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{user.fullName}</h3>
                                <p className="text-sm text-[var(--text-muted)] opacity-70">{user.email}</p>
                            </div>
                            <div className="pt-2">
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                                    Personal Account
                                </div>
                            </div>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -left-12 -top-12 w-48 h-48 bg-[var(--accent)]/5 rounded-full blur-3xl group-hover:bg-[var(--accent)]/10 transition-colors" />
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-2 space-y-8">
                    {pageError && <InlineAlert variant="danger" title="Error" description={pageError} />}

                    <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Enter your first name"
                                className="bg-[var(--bg-secondary)]/30"
                            />
                            <Input
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Enter your last name"
                                className="bg-[var(--bg-secondary)]/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 cursor-not-allowed group">
                                <span className="text-[var(--text-primary)] font-medium">{user.email}</span>
                                <Lock className="w-4 h-4 text-[var(--text-muted)] opacity-50" />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] italic opacity-60">Primary email for notifications and security. Cannot be changed.</p>
                        </div>

                        <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                isLoading={isSaving}
                                className="px-10 py-6 text-base shadow-lg shadow-[var(--accent)]/20"
                            >
                                Save Profile Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
