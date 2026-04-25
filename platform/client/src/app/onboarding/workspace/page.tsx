'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert, Input } from '@/components/ui';

export default function WorkspaceOnboarding() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        workspaceName: '',
        role: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const roles = ['Founder', 'Developer', 'Marketer', 'Other'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validation
        if (!formData.workspaceName.trim()) {
            setErrors({ workspaceName: 'Workspace name is required' });
            return;
        }
        if (!formData.role) {
            setErrors({ role: 'Please select your role' });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/workspace`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    workspace_name: formData.workspaceName,
                    user_role: formData.role,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save workspace info');
            }

            // Navigate to next step
            router.push('/onboarding/use-case');
        } catch (error) {
            console.error('Error saving workspace:', error);
            setErrors({ general: 'Failed to save. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            step={1}
            totalSteps={4}
            icon={<Building2 className="h-6 w-6" />}
            title="Set up your workspace"
            description="We’ll use this to shape your initial defaults and make the rest of setup much smoother."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <InlineAlert
                        variant="danger"
                        title="Couldn’t save workspace details"
                        description={errors.general}
                    />
                )}

                <div className="grid gap-5">
                    <Input
                        id="workspaceName"
                        label="Workspace or company name"
                        value={formData.workspaceName}
                        onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                        placeholder="Acme Corporation"
                        disabled={loading}
                        error={errors.workspaceName}
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />

                    <div className="w-full">
                        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
                            Your role
                        </label>
                        <select
                            id="role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            disabled={loading}
                            className={`flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 ${errors.role ? 'border-[var(--danger)]' : 'border-[var(--border)]'} bg-[var(--bg-primary)] text-[var(--text-primary)]`}
                        >
                            <option value="">Select your role</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                        {errors.role && <p className="mt-1.5 text-sm text-[var(--danger)]">{errors.role}</p>}
                    </div>
                </div>

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Continue'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
            </form>
        </OnboardingShell>
    );
}
