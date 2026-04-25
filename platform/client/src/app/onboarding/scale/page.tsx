'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert } from '@/components/ui';

export default function ScaleOnboarding() {
    const router = useRouter();
    const [selectedScale, setSelectedScale] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const scaleOptions = [
        { value: 'testing', label: 'Just testing' },
        { value: 'less_1k', label: 'Less than 1,000' },
        { value: '1k_10k', label: '1,000 – 10,000' },
        { value: '10k_plus', label: '10,000+' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!selectedScale) {
            setErrors({ scale: 'Please select an option' });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/scale`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    expected_scale: selectedScale,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save scale');
            }

            router.push('/onboarding/complete');
        } catch (error) {
            console.error('Error saving scale:', error);
            setErrors({ general: 'Failed to save. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            step={4}
            totalSteps={4}
            icon={<TrendingUp className="h-6 w-6" />}
            title="What scale are you expecting first?"
            description="This only sets sensible defaults for throughput, examples, and guardrails. You can change it later."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                    <InlineAlert
                        variant="danger"
                        title="Couldn’t save expected volume"
                        description={errors.general}
                    />
                )}

                <div className="grid gap-3">
                    {scaleOptions.map((option) => (
                        <label
                            key={option.value}
                            className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-all ${selectedScale === option.value
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[var(--shadow-sm)]'
                                : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            <input
                                type="radio"
                                name="scale"
                                value={option.value}
                                checked={selectedScale === option.value}
                                onChange={(e) => setSelectedScale(e.target.value)}
                                disabled={loading}
                                className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                            />
                            <p className="text-sm font-medium text-[var(--text-primary)]">{option.label}</p>
                        </label>
                    ))}
                </div>

                {errors.scale && <p className="text-sm text-[var(--danger)]">{errors.scale}</p>}

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Finish Setup'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
            </form>
        </OnboardingShell>
    );
}
