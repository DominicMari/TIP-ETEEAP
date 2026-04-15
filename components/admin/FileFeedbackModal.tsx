"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FileFeedbackEntry } from "@/lib/types/fileFeedback";

interface FileFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    sourceType: "application" | "portfolio";
    recordId: string;
    adminName: string;
    onSuccess: (entry: FileFeedbackEntry) => void;
}

export default function FileFeedbackModal({
    isOpen,
    onClose,
    fileName,
    sourceType,
    recordId,
    adminName,
    onSuccess,
}: FileFeedbackModalProps) {
    const [message, setMessage] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const titleId = "file-feedback-modal-title";
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setMessage("");
            setValidationError(null);
            setSubmitError(null);
            setIsSubmitting(false);
            setTimeout(() => closeButtonRef.current?.focus(), 0);
        }
    }, [isOpen]);

    // ESC key to close
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Focus trap
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const focusable = (
            [closeButtonRef.current, textareaRef.current, submitButtonRef.current] as Array<HTMLButtonElement | HTMLTextAreaElement | null>
        ).filter(
            (el): el is HTMLButtonElement | HTMLTextAreaElement => el !== null && !el.hasAttribute("disabled")
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    const handleSubmit = async () => {
        if (message.trim() === "") {
            setValidationError("Feedback message cannot be empty.");
            return;
        }
        setValidationError(null);
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/file-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceType, recordId, fileName, message: message.trim(), adminName }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                onSuccess(data.entry as FileFeedbackEntry);
                onClose();
            } else {
                setSubmitError(data.error ?? "Failed to submit feedback.");
            }
        } catch {
            setSubmitError("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-4 p-6"
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 id={titleId} className="text-lg font-bold text-gray-900">Give File Feedback</h2>
                        <p className="mt-1 text-sm font-medium text-blue-700 truncate" title={fileName}>{fileName}</p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        aria-label="Close feedback modal"
                        className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="feedback-message" className="text-sm font-medium text-gray-700">Feedback Message</label>
                    <textarea
                        id="feedback-message"
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            if (validationError && e.target.value.trim() !== "") setValidationError(null);
                        }}
                        maxLength={2000}
                        rows={6}
                        placeholder="Write your feedback for this file..."
                        className={`w-full resize-none rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${validationError ? "border-red-400 focus:ring-red-400" : "border-gray-300"}`}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-red-500 min-h-[1rem]">{validationError ?? ""}</span>
                        <span className="text-xs text-gray-400">{message.length}/2000</span>
                    </div>
                </div>

                {submitError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
                )}

                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        ref={submitButtonRef}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Submitting…
                            </>
                        ) : "Submit Feedback"}
                    </button>
                </div>
            </div>
        </div>
    );
}
