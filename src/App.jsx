import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import { Plus, LayoutDashboard, FileText } from 'lucide-react';
import { ref, set, get, child, remove } from 'firebase/database';
import { db } from './firebase';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
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
  }, []);

  const saveInvoice = async (invoiceData) => {
    try {
      await set(ref(db, 'invoices/' + invoiceData.id), invoiceData);
      const newInvoices = [invoiceData, ...invoices];
      setInvoices(newInvoices);
      localStorage.setItem('invoices', JSON.stringify(newInvoices));
      setCurrentInvoice(invoiceData);
      setActiveTab('view_download');
      setIsSidebarOpen(false);
    } catch (e) {
      console.error("Error saving invoice: ", e);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      await remove(ref(db, 'invoices/' + id));
      const newInvoices = invoices.filter(inv => inv.id !== id);
      setInvoices(newInvoices);
      localStorage.setItem('invoices', JSON.stringify(newInvoices));
    } catch (e) {
      console.error("Error deleting invoice: ", e);
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
      </nav>

      <main className="main-content">
        <div className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <LayoutDashboard size={24} />
        </div>
        <header className="top-bar">
          <h2>{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'create' ? 'Create Invoice' : 'Invoice Preview'}</h2>
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
              onDelete={deleteInvoice}
            />
          )}
          {activeTab === 'create' && (
            <InvoiceForm onSave={saveInvoice} onCancel={() => setActiveTab('dashboard')} />
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
