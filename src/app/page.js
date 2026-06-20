"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, HelpCircle, ChevronDown, Plus,
  Home, Receipt, ShoppingCart, BarChart2, Settings, LogOut, Users
} from 'lucide-react';

import Login from '../components/Login';
import CompanyProfileModal from '../components/CompanyProfileModal';
import Dashboard from '../components/Dashboard';
import Invoices from '../components/Invoices';
import Clients from '../components/Clients';
import CreateInvoice from '../components/CreateInvoice';
import InvoiceDetail from '../components/InvoiceDetail';
import { ApiClient } from '../lib/apiClient';

// ── Sub-components ───────────────────────────────────────────────
const NavItem = ({ icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
      active
        ? 'bg-blue-100 text-black font-semibold'
        : 'text-slate-500 hover:bg-slate-100 hover:text-black'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ── Main Page ────────────────────────────────────────────────────
export default function DesktopPage() {
  const [isLoggedIn, setIsLoggedIn]           = useState(false);
  const [activeTab, setActiveTab]             = useState('invoices');
  const [activeArgs, setActiveArgs]           = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName]         = useState('GST Ledger Pro');
  const [companyGstin, setCompanyGstin]       = useState('27AAAAA0000A1Z5');
  const [dbStatus, setDbStatus]               = useState('checking'); // 'connected'|'offline'|'checking'

  // ── Auth ────────────────────────────────────────────────────────
  useEffect(() => {
    const logged = localStorage.getItem('is_logged_in') === 'true';
    setIsLoggedIn(logged);
    loadProfile();
    checkDb();
  }, []);

  useEffect(() => {
    const id = setInterval(checkDb, 30000);
    return () => clearInterval(id);
  }, []);

  const loadProfile = async () => {
    const p = await ApiClient.getCompanyProfile();
    if (p?.name)  setCompanyName(p.name);
    if (p?.gstin) setCompanyGstin(p.gstin);
  };

  const checkDb = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
      setDbStatus(res.ok ? 'connected' : 'offline');
    } catch { setDbStatus('offline'); }
  }, []);

  const navigateTo = (tab, args = null) => {
    setActiveTab(tab);
    setActiveArgs(args);
    setSearchQuery('');
  };

  const handleLogout = () => {
    localStorage.removeItem('is_logged_in');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLogin={() => setIsLoggedIn(true)} />;

  // ── Routing ─────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':      return <Dashboard navigateTo={navigateTo} searchQuery={searchQuery} />;
      case 'invoices':       return <Invoices  navigateTo={navigateTo} searchQuery={searchQuery} />;
      case 'clients':        return <Clients   navigateTo={navigateTo} searchQuery={searchQuery} />;
      case 'create-invoice': return <CreateInvoice navigateTo={navigateTo} editInvoiceId={activeArgs} />;
      case 'invoice-detail': return <InvoiceDetail invoiceId={activeArgs} navigateTo={navigateTo} />;
      default:               return <Invoices  navigateTo={navigateTo} searchQuery={searchQuery} />;
    }
  };

  const tabTitle = {
    dashboard: 'Home', invoices: 'All Invoices', clients: 'Clients Directory',
    'create-invoice': 'Create Invoice', 'invoice-detail': 'Invoice Detail',
  }[activeTab] || 'All Invoices';

  const firstLetter = companyName?.[0]?.toUpperCase() || 'G';

  // ── DB Status badge styles ──────────────────────────────────────
  const dbBadge = {
    connected: { bg:'#f0fdf4', border:'#bbf7d0', color:'#16a34a', dot:'#4ade80', label:'NeDB Connected' },
    offline:   { bg:'#fef2f2', border:'#fecaca', color:'#dc2626', dot:'#f87171', label:'DB Offline' },
    checking:  { bg:'#fffbeb', border:'#fde68a', color:'#d97706', dot:'#fbbf24', label:'Checking...' },
  }[dbStatus];

  // ── Layout ──────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#faf9f6] font-sans text-sm text-black antialiased overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-slate-200 bg-[#faf9f6] flex flex-col fixed h-full z-20 no-print">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-sm shrink-0">
            {firstLetter}
          </div>
          <div>
            <h1 className="font-black text-base leading-tight uppercase tracking-tight">{companyName}</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Enterprise Tax</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          <NavItem icon={<Home size={18}/>}        label="Home"      active={activeTab==='dashboard'}  onClick={() => navigateTo('dashboard')} />
          <NavItem icon={<Receipt size={18}/>}      label="Sales"     active={activeTab==='invoices' || activeTab==='invoice-detail' || activeTab==='create-invoice'} onClick={() => navigateTo('invoices')} />
          <NavItem icon={<Users size={18}/>}        label="Clients"   active={activeTab==='clients'}    onClick={() => navigateTo('clients')} />
          <NavItem icon={<ShoppingCart size={18}/>} label="Purchases" onClick={() => {}} />
          <NavItem icon={<BarChart2 size={18}/>}    label="Reports"   onClick={() => {}} />
          <NavItem icon={<Settings size={18}/>}     label="Settings"  onClick={() => setIsCompanyModalOpen(true)} />
          <NavItem icon={<LogOut size={18}/>}       label="Logout"    onClick={handleLogout} />
        </nav>

        {/* New Invoice CTA */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => navigateTo('create-invoice')}
            className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-sm text-sm"
          >
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-10 no-print shrink-0">
          {/* Left: title */}
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <span>{tabTitle}</span>
            <ChevronDown size={18} className="text-slate-400" />
          </div>

          {/* Right: search + actions + DB badge */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-xs w-52">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search invoices..."
                className="bg-transparent outline-none w-full text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* DB Status Badge */}
            <div
              title={dbBadge.label}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-default select-none transition-all duration-500"
              style={{ background: dbBadge.bg, borderColor: dbBadge.border, color: dbBadge.color }}
            >
              <span
                className={`w-2 h-2 rounded-full ${dbStatus !== 'connected' ? 'animate-pulse' : ''}`}
                style={{ background: dbBadge.dot }}
              />
              {dbBadge.label}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3 text-slate-500 border-l border-slate-200 pl-4">
              <Bell size={20} className="cursor-pointer hover:text-black transition-colors" />
              <HelpCircle size={20} className="cursor-pointer hover:text-black transition-colors" />
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              {firstLetter}
            </div>

            {/* New split button */}
            <div className="flex items-center bg-blue-600 rounded-md overflow-hidden shadow-sm hover:brightness-105 transition-all">
              <button
                onClick={() => navigateTo('create-invoice')}
                className="text-white px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 border-r border-blue-500"
              >
                <Plus size={16} /> New
              </button>
              <button
                onClick={() => navigateTo('create-invoice')}
                className="text-white px-2 py-1.5 hover:bg-blue-700 transition-all"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-8">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="shrink-0 px-8 py-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 bg-white no-print">
          <span>© 2026 GST Ledger Pro. All rights reserved.</span>
          <div className="flex gap-6">
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Compliance Policy</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">API Documentation</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>

      {/* Company Settings Modal */}
      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={loadProfile}
      />
    </div>
  );
}
