'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowRight } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert } from '@/components/ui';

export default function UseCaseOnboarding() {
    const router = useRouter();
    const [selectedUseCase, setSelectedUseCase] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const useCases = [
        { value: 'transactional', label: 'Transactional emails', description: 'OTP, alerts, system emails' },
        { value: 'marketing', label: 'Marketing campaigns', description: 'Newsletters, promotions' },
        { value: 'event_based', label: 'Event-based automation', description: 'Triggered by user actions' },
        { value: 'exploring', label: 'Just exploring', description: 'Learning about the platform' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!selectedUseCase) {
            setErrors({ useCase: 'Please select a use case' });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/use-case`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    primary_use_case: selectedUseCase,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save use case');
            }

            router.push('/onboarding/integrations');
        } catch (error) {
            console.error('Error saving use case:', error);
            setErrors({ general: 'Failed to save. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            step={2}
            totalSteps={4}
            icon={<Target className="h-6 w-6" />}
            title="How will you use ShrFlow first?"
            description="We’ll tailor your starting views and recommendations around the kind of sending you care about most."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                    <InlineAlert
                        variant="danger"
                        title="Couldn’t save your use case"
                        description={errors.general}
                    />
                )}

                <div className="grid gap-3">
                    {useCases.map((useCase) => (
                        <label
                            key={useCase.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-4 transition-all ${selectedUseCase === useCase.value
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[var(--shadow-sm)]'
                                : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            <input
                                type="radio"
                                name="useCase"
                                value={useCase.value}
                                checked={selectedUseCase === useCase.value}
                                onChange={(e) => setSelectedUseCase(e.target.value)}
                                disabled={loading}
                                className="mt-1 h-4 w-4 cursor-pointer accent-[var(--accent)]"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{useCase.label}</p>
                                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{useCase.description}</p>
                            </div>
                        </label>
                    ))}
                </div>

                {errors.useCase && <p className="text-sm text-[var(--danger)]">{errors.useCase}</p>}

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Continue'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
            </form>
        </OnboardingShell>
    );
}
