import React from 'react';
import { Eye, Trash2, Calendar, User, Hash } from 'lucide-react';

const Dashboard = ({ invoices, onView, onDelete }) => {
    if (invoices.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No invoices found</h3>
                <p>Create your first invoice to see it here.</p>
            </div>
        );
    }

    return (
        <div className="invoice-grid">
            {invoices.map((invoice) => (
                <div key={invoice.id} className="invoice-card" onClick={() => onView(invoice)}>
                    <div className="invoice-card-header" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>
                            <span>Bill No:</span>
                            <span>{invoice.invoiceNo}</span>
                        </div>
                        <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}>
                            {invoice.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} Bricks
                        </span>
                    </div>

                    <div className="invoice-card-body">
                        <div className="invoice-amount" style={{ margin: '0 0 1.25rem 0', fontSize: '1.875rem', color: '#0f172a', letterSpacing: '-0.02em', fontWeight: 800 }}>
                            ₹{parseFloat(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="icon-text" style={{ marginBottom: '0.75rem', color: '#475569' }}>
                            <User size={16} color="#94a3b8" /> <span style={{ fontWeight: 500 }}>{invoice.billTo.name || 'No Name Provided'}</span>
                        </div>
                        <div className="icon-text muted" style={{ color: '#64748b' }}>
                            <Calendar size={16} color="#94a3b8" /> <span>{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="invoice-card-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            className="btn-danger-ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(invoice.id);
                            }}
                            title="Delete Invoice"
                        >
                            <Trash2 size={16} />
                        </button>
                        <span className="view-details-btn" style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'gap 0.2s' }}>
                            View Details <Eye size={16} />
                        </span>
                    </div>
                </div>
            ))}

            <style >{`
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
        }
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .icon-text {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.875rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        .icon-text.muted {
          color: #64748b;
        }
        .btn-danger-ghost {
          background: transparent;
          color: #94a3b8;
          border: none;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-danger-ghost:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .invoice-card:hover .view-details-btn {
          gap: 0.5rem;
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
