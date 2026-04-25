'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plug, ArrowRight } from 'lucide-react';
import { OnboardingShell } from '@/components/onboarding';
import { Button, InlineAlert } from '@/components/ui';

export default function IntegrationsOnboarding() {
    const router = useRouter();
    const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const integrations = [
        { value: 'api_webhooks', label: 'API / Webhooks' },
        { value: 'web_app', label: 'Web Application' },
        { value: 'mobile_app', label: 'Mobile App' },
        { value: 'ecommerce', label: 'Ecommerce (Shopify-style)' },
        { value: 'not_sure', label: 'Not sure yet' },
    ];

    const toggleIntegration = (value: string) => {
        if (selectedIntegrations.includes(value)) {
            setSelectedIntegrations(selectedIntegrations.filter(i => i !== value));
        } else {
            setSelectedIntegrations([...selectedIntegrations, value]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (selectedIntegrations.length === 0) {
            setErrors({ integrations: 'Please select at least one option' });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onboarding/integrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    integration_sources: selectedIntegrations,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save integrations');
            }

            router.push('/onboarding/scale');
        } catch (error) {
            console.error('Error saving integrations:', error);
            setErrors({ general: 'Failed to save. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <OnboardingShell
            step={3}
            totalSteps={4}
            icon={<Plug className="h-6 w-6" />}
            title="Where will events come from?"
            description="Pick the sources you expect first. We’ll use this to guide setup docs and examples later."
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                    <InlineAlert
                        variant="danger"
                        title="Couldn’t save integration sources"
                        description={errors.general}
                    />
                )}

                <div className="grid gap-3">
                    {integrations.map((integration) => (
                        <label
                            key={integration.value}
                            className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-all ${selectedIntegrations.includes(integration.value)
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[var(--shadow-sm)]'
                                : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
                                }`}
                        >
                            <input
                                type="checkbox"
                                value={integration.value}
                                checked={selectedIntegrations.includes(integration.value)}
                                onChange={() => toggleIntegration(integration.value)}
                                disabled={loading}
                                className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                            />
                            <p className="text-sm font-medium text-[var(--text-primary)]">{integration.label}</p>
                        </label>
                    ))}
                </div>

                {errors.integrations && <p className="text-sm text-[var(--danger)]">{errors.integrations}</p>}

                <Button type="submit" size="lg" isLoading={loading} className="w-full">
                    {loading ? 'Saving...' : 'Continue'}
                    {!loading && <ArrowRight className="h-5 w-5" />}
                </Button>
            </form>
        </OnboardingShell>
    );
}
