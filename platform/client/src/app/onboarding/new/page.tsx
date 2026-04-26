'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert, Input } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function CreateAdditionalWorkspace() {
    const router = useRouter();
    const { token, handleAuthSuccess } = useAuth();
    const [workspaceName, setWorkspaceName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!workspaceName.trim()) {
            setErrors({ workspaceName: 'Workspace name is required' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/workspaces`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    company_name: workspaceName,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create workspace');
            }

            const data = await response.json();
            // Update auth context with new token and session data
            handleAuthSuccess(data);
            
            // Navigate to the next onboarding step for this new workspace
            router.push('/onboarding/use-case');
        } catch (error) {
            console.error('Error creating workspace:', error);
            setErrors({ general: 'Failed to create workspace. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            step={1}
            totalSteps={4}
            icon={<Building2 className="h-6 w-6" />}
            title="Create a New Workspace"
            description="Set up a completely new, isolated workspace. You will be the owner of this new space."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                    <InlineAlert
                        variant="danger"
                        title="Couldn’t create workspace"
                        description={errors.general}
                    />
                )}

                <div className="grid gap-5">
                    <Input
                        id="workspaceName"
                        label="Workspace or company name"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Acme Corporation"
                        disabled={loading}
                        error={errors.workspaceName}
                        className="border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                        autoFocus
                    />
                </div>

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Workspace'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
            </form>
        </OnboardingShell>
    );
}
