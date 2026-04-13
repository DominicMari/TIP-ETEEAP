'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from './useNotifications';
import { getBadgeDisplay, formatNotificationItem } from './notificationUtils';

export { getBadgeDisplay, formatNotificationItem };

export interface NotificationBellProps {
    onNavigateToApplicant: (applicationId: string) => void;
}

export default function NotificationBell({ onNavigateToApplicant }: NotificationBellProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    const handleNotificationClick = async (id: string, applicationId: string | null) => {
        await markAsRead(id);
        if (applicationId) {
            onNavigateToApplicant(applicationId);
        }
        setIsOpen(false);
    };

    const badge = getBadgeDisplay(unreadCount);

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Bell button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {badge !== null && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold leading-none">
                        {badge}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Mark all as read
                        </button>
                    </div>

                    {/* Notification list */}
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {isLoading ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">Loading…</li>
                        ) : notifications.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                                No new notifications
                            </li>
                        ) : (
                            notifications.map((notification) => {
                                const { name, message, elapsedTime } = formatNotificationItem(notification);
                                return (
                                    <li key={notification.id}>
                                        <button
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification.id,
                                                    notification.application_id
                                                )
                                            }
                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : 'bg-white'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-gray-800">
                                                {name}{' '}
                                                <span className="font-normal text-gray-600">{message}</span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{elapsedTime}</p>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
