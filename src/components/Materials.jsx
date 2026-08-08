import React, { useState } from 'react';
import { PackagePlus, Check, X, Trash2, Edit2, Search, Package, Lock } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { UNIT_SUGGESTIONS, plural } from '../units';

const emptyMaterial = () => ({
    id: Date.now().toString(),
    name: '',
    unit: 'Unit',
    defaultRate: ''
});

const validate = (material, materials, editingId) => {
    const errors = {};
    const name = material.name.trim();

    if (!name) {
        errors.name = 'Material name is required.';
    } else if (materials.some(m => m.id !== editingId && m.name.trim().toLowerCase() === name.toLowerCase())) {
        errors.name = 'That material already exists.';
    }

    if (!material.unit.trim()) errors.unit = 'Unit is required.';

    if (material.defaultRate !== '') {
        const rate = Number(material.defaultRate);
        if (!Number.isFinite(rate) || rate <= 0) {
            errors.defaultRate = 'Enter an amount greater than 0.';
        }
    }

    return errors;
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Materials = ({ materials, onSave, onDelete, orderCounts }) => {
    const [material, setMaterial] = useState(emptyMaterial);
    const [errors, setErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [query, setQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMaterial(prev => ({ ...prev, [name]: value }));
        setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    const resetForm = () => {
        setMaterial(emptyMaterial());
        setErrors({});
        setEditingId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const found = validate(material, materials, editingId);
        if (Object.keys(found).length > 0) {
            setErrors(found);
            return;
        }

        onSave({
            ...material,
            name: material.name.trim(),
            unit: material.unit.trim(),
            defaultRate: material.defaultRate === '' ? '' : Number(material.defaultRate),
            createdAt: material.createdAt || new Date().toISOString()
        });
        resetForm();
    };

    const handleEdit = (target) => {
        setMaterial({ ...target, defaultRate: target.defaultRate === '' || target.defaultRate === undefined ? '' : String(target.defaultRate) });
        setEditingId(target.id);
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = () => {
        if (editingId === pendingDelete.id) resetForm();
        onDelete(pendingDelete.id);
        setPendingDelete(null);
    };

    const pendingLinkedOrders = pendingDelete ? (orderCounts[pendingDelete.id] || 0) : 0;

    const term = query.trim().toLowerCase();
    const visible = term
        ? materials.filter(m => m.name.toLowerCase().includes(term) || m.unit.toLowerCase().includes(term))
        : materials;

    return (
        <div className="materials-page">
            <form className="form-card" onSubmit={handleSubmit} noValidate>
                <h3 className="section-title">{editingId ? 'Edit Material' : 'Add Material'}</h3>

                <div className="grid-3">
                    <div className="form-group">
                        <label className="form-label">Material Name <span className="req">*</span></label>
                        <input
                            type="text"
                            name="name"
                            className={`form-input ${errors.name ? 'has-error' : ''}`}
                            value={material.name}
                            onChange={handleChange}
                            placeholder="e.g. Cement, P-Sand, M-Sand"
                        />
                        {errors.name && <span className="field-error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Unit <span className="req">*</span></label>
                        <input
                            type="text"
                            name="unit"
                            list="unit-suggestions"
                            className={`form-input ${errors.unit ? 'has-error' : ''}`}
                            value={material.unit}
                            onChange={handleChange}
                            placeholder="e.g. Bag"
                        />
                        <datalist id="unit-suggestions">
                            {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                        </datalist>
                        {errors.unit
                            ? <span className="field-error">{errors.unit}</span>
                            : <span className="field-hint">Singular — “Bag”, “Load”, “Piece”</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Default Rate <span className="optional">(optional)</span></label>
                        <input
                            type="number"
                            name="defaultRate"
                            min="0.01"
                            step="0.01"
                            className={`form-input ${errors.defaultRate ? 'has-error' : ''}`}
                            value={material.defaultRate}
                            onChange={handleChange}
                            placeholder="e.g. 420"
                        />
                        {errors.defaultRate
                            ? <span className="field-error">{errors.defaultRate}</span>
                            : <span className="field-hint">Prefills the rate on new orders</span>}
                    </div>
                </div>

                <div className="form-actions">
                    {editingId && (
                        <button type="button" className="btn-secondary" onClick={resetForm}>
                            <X size={16} /> Cancel
                        </button>
                    )}
                    <button type="submit" className="btn-primary">
                        {editingId ? <Check size={18} /> : <PackagePlus size={18} />}
                        {editingId ? 'Update Material' : 'Add Material'}
                    </button>
                </div>
            </form>

            <div className="list-header">
                <h3 className="section-title" style={{ margin: 0 }}>
                    Materials <span className="count-pill">{materials.length}</span>
                </h3>
                {materials.length > 0 && (
                    <div className="search-box">
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name or unit"
                        />
                    </div>
                )}
            </div>

            {materials.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No materials yet</h3>
                    <p>Add the materials you supply — bricks, cement, P-sand, M-sand and so on.</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No matches for “{query}”</h3>
                    <p>Try a different material name or unit.</p>
                </div>
            ) : (
                <div className="materials-grid">
                    {visible.map((m) => (
                        <div key={m.id} className={`material-card ${editingId === m.id ? 'editing' : ''} ${m.builtIn ? 'built-in' : ''}`}>
                            <div className="material-card-top">
                                <div className="material-icon"><Package size={18} /></div>
                                <div className="material-identity">
                                    <span className="material-name">{m.name}</span>
                                    <span className="unit-badge">Measured in {plural(m.unit)}</span>
                                </div>
                                {m.builtIn && (
                                    <span className="locked-badge" title="Standard material — cannot be changed">
                                        <Lock size={11} /> Default
                                    </span>
                                )}
                            </div>

                            <div className="material-rate">
                                {m.defaultRate === '' || m.defaultRate === undefined
                                    ? <span className="no-rate">No default rate</span>
                                    : <>{money(m.defaultRate)} <em>/ {m.unit}</em></>}
                            </div>

                            <div className="material-card-footer">
                                <span className="order-count">
                                    {(orderCounts[m.id] || 0)} order{(orderCounts[m.id] || 0) === 1 ? '' : 's'}
                                </span>
                                {m.builtIn ? (
                                    <span className="locked-note">Standard</span>
                                ) : (
                                    <div className="card-actions">
                                        <button className="btn-edit-ghost" onClick={() => handleEdit(m)} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-danger-ghost" onClick={() => setPendingDelete(m)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete this material?"
                message={pendingDelete ? `${pendingDelete.name} will be removed from your materials list.` : ''}
                detail={pendingLinkedOrders > 0
                    ? `${pendingDelete.name} is used by ${pendingLinkedOrders} order${pendingLinkedOrders > 1 ? 's' : ''}. Those orders keep their recorded quantity and rate, but you won't be able to pick this material for new orders.`
                    : null}
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
                .grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }
                .req { color: #ef4444; }
                .optional {
                    color: #94a3b8;
                    font-weight: 400;
                    font-size: 0.75rem;
                }
                .form-input.has-error { border-color: #ef4444; }
                .form-input.has-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
                .field-error {
                    display: block;
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 0.375rem;
                }
                .field-hint {
                    display: block;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    margin-top: 0.375rem;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                }
                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    margin: 2.5rem 0 1.25rem;
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
                .materials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.25rem;
                }
                .material-card {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    transition: all 0.25s ease;
                }
                .material-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 18px 25px -12px rgba(0, 0, 0, 0.1);
                }
                .material-card.editing {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                .material-card-top {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                    margin-bottom: 1.15rem;
                }
                .material-card.built-in { background: #fcfcfd; }
                .locked-badge {
                    margin-left: auto;
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.2rem 0.55rem;
                    border-radius: 999px;
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.625rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }
                .locked-note {
                    font-size: 0.75rem;
                    color: #cbd5e1;
                    font-weight: 600;
                }
                .material-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: #ede9fe;
                    color: #6d28d9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .material-identity {
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                    min-width: 0;
                }
                .material-name {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 1rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .unit-badge {
                    align-self: flex-start;
                    padding: 0.15rem 0.6rem;
                    border-radius: 999px;
                    background: #ede9fe;
                    color: #6d28d9;
                    font-size: 0.6875rem;
                    font-weight: 700;
                }
                .material-rate {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                    flex: 1;
                    overflow-wrap: anywhere;
                }
                .material-rate em {
                    font-style: normal;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    color: #94a3b8;
                }
                .no-rate {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #94a3b8;
                }
                .material-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 1.25rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                }
                .order-count {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    font-weight: 600;
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
                .btn-edit-ghost, .btn-danger-ghost {
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
                .btn-edit-ghost:hover { background: #e0e7ff; color: #3730a3; }
                .btn-danger-ghost:hover { background: #fee2e2; color: #ef4444; }

                @media (max-width: 900px) {
                    .grid-3 { grid-template-columns: 1fr; }
                }
                @media (max-width: 768px) {
                    .form-actions { flex-direction: column-reverse; }
                    .form-actions button { width: 100%; }
                    .search-box { min-width: 100%; }
                    .materials-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Materials;
