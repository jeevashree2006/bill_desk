import React, { useState, useMemo } from 'react';
import { PackagePlus, Trash2, MapPin, Calendar, Package, IndianRupee, HardHat, UserRound, Search } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { plural } from '../units';

const emptyOrder = () => ({
    id: Date.now().toString(),
    personId: '',
    materialId: '',
    quantity: '',
    pricePerUnit: '',
    deliveryAddress: '',
    date: new Date().toISOString().split('T')[0]
});

const validate = (order, people, materials) => {
    const errors = {};

    if (!order.personId) {
        errors.personId = 'Please select a person.';
    } else if (!people.some(p => p.id === order.personId)) {
        errors.personId = 'That person no longer exists. Please select another.';
    }

    if (!order.materialId) {
        errors.materialId = 'Please select a material.';
    } else if (!materials.some(m => m.id === order.materialId)) {
        errors.materialId = 'That material no longer exists. Please select another.';
    }

    const qty = Number(order.quantity);
    if (order.quantity === '') {
        errors.quantity = 'Quantity is required.';
    } else if (!Number.isFinite(qty) || qty <= 0) {
        errors.quantity = 'Enter a number greater than 0.';
    }

    const price = Number(order.pricePerUnit);
    if (order.pricePerUnit === '') {
        errors.pricePerUnit = 'Price is required.';
    } else if (!Number.isFinite(price) || price <= 0) {
        errors.pricePerUnit = 'Enter an amount greater than 0.';
    }

    if (!order.deliveryAddress.trim()) {
        errors.deliveryAddress = 'Delivered address is required.';
    } else if (order.deliveryAddress.trim().length < 5) {
        errors.deliveryAddress = 'Please enter a fuller address.';
    }

    if (!order.date) errors.date = 'Delivery date is required.';

    return errors;
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qtyText = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const Orders = ({ orders, people, materials, onSave, onDelete, onGoToPeople }) => {
    const [order, setOrder] = useState(emptyOrder);
    const [errors, setErrors] = useState({});
    const [query, setQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);

    // Options show the name on its own. The phone is appended only when two
    // people share a name, so the list can never show identical options.
    const duplicateNames = useMemo(() => {
        const counts = new Map();
        people.forEach(p => {
            const key = p.name.trim().toLowerCase();
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return new Set([...counts].filter(([, n]) => n > 1).map(([key]) => key));
    }, [people]);

    const selectedMaterial = materials.find(m => m.id === order.materialId) || null;
    const unit = selectedMaterial?.unit || 'Unit';

    const liveTotal = useMemo(() => {
        const qty = Number(order.quantity);
        const price = Number(order.pricePerUnit);
        if (!Number.isFinite(qty) || !Number.isFinite(price)) return 0;
        return qty * price;
    }, [order.quantity, order.pricePerUnit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrder(prev => ({ ...prev, [name]: value }));
        setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    // Selecting a person prefills their saved address as a convenient starting point
    const handlePersonChange = (e) => {
        const personId = e.target.value;
        const picked = people.find(p => p.id === personId);
        setOrder(prev => ({
            ...prev,
            personId,
            deliveryAddress: prev.deliveryAddress.trim() === '' && picked?.address
                ? picked.address
                : prev.deliveryAddress
        }));
        setErrors(prev => ({ ...prev, personId: undefined }));
    };

    // Choosing a material prefills its default rate when the field is still blank
    const handleMaterialChange = (e) => {
        const materialId = e.target.value;
        const picked = materials.find(m => m.id === materialId);
        setOrder(prev => ({
            ...prev,
            materialId,
            pricePerUnit: prev.pricePerUnit === '' && picked?.defaultRate
                ? String(picked.defaultRate)
                : prev.pricePerUnit
        }));
        setErrors(prev => ({ ...prev, materialId: undefined }));
    };

    const resetForm = () => {
        setOrder(emptyOrder());
        setErrors({});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const found = validate(order, people, materials);
        if (Object.keys(found).length > 0) {
            setErrors(found);
            return;
        }

        const person = people.find(p => p.id === order.personId);
        const material = materials.find(m => m.id === order.materialId);
        const qty = Number(order.quantity);
        const price = Number(order.pricePerUnit);

        onSave({
            ...order,
            quantity: qty,
            pricePerUnit: price,
            totalAmount: Number((qty * price).toFixed(2)),
            deliveryAddress: order.deliveryAddress.trim(),
            // Snapshots so the order stays readable if the person or material is deleted
            personName: person.name,
            personType: person.type,
            personPhone: person.phone,
            materialName: material.name,
            materialUnit: material.unit,
            createdAt: order.createdAt || new Date().toISOString()
        });
        resetForm();
    };

    const confirmDelete = () => {
        onDelete(pendingDelete.id);
        setPendingDelete(null);
    };

    const term = query.trim().toLowerCase();
    const visible = term
        ? orders.filter(o =>
            (o.personName || '').toLowerCase().includes(term) ||
            (o.materialName || '').toLowerCase().includes(term) ||
            (o.deliveryAddress || '').toLowerCase().includes(term))
        : orders;

    const totalValue = useMemo(
        () => orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        [orders]
    );

    // Quantities only add up within a material — bags and pieces can't be summed.
    const byMaterial = useMemo(() => {
        const map = new Map();
        orders.forEach((o) => {
            const key = o.materialName || 'Unknown';
            if (!map.has(key)) map.set(key, { name: key, unit: o.materialUnit || 'Unit', quantity: 0 });
            map.get(key).quantity += Number(o.quantity || 0);
        });
        return [...map.values()].sort((a, b) => b.quantity - a.quantity);
    }, [orders]);

    if (people.length === 0) {
        return (
            <div className="gate-state">
                <div className="gate-icon">👷</div>
                <h3>Add a person first</h3>
                <p>Orders are created against an engineer or customer. Add one in the People tab to get started.</p>
                <button className="btn-primary" onClick={onGoToPeople}>Go to People</button>
                <style>{gateStyles}</style>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <form className="form-card" onSubmit={handleSubmit} noValidate>
                <h3 className="section-title">New Order</h3>

                <div className="grid-2">
                    <div className="form-group">
                        <label className="form-label">Person <span className="req">*</span></label>
                        <select
                            name="personId"
                            className={`form-input ${errors.personId ? 'has-error' : ''}`}
                            value={order.personId}
                            onChange={handlePersonChange}
                        >
                            <option value="">— Select an engineer or customer —</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>
                                    {duplicateNames.has(p.name.trim().toLowerCase())
                                        ? `${p.name} — ${p.phone}`
                                        : p.name}
                                </option>
                            ))}
                        </select>
                        {errors.personId && <span className="field-error">{errors.personId}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Material <span className="req">*</span></label>
                        <select
                            name="materialId"
                            className={`form-input ${errors.materialId ? 'has-error' : ''}`}
                            value={order.materialId}
                            onChange={handleMaterialChange}
                        >
                            <option value="">— Select a material —</option>
                            {materials.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        {errors.materialId && <span className="field-error">{errors.materialId}</span>}
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label className="form-label">
                            Total Quantity {selectedMaterial && <span className="unit-hint">({plural(unit)})</span>}
                            <span className="req"> *</span>
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            min="0.01"
                            step="any"
                            className={`form-input ${errors.quantity ? 'has-error' : ''}`}
                            value={order.quantity}
                            onChange={handleChange}
                            placeholder={selectedMaterial ? `Number of ${plural(unit).toLowerCase()}` : 'Select a material first'}
                        />
                        {errors.quantity && <span className="field-error">{errors.quantity}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            Price per {selectedMaterial ? unit : 'Unit'}
                            <span className="req"> *</span>
                        </label>
                        <input
                            type="number"
                            name="pricePerUnit"
                            min="0.01"
                            step="0.01"
                            className={`form-input ${errors.pricePerUnit ? 'has-error' : ''}`}
                            value={order.pricePerUnit}
                            onChange={handleChange}
                            placeholder="e.g. 9.50"
                        />
                        {errors.pricePerUnit && <span className="field-error">{errors.pricePerUnit}</span>}
                    </div>
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label className="form-label">Delivery Date <span className="req">*</span></label>
                        <input
                            type="date"
                            name="date"
                            className={`form-input ${errors.date ? 'has-error' : ''}`}
                            value={order.date}
                            onChange={handleChange}
                        />
                        {errors.date && <span className="field-error">{errors.date}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Total Amount</label>
                        <div className="computed-total">{money(liveTotal)}</div>
                        <span className="computed-hint">
                            Quantity × price per {selectedMaterial ? unit.toLowerCase() : 'unit'}
                        </span>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Delivered Address <span className="req">*</span></label>
                    <textarea
                        name="deliveryAddress"
                        className={`form-input ${errors.deliveryAddress ? 'has-error' : ''}`}
                        rows="3"
                        value={order.deliveryAddress}
                        onChange={handleChange}
                        placeholder="Site or delivery address"
                    />
                    {errors.deliveryAddress && <span className="field-error">{errors.deliveryAddress}</span>}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary">
                        <PackagePlus size={18} /> Add Order
                    </button>
                </div>
            </form>

            {orders.length > 0 && (
                <>
                    <div className="summary-row">
                        <div className="summary-card">
                            <span className="summary-label">Orders</span>
                            <span className="summary-value">{orders.length}</span>
                        </div>
                        <div className="summary-card">
                            <span className="summary-label">Total Value</span>
                            <span className="summary-value">{money(totalValue)}</span>
                        </div>
                    </div>

                    <div className="material-totals">
                        {byMaterial.map(m => (
                            <span key={m.name} className="material-chip">
                                <Package size={13} />
                                <strong>{qtyText(m.quantity)}</strong> {plural(m.unit).toLowerCase()} {m.name}
                            </span>
                        ))}
                    </div>
                </>
            )}

            <div className="list-header">
                <h3 className="section-title" style={{ margin: 0 }}>
                    Orders <span className="count-pill">{orders.length}</span>
                </h3>
                {orders.length > 0 && (
                    <div className="search-box">
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by person, material or address"
                        />
                    </div>
                )}
            </div>

            {orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No orders yet</h3>
                    <p>Fill in the form above to record your first order.</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No matches for “{query}”</h3>
                    <p>Try a different person, material or address.</p>
                </div>
            ) : (
                <div className="orders-grid">
                    {visible.map((o) => {
                        const stillExists = people.some(p => p.id === o.personId);
                        return (
                            <div key={o.id} className="order-card">
                                <div className="order-card-top">
                                    <div className={`person-avatar ${o.personType === 'Engineer' ? 'engineer' : 'customer'}`}>
                                        {o.personType === 'Engineer' ? <HardHat size={18} /> : <UserRound size={18} />}
                                    </div>
                                    <div className="order-identity">
                                        <span className="person-name">{o.personName}</span>
                                        <span className="person-sub">
                                            {o.personPhone}
                                            {!stillExists && <em className="removed-tag">person removed</em>}
                                        </span>
                                    </div>
                                    <span className="material-badge">{o.materialName}</span>
                                </div>

                                <div className="order-amount">{money(o.totalAmount)}</div>

                                <div className="order-metrics">
                                    <div className="metric">
                                        <Package size={15} color="#94a3b8" />
                                        <span>
                                            <strong>{qtyText(o.quantity)}</strong> {plural(o.materialUnit).toLowerCase()}
                                        </span>
                                    </div>
                                    <div className="metric">
                                        <IndianRupee size={15} color="#94a3b8" />
                                        <span><strong>{money(o.pricePerUnit)}</strong> / {(o.materialUnit || 'unit').toLowerCase()}</span>
                                    </div>
                                </div>

                                <div className="order-details">
                                    <div className="detail-row">
                                        <MapPin size={15} color="#94a3b8" />
                                        <span>{o.deliveryAddress}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Calendar size={15} color="#94a3b8" />
                                        <span>
                                            {new Date(o.date).toLocaleDateString('en-GB', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-card-footer">
                                    <div className="card-actions">
                                        <button className="btn-danger-ghost" onClick={() => setPendingDelete(o)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete this order?"
                message={pendingDelete
                    ? `The order of ${qtyText(pendingDelete.quantity)} ${plural(pendingDelete.materialUnit).toLowerCase()} ${pendingDelete.materialName} for ${pendingDelete.personName} (${money(pendingDelete.totalAmount)}) will be removed.`
                    : ''}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            <style>{`
                .section-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    color: #0f172a;
                }
                .req { color: #ef4444; }
                .unit-hint { color: #94a3b8; font-weight: 500; }
                .form-input.has-error { border-color: #ef4444; }
                .form-input.has-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
                .field-error {
                    display: block;
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 0.375rem;
                }
                .computed-total {
                    height: 46px;
                    display: flex;
                    align-items: center;
                    padding: 0 0.75rem;
                    border: 1px dashed var(--border-color);
                    border-radius: 8px;
                    background: #f8fafc;
                    font-size: 1.125rem;
                    font-weight: 800;
                    color: #0f172a;
                }
                .computed-hint {
                    display: block;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 0.375rem;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                }
                .summary-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                    gap: 1rem;
                    margin-top: 2.5rem;
                }
                .summary-card {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 14px;
                    padding: 1.15rem 1.35rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    min-width: 0;
                }
                .summary-label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: #94a3b8;
                    font-weight: 700;
                }
                .summary-value {
                    font-size: clamp(1.125rem, 1.6vw + 0.6rem, 1.5rem);
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                    line-height: 1.25;
                    min-width: 0;
                    overflow-wrap: anywhere;
                }
                .material-totals {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .material-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: white;
                    border: 1px solid var(--border-color);
                    border-radius: 999px;
                    padding: 0.35rem 0.8rem;
                    font-size: 0.8125rem;
                    color: #475569;
                }
                .material-chip strong { color: #0f172a; }
                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    margin: 2rem 0 1.25rem;
                    flex-wrap: wrap;
                }
                .count-pill {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 24px;
                    height: 22px;
                    padding: 0 0.5rem;
                    margin-left: 0.5rem;
                    border-radius: 999px;
                    background: #e0e7ff;
                    color: #3730a3;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: white;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 0 0.75rem;
                    height: 38px;
                    min-width: 260px;
                }
                .search-box input {
                    border: none;
                    outline: none;
                    font-size: 0.875rem;
                    font-family: inherit;
                    flex: 1;
                    background: transparent;
                    color: var(--text-main);
                }
                .orders-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.25rem;
                }
                .order-card {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    transition: all 0.25s ease;
                }
                .order-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 18px 25px -12px rgba(0, 0, 0, 0.1);
                }
                .order-card-top {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    margin-bottom: 1.25rem;
                }
                .person-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .person-avatar.engineer { background: #fef3c7; color: #b45309; }
                .person-avatar.customer { background: #dbeafe; color: #1d4ed8; }
                .order-identity {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    flex: 1;
                }
                .person-name {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 1rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .person-sub {
                    font-size: 0.8125rem;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .material-badge {
                    flex-shrink: 0;
                    padding: 0.2rem 0.65rem;
                    border-radius: 999px;
                    background: #ede9fe;
                    color: #6d28d9;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .removed-tag {
                    font-style: normal;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    background: #fee2e2;
                    color: #b91c1c;
                    padding: 0.1rem 0.45rem;
                    border-radius: 999px;
                }
                .order-amount {
                    font-size: clamp(1.375rem, 1.6vw + 0.7rem, 1.75rem);
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                    margin-bottom: 1rem;
                    overflow-wrap: anywhere;
                }
                .order-metrics {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                .metric {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 0.4rem 0.7rem;
                    font-size: 0.8125rem;
                    color: #475569;
                }
                .metric strong { color: #0f172a; }
                .order-details {
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    flex: 1;
                }
                .detail-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.6rem;
                    font-size: 0.875rem;
                    color: #475569;
                    word-break: break-word;
                }
                .order-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    margin-top: 1.25rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }
                .card-actions { display: flex; gap: 0.35rem; }
                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                }
                .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
                .empty-state p { color: #64748b; margin-top: 0.5rem; }
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
                .btn-danger-ghost:hover { background: #fee2e2; color: #ef4444; }

                @media (max-width: 768px) {
                    .form-actions { flex-direction: column-reverse; }
                    .form-actions button { width: 100%; }
                    .search-box { min-width: 100%; }
                    .orders-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

const gateStyles = `
    .gate-state {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 12px;
        border: 2px dashed #e2e8f0;
    }
    .gate-icon { font-size: 3rem; margin-bottom: 1rem; }
    .gate-state p { color: #64748b; margin-top: 0.5rem; }
    .gate-state .btn-primary { margin: 1.5rem auto 0; }
`;

export default Orders;
