'use client';

import { useEffect, useState } from 'react';
import { Monitor, Sliders } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, InlineAlert, Input, KeyValueList, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
];

const DATE_FORMATS = [
    { value: 'MMM DD, YYYY', label: 'Jan 25, 2025' },
    { value: 'DD/MM/YYYY', label: '25/01/2025' },
    { value: 'MM/DD/YYYY', label: '01/25/2025' },
    { value: 'YYYY-MM-DD', label: '2025-01-25' },
];

type Prefs = {
    timezone: string;
    date_format: string;
    default_from_name: string;
};

const selectClassName = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

export default function PreferencesPage() {
    const { token } = useAuth();
    const { success, error } = useToast();
    const [prefs, setPrefs] = useState<Prefs>({
        timezone: 'UTC',
        date_format: 'MMM DD, YYYY',
        default_from_name: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/settings/preferences`, { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => response.ok ? response.json() : null)
            .then((data) => { if (data) setPrefs((current) => ({ ...current, ...data })); })
            .catch(() => {});
    }, [token]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/settings/preferences`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs),
            });
            if (!res.ok) throw new Error('Failed to save preferences.');
            success('Preferences saved.');
        } catch (saveError) {
            console.error(saveError);
            error('Could not save preferences.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Preferences"
                subtitle="Set personal defaults for time, formatting, and composition so the workspace behaves the way you expect every day."
                action={<Button onClick={save} isLoading={saving}>Save Preferences</Button>}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Timezone" value={prefs.timezone.split('/').pop() || prefs.timezone} icon={<Sliders className="h-5 w-5" />} />
                <StatCard label="Date Format" value={prefs.date_format} icon={<Sliders className="h-5 w-5" />} />
                <StatCard label="Theme" value="System" icon={<Monitor className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
                <SectionCard title="Workspace Defaults" description="These defaults are used for reporting, scheduling, and prefilled campaign composer fields.">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[var(--text-primary)]">Timezone</label>
                            <select value={prefs.timezone} onChange={(e) => setPrefs((current) => ({ ...current, timezone: e.target.value }))} className={selectClassName}>
                                {TIMEZONES.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-[var(--text-primary)]">Date Format</label>
                            <select value={prefs.date_format} onChange={(e) => setPrefs((current) => ({ ...current, date_format: e.target.value }))} className={selectClassName}>
                                {DATE_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
                            </select>
                        </div>

                        <Input
                            label="Default From Name"
                            helperText="Pre-filled when creating a new campaign."
                            value={prefs.default_from_name}
                            onChange={(e) => setPrefs((current) => ({ ...current, default_from_name: e.target.value }))}
                            placeholder="e.g. Acme Newsletter"
                        />
                    </div>
                </SectionCard>

                <SectionCard title="Theme" description="The app currently follows your operating system appearance automatically.">
                    <InlineAlert
                        variant="info"
                        title="System theme only"
                        description="ShrFlow follows the OS theme right now. There is no separate in-app light or dark mode selection yet."
                    />
                </SectionCard>
            </div>

            <SectionCard title="Current Preference Snapshot" description="Quick summary of the defaults currently applied to your account.">
                <KeyValueList
                    columns={3}
                    items={[
                        { label: 'Timezone', value: prefs.timezone },
                        { label: 'Date Format', value: prefs.date_format },
                        { label: 'Default From Name', value: prefs.default_from_name || 'Not set' },
                        { label: 'Theme', value: 'System' },
                    ]}
                />
            </SectionCard>
        </div>
    );
}
