export interface FileValidationResult {
    valid: boolean;
    error: string | null;
}

export const ACCEPTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB = 10,485,760 bytes

/**
 * Validates a File object against allowed MIME types and maximum size.
 *
 * Returns { valid: true, error: null } on success.
 * Returns { valid: false, error: "<message>" } on failure.
 */
export function validateFile(file: { type: string; size: number }): FileValidationResult {
    if (!(ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Accepted: JPEG, PNG, GIF, PDF.',
        };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: 'File size exceeds 10 MB limit.',
        };
    }

    return { valid: true, error: null };
}
