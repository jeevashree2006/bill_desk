import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Dashboard from './components/Dashboard';
import { Plus, LayoutDashboard, FileText } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      setInvoices(JSON.parse(savedInvoices));
    }
  }, []);

  const saveInvoice = (invoiceData) => {
    const newInvoices = [invoiceData, ...invoices];
    setInvoices(newInvoices);
    localStorage.setItem('invoices', JSON.stringify(newInvoices));
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const deleteInvoice = (id) => {
    const newInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(newInvoices);
    localStorage.setItem('invoices', JSON.stringify(newInvoices));
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
          {activeTab === 'view' && (
            <div className="view-container">
              <div className="view-actions">
                <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>Back</button>
              </div>
              <InvoicePreview invoice={currentInvoice} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
