'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onFeedback?: (imageUrl: string, imageName: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = 'Image Viewer',
  onFeedback,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      resetView();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetView();
          break;
        case 'r':
        case 'R':
          rotate();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setShowMagnifier(false);
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetView();
  }, [images.length]);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetView();
  }, [images.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (imageRef.current && showMagnifier) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMagnifierPosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  };

  const toggleMagnifier = () => setShowMagnifier((prev) => !prev);

  const downloadImage = async () => {
    try {
      const response = await fetch(images[currentIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(images[currentIndex], '_blank');
    }
  };

  if (!isOpen || images.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-700/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base">{title}</h3>
            <p className="text-gray-500 text-xs">
              {currentIndex + 1} of {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <ToolbarBtn onClick={zoomOut} title="Zoom Out (-)" icon={<ZoomOut size={16} />} />
          <span className="text-gray-400 text-xs min-w-[45px] text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <ToolbarBtn onClick={zoomIn} title="Zoom In (+)" icon={<ZoomIn size={16} />} />

          <ToolbarSep />

          {/* Magnifier */}
          <ToolbarBtn
            onClick={toggleMagnifier}
            title="Toggle Magnifier"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
                <circle cx="11" cy="11" r="3" className={showMagnifier ? 'opacity-100' : 'opacity-0'} />
              </svg>
            }
            active={showMagnifier}
          />

          {/* Rotate */}
          <ToolbarBtn onClick={rotate} title="Rotate (R)" icon={<RotateCw size={16} />} />

          {/* Download */}
          <ToolbarBtn onClick={downloadImage} title="Download" icon={<Download size={16} />} />

          {/* Give Feedback */}
          {onFeedback && (
            <ToolbarBtn
              onClick={() => onFeedback(images[currentIndex], `image-${currentIndex + 1}`)}
              title="Give Feedback"
              icon={<MessageSquare size={16} />}
            />
          )}

          <ToolbarSep />

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-red-600/80 rounded-lg transition-all duration-150"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
      >
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10 backdrop-blur-sm"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-10 backdrop-blur-sm"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}

        {/* Image with Transform */}
        <div
          className="relative"
          style={{
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-h-[80vh] max-w-[90vw] object-contain select-none"
            draggable={false}
          />

          {/* Magnifier Overlay */}
          {showMagnifier && (
            <div
              className="absolute pointer-events-none border-2 border-yellow-400 rounded-full overflow-hidden shadow-2xl"
              style={{
                width: 150,
                height: 150,
                left: `calc(${magnifierPosition.x}% - 75px)`,
                top: `calc(${magnifierPosition.y}% - 75px)`,
                backgroundImage: `url(${images[currentIndex]})`,
                backgroundSize: `${scale * 300}%`,
                backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                backgroundRepeat: 'no-repeat',
                display:
                  magnifierPosition.x >= 0 &&
                    magnifierPosition.x <= 100 &&
                    magnifierPosition.y >= 0 &&
                    magnifierPosition.y <= 100
                    ? 'block'
                    : 'none',
              }}
            />
          )}
        </div>

        {/* Keyboard hints */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-gray-500 text-xs bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
          <span>Scroll to zoom</span>
          <span className="text-gray-700">·</span>
          <span>Drag to pan</span>
          <span className="text-gray-700">·</span>
          <span>Arrows to navigate</span>
          <span className="text-gray-700">·</span>
          <span>ESC to close</span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="bg-gray-900/90 backdrop-blur-sm border-t border-gray-700/60 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-thin scrollbar-track-gray-900 scrollbar-thumb-gray-700">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  resetView();
                }}
                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 ${idx === currentIndex
                  ? 'border-yellow-400 ring-2 ring-yellow-400/30 shadow-lg shadow-yellow-400/10'
                  : 'border-transparent hover:border-gray-500 opacity-60 hover:opacity-100'
                  }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

/* ── Tiny shared components ────────────────────────────── */

const ToolbarBtn: React.FC<{
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
}> = ({ onClick, title, icon, active }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-all duration-150 ${active
      ? 'text-yellow-400 bg-yellow-400/15'
      : 'text-gray-400 hover:text-white hover:bg-gray-700/80'
      }`}
  >
    {icon}
  </button>
);

const ToolbarSep = () => <div className="w-px h-5 bg-gray-700 mx-1" />;

export default ImageViewer;
