import React, { useState, useEffect, useMemo } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import People from './components/People';
import Orders from './components/Orders';
import Materials from './components/Materials';
import Balance from './components/Balance';
import Login from './components/Login';
import { Plus, LayoutDashboard, FileText, LogOut, Users, Package, Wallet } from 'lucide-react';
import { ref, set, get, child, remove } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import './App.css';

// Opt-in only: set localStorage.devBypassAuth = 'true' in the console to skip Google sign-in.
const DEV_BYPASS_AUTH = import.meta.env.DEV && localStorage.getItem('devBypassAuth') === 'true';
const DEV_USER = { displayName: 'Dev User', email: 'dev@local', uid: 'dev-local', photoURL: null };

const TAB_TITLES = {
  dashboard: 'Dashboard',
  create: 'Create Invoice',
  edit: 'Edit Invoice',
  people: 'Engineers & Customers',
  materials: 'Materials',
  orders: 'Orders',
  balance: 'Balance',
  view: 'Invoice Preview',
  view_download: 'Invoice Preview'
};

// Fixed list that always ships with the app — not editable or deletable.
// Anything else the user needs is added on top via the Materials tab.
const DEFAULT_MATERIALS = [
  { id: 'mat-bricks', name: 'Bricks', unit: 'Piece', defaultRate: '', builtIn: true },
  { id: 'mat-cement', name: 'Cement', unit: 'Bag', defaultRate: '', builtIn: true },
  { id: 'mat-p-sand', name: 'P-Sand', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-m-sand', name: 'M-Sand', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-river-sand', name: 'River Sand', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-jally-12', name: 'Jally 1/2"', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-jally-34', name: 'Jally 3/4"', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-jally-1', name: 'Jally 1"', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-jally-112', name: 'Jally 1 1/2"', unit: 'Unit', defaultRate: '', builtIn: true },
  { id: 'mat-chips-stone', name: 'Chips Stone', unit: 'Unit', defaultRate: '', builtIn: true }
];

const BUILT_IN_IDS = new Set(DEFAULT_MATERIALS.map(m => m.id));

// Orders saved before materials existed carry only totalBricks / pricePerBrick.
const normalizeOrder = (order) => {
  if (order.quantity !== undefined) return order;
  return {
    ...order,
    materialId: 'mat-bricks',
    materialName: 'Bricks',
    materialUnit: 'Piece',
    quantity: Number(order.totalBricks || 0),
    pricePerUnit: Number(order.pricePerBrick || 0)
  };
};

function App() {
  const [user, setUser] = useState(DEV_BYPASS_AUTH ? DEV_USER : null);
  const [authLoading, setAuthLoading] = useState(!DEV_BYPASS_AUTH);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [people, setPeople] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customMaterials, setCustomMaterials] = useState([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch data when user is authenticated
  useEffect(() => {
    if (!user) return;

    const readLocal = (storageKey) => {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      try {
        return JSON.parse(saved);
      } catch {
        console.warn(`Could not parse "${storageKey}" from local storage.`);
        return null;
      }
    };

    const loadLocal = (storageKey, setter, transform) => {
      const records = readLocal(storageKey);
      if (records) setter(transform ? records.map(transform) : records);
    };

    // Built-ins live in code, so only user-added materials are stored. Older
    // saves kept copies of the built-ins — drop those so they can't duplicate.
    const dropBuiltIns = (records) => records.filter(m => !BUILT_IN_IDS.has(m.id));
    const applyCustomMaterials = (records) => setCustomMaterials(dropBuiltIns(records || []));

    if (DEV_BYPASS_AUTH) {
      loadLocal('invoices', setInvoices);
      loadLocal('people', setPeople);
      loadLocal('brickOrders', setOrders, normalizeOrder);
      loadLocal('payments', setPayments);
      applyCustomMaterials(readLocal('materials'));
      return;
    }

    const fetchCollection = async (path, storageKey, setter, sortBy, transform) => {
      try {
        const snapshot = await get(child(ref(db), path));
        if (snapshot.exists()) {
          let records = Object.values(snapshot.val());
          if (transform) records = records.map(transform);
          if (sortBy) records.sort(sortBy);
          setter(records);
          // Keep local storage warm so the app still works offline
          localStorage.setItem(storageKey, JSON.stringify(records));
        } else {
          setter([]);
        }
      } catch (error) {
        console.error(`Error fetching ${path}: `, error);
        // Fallback to local storage if fail just in case
        loadLocal(storageKey, setter, transform);
      }
    };

    const fetchMaterials = async () => {
      try {
        const snapshot = await get(child(ref(db), 'materials'));
        const records = snapshot.exists() ? dropBuiltIns(Object.values(snapshot.val())) : [];
        applyCustomMaterials(records);
        localStorage.setItem('materials', JSON.stringify(records));
      } catch (error) {
        console.error('Error fetching materials: ', error);
        applyCustomMaterials(readLocal('materials'));
      }
    };

    const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);
    const byCreatedDesc = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

    fetchCollection('invoices', 'invoices', setInvoices, byDateDesc);
    fetchCollection('people', 'people', setPeople, byCreatedDesc);
    fetchCollection('brickOrders', 'brickOrders', setOrders, byDateDesc, normalizeOrder);
    fetchCollection('payments', 'payments', setPayments, byDateDesc);
    fetchMaterials();
  }, [user]);

  const saveInvoice = async (invoiceData) => {
    // Always update local state and navigate, regardless of Firebase status
    let newInvoices;
    if (invoices.some(inv => inv.id === invoiceData.id)) {
      newInvoices = invoices.map(inv => inv.id === invoiceData.id ? invoiceData : inv);
    } else {
      newInvoices = [invoiceData, ...invoices];
    }

    setInvoices(newInvoices);
    localStorage.setItem('invoices', JSON.stringify(newInvoices));
    setCurrentInvoice(invoiceData);
    setActiveTab('view_download');
    setIsSidebarOpen(false);

    if (DEV_BYPASS_AUTH) return;

    // Best-effort Firebase save
    try {
      await set(ref(db, 'invoices/' + invoiceData.id), invoiceData);
    } catch (e) {
      console.warn("Firebase save failed (will use local storage): ", e);
    }
  };

  const deleteInvoice = async (id) => {
    // Always update local state
    const newInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(newInvoices);
    localStorage.setItem('invoices', JSON.stringify(newInvoices));

    if (DEV_BYPASS_AUTH) return;

    // Best-effort Firebase delete
    try {
      await remove(ref(db, 'invoices/' + id));
    } catch (e) {
      console.warn("Firebase delete failed (removed locally): ", e);
    }
  };

  // Shared local-first persistence for the people / brick-order collections:
  // state and local storage update immediately, Firebase is best-effort.
  const saveRecord = async (record, list, setList, storageKey, dbPath) => {
    const next = list.some(r => r.id === record.id)
      ? list.map(r => (r.id === record.id ? record : r))
      : [record, ...list];

    setList(next);
    localStorage.setItem(storageKey, JSON.stringify(next));

    if (DEV_BYPASS_AUTH) return;

    try {
      await set(ref(db, `${dbPath}/${record.id}`), record);
    } catch (e) {
      console.warn(`Firebase save failed for ${dbPath} (kept locally): `, e);
    }
  };

  const deleteRecord = async (id, list, setList, storageKey, dbPath) => {
    const next = list.filter(r => r.id !== id);

    setList(next);
    localStorage.setItem(storageKey, JSON.stringify(next));

    if (DEV_BYPASS_AUTH) return;

    try {
      await remove(ref(db, `${dbPath}/${id}`));
    } catch (e) {
      console.warn(`Firebase delete failed for ${dbPath} (removed locally): `, e);
    }
  };

  const savePerson = (person) => saveRecord(person, people, setPeople, 'people', 'people');
  const deletePerson = (id) => deleteRecord(id, people, setPeople, 'people', 'people');
  const saveOrder = (order) => saveRecord(order, orders, setOrders, 'brickOrders', 'brickOrders');
  const deleteOrder = (id) => deleteRecord(id, orders, setOrders, 'brickOrders', 'brickOrders');
  const savePayment = (payment) => saveRecord(payment, payments, setPayments, 'payments', 'payments');
  const deletePayment = (id) => deleteRecord(id, payments, setPayments, 'payments', 'payments');
  // Built-ins are fixed and always shown first; only custom materials persist.
  const materials = useMemo(() => [...DEFAULT_MATERIALS, ...customMaterials], [customMaterials]);

  const saveMaterial = (material) => {
    if (BUILT_IN_IDS.has(material.id)) return;
    return saveRecord(material, customMaterials, setCustomMaterials, 'materials', 'materials');
  };

  const deleteMaterial = (id) => {
    if (BUILT_IN_IDS.has(id)) return;
    return deleteRecord(id, customMaterials, setCustomMaterials, 'materials', 'materials');
  };

  // How many brick orders reference each person, for the People list + delete warning
  const orderCounts = useMemo(() => {
    return orders.reduce((counts, order) => {
      if (order.personId) counts[order.personId] = (counts[order.personId] || 0) + 1;
      return counts;
    }, {});
  }, [orders]);

  // How many orders reference each material, for the Materials list + delete warning
  const materialOrderCounts = useMemo(() => {
    return orders.reduce((counts, order) => {
      if (order.materialId) counts[order.materialId] = (counts[order.materialId] || 0) + 1;
      return counts;
    }, {});
  }, [orders]);

  const handleCreateNew = () => {
    setCurrentInvoice(null);
    setActiveTab('create');
    setIsSidebarOpen(false);
  };

  const handleViewInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setActiveTab('view');
    setIsSidebarOpen(false);
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setActiveTab('edit');
    setIsSidebarOpen(false);
  };

  const clearSessionData = () => {
    setInvoices([]);
    setPeople([]);
    setOrders([]);
    setPayments([]);
    setCustomMaterials([]);
    setCurrentInvoice(null);
    setActiveTab('dashboard');
  };

  const handleSignOut = async () => {
    if (DEV_BYPASS_AUTH) {
      localStorage.removeItem('devBypassAuth');
      setUser(null);
      clearSessionData();
      return;
    }

    try {
      await signOut(auth);
      clearSessionData();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>
        <style>{`
          .auth-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0a0a1a;
          }
          .auth-loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: authSpin 0.7s linear infinite;
          }
          @keyframes authSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <div className={`overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <FileText size={32} color="#2563eb" />
          <h1>BillDesk</h1>
        </div>
        <ul className="sidebar-menu">
          <li
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </li>
          <li
            className={activeTab === 'create' ? 'active' : ''}
            onClick={handleCreateNew}
          >
            <Plus size={20} />
            <span>New Invoice</span>
          </li>
          <li
            className={activeTab === 'people' ? 'active' : ''}
            onClick={() => { setActiveTab('people'); setIsSidebarOpen(false); }}
          >
            <Users size={20} />
            <span>People</span>
          </li>
          <li
            className={activeTab === 'materials' ? 'active' : ''}
            onClick={() => { setActiveTab('materials'); setIsSidebarOpen(false); }}
          >
            <Package size={20} />
            <span>Materials</span>
          </li>
          <li
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          >
            <FileText size={20} />
            <span>Orders</span>
          </li>
          <li
            className={activeTab === 'balance' ? 'active' : ''}
            onClick={() => { setActiveTab('balance'); setIsSidebarOpen(false); }}
          >
            <Wallet size={20} />
            <span>Balance</span>
          </li>
        </ul>

        {/* User info and sign out at the bottom of sidebar */}
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="sidebar-user-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="sidebar-user-avatar-placeholder">
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user.displayName || 'User'}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
          <button className="sidebar-signout-btn" onClick={handleSignOut} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <LayoutDashboard size={24} />
        </div>
        <header className="top-bar">
          <h2>{TAB_TITLES[activeTab] || 'Invoice Preview'}</h2>
          {activeTab === 'dashboard' && (
            <button className="btn-primary" onClick={handleCreateNew}>
              <Plus size={18} /> Create New
            </button>
          )}
        </header>

        <section className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              invoices={invoices}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onDelete={deleteInvoice}
            />
          )}
          {activeTab === 'people' && (
            <People
              people={people}
              onSave={savePerson}
              onDelete={deletePerson}
              orderCounts={orderCounts}
            />
          )}
          {activeTab === 'materials' && (
            <Materials
              materials={materials}
              onSave={saveMaterial}
              onDelete={deleteMaterial}
              orderCounts={materialOrderCounts}
            />
          )}
          {activeTab === 'orders' && (
            <Orders
              orders={orders}
              people={people}
              materials={materials}
              onSave={saveOrder}
              onDelete={deleteOrder}
              onGoToPeople={() => setActiveTab('people')}
            />
          )}
          {activeTab === 'balance' && (
            <Balance
              orders={orders}
              payments={payments}
              people={people}
              onSavePayment={savePayment}
              onDeletePayment={deletePayment}
            />
          )}
          {(activeTab === 'create' || activeTab === 'edit') && (
            <InvoiceForm
              key={activeTab === 'edit' ? `edit-${currentInvoice?.id}` : 'create'}
              initialInvoice={activeTab === 'edit' ? currentInvoice : null}
              onSave={saveInvoice}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}
          {(activeTab === 'view' || activeTab === 'view_download') && (
            <div className="view-container">
              <InvoicePreview
                invoice={currentInvoice}
                autoDownload={activeTab === 'view_download'}
                onBack={() => setActiveTab('dashboard')}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
