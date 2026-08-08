import React, { useState, useMemo } from 'react';
import {
    Eye, HandCoins, History, Trash2, HardHat, UserRound, Search, Check, CircleAlert, Package, Download
} from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { plural } from '../units';
import { downloadStatement } from '../statementPdf';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const count = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const shortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const Balance = ({ orders, payments, people, onSavePayment, onDeletePayment }) => {
    const [query, setQuery] = useState('');
    const [detailsFor, setDetailsFor] = useState(null);
    const [payFor, setPayFor] = useState(null);
    const [historyFor, setHistoryFor] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);

    const [payment, setPayment] = useState({ date: '', amount: '' });
    const [payErrors, setPayErrors] = useState({});

    // A profile appears here as soon as it has at least one brick order.
    const profiles = useMemo(() => {
        const byPerson = new Map();

        orders.forEach((order) => {
            const key = order.personId || `unlinked-${order.id}`;
            if (!byPerson.has(key)) {
                const live = people.find(p => p.id === order.personId);
                byPerson.set(key, {
                    personId: key,
                    name: live?.name || order.personName || 'Unknown',
                    type: live?.type || order.personType || 'Customer',
                    phone: live?.phone || order.personPhone || '',
                    exists: Boolean(live),
                    orders: [],
                    materials: new Map(),
                    totalAmount: 0
                });
            }
            const profile = byPerson.get(key);
            profile.orders.push(order);
            profile.totalAmount += Number(order.totalAmount || 0);

            // Quantities only add up within a material — bags and pieces can't be summed.
            const name = order.materialName || 'Unknown';
            if (!profile.materials.has(name)) {
                profile.materials.set(name, { name, unit: order.materialUnit || 'Unit', quantity: 0 });
            }
            profile.materials.get(name).quantity += Number(order.quantity || 0);
        });

        payments.forEach((p) => {
            const profile = byPerson.get(p.personId);
            if (profile) profile.payments = [...(profile.payments || []), p];
        });

        return [...byPerson.values()].map((profile) => {
            const paid = (profile.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
            return {
                ...profile,
                materials: [...profile.materials.values()].sort((a, b) => b.quantity - a.quantity),
                orders: [...profile.orders].sort((a, b) => new Date(a.date) - new Date(b.date)),
                payments: [...(profile.payments || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
                paid,
                balance: profile.totalAmount - paid
            };
        }).sort((a, b) => b.balance - a.balance);
    }, [orders, payments, people]);

    const totals = useMemo(() => ({
        billed: profiles.reduce((s, p) => s + p.totalAmount, 0),
        received: profiles.reduce((s, p) => s + p.paid, 0),
        outstanding: profiles.reduce((s, p) => s + Math.max(0, p.balance), 0)
    }), [profiles]);

    const term = query.trim().toLowerCase();
    const visible = term
        ? profiles.filter(p => p.name.toLowerCase().includes(term) || p.phone.includes(term))
        : profiles;

    // Keep the open modals pointing at fresh data after a payment is added/removed
    const live = (profile) => profiles.find(p => p.personId === profile.personId) || profile;

    const openPayModal = (profile) => {
        setPayment({ date: new Date().toISOString().split('T')[0], amount: '' });
        setPayErrors({});
        setPayFor(profile);
    };

    const handlePayChange = (e) => {
        const { name, value } = e.target;
        setPayment(prev => ({ ...prev, [name]: value }));
        setPayErrors(prev => (prev[name] ? { ...prev, [name]: undefined } : prev));
    };

    const submitPayment = (e) => {
        e.preventDefault();
        const profile = live(payFor);
        const errors = {};
        const amount = Number(payment.amount);

        if (!payment.date) errors.date = 'Date is required.';

        if (payment.amount === '') {
            errors.amount = 'Amount is required.';
        } else if (!Number.isFinite(amount) || amount <= 0) {
            errors.amount = 'Enter an amount greater than 0.';
        } else if (amount > profile.balance) {
            errors.amount = `Amount is more than the pending balance of ${money(profile.balance)}.`;
        }

        if (Object.keys(errors).length > 0) {
            setPayErrors(errors);
            return;
        }

        onSavePayment({
            id: Date.now().toString(),
            personId: profile.personId,
            personName: profile.name,
            date: payment.date,
            amount: Number(amount.toFixed(2)),
            createdAt: new Date().toISOString()
        });

        setPayFor(null);
    };

    const confirmDeletePayment = () => {
        onDeletePayment(pendingDelete.id);
        setPendingDelete(null);
    };

    if (profiles.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">💰</div>
                <h3>No balances yet</h3>
                <p>Add a brick order and the engineer or customer will appear here automatically.</p>
                <style>{`
                    .empty-state {
                        text-align: center;
                        padding: 4rem 2rem;
                        background: white;
                        border-radius: 12px;
                        border: 2px dashed #e2e8f0;
                    }
                    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
                    .empty-state p { color: #64748b; margin-top: 0.5rem; }
                `}</style>
            </div>
        );
    }

    const payProfile = payFor ? live(payFor) : null;
    const detailsProfile = detailsFor ? live(detailsFor) : null;
    const historyProfile = historyFor ? live(historyFor) : null;

    return (
        <div className="balance-page">
            <div className="summary-row">
                <div className="summary-card">
                    <span className="summary-label">Total Billed</span>
                    <span className="summary-value">{money(totals.billed)}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Total Received</span>
                    <span className="summary-value received">{money(totals.received)}</span>
                </div>
                <div className="summary-card">
                    <span className="summary-label">Outstanding</span>
                    <span className="summary-value due">{money(totals.outstanding)}</span>
                </div>
            </div>

            <div className="list-header">
                <h3 className="section-title">
                    Balances <span className="count-pill">{profiles.length}</span>
                </h3>
                <div className="search-box">
                    <Search size={16} color="#94a3b8" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or phone"
                    />
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No matches for “{query}”</h3>
                    <p>Try a different name or phone number.</p>
                </div>
            ) : (
                <div className="balance-grid">
                    {visible.map((profile) => {
                        const settled = profile.balance <= 0;
                        const pct = profile.totalAmount > 0
                            ? Math.min(100, (profile.paid / profile.totalAmount) * 100)
                            : 0;

                        return (
                            <div key={profile.personId} className="balance-card">
                                <div className="balance-card-top">
                                    <div className={`person-avatar ${profile.type === 'Engineer' ? 'engineer' : 'customer'}`}>
                                        {profile.type === 'Engineer' ? <HardHat size={18} /> : <UserRound size={18} />}
                                    </div>
                                    <div className="balance-identity">
                                        <span className="person-name">{profile.name}</span>
                                        <span className="person-sub">
                                            {profile.phone}
                                            {!profile.exists && <em className="removed-tag">person removed</em>}
                                        </span>
                                    </div>
                                    <span className={`status-badge ${settled ? 'settled' : 'due'}`}>
                                        {settled ? 'Settled' : 'Due'}
                                    </span>
                                </div>

                                <div className="material-chips">
                                    {profile.materials.map(m => (
                                        <span key={m.name} className="material-chip">
                                            <Package size={13} />
                                            <strong>{count(m.quantity)}</strong> {plural(m.unit).toLowerCase()} {m.name}
                                        </span>
                                    ))}
                                </div>

                                <div className="figure-grid">
                                    <div className="figure">
                                        <span className="figure-label">Total Amount</span>
                                        <span className="figure-value">{money(profile.totalAmount)}</span>
                                    </div>
                                    <div className="figure">
                                        <span className="figure-label">Paid</span>
                                        <span className="figure-value paid">{money(profile.paid)}</span>
                                    </div>
                                    <div className="figure">
                                        <span className="figure-label">Balance</span>
                                        <span className={`figure-value ${settled ? 'paid' : 'due'}`}>
                                            {money(Math.max(0, profile.balance))}
                                        </span>
                                    </div>
                                </div>

                                <div className="progress-track" title={`${pct.toFixed(0)}% paid`}>
                                    <div className={`progress-fill ${settled ? 'settled' : ''}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="progress-caption">
                                    {profile.orders.length} order{profile.orders.length === 1 ? '' : 's'} · {pct.toFixed(0)}% paid
                                </span>

                                <div className="balance-actions">
                                    <button className="action-btn" onClick={() => setDetailsFor(profile)}>
                                        <Eye size={15} /> View Details
                                    </button>
                                    <button
                                        className="action-btn primary"
                                        onClick={() => openPayModal(profile)}
                                        disabled={settled}
                                        title={settled ? 'Fully paid' : 'Record a payment'}
                                    >
                                        <HandCoins size={15} /> Update Amount
                                    </button>
                                    <button className="action-btn" onClick={() => setHistoryFor(profile)}>
                                        <History size={15} /> Paid Details
                                    </button>
                                    <button
                                        className="action-btn download"
                                        onClick={() => downloadStatement(profile)}
                                        title={`Download ${profile.name}'s full statement as PDF`}
                                    >
                                        <Download size={15} /> Download
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Order breakdown */}
            <Modal
                open={detailsProfile !== null}
                title={detailsProfile ? `${detailsProfile.name} — Order Details` : ''}
                subtitle={detailsProfile ? `${detailsProfile.orders.length} order${detailsProfile.orders.length === 1 ? '' : 's'}` : ''}
                onClose={() => setDetailsFor(null)}
                width={620}
            >
                {detailsProfile && (
                    <>
                        <div className="table-scroll">
                            <table className="modal-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '48px' }}>S.No</th>
                                        <th>Date</th>
                                        <th>Material</th>
                                        <th className="num">Qty</th>
                                        <th className="num">Rate</th>
                                        <th className="num">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailsProfile.orders.map((o, i) => (
                                        <tr key={o.id}>
                                            <td data-label="S.No">{i + 1}</td>
                                            <td data-label="Date">{shortDate(o.date)}</td>
                                            <td data-label="Material">{o.materialName}</td>
                                            <td data-label="Qty" className="num">
                                                {count(o.quantity)} <em className="unit">{plural(o.materialUnit).toLowerCase()}</em>
                                            </td>
                                            <td data-label="Rate" className="num">{money(o.pricePerUnit)}</td>
                                            <td data-label="Total" className="num strong">{money(o.totalAmount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="5">Total</td>
                                        <td className="num strong">{money(detailsProfile.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="modal-summary">
                            <div><span>Paid</span><strong className="paid">{money(detailsProfile.paid)}</strong></div>
                            <div><span>Balance</span><strong className={detailsProfile.balance <= 0 ? 'paid' : 'due'}>
                                {money(Math.max(0, detailsProfile.balance))}
                            </strong></div>
                        </div>
                    </>
                )}
            </Modal>

            {/* Record a payment */}
            <Modal
                open={payProfile !== null}
                title={payProfile ? `Record Payment — ${payProfile.name}` : ''}
                subtitle={payProfile ? `Pending balance ${money(Math.max(0, payProfile.balance))}` : ''}
                onClose={() => setPayFor(null)}
                width={460}
            >
                {payProfile && (
                    <form onSubmit={submitPayment} noValidate>
                        <div className="form-group">
                            <label className="form-label">Date <span className="req">*</span></label>
                            <input
                                type="date"
                                name="date"
                                className={`form-input ${payErrors.date ? 'has-error' : ''}`}
                                value={payment.date}
                                onChange={handlePayChange}
                            />
                            {payErrors.date && <span className="field-error">{payErrors.date}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amount Given <span className="req">*</span></label>
                            <input
                                type="number"
                                name="amount"
                                min="0.01"
                                step="0.01"
                                className={`form-input ${payErrors.amount ? 'has-error' : ''}`}
                                value={payment.amount}
                                onChange={handlePayChange}
                                placeholder="e.g. 2000"
                                autoFocus
                            />
                            {payErrors.amount && <span className="field-error">{payErrors.amount}</span>}
                        </div>

                        <div className="pay-preview">
                            <div><span>Already paid</span><strong>{money(payProfile.paid)}</strong></div>
                            <div><span>This payment</span><strong>{money(Number(payment.amount) || 0)}</strong></div>
                            <div className="pay-preview-total">
                                <span>Balance after</span>
                                <strong>{money(Math.max(0, payProfile.balance - (Number(payment.amount) || 0)))}</strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setPayFor(null)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary">
                                <Check size={16} /> Save Payment
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Payment history */}
            <Modal
                open={historyProfile !== null}
                title={historyProfile ? `${historyProfile.name} — Paid Details` : ''}
                subtitle={historyProfile ? `${historyProfile.payments.length} payment${historyProfile.payments.length === 1 ? '' : 's'} · ${money(historyProfile.paid)} received` : ''}
                onClose={() => setHistoryFor(null)}
                width={560}
            >
                {historyProfile && (historyProfile.payments.length === 0 ? (
                    <div className="modal-empty">
                        <CircleAlert size={22} color="#94a3b8" />
                        <p>No payments recorded yet.</p>
                        <span>Use “Update Amount” to add the first one.</span>
                    </div>
                ) : (
                    <>
                        <div className="table-scroll">
                            <table className="modal-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '48px' }}>S.No</th>
                                        <th>Date</th>
                                        <th className="num">Paid Amount</th>
                                        <th style={{ width: '44px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyProfile.payments.map((p, i) => (
                                        <tr key={p.id}>
                                            <td data-label="S.No">{i + 1}</td>
                                            <td data-label="Date">{shortDate(p.date)}</td>
                                            <td data-label="Paid Amount" className="num strong paid">{money(p.amount)}</td>
                                            <td data-label="">
                                                <button
                                                    type="button"
                                                    className="btn-danger-ghost"
                                                    onClick={() => setPendingDelete(p)}
                                                    title="Remove this payment"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="2">Total Paid</td>
                                        <td className="num strong">{money(historyProfile.paid)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="modal-summary">
                            <div><span>Total Amount</span><strong>{money(historyProfile.totalAmount)}</strong></div>
                            <div><span>Balance</span><strong className={historyProfile.balance <= 0 ? 'paid' : 'due'}>
                                {money(Math.max(0, historyProfile.balance))}
                            </strong></div>
                        </div>
                    </>
                ))}
            </Modal>

            <ConfirmDialog
                open={pendingDelete !== null}
                title="Remove this payment?"
                message={pendingDelete
                    ? `The payment of ${money(pendingDelete.amount)} on ${shortDate(pendingDelete.date)} will be removed and the balance recalculated.`
                    : ''}
                confirmLabel="Remove"
                onConfirm={confirmDeletePayment}
                onCancel={() => setPendingDelete(null)}
            />

            <style>{`
                .section-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: #0f172a;
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
                .summary-row {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                    gap: 1rem;
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
                .summary-value.received { color: #15803d; }
                .summary-value.due { color: #dc2626; }
                .list-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    margin: 2rem 0 1.25rem;
                    flex-wrap: wrap;
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
                .balance-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 1.25rem;
                }
                .balance-card {
                    background: white;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 16px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                    transition: all 0.25s ease;
                }
                .balance-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 18px 25px -12px rgba(0, 0, 0, 0.1);
                }
                .balance-card-top {
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
                .balance-identity {
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
                .removed-tag {
                    font-style: normal;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    background: #fee2e2;
                    color: #b91c1c;
                    padding: 0.1rem 0.45rem;
                    border-radius: 999px;
                }
                .status-badge {
                    flex-shrink: 0;
                    padding: 0.2rem 0.65rem;
                    border-radius: 999px;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                .status-badge.settled { background: #dcfce7; color: #15803d; }
                .status-badge.due { background: #fee2e2; color: #b91c1c; }
                .material-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                    margin-bottom: 1.15rem;
                }
                .material-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    background: #f8fafc;
                    border: 1px solid var(--border-color);
                    border-radius: 999px;
                    padding: 0.3rem 0.7rem;
                    font-size: 0.75rem;
                    color: #475569;
                }
                .material-chip strong { color: #0f172a; }
                /* One row per figure: amounts keep to a single line at any card
                   width, instead of wrapping mid-number inside narrow columns. */
                .figure-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1.15rem;
                }
                .modal-table .unit {
                    font-style: normal;
                    color: #94a3b8;
                    font-size: 0.75rem;
                }
                .figure {
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 1rem;
                    min-width: 0;
                }
                .figure + .figure {
                    padding-top: 0.5rem;
                    border-top: 1px solid #f8fafc;
                }
                .figure-label {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    color: #94a3b8;
                    font-weight: 700;
                    white-space: nowrap;
                }
                .figure-value {
                    font-size: 1.0625rem;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1.3;
                    text-align: right;
                    white-space: nowrap;
                }
                .figure-value.paid { color: #15803d; }
                .figure-value.due { color: #dc2626; }
                .progress-track {
                    height: 6px;
                    background: #f1f5f9;
                    border-radius: 999px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #2563eb, #60a5fa);
                    border-radius: 999px;
                    transition: width 0.35s ease;
                }
                .progress-fill.settled { background: linear-gradient(90deg, #16a34a, #4ade80); }
                .progress-caption {
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin-top: 0.5rem;
                    font-weight: 600;
                }
                .balance-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    margin-top: 1.25rem;
                    padding-top: 1.15rem;
                    border-top: 1px solid #f1f5f9;
                }
                .action-btn.download {
                    background: #f0fdf4;
                    border-color: #bbf7d0;
                    color: #15803d;
                }
                .action-btn.download:hover:not(:disabled) {
                    background: #dcfce7;
                    border-color: #86efac;
                    color: #166534;
                }
                .action-btn {
                    min-width: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.35rem;
                    height: 36px;
                    padding: 0 0.6rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: white;
                    color: #475569;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                .action-btn:hover:not(:disabled) {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }
                .action-btn.primary {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }
                .action-btn.primary:hover:not(:disabled) {
                    background: var(--primary-hover);
                    border-color: var(--primary-hover);
                    color: white;
                }
                .action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

                /* Modal internals */
                .table-scroll { overflow-x: auto; }
                .modal-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                .modal-table th {
                    text-align: left;
                    padding: 0.5rem 0.6rem;
                    border-bottom: 2px solid var(--border-color);
                    color: #94a3b8;
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    white-space: nowrap;
                }
                .modal-table td {
                    padding: 0.7rem 0.6rem;
                    border-bottom: 1px solid #f1f5f9;
                    color: #475569;
                }
                .modal-table .num { text-align: right; white-space: nowrap; }
                .modal-table .strong { font-weight: 700; color: #0f172a; }
                .modal-table .paid { color: #15803d; }
                .modal-table tfoot td {
                    border-bottom: none;
                    border-top: 2px solid var(--border-color);
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.03em;
                }
                .modal-summary {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.35rem;
                    padding-top: 1.15rem;
                    border-top: 1px dashed var(--border-color);
                }
                .modal-summary > div {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                    min-width: 0;
                }
                .modal-summary span {
                    font-size: 0.6875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    color: #94a3b8;
                    font-weight: 700;
                }
                .modal-summary strong {
                    font-size: 1.125rem;
                    color: #0f172a;
                    overflow-wrap: anywhere;
                }
                .modal-summary .paid { color: #15803d; }
                .modal-summary .due { color: #dc2626; }
                .modal-empty {
                    text-align: center;
                    padding: 2rem 1rem;
                }
                .modal-empty p {
                    margin-top: 0.6rem;
                    font-weight: 600;
                    color: #475569;
                }
                .modal-empty span {
                    font-size: 0.8125rem;
                    color: #94a3b8;
                }
                .pay-preview {
                    background: #f8fafc;
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    padding: 0.9rem 1rem;
                    margin-bottom: 0.5rem;
                }
                .pay-preview > div {
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    font-size: 0.875rem;
                    color: #64748b;
                    padding: 0.25rem 0;
                }
                .pay-preview strong { color: #0f172a; }
                .pay-preview-total {
                    border-top: 1px dashed var(--border-color);
                    margin-top: 0.35rem;
                    padding-top: 0.6rem !important;
                    font-weight: 700;
                }
                .pay-preview-total strong { color: #dc2626; }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                }
                .req { color: #ef4444; }
                .form-input.has-error { border-color: #ef4444; }
                .form-input.has-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }
                .field-error {
                    display: block;
                    color: #ef4444;
                    font-size: 0.75rem;
                    margin-top: 0.375rem;
                }
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
                    color: #cbd5e1;
                    border: none;
                    padding: 0.35rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    transition: all 0.2s ease;
                }
                .btn-danger-ghost:hover { background: #fee2e2; color: #ef4444; }

                @media (max-width: 768px) {
                    .search-box { min-width: 100%; }
                    .balance-grid { grid-template-columns: 1fr; }
                    .modal-actions { flex-direction: column-reverse; }
                    .modal-actions button { width: 100%; }
                    .balance-actions { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default Balance;
