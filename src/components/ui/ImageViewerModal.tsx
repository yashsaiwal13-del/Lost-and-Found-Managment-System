'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ZoomIn } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export function ImageViewerModal({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose,
}: ImageViewerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Top Floating Control Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1080px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginBottom: '16px',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ZoomIn className="h-4 w-4 text-white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title || 'Item Image Examination'}
            </h4>
            {subtitle && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open original image in new tab"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Original</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            title="Close viewer (Esc)"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: '0.2s',
            }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          maxHeight: 'calc(85vh - 70px)',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <img
          src={imageUrl}
          alt={title || 'Full examination preview'}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(85vh - 70px)',
            objectFit: 'contain',
            borderRadius: '12px',
          }}
        />
      </div>
    </div>
  );
}
