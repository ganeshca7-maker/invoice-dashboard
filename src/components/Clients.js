"use client";
import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Search, Building2, Phone, Mail, MapPin,
  Landmark, X, ChevronDown, CheckCircle, Star, Trash2, Pencil, CreditCard,
  Upload, Download, XCircle
} from 'lucide-react';
import { ApiClient } from '../lib/apiClient';
import CustomerModal from './CustomerModal';

// ── Indian States list ─────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi (NCT)','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'
];

// ── Searchable Dropdown ────────────────────────────────────────────
function SearchableDropdown({ value, onChange, options = [], placeholder, onAddCustom }) {
  const [query, setQuery]   = useState(value || '');
  const [open, setOpen]     = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options.slice(0, 8);

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white"
      />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {filtered.length > 0
            ? filtered.map(opt => (
                <div key={opt} onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false); }}
                  className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">{opt}</div>
              ))
            : <div className="px-3 py-2 text-xs text-slate-400 italic">No results</div>
          }
          {onAddCustom && query.trim() && !options.some(o => o.toLowerCase() === query.toLowerCase()) && (
            <div onMouseDown={() => { onAddCustom(query.trim()); setQuery(query.trim()); onChange(query.trim()); setOpen(false); }}
              className="px-3 py-2 text-xs font-bold text-blue-600 border-t border-slate-100 cursor-pointer hover:bg-blue-50">
              + Add "{query.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Form Field ─────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white placeholder:text-slate-300" />
);

// ── Empty State ────────────────────────────────────────────────────
const EmptyState = ({ onAdd }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Users size={36} className="text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 mb-1">No clients yet</h3>
    <p className="text-sm text-slate-400 mb-6 max-w-xs">Add your first customer to start creating invoices and tracking payments.</p>
    <button onClick={onAdd}
      className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
      <Plus size={16}/> Add First Customer
    </button>
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────
const Avatar = ({ initials, size = 'md' }) => {
  const cls = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-10 h-10 text-base';
  return (
    <div className={`${cls} rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0`}>
      {initials || '?'}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────
const BLANK_FORM = {
  name:'', email:'', phone:'', gstin:'', currency:'INR (₹)',
  address1:'', address2:'', address3:'', city:'', pincode:'', state:'', country:'India'
};

const BLANK_BANK = { bankName:'', accountHolderName:'', accountNumber:'', ifscCode:'', branchName:'', accountType:'Current' };

export default function Clients({ searchQuery }) {
  const [clients, setClients]               = useState([]);
  const [countries, setCountries]           = useState([]);
  const [localSearch, setLocalSearch]       = useState('');

  // ── Add/Edit Client modal ──────────────────────────────────────
  const [clientModal, setClientModal]       = useState(false);
  const [clientForm, setClientForm]         = useState(BLANK_FORM);
  const [saving, setSaving]                 = useState(false);

  // ── Bank accounts modal ────────────────────────────────────────
  const [bankModal, setBankModal]           = useState(false);
  const [selClient, setSelClient]           = useState(null);
  const [bankForm, setBankForm]             = useState(BLANK_BANK);
  const [bankFormOpen, setBankFormOpen]     = useState(false);
  const [editBankIdx, setEditBankIdx]       = useState(-1);

  // ── Import modal ───────────────────────────────────────────────
  const [importOpen, setImportOpen]           = useState(false);
  const [importParsed, setImportParsed]       = useState([]);
  const [importError, setImportError]         = useState('');
  const [importLoading, setImportLoading]     = useState(false);
  const [isDragOver, setIsDragOver]           = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadClients(); loadCountries(); }, []);

  const downloadTemplate = () => {
    const csvContent = "name,email,phone,gstin,currency,address1,city,state,pincode,country,creditPeriod\nAcme Corp,billing@acme.com,9876543210,27AAAAA0000A1Z5,INR (₹),123 Main St,Mumbai,Maharashtra,400001,India,15";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeImport = () => { setImportOpen(false); setImportParsed([]); setImportError(''); setIsDragOver(false); };

  const validateClient = (c) => c.name && c.city && c.state && c.pincode && c.country && c.address1;

  const handleFile = (file) => {
    if (!file) return;
    setImportError(''); setImportParsed([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        let data = [];
        if (file.name.endsWith('.json')) data = JSON.parse(text);
        else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length < 2) throw new Error("CSV must have header and at least one row");
          const headers = lines[0].split(',').map(h => h.trim());
          data = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim());
            const obj = { id: `c${Date.now()}${Math.random().toString(36).substr(2,5)}`, initials: '', status: 'Active', lastInvoice: 'Never', bankAccounts: [] };
            headers.forEach((h, i) => obj[h] = vals[i]);
            obj.initials = obj.name ? (obj.name.split(' ').length > 1 ? obj.name.split(' ')[0][0] + obj.name.split(' ')[obj.name.split(' ').length - 1][0] : obj.name.slice(0, 2)).toUpperCase() : '??';
            return obj;
          });
        } else throw new Error("Unsupported file format");
        if (!Array.isArray(data)) throw new Error("File must contain an array of objects");
        setImportParsed(data);
      } catch (err) { setImportError(err.message || 'Failed to parse file'); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const executeImport = async () => {
    const valid = importParsed.filter(validateClient);
    if (!valid.length) return;
    setImportLoading(true);
    const res = await fetch('/api/clients/batch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(valid) });
    setImportLoading(false);
    if (res.ok) { const d = await res.json(); alert(`Import complete: ${d.saved} saved, ${d.failed} failed`); loadClients(); closeImport(); }
    else alert('Batch import failed');
  };

  const loadClients   = async () => setClients(await ApiClient.getClients() || []);
  const loadCountries = async () => setCountries(await ApiClient.getCountries() || []);

  // ── Bank account actions ───────────────────────────────────────
  const openBankModal = (client) => { setSelClient(client); setBankModal(true); setBankFormOpen(false); setEditBankIdx(-1); setBankForm(BLANK_BANK); };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    if (!selClient) return;
    const accounts = [...(selClient.bankAccounts || [])];
    if (accounts.some((a, i) => i !== editBankIdx && a.accountNumber === bankForm.accountNumber.trim())) {
      alert('Account number already exists.'); return;
    }
    const isDefault = editBankIdx >= 0 ? accounts[editBankIdx].isDefault : accounts.length === 0;
    const entry     = { ...bankForm, bankName: bankForm.bankName.trim(), accountNumber: bankForm.accountNumber.trim(), ifscCode: bankForm.ifscCode.trim().toUpperCase(), isDefault };
    if (editBankIdx >= 0) accounts[editBankIdx] = entry; else accounts.push(entry);
    const updated = { ...selClient, bankAccounts: accounts };
    const res     = await ApiClient.updateClient(updated);
    if (res.success) { setSelClient(updated); loadClients(); setBankFormOpen(false); setBankForm(BLANK_BANK); setEditBankIdx(-1); }
    else alert(res.error);
  };

  const setDefault = async (idx) => {
    const accounts = (selClient.bankAccounts || []).map((a, i) => ({ ...a, isDefault: i === idx }));
    const updated  = { ...selClient, bankAccounts: accounts };
    const res      = await ApiClient.updateClient(updated);
    if (res.success) { setSelClient(updated); loadClients(); }
  };

  const deleteBank = async (idx) => {
    if (!confirm('Delete this bank account?')) return;
    const accounts = [...(selClient.bankAccounts || [])];
    const removed  = accounts.splice(idx, 1)[0];
    if (removed.isDefault && accounts.length > 0) accounts[0].isDefault = true;
    const updated = { ...selClient, bankAccounts: accounts };
    const res     = await ApiClient.updateClient(updated);
    if (res.success) { setSelClient(updated); loadClients(); }
  };

  // ── Filtering ──────────────────────────────────────────────────
  const search   = localSearch || searchQuery || '';
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.tradeName || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const setBankField = (key) => (e) => setBankForm(p => ({ ...p, [key]: e.target.value }));

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Client Directory</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage customers, billing profiles and bank accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs">
            <Search size={14} className="text-slate-400 shrink-0"/>
            <input type="text" value={localSearch} onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search clients..." className="outline-none bg-transparent w-40 text-slate-800 placeholder:text-slate-400"/>
          </div>
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Upload size={16}/> Import
          </button>
          {/* Add Customer */}
          <button onClick={() => { setClientForm(BLANK_FORM); setClientModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm">
            <Plus size={16}/> Add Customer
          </button>
        </div>
      </div>

      {/* ── Client Cards Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length > 0 ? filtered.map(c => {
          const addr = [c.address1, c.address2, c.address3, c.city, c.state, c.pincode, c.country].filter(Boolean).join(', ');
          const banks = c.bankAccounts?.length || 0;
          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 hover:shadow-sm transition-all flex flex-col gap-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar initials={c.initials}/>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{c.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 inline-block ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 shrink-0">{c.currency || 'INR (₹)'}</span>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5">
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={12} className="shrink-0 text-slate-300"/>
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} className="shrink-0 text-slate-300"/>
                    <span>{c.phone}</span>
                  </div>
                )}
                {addr && (
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <MapPin size={12} className="shrink-0 text-slate-300 mt-0.5"/>
                    <span className="line-clamp-2 leading-relaxed">{addr}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Last invoice: <strong className="text-slate-600">{c.lastInvoice || 'Never'}</strong></span>
                <button onClick={() => openBankModal(c)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-black transition-colors">
                  <Landmark size={14}/> Banks ({banks})
                </button>
              </div>
            </div>
          );
        }) : (
          filtered.length === 0 && clients.length === 0
            ? <EmptyState onAdd={() => { setClientForm(BLANK_FORM); setClientModal(true); }}/>
            : <div className="col-span-full py-16 text-center text-slate-400">No clients matching "{search}"</div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD CUSTOMER MODAL
      ══════════════════════════════════════════════════════════ */}
      <CustomerModal 
        isOpen={clientModal} 
        onClose={() => setClientModal(false)} 
        onSave={() => { loadClients(); setClientForm(BLANK_FORM); }} 
        initialData={clientForm.name ? clientForm : null}
      />

      {/* ══════════════════════════════════════════════════════════
          BANK ACCOUNTS MODAL
      ══════════════════════════════════════════════════════════ */}
      {bankModal && selClient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setBankModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

            {/* Header */}
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Avatar initials={selClient.initials}/>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bank Accounts</h3>
                  <p className="text-xs text-slate-400">{selClient.name}</p>
                </div>
              </div>
              <button onClick={() => setBankModal(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* Add Bank Form */}
              {bankFormOpen && (
                <div className="mx-6 mt-5 border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <CreditCard size={14}/> {editBankIdx >= 0 ? 'Edit' : 'Add'} Bank Account
                  </h4>
                  <form onSubmit={handleBankSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Bank Name" required>
                      <Input required value={bankForm.bankName} onChange={setBankField('bankName')} placeholder="e.g. HDFC Bank"/>
                    </Field>
                    <Field label="Account Holder Name" required>
                      <Input required value={bankForm.accountHolderName} onChange={setBankField('accountHolderName')} placeholder="e.g. Acme Corp"/>
                    </Field>
                    <Field label="Account Number" required>
                      <Input required value={bankForm.accountNumber} onChange={setBankField('accountNumber')} placeholder="Enter account number"/>
                    </Field>
                    <Field label="IFSC Code" required>
                      <Input required value={bankForm.ifscCode} onChange={setBankField('ifscCode')} placeholder="e.g. HDFC0001234"/>
                    </Field>
                    <Field label="Branch Name">
                      <Input value={bankForm.branchName} onChange={setBankField('branchName')} placeholder="e.g. Bandra KH Branch"/>
                    </Field>
                    <Field label="Account Type">
                      <select value={bankForm.accountType} onChange={setBankField('accountType')}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-black outline-none bg-white">
                        <option value="Current">Current</option>
                        <option value="Savings">Savings</option>
                        <option value="OD">Overdraft (OD)</option>
                      </select>
                    </Field>
                    <div className="col-span-full flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => { setBankFormOpen(false); setEditBankIdx(-1); setBankForm(BLANK_BANK); }}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                      <button type="submit"
                        className="px-5 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5">
                        <CheckCircle size={14}/> Save Account
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bank Accounts Table */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registered Bank Accounts</p>
                  {!bankFormOpen && (
                    <button onClick={() => { setEditBankIdx(-1); setBankForm(BLANK_BANK); setBankFormOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
                      <Plus size={13}/> Add Bank
                    </button>
                  )}
                </div>

                {selClient.bankAccounts?.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-white">
                        <tr>
                          <th className="px-4 py-3">Bank Name</th>
                          <th className="px-4 py-3">Account Number</th>
                          <th className="px-4 py-3">IFSC</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-center">Default</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selClient.bankAccounts.map((acc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800">{acc.bankName}</td>
                            <td className="px-4 py-3 font-mono">
                              {acc.accountNumber.length > 4 ? `•••• ${acc.accountNumber.slice(-4)}` : acc.accountNumber}
                            </td>
                            <td className="px-4 py-3 font-mono uppercase text-slate-500">{acc.ifscCode}</td>
                            <td className="px-4 py-3 text-slate-500">{acc.accountType}</td>
                            <td className="px-4 py-3 text-center">
                              {acc.isDefault
                                ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold flex items-center gap-1 justify-center w-fit mx-auto"><Star size={9}/> Default</span>
                                : <button onClick={() => setDefault(idx)} className="text-[10px] font-bold text-blue-600 hover:underline">Set Default</button>
                              }
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditBankIdx(idx); setBankForm({ ...acc }); setBankFormOpen(true); }}
                                  className="text-slate-500 hover:text-black transition-colors"><Pencil size={14}/></button>
                                <button onClick={() => deleteBank(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 text-center">
                    <Landmark size={32} className="text-slate-200 mx-auto mb-3"/>
                    <p className="text-sm font-medium text-slate-500">No bank accounts yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Bank" to register a bank account.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-7 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <button onClick={() => setBankModal(false)}
                className="px-5 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Import Modal ───────────────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && closeImport()}>
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Upload size={20} className="text-sky-600" /> Import Customers</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload a JSON or CSV file to batch-import customers.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={downloadTemplate} className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  <Download size={14} /> Download CSV Template
                </button>
                <button onClick={closeImport} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div className={`m-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'}`}
              onClick={() => fileInputRef.current?.click()} onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
              <Upload size={40} className="text-slate-300 mx-auto" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-slate-600">Drag & drop here, or <span className="text-sky-600 underline">browse</span></p>
              <p className="text-xs text-slate-400 mt-1">Supports <strong>.json</strong> (array) and <strong>.csv</strong> (with headers)</p>
            </div>
            {importError && (
              <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{importError}</p>
              </div>
            )}
            {importParsed.length > 0 && (() => {
              const valid = importParsed.filter(validateClient);
              const invalid = importParsed.filter(i => !validateClient(i));
              return (
                <div className="px-6 pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-700">Preview — {importParsed.length} record(s)</p>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{valid.length} valid</span>
                      {invalid.length > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">{invalid.length} invalid</span>}
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800 text-white sticky top-0">
                        <tr>{['Name','City','State','Country','✓'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsed.map((c, i) => {
                          const ok = validateClient(c);
                          return (
                            <tr key={i} className={ok ? '' : 'bg-red-50/60'}>
                              <td className="px-3 py-2 font-bold">{c.name || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2">{c.city || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2">{c.state || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2">{c.country || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2 text-center">
                                {ok ? <CheckCircle size={14} className="text-emerald-500 mx-auto"/> : <XCircle size={14} className="text-red-400 mx-auto"/>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center mt-auto">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">NeDB Bulk Import</p>
              <div className="flex gap-3">
                <button onClick={closeImport} className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all">Cancel</button>
                <button onClick={executeImport} disabled={!importParsed.length || importLoading || importParsed.filter(validateClient).length === 0}
                  className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                  {importLoading ? 'Importing...' : <><CheckCircle size={16}/> Import {importParsed.filter(validateClient).length} Records</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
