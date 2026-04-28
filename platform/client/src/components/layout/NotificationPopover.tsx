'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
}

export default function NotificationPopover() {
    const { token, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const fetchNotifications = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/notifications/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && (user?.role === 'ADMIN' || user?.role === 'OWNER')) {
            fetchNotifications();
            // Poll every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [token, user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`${API_BASE}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Failed to delete notification', err);
        }
    };

    if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') return null;

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isOpen ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)] animate-in zoom-in">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)]/50">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-[var(--border)] mx-auto mb-2 opacity-20" />
                                <p className="text-xs text-[var(--text-muted)]">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {notifications.map((n) => (
                                    <div key={n.id} className={`group p-4 transition-colors ${!n.read_at ? 'bg-[var(--accent)]/5' : 'hover:bg-[var(--bg-hover)]'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                                    {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                                                    {n.title}
                                                </p>
                                                <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{n.message}</p>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <Link 
                                                        href={n.data?.campaign_id ? `/campaigns/${n.data.campaign_id}` : '/campaigns'} 
                                                        onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                                                        className="text-[10px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
                                                    >
                                                        Review Now <ExternalLink className="w-2.5 h-2.5" />
                                                    </Link>
                                                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {!n.read_at && (
                                                    <button 
                                                        onClick={() => markAsRead(n.id)}
                                                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--success)] hover:bg-[var(--success-bg)]/20 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => deleteNotification(n.id)}
                                                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)]/20 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete notification"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
