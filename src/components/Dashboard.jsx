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
                    <div className="invoice-card-header">
                        <span className="badge">Paid</span>
                        <button
                            className="btn-danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(invoice.id);
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    <div className="invoice-card-body">
                        <div className="icon-text">
                            <Hash size={14} /> <span>{invoice.invoiceNo}</span>
                        </div>
                        <div className="invoice-amount">
                            ₹{parseFloat(invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="icon-text">
                            <User size={14} /> <span>{invoice.billTo.name || 'No Name'}</span>
                        </div>
                        <div className="icon-text muted" style={{ marginTop: '0.5rem' }}>
                            <Calendar size={14} /> <span>{invoice.date}</span>
                        </div>
                    </div>

                    <div className="invoice-card-footer" style={{ marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            View Details <Eye size={14} />
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
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #1e293b;
          margin-bottom: 0.25rem;
        }
        .icon-text.muted {
          color: #64748b;
        }
      `}</style>
        </div>
    );
};

export default Dashboard;
