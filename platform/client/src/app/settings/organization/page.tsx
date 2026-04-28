'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { can } from '@/utils/permissions';
import { Button, InlineAlert, Input, KeyValueList, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'India', 'Singapore', 'Netherlands', 'Brazil', 'Other',
];

const selectClassName = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

export default function OrganizationSettingsPage() {
    const { token, user, leaveWorkspace } = useAuth();
    const { success, error } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        company_name: '',
        business_address: '',
        business_city: '',
        business_state: '',
        business_zip: '',
        business_country: 'United States',
    });

    const isCanSpamComplete = Boolean(
        form.business_address && form.business_city && form.business_state && form.business_zip && form.business_country
    );

    const completenessScore = useMemo(() => {
        const fields = Object.values(form);
        const completed = fields.filter(Boolean).length;
        return `${completed}/${fields.length}`;
    }, [form]);

    useEffect(() => {
        if (token) fetchOrganization();
    }, [token]);

    const fetchOrganization = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/organization`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setForm({
                    company_name: data.company_name || '',
                    business_address: data.business_address || '',
                    business_city: data.business_city || '',
                    business_state: data.business_state || '',
                    business_zip: data.business_zip || '',
                    business_country: data.business_country || 'United States',
                });
            }
        } catch (fetchError) {
            console.error('Failed to fetch organization', fetchError);
            error('Failed to load organization details.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch(`${API_BASE}/settings/organization`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                throw new Error('Failed to save organization.');
            }

            setIsEditing(false);
            success('Organization details saved.');
        } catch (saveError) {
            console.error('Error saving organization', saveError);
            error('Could not save organization details.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

    const footerFields = [
        { label: 'Company', value: form.company_name || 'Your Company Name' },
        { label: 'Street', value: form.business_address || 'Add a business address' },
        { label: 'City / Region', value: `${form.business_city || 'City'}, ${form.business_state || 'State'}` },
        { label: 'Postal Code', value: form.business_zip || 'ZIP / postal code' },
        { label: 'Country', value: form.business_country || 'Country' },
    ];

    if (isLoading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading organization details...</div>;
    }

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title="Organization Details"
                subtitle="Set the legal entity and mailing address that power compliance, footer rendering, and trust signals across your email program."
                action={!isEditing && can(user, 'settings:manage') ? <Button onClick={() => setIsEditing(true)}>Edit Details</Button> : null}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Compliance Status" value={isCanSpamComplete ? 'Ready' : 'Needs Address'} icon={<ShieldCheck className="h-5 w-5" />} />
                <StatCard label="Profile Completion" value={completenessScore} icon={<Building2 className="h-5 w-5" />} />
                <StatCard label="Footer Preview" value={isCanSpamComplete ? 'Live' : 'Blocked'} icon={<MailCheck className="h-5 w-5" />} />
            </div>

            {!isCanSpamComplete && (
                <InlineAlert
                    variant="warning"
                    title="Physical mailing address required"
                    description="Commercial email regulations like CAN-SPAM require a valid physical address in every marketing footer."
                    icon={<AlertTriangle className="mt-0.5 h-4 w-4" />}
                />
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="space-y-6">
                    <SectionCard
                        title="Company Details"
                        description="These details are used in compliance footers, account identity, and future billing records."
                        action={!isEditing && can(user, 'settings:manage') ? <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Edit</Button> : null}
                    >
                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-5">
                                <Input
                                    label="Company Name"
                                    value={form.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    placeholder="Acme Corp"
                                    autoFocus
                                />
                                <Input
                                    label="Street Address"
                                    value={form.business_address}
                                    onChange={(e) => handleChange('business_address', e.target.value)}
                                    placeholder="123 Main Street"
                                    required
                                />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="City"
                                        value={form.business_city}
                                        onChange={(e) => handleChange('business_city', e.target.value)}
                                        placeholder="San Francisco"
                                        required
                                    />
                                    <Input
                                        label="State / Region"
                                        value={form.business_state}
                                        onChange={(e) => handleChange('business_state', e.target.value)}
                                        placeholder="CA"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Input
                                        label="ZIP / Postal Code"
                                        value={form.business_zip}
                                        onChange={(e) => handleChange('business_zip', e.target.value)}
                                        placeholder="94107"
                                        required
                                    />
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-[var(--text-primary)]">Country</label>
                                        <select
                                            value={form.business_country}
                                            onChange={(e) => handleChange('business_country', e.target.value)}
                                            className={selectClassName}
                                            required
                                        >
                                            {COUNTRIES.map((country) => (
                                                <option key={country} value={country}>{country}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <Button type="submit" isLoading={isSaving}>Save Organization</Button>
                                    <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); fetchOrganization(); }}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <KeyValueList
                                columns={2}
                                items={[
                                    {
                                        label: 'Registered Company',
                                        value: form.company_name || 'Legal entity not set',
                                        helper: 'Shown in workspace identity and future billing records.',
                                    },
                                    {
                                        label: 'Street Address',
                                        value: form.business_address || <span className="text-[var(--danger)]">Missing required address</span>,
                                        helper: 'Required in footer rendering for commercial email.',
                                    },
                                    {
                                        label: 'City / Region',
                                        value: `${form.business_city || 'City'}${form.business_city && form.business_state ? ', ' : ''}${form.business_state || 'State'}`,
                                    },
                                    {
                                        label: 'Postal Code',
                                        value: form.business_zip || 'Not set',
                                    },
                                    {
                                        label: 'Compliance Country',
                                        value: form.business_country,
                                    },
                                ]}
                            />
                        )}
                    </SectionCard>

                    {/* DANGER ZONE */}
                    <SectionCard
                        tone="danger"
                        title="Danger Zone"
                        description="Critical actions that affect your access or the entire workspace."
                    >
                        <div className="space-y-4">
                            {user?.role?.toUpperCase() === 'OWNER' ? (
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5">
                                        <div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">Delete Workspace</p>
                                            <p className="text-xs text-[var(--text-muted)] max-w-md">
                                                Permanently remove this workspace and all associated data (contacts, campaigns, settings). This action cannot be undone.
                                            </p>
                                        </div>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={async () => {
                                                if (confirm("Are you ABSOLUTELY sure you want to delete this workspace? All data will be permanently wiped.")) {
                                                    try {
                                                        await leaveWorkspace();
                                                        success("Workspace deleted successfully.");
                                                    } catch (err: any) {
                                                        error(err.message);
                                                    }
                                                }
                                            }}
                                        >
                                            Delete Workspace
                                        </Button>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] italic">
                                        Note: As an owner, you can only delete a workspace if you are the last member. Otherwise, you must promote another member to Owner first.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/50">
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Leave Workspace</p>
                                        <p className="text-xs text-[var(--text-muted)] max-w-md">
                                            Remove your account from this workspace. You will lose access to all campaigns and contacts.
                                        </p>
                                    </div>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to leave this workspace?")) {
                                                try {
                                                    await leaveWorkspace();
                                                    success("You have left the workspace.");
                                                } catch (err: any) {
                                                    error(err.message);
                                                }
                                            }
                                        }}
                                    >
                                        Leave Workspace
                                    </Button>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <SectionCard
                        title="Email Footer Preview"
                        description="Preview how the compliance footer will appear in outbound messages."
                    >
                        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-center">
                            {isCanSpamComplete ? (
                                <div>
                                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                                        You are receiving this email because you opted in via our website.
                                    </p>
                                    <div className="mt-4 text-[11px] leading-6 text-[var(--text-muted)]">
                                        <p className="font-semibold text-[var(--text-primary)]">{form.company_name || 'Your Company Name'}</p>
                                        <p>{form.business_address}</p>
                                        <p>{form.business_city}, {form.business_state} {form.business_zip}</p>
                                        <p>{form.business_country}</p>
                                    </div>
                                    <p className="mt-3 text-[10px] font-medium text-[var(--accent)] underline">Unsubscribe from these emails</p>
                                </div>
                            ) : (
                                <p className="py-4 text-xs italic text-[var(--text-muted)]">
                                    Fill out your physical address completely to unlock the footer preview.
                                </p>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        tone="success"
                        title="Why this matters"
                        description="Anti-spam regulations globally require commercial email to identify the sender's physical mailing address. This also improves recipient trust."
                    >
                        <a
                            href="https://www.FTC.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--success)] transition hover:opacity-80"
                        >
                            Read the FTC CAN-SPAM guide
                        </a>
                    </SectionCard>

                    <SectionCard title="Footer Fields" description="Quick audit view for the legal footer fields currently on file.">
                        <KeyValueList columns={1} items={footerFields} />
                    </SectionCard>
                </div>
            </div>
        </div>
    );
}
