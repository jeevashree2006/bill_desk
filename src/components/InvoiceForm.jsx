import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

const InvoiceForm = ({ onSave, onCancel }) => {
    const [invoice, setInvoice] = useState({
        id: Date.now().toString(),
        invoiceNo: '',
        date: new Date().toISOString().split('T')[0],
        billTo: {
            name: '',
            address: '',
            gst: ''
        },
        shipTo: '',
        items: [
            { id: '1', particulars: 'Bricks', hsn: '68159910', qty: 0, rate: 0, amount: 0 }
        ],
        totalAmount: 0,
        totalCGST: 0,
        totalSGST: 0,
        grandTotal: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setInvoice(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setInvoice(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleItemChange = (id, field, value) => {
        const newItems = invoice.items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'qty' || field === 'rate') {
                    const qty = parseFloat(updatedItem.qty) || 0;
                    const rate = parseFloat(updatedItem.rate) || 0;
                    // Derive exclusive base value from inclusive rate
                    const exclusiveAmount = (qty * rate * 100) / 112;
                    updatedItem.amount = exclusiveAmount.toFixed(2);
                }
                return updatedItem;
            }
            return item;
        });

        calculateTotals(newItems);
    };

    const addItem = () => {
        const newItem = {
            id: Date.now().toString(),
            particulars: '',
            hsn: '',
            qty: 0,
            rate: 0,
            amount: 0
        };
        setInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (id) => {
        const newItems = invoice.items.filter(item => item.id !== id);
        calculateTotals(newItems);
    };

    const calculateTotals = (items) => {
        const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        const cgst = totalAmount * 0.06;
        const sgst = totalAmount * 0.06;

        // Use exact inclusive string to avoid rounding errors when displaying mathematically perfect total
        const exactGrandTotal = items.reduce((sum, item) => {
            const qty = parseFloat(item.qty) || 0;
            const rate = parseFloat(item.rate) || 0;
            return sum + (qty * rate);
        }, 0);

        setInvoice(prev => ({
            ...prev,
            items,
            totalAmount: totalAmount.toFixed(2),
            totalCGST: cgst.toFixed(2),
            totalSGST: sgst.toFixed(2),
            grandTotal: Math.round(exactGrandTotal).toFixed(2)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(invoice);
    };

    return (
        <form className="form-card" onSubmit={handleSubmit}>
            <div className="grid-2">
                <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input
                        type="text"
                        name="invoiceNo"
                        className="form-input"
                        value={invoice.invoiceNo}
                        onChange={handleChange}
                        required
                        placeholder="e.g. 395"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                        type="date"
                        name="date"
                        className="form-input"
                        value={invoice.date}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="grid-2">
                <div className="form-group">
                    <label className="form-label">Bill To (Customer Details)</label>
                    <input
                        type="text"
                        name="billTo.name"
                        className="form-input"
                        placeholder="Name"
                        value={invoice.billTo.name}
                        onChange={handleChange}
                        style={{ marginBottom: '0.5rem' }}
                    />
                    <textarea
                        name="billTo.address"
                        className="form-input"
                        placeholder="Address"
                        rows="3"
                        value={invoice.billTo.address}
                        onChange={handleChange}
                        style={{ marginBottom: '0.5rem' }}
                    />
                    <input
                        type="text"
                        name="billTo.gst"
                        className="form-input"
                        placeholder="GST No"
                        value={invoice.billTo.gst}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Ship To Address</label>
                    <textarea
                        name="shipTo"
                        className="form-input"
                        placeholder="Shipping Address"
                        rows="7"
                        value={invoice.shipTo}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="items-section" style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Items</h4>
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Particulars</th>
                            <th>HSN Code</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item) => (
                            <tr key={item.id}>
                                <td data-label="Particulars">
                                    <input
                                        type="text"
                                        className="form-input small"
                                        value={item.particulars}
                                        onChange={(e) => handleItemChange(item.id, 'particulars', e.target.value)}
                                    />
                                </td>
                                <td data-label="HSN Code">
                                    <input
                                        type="text"
                                        className="form-input small"
                                        value={item.hsn}
                                        onChange={(e) => handleItemChange(item.id, 'hsn', e.target.value)}
                                    />
                                </td>
                                <td data-label="Qty" style={{ width: '100px' }}>
                                    <input
                                        type="number"
                                        className="form-input small"
                                        value={item.qty}
                                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                                    />
                                </td>
                                <td data-label="Rate" style={{ width: '120px' }}>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input small"
                                        value={item.rate}
                                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                    />
                                </td>
                                <td data-label="Amount" style={{ width: '120px', fontWeight: '600' }}>
                                    <span>{item.amount}</span>
                                </td>
                                <td data-label="Action">
                                    <button type="button" className="btn-danger" onClick={() => removeItem(item.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="btn-secondary" onClick={addItem} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    <Plus size={16} /> Add Item
                </button>
            </div>

            <div className="form-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: '1rem' }}>
                <div style={{ textAlign: 'right', marginRight: '2rem', marginBottom: '0' }}>
                    <p style={{ color: '#64748b' }}>CGST (6%): ₹{invoice.totalCGST}</p>
                    <p style={{ color: '#64748b' }}>SGST (6%): ₹{invoice.totalSGST}</p>
                    <h3 style={{ marginTop: '0.5rem' }}>Total: ₹{invoice.grandTotal}</h3>
                </div>
                <button type="button" className="btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn-primary">
                    <Save size={18} /> Save Invoice
                </button>
            </div>

            <style>{`
        .form-input.small {
          padding: 0.5rem;
          font-size: 0.875rem;
        }
      `}</style>
        </form>
    );
};

export default InvoiceForm;
