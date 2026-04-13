'use client';

import { useEffect, useRef, useState } from 'react';
import supabase from '../../../lib/supabase/client';

export interface Notification {
    id: string;
    type: string;
    applicant_name: string | null;
    application_id: string | null;
    created_at: string;
    is_read: boolean;
}

export interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isLoading: boolean;
}

const FETCH_LIMIT = 20;
const POLL_INTERVAL_MS = 30_000;

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, type, applicant_name, application_id, created_at, is_read')
            .order('created_at', { ascending: false })
            .limit(FETCH_LIMIT);

        if (!error && data) {
            setNotifications(data as Notification[]);
        }
        setIsLoading(false);
    };

    const startPolling = () => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe via Supabase Realtime
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Realtime is active — no polling needed
                    stopPolling();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                    // Realtime unavailable — fall back to polling
                    startPolling();
                }
            });

        channelRef.current = channel;

        // Safety net: start polling after a short delay if subscription never confirms
        const subscribeTimeout = setTimeout(() => {
            if (pollingRef.current === null && channelRef.current?.state !== 'joined') {
                startPolling();
            }
        }, 5_000);

        return () => {
            clearTimeout(subscribeTimeout);
            stopPolling();
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const markAsRead = async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);

        if (!error) {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return { notifications, unreadCount, markAsRead, markAllAsRead, isLoading };
}
