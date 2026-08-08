import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Generic content modal used for the Balance tab popups
 * (order breakdown, record a payment, payment history).
 */
const Modal = ({ open, title, subtitle, onClose, children, width = 560 }) => {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} role="presentation">
            <div
                className="modal-card"
                style={{ maxWidth: `${width}px` }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="modal-head">
                    <div className="modal-head-text">
                        <h3 id="modal-title">{title}</h3>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <button className="modal-close" onClick={onClose} title="Close" aria-label="Close">
                        <X size={18} />
                    </button>
                </header>

                <div className="modal-body">{children}</div>
            </div>

            <style>{`
                .modal-backdrop {
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
                    animation: modalFade 0.15s ease;
                }
                @keyframes modalFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .modal-card {
                    background: #ffffff;
                    border-radius: 18px;
                    width: 100%;
                    max-height: calc(100vh - 3rem);
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
                    animation: modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                @keyframes modalPop {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .modal-head {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 1.5rem 1.75rem 1.15rem;
                    border-bottom: 1px solid #f1f5f9;
                    flex-shrink: 0;
                }
                .modal-head-text { min-width: 0; }
                .modal-head h3 {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #0f172a;
                }
                .modal-head p {
                    margin-top: 0.2rem;
                    font-size: 0.8125rem;
                    color: #64748b;
                }
                .modal-close {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    padding: 0.35rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }
                .modal-close:hover { background: #f1f5f9; color: #475569; }
                .modal-body {
                    padding: 1.5rem 1.75rem 1.75rem;
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                .modal-body::-webkit-scrollbar { width: 6px; }
                .modal-body::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }

                @media (max-width: 600px) {
                    .modal-head { padding: 1.25rem 1.25rem 1rem; }
                    .modal-body { padding: 1.25rem; }
                }
            `}</style>
        </div>
    );
};

export default Modal;
