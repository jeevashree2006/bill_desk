import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * In-app confirmation modal.
 *
 * Replaces window.confirm(), which is silently suppressed in embedded/preview
 * browsers and in-app webviews — there it returns false instantly, so the
 * confirmed action never runs and the button looks broken.
 */
const ConfirmDialog = ({
    open,
    title,
    message,
    detail,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    tone = 'danger',
    onConfirm,
    onCancel
}) => {
    const confirmRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onCancel();
        };

        document.addEventListener('keydown', onKeyDown);
        // Stop the page behind the dialog from scrolling
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        confirmRef.current?.focus();

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="confirm-backdrop"
            onClick={onCancel}
            role="presentation"
        >
            <div
                className="confirm-card"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="confirm-close" onClick={onCancel} title="Close" aria-label="Close">
                    <X size={18} />
                </button>

                <div className={`confirm-icon ${tone}`}>
                    <AlertTriangle size={22} />
                </div>

                <h3 className="confirm-title" id="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                {detail && <p className="confirm-detail">{detail}</p>}

                <div className="confirm-actions">
                    <button type="button" className="btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        ref={confirmRef}
                        className={`confirm-btn ${tone}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`
                .confirm-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.55);
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    z-index: 100;
                    animation: confirmFade 0.15s ease;
                }
                @keyframes confirmFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .confirm-card {
                    position: relative;
                    background: #ffffff;
                    border-radius: 18px;
                    padding: 2rem;
                    width: 100%;
                    max-width: 420px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                    animation: confirmPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes confirmPop {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .confirm-close {
                    position: absolute;
                    top: 0.85rem;
                    right: 0.85rem;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 0.35rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    transition: all 0.2s ease;
                }
                .confirm-close:hover { background: #f1f5f9; color: #475569; }
                .confirm-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.15rem;
                }
                .confirm-icon.danger { background: #fee2e2; color: #dc2626; }
                .confirm-icon.primary { background: #dbeafe; color: #2563eb; }
                .confirm-title {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 0.5rem;
                }
                .confirm-message {
                    color: #475569;
                    font-size: 0.9375rem;
                    line-height: 1.55;
                }
                .confirm-detail {
                    margin-top: 0.85rem;
                    padding: 0.7rem 0.9rem;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 10px;
                    color: #92400e;
                    font-size: 0.8125rem;
                    line-height: 1.5;
                    text-align: left;
                }
                .confirm-actions {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 1.75rem;
                }
                .confirm-actions > * { flex: 1; }
                .confirm-btn {
                    border: none;
                    height: 42px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9375rem;
                    font-family: inherit;
                    color: #ffffff;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                .confirm-btn.danger { background: #dc2626; }
                .confirm-btn.danger:hover { background: #b91c1c; }
                .confirm-btn.primary { background: var(--primary); }
                .confirm-btn.primary:hover { background: var(--primary-hover); }
                .confirm-btn:focus-visible {
                    outline: 2px solid #0f172a;
                    outline-offset: 2px;
                }
                .confirm-actions .btn-secondary {
                    height: 42px;
                    font-size: 0.9375rem;
                }
            `}</style>
        </div>
    );
};

export default ConfirmDialog;
