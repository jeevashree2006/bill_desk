import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { Plus, LayoutDashboard, FileText, LogOut } from 'lucide-react';
import { ref, set, get, child, remove } from 'firebase/database';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import './App.css';

const DEV_BYPASS_AUTH = import.meta.env.DEV;
const DEV_USER = { displayName: 'Dev User', email: 'dev@local', uid: 'dev-local', photoURL: null };

function App() {
  const [user, setUser] = useState(DEV_BYPASS_AUTH ? DEV_USER : null);
  const [authLoading, setAuthLoading] = useState(!DEV_BYPASS_AUTH);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

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

  // Fetch invoices when user is authenticated
  useEffect(() => {
    if (!user) return;

    if (DEV_BYPASS_AUTH) {
      const savedInvoices = localStorage.getItem('invoices');
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      return;
    }

    const fetchInvoices = async () => {
      try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `invoices`));
        if (snapshot.exists()) {
          const invoicesData = Object.values(snapshot.val());
          invoicesData.sort((a, b) => new Date(b.date) - new Date(a.date));
          setInvoices(invoicesData);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error("Error fetching invoices: ", error);
        // Fallback to local storage if fail just in case
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) {
          setInvoices(JSON.parse(savedInvoices));
        }
      }
    };
    fetchInvoices();
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setInvoices([]);
      setCurrentInvoice(null);
      setActiveTab('dashboard');
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
          <h2>{activeTab === 'dashboard' ? 'Dashboard' : (activeTab === 'create' ? 'Create Invoice' : (activeTab === 'edit' ? 'Edit Invoice' : 'Invoice Preview'))}</h2>
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
