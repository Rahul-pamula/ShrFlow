'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ListCollapse, Mail, Plus, Tag, User, UserCheck, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button, InlineAlert, Input, KeyValueList, PageHeader, SectionCard, StatCard, useToast } from '@/components/ui';

const API_BASE = 'http://localhost:8000';

function apiHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
}

interface ContactData {
    id: string;
    email: string;
    email_domain?: string | null;
    first_name: string | null;
    last_name: string | null;
    status: string;
    tags: string[] | null;
    custom_fields: Record<string, string> | null;
    created_at: string;
}

export default function ContactDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const contactId = params?.id || '';
    const { token } = useAuth();
    const { success, error } = useToast();

    const [contact, setContact] = useState<ContactData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [draftEmail, setDraftEmail] = useState('');
    const [draftFirstName, setDraftFirstName] = useState('');
    const [draftLastName, setDraftLastName] = useState('');
    const [draftCustomFields, setDraftCustomFields] = useState<Record<string, string>>({});
    const [savingProfile, setSavingProfile] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [updatingTags, setUpdatingTags] = useState(false);

    useEffect(() => {
        if (!token || !contactId) return;

        async function fetchContact() {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/contacts/${contactId}`, {
                    headers: apiHeaders(token),
                });
                if (res.ok) {
                    const data = await res.json();
                    setContact(data);
                    setDraftEmail(data.email || '');
                    setDraftFirstName(data.first_name || '');
                    setDraftLastName(data.last_name || '');
                    setDraftCustomFields(data.custom_fields || {});
                    setPageError('');
                } else if (res.status === 404) {
                    setPageError('Contact not found.');
                } else {
                    setPageError('Failed to load contact details.');
                }
            } catch (fetchError) {
                console.error(fetchError);
                setPageError('An error occurred while loading this contact.');
            } finally {
                setLoading(false);
            }
        }

        fetchContact();
    }, [contactId, token]);

    const displayName = useMemo(() => {
        if (!contact) return 'Contact';
        return [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed Contact';
    }, [contact]);

    const resetDraft = () => {
        if (!contact) return;
        setDraftEmail(contact.email || '');
        setDraftFirstName(contact.first_name || '');
        setDraftLastName(contact.last_name || '');
        setDraftCustomFields(contact.custom_fields || {});
        setIsEditing(false);
    };

    const saveTags = async (newTags: string[]) => {
        if (!contactId || !token) return;
        setUpdatingTags(true);
        try {
            const res = await fetch(`${API_BASE}/contacts/${contactId}/tags`, {
                method: 'POST',
                headers: {
                    ...apiHeaders(token),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags: newTags }),
            });
            if (!res.ok) throw new Error('Failed to update tags.');
            const data = await res.json();
            setContact(data.contact);
            success('Tags updated.');
        } catch (tagError) {
            console.error(tagError);
            error('Could not update tags.');
        } finally {
            setUpdatingTags(false);
        }
    };

    const handleAddTag = async () => {
        const newTag = tagInput.trim();
        if (!newTag || !contact) return;

        const currentTags = contact.tags || [];
        if (currentTags.includes(newTag)) {
            setTagInput('');
            return;
        }

        await saveTags([...currentTags, newTag]);
        setTagInput('');
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!contact) return;
        await saveTags((contact.tags || []).filter((tag) => tag !== tagToRemove));
    };

    const handleSaveContact = async () => {
        if (!token || !contact || !contactId) return;
        if (!draftFirstName.trim() || !draftLastName.trim()) {
            error('First name and last name are required.');
            return;
        }

        setSavingProfile(true);
        try {
            const sanitizedCustomFields = Object.fromEntries(
                Object.entries(draftCustomFields).filter(([key, value]) => key.trim() && String(value).trim())
            );
            const res = await fetch(`${API_BASE}/contacts/${contactId}`, {
                method: 'PATCH',
                headers: {
                    ...apiHeaders(token),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: draftEmail,
                    first_name: draftFirstName,
                    last_name: draftLastName,
                    custom_fields: sanitizedCustomFields,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to update contact.');
            setContact(data.contact);
            setDraftEmail(data.contact.email || '');
            setDraftFirstName(data.contact.first_name || '');
            setDraftLastName(data.contact.last_name || '');
            setDraftCustomFields(data.contact.custom_fields || {});
            setIsEditing(false);
            success('Contact updated.');
        } catch (saveError: any) {
            console.error(saveError);
            error(saveError.message || 'Could not update contact.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCustomFieldChange = (key: string, value: string) => {
        setDraftCustomFields((current) => ({ ...current, [key]: value }));
    };

    const handleCustomFieldRename = (oldKey: string, nextKey: string) => {
        setDraftCustomFields((current) => {
            const updated = { ...current };
            const value = updated[oldKey] || '';
            delete updated[oldKey];
            if (nextKey.trim()) {
                updated[nextKey] = value;
            }
            return updated;
        });
    };

    const handleAddCustomField = () => {
        let nextKey = 'new_field';
        let index = 1;
        while (draftCustomFields[nextKey]) {
            index += 1;
            nextKey = `new_field_${index}`;
        }
        setDraftCustomFields((current) => ({ ...current, [nextKey]: '' }));
    };

    if (loading) {
        return <div className="p-12 text-sm text-[var(--text-muted)]">Loading contact details...</div>;
    }

    if (pageError || !contact) {
        return (
            <div className="space-y-6 p-8">
                <InlineAlert variant="danger" title="Contact unavailable" description={pageError || 'This contact could not be loaded.'} />
                <Button variant="secondary" onClick={() => router.push('/contacts')}>Back to Contacts</Button>
            </div>
        );
    }

    const customFieldEntries = Object.entries(isEditing ? draftCustomFields : (contact.custom_fields || {}));
    const statusVariant = contact.status === 'subscribed' ? 'success' : 'warning';

    return (
        <div className="space-y-8 pb-8">
            <PageHeader
                title={displayName}
                subtitle="Inspect contact status, update profile fields, and manage segmentation tags without leaving the contacts workspace."
                breadcrumb={
                    <Link href="/contacts" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Contacts
                    </Link>
                }
                action={
                    isEditing ? (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={resetDraft}>Cancel</Button>
                            <Button onClick={handleSaveContact} isLoading={savingProfile}>Save Changes</Button>
                        </div>
                    ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit Contact</Button>
                    )
                }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard label="Contact Status" value={contact.status} icon={contact.status === 'subscribed' ? <UserCheck className="h-5 w-5" /> : <ListCollapse className="h-5 w-5" />} />
                <StatCard label="Email Domain" value={contact.email_domain || 'Unknown'} icon={<Mail className="h-5 w-5" />} />
                <StatCard label="Tags" value={(contact.tags || []).length.toString()} icon={<Tag className="h-5 w-5" />} />
            </div>

            <SectionCard title="Profile Summary" description="Core identity, delivery state, and contact ownership details at a glance.">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-primary)]">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{displayName}</h2>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                                <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{contact.email}</span>
                                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Added {new Date(contact.created_at).toLocaleDateString()}</span>
                                {contact.email_domain && <Badge variant="outline">{contact.email_domain}</Badge>}
                            </div>
                        </div>
                    </div>
                    <Badge variant={statusVariant}>{contact.status}</Badge>
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
                <SectionCard title="Contact Information" description="Update the record fields used in campaigns, segments, and downstream personalization.">
                    {isEditing ? (
                        <div className="space-y-4">
                            <Input label="Email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Input label="First Name" value={draftFirstName} onChange={(e) => setDraftFirstName(e.target.value)} placeholder="First Name *" />
                                <Input label="Last Name" value={draftLastName} onChange={(e) => setDraftLastName(e.target.value)} placeholder="Last Name *" />
                            </div>
                        </div>
                    ) : (
                        <KeyValueList
                            columns={2}
                            items={[
                                { label: 'Email', value: contact.email },
                                { label: 'First Name', value: contact.first_name || '—' },
                                { label: 'Last Name', value: contact.last_name || '—' },
                                { label: 'Status', value: contact.status },
                            ]}
                        />
                    )}

                    <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Custom Fields</h3>
                            {isEditing && <Button variant="secondary" size="sm" onClick={handleAddCustomField}><Plus className="h-3.5 w-3.5" />Add Field</Button>}
                        </div>

                        {customFieldEntries.length === 0 ? (
                            <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm text-[var(--text-muted)]">
                                No custom fields yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {customFieldEntries.map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                                        {isEditing ? (
                                            <Input
                                                value={key}
                                                onChange={(e) => handleCustomFieldRename(key, e.target.value.trim().replace(/\s+/g, '_').toLowerCase())}
                                            />
                                        ) : (
                                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-muted)]">
                                                {key.replace(/_/g, ' ')}
                                            </div>
                                        )}
                                        {isEditing ? (
                                            <Input value={String(value ?? '')} onChange={(e) => handleCustomFieldChange(key, e.target.value)} />
                                        ) : (
                                            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
                                                {String(value || '—')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </SectionCard>

                <SectionCard title="Tags" description="Use tags to power audience filtering, follow-up workflows, and quick segmentation.">
                    <div className="flex flex-wrap gap-2">
                        {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] px-3 py-1.5 text-sm text-[var(--text-primary)]">
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        disabled={updatingTags}
                                        className="text-[var(--text-muted)] transition hover:text-[var(--danger)] disabled:opacity-50"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-[var(--text-muted)]">No tags added yet.</span>
                        )}
                    </div>

                    <div className="mt-5 flex gap-3">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Add a new tag"
                            disabled={updatingTags}
                        />
                        <Button onClick={handleAddTag} disabled={!tagInput.trim() || updatingTags}>
                            <Plus className="h-4 w-4" />
                            Add
                        </Button>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
