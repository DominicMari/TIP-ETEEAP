// @vitest-environment jsdom
// Feature: file-feedback, Property 8: onFeedback is called with the correct file arguments
// Validates: Requirements 4.3, 5.3

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Property 8: onFeedback is called with the correct file arguments', () => {
    it('ImageViewer: onFeedback called with correct URL and name for any initialIndex (property)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
                fc.nat(),
                async (urls, rawIndex) => {
                    const initialIndex = rawIndex % urls.length;
                    const onFeedback = vi.fn();

                    const { unmount } = render(
                        <ImageViewer
                            images={urls}
                            initialIndex={initialIndex}
                            isOpen={true}
                            onClose={vi.fn()}
                            onFeedback={onFeedback}
                        />
                    );

                    const feedbackButton = screen.queryByTitle('Give Feedback');
                    if (!feedbackButton) { unmount(); return false; }

                    fireEvent.click(feedbackButton);

                    const expectedUrl = urls[initialIndex];
                    const expectedName = `image-${initialIndex + 1}`;
                    const called =
                        onFeedback.mock.calls.length === 1 &&
                        onFeedback.mock.calls[0][0] === expectedUrl &&
                        onFeedback.mock.calls[0][1] === expectedName;

                    unmount();
                    return called;
                }
            ),
            { numRuns: 20 }
        );
    });

    it('FileViewer: onFeedback called with first file URL and name by default (property)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }),
                        url: fc.webUrl(),
                        type: fc.constantFrom('image', 'pdf', 'document', 'other') as fc.Arbitrary<FileItem['type']>,
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                async (files) => {
                    const onFeedback = vi.fn();

                    const { unmount } = render(
                        <FileViewer
                            files={files}
                            isOpen={true}
                            onClose={vi.fn()}
                            onFeedback={onFeedback}
                        />
                    );

                    const feedbackButton = screen.queryByText('Give Feedback');
                    if (!feedbackButton) { unmount(); return false; }

                    fireEvent.click(feedbackButton);

                    const expectedUrl = files[0].url;
                    const expectedName = files[0].name;
                    const called =
                        onFeedback.mock.calls.length === 1 &&
                        onFeedback.mock.calls[0][0] === expectedUrl &&
                        onFeedback.mock.calls[0][1] === expectedName;

                    unmount();
                    return called;
                }
            ),
            { numRuns: 20 }
        );
    });

    it('ImageViewer example: single image, Give Feedback calls onFeedback with correct args', () => {
        const onFeedback = vi.fn();
        const imageUrl = 'https://example.com/photo.jpg';

        render(
            <ImageViewer images={[imageUrl]} initialIndex={0} isOpen={true} onClose={vi.fn()} onFeedback={onFeedback} />
        );

        fireEvent.click(screen.getByTitle('Give Feedback'));
        expect(onFeedback).toHaveBeenCalledWith(imageUrl, 'image-1');
    });

    it('ImageViewer example: multiple images, Give Feedback uses currentIndex', () => {
        const onFeedback = vi.fn();
        const images = [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
            'https://example.com/img3.jpg',
        ];

        render(
            <ImageViewer images={images} initialIndex={2} isOpen={true} onClose={vi.fn()} onFeedback={onFeedback} />
        );

        fireEvent.click(screen.getByTitle('Give Feedback'));
        expect(onFeedback).toHaveBeenCalledWith(images[2], 'image-3');
    });

    it('FileViewer example: single file, Give Feedback calls onFeedback with correct args', () => {
        const onFeedback = vi.fn();
        const files: FileItem[] = [
            { name: 'resume.pdf', url: 'https://example.com/resume.pdf', type: 'pdf' },
        ];

        render(
            <FileViewer files={files} isOpen={true} onClose={vi.fn()} onFeedback={onFeedback} />
        );

        fireEvent.click(screen.getByText('Give Feedback'));
        expect(onFeedback).toHaveBeenCalledWith('https://example.com/resume.pdf', 'resume.pdf');
    });
});
