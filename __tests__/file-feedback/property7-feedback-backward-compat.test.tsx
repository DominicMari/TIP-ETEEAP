// @vitest-environment jsdom
// Feature: file-feedback, Property 7: onFeedback prop is backward-compatible
// Validates: Requirements 4.4, 5.4

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ImageViewer } from '../../components/admin/ImageViewer';
import { FileViewer } from '../../components/admin/FileViewer';
import type { FileItem } from '../../components/admin/FileViewer';

vi.mock('react-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-dom')>();
    return {
        ...actual,
        createPortal: (node: React.ReactNode) => node,
    };
});

describe('Property 7: onFeedback prop is backward-compatible', () => {
    it('ImageViewer: no "Give Feedback" button when onFeedback is omitted (property)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
                async (urls) => {
                    const { unmount } = render(
                        <ImageViewer
                            images={urls}
                            isOpen={true}
                            onClose={vi.fn()}
                        />
                    );

                    const feedbackButton = screen.queryByTitle('Give Feedback');
                    const feedbackButtonByText = screen.queryByText('Give Feedback');
                    const absent = feedbackButton === null && feedbackButtonByText === null;

                    unmount();
                    return absent;
                }
            ),
            { numRuns: 20 }
        );
    });

    it('FileViewer: no "Give Feedback" button when onFeedback is omitted (property)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        url: fc.webUrl(),
                        type: fc.constantFrom('image', 'pdf', 'document', 'other') as fc.Arbitrary<FileItem['type']>,
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                async (files) => {
                    const { unmount } = render(
                        <FileViewer
                            files={files}
                            isOpen={true}
                            onClose={vi.fn()}
                        />
                    );

                    const feedbackButton = screen.queryByText('Give Feedback');
                    const absent = feedbackButton === null;

                    unmount();
                    return absent;
                }
            ),
            { numRuns: 20 }
        );
    });

    it('ImageViewer example: single image URL, no Give Feedback button without onFeedback', () => {
        render(
            <ImageViewer
                images={['https://example.com/image.jpg']}
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByTitle('Give Feedback')).not.toBeInTheDocument();
        expect(screen.queryByText('Give Feedback')).not.toBeInTheDocument();
    });

    it('FileViewer example: single file, no Give Feedback button without onFeedback', () => {
        const files: FileItem[] = [
            { name: 'document.pdf', url: 'https://example.com/document.pdf', type: 'pdf' },
        ];

        render(
            <FileViewer
                files={files}
                isOpen={true}
                onClose={vi.fn()}
            />
        );

        expect(screen.queryByText('Give Feedback')).not.toBeInTheDocument();
    });
});
