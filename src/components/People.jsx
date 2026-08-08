import React, { useState } from 'react';
import { UserPlus, Check, X, Trash2, Edit2, Phone, MapPin, HardHat, UserRound, Search } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const emptyPerson = () => ({
    id: Date.now().toString(),
    name: '',
    type: 'Customer',
    phone: '',
    address: ''
});

const validate = (person) => {
    const errors = {};

    if (!person.name.trim()) {
        errors.name = 'Name is required.';
    } else if (person.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters.';
    }

    if (!person.type) errors.type = 'Please choose Engineer or Customer.';

    const digits = person.phone.replace(/\D/g, '');
    if (!person.phone.trim()) {
        errors.phone = 'Phone number is required.';
    } else if (digits.length !== 10) {
        errors.phone = 'Enter a valid 10-digit phone number.';
    }

    return errors;
};

const People = ({ people, onSave, onDelete, orderCounts }) => {
    const [person, setPerson] = useState(emptyPerson);
    const [errors, setErrors] = useState({});
    const [editingId, setEditingId] = useState(null);
    const [query, setQuery] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPerson(prev => ({ ...prev, [name]: value }));
        // Clear the error for this field as soon as the user corrects it
        setErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    const resetForm = () => {
        setPerson(emptyPerson());
        setErrors({});
        setEditingId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const found = validate(person);
        if (Object.keys(found).length > 0) {
            setErrors(found);
            return;
        }

        onSave({
            ...person,
            name: person.name.trim(),
            phone: person.phone.trim(),
            address: person.address.trim(),
            createdAt: person.createdAt || new Date().toISOString()
        });
        resetForm();
    };

    const handleEdit = (target) => {
        setPerson({ ...target });
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
        ? people.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.phone.includes(term) ||
            p.type.toLowerCase().includes(term))
        : people;

    return (
        <div className="people-page">
            <form className="form-card" onSubmit={handleSubmit} noValidate>
                <h3 className="section-title">
                    {editingId ? 'Edit Person' : 'Add Engineer or Customer'}
                </h3>

                <div className="grid-3">
                    <div className="form-group">
                        <label className="form-label">Name <span className="req">*</span></label>
                        <input
                            type="text"
                            name="name"
                            className={`form-input ${errors.name ? 'has-error' : ''}`}
                            value={person.name}
                            onChange={handleChange}
                            placeholder="e.g. Ramesh Kumar"
                        />
                        {errors.name && <span className="field-error">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type <span className="req">*</span></label>
                        <select
                            name="type"
                            className={`form-input ${errors.type ? 'has-error' : ''}`}
                            value={person.type}
                            onChange={handleChange}
                        >
                            <option value="Customer">Customer</option>
                            <option value="Engineer">Engineer</option>
                        </select>
                        {errors.type && <span className="field-error">{errors.type}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone <span className="req">*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            className={`form-input ${errors.phone ? 'has-error' : ''}`}
                            value={person.phone}
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                        />
                        {errors.phone && <span className="field-error">{errors.phone}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Address <span className="optional">(optional)</span></label>
                    <textarea
                        name="address"
                        className="form-input"
                        rows="3"
                        value={person.address}
                        onChange={handleChange}
                        placeholder="Street, area, city, pincode"
                    />
                </div>

                <div className="form-actions">
                    {editingId && (
                        <button type="button" className="btn-secondary" onClick={resetForm}>
                            <X size={16} /> Cancel
                        </button>
                    )}
                    <button type="submit" className="btn-primary">
                        {editingId ? <Check size={18} /> : <UserPlus size={18} />}
                        {editingId ? 'Update Person' : 'Add Person'}
                    </button>
                </div>
            </form>

            <div className="list-header">
                <h3 className="section-title" style={{ margin: 0 }}>
                    People <span className="count-pill">{people.length}</span>
                </h3>
                {people.length > 0 && (
                    <div className="search-box">
                        <Search size={16} color="#94a3b8" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, phone or type"
                        />
                    </div>
                )}
            </div>

            {people.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👷</div>
                    <h3>No people added yet</h3>
                    <p>Add an engineer or customer above to see them listed here.</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No matches for “{query}”</h3>
                    <p>Try a different name, phone number or type.</p>
                </div>
            ) : (
                <div className="people-grid">
                    {visible.map((p) => (
                        <div key={p.id} className={`person-card ${editingId === p.id ? 'editing' : ''}`}>
                            <div className="person-card-top">
                                <div className={`person-avatar ${p.type === 'Engineer' ? 'engineer' : 'customer'}`}>
                                    {p.type === 'Engineer' ? <HardHat size={18} /> : <UserRound size={18} />}
                                </div>
                                <div className="person-identity">
                                    <span className="person-name">{p.name}</span>
                                    <span className={`type-badge ${p.type === 'Engineer' ? 'engineer' : 'customer'}`}>
                                        {p.type}
                                    </span>
                                </div>
                            </div>

                            <div className="person-details">
                                <div className="detail-row">
                                    <Phone size={15} color="#94a3b8" />
                                    <a href={`tel:${p.phone}`}>{p.phone}</a>
                                </div>
                                {p.address && (
                                    <div className="detail-row">
                                        <MapPin size={15} color="#94a3b8" />
                                        <span>{p.address}</span>
                                    </div>
                                )}
                            </div>

                            <div className="person-card-footer">
                                <span className="order-count">
                                    {(orderCounts[p.id] || 0)} order{(orderCounts[p.id] || 0) === 1 ? '' : 's'}
                                </span>
                                <div className="card-actions">
                                    <button className="btn-edit-ghost" onClick={() => handleEdit(p)} title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="btn-danger-ghost" onClick={() => setPendingDelete(p)} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Delete this person?"
                message={pendingDelete ? `${pendingDelete.name} will be removed from your people list.` : ''}
                detail={pendingLinkedOrders > 0
                    ? `${pendingDelete.name} has ${pendingLinkedOrders} brick order${pendingLinkedOrders > 1 ? 's' : ''}. Those orders will stay in the list, but will no longer be linked to a person.`
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
                .form-input.has-error {
                    border-color: #ef4444;
                }
                .form-input.has-error:focus {
                    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
                }
                .field-error {
                    display: block;
                    color: #ef4444;
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
                .people-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.25rem;
                }
                .person-card {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.25s ease;
                }
                .person-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 18px 25px -12px rgba(0, 0, 0, 0.1);
                }
                .person-card.editing {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                .person-card-top {
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
                .person-identity {
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                    min-width: 0;
                }
                .person-name {
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 1rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .type-badge {
                    align-self: flex-start;
                    padding: 0.15rem 0.6rem;
                    border-radius: 999px;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .type-badge.engineer { background: #fef3c7; color: #b45309; }
                .type-badge.customer { background: #dbeafe; color: #1d4ed8; }
                .person-details {
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
                .detail-row a {
                    color: #475569;
                    text-decoration: none;
                }
                .detail-row a:hover {
                    color: var(--primary);
                    text-decoration: underline;
                }
                .person-card-footer {
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
                    .people-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default People;
