"use client";

import { Paperclip } from "lucide-react";
import type { FileFeedbackEntry } from "@/lib/types/fileFeedback";

function formatDate(dateString: string | null): string {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    } catch {
        return dateString;
    }
}

export function FileFeedbackSection({ feedback }: { feedback: FileFeedbackEntry[] }) {
    return (
        <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700">
                    File Feedback from Admin
                </span>
            </div>
            <div className="space-y-3">
                {feedback.map((entry, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-lg border border-amber-200 p-3"
                    >
                        <p className="text-xs font-semibold text-amber-700 mb-1">
                            {entry.fileName}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">{entry.message}</p>
                        <p className="text-xs text-gray-400">
                            — {entry.adminName} · {formatDate(entry.createdAt)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FileFeedbackSection;
