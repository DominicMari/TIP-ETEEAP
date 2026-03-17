"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Trash2, X } from "lucide-react";

type ModalVariant = "alert" | "confirm" | "success" | "danger";

interface ModalProps {
    open: boolean;
    title: string;
    message: string;
    variant?: ModalVariant;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const variantStyles: Record<ModalVariant, { icon: React.ReactNode; confirmBtn: string }> = {
    alert: {
        icon: <AlertCircle className="w-10 h-10 text-yellow-500" />,
        confirmBtn: "bg-yellow-500 hover:bg-yellow-600 text-white",
    },
    success: {
        icon: <CheckCircle className="w-10 h-10 text-green-500" />,
        confirmBtn: "bg-green-600 hover:bg-green-700 text-white",
    },
    confirm: {
        icon: <AlertCircle className="w-10 h-10 text-blue-500" />,
        confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    danger: {
        icon: <Trash2 className="w-10 h-10 text-red-500" />,
        confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
    },
};

export default function Modal({
    open,
    title,
    message,
    variant = "alert",
    confirmLabel = "OK",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: ModalProps) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    // Focus confirm button when modal opens
    useEffect(() => {
        if (open) confirmRef.current?.focus();
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel?.();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onCancel]);

    if (!open) return null;

    const styles = variantStyles[variant];
    const isConfirmType = onCancel !== undefined;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center text-center gap-4 animate-fade-in">
                {styles.icon}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
                </div>
                <div className="flex gap-3 w-full justify-center mt-1">
                    {isConfirmType && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${styles.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
