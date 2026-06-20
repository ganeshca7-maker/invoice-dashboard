"use client";
import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Trash2, Settings2, MapPin, Users, ChevronDown,
  Building2, FileText, CheckCircle, Truck, Upload, Download, XCircle
} from 'lucide-react';
import { ApiClient } from '../lib/apiClient';
import CustomerModal from './CustomerModal';

// ── Constants ─────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi (NCT)','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'
];

const STATE_CODES = {
  'Andhra Pradesh':'28','Arunachal Pradesh':'12','Assam':'18','Bihar':'10','Chhattisgarh':'22',
  'Goa':'30','Gujarat':'24','Haryana':'06','Himachal Pradesh':'02','Jharkhand':'20','Karnataka':'29',
  'Kerala':'32','Madhya Pradesh':'23','Maharashtra':'27','Manipur':'14','Meghalaya':'17','Mizoram':'15',
  'Nagaland':'13','Odisha':'21','Punjab':'03','Rajasthan':'08','Sikkim':'11','Tamil Nadu':'33',
  'Telangana':'36','Tripura':'16','Uttar Pradesh':'09','Uttarakhand':'05','West Bengal':'19',
  'Andaman & Nicobar Islands':'35','Chandigarh':'04','Dadra & Nagar Haveli and Daman & Diu':'26',
  'Delhi (NCT)':'07','Jammu & Kashmir':'01','Ladakh':'38','Lakshadweep':'31','Puducherry':'34'
};

const fmtPrice = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Shared sub-components ─────────────────────────────────────────
const Field = ({ label, required, children, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Inp = ({ className = '', ...props }) => (
  <input {...props}
    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white placeholder:text-slate-300 ${className}`}
  />
);

function StateDropdown({ value, onChange, placeholder = 'Select state...' }) {
  const [q, setQ]   = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setQ(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = q.trim() ? INDIAN_STATES.filter(s => s.toLowerCase().includes(q.toLowerCase())) : INDIAN_STATES.slice(0, 10);
  return (
    <div ref={ref} className="relative">
      <input value={q} onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white" />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filtered.map(s => (
            <div key={s} onMouseDown={() => { onChange(s); setQ(s); setOpen(false); }}
              className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">{s}</div>
          ))}
          {!filtered.length && <div className="px-3 py-2 text-xs text-slate-400 italic">No results</div>}
        </div>
      )}
    </div>
  );
}

function ItemSearchDropdown({ value, onChange, options, placeholder }) {
  const [q, setQ]   = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setQ(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const filtered = q.trim() ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <div ref={ref} className="relative">
      <input value={q}
        onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder={placeholder}
        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs focus:border-black outline-none bg-white" />
      {open && q.trim() && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
          {filtered.length ? filtered.map(o => (
            <div key={o} onMouseDown={() => { onChange(o); setQ(o); setOpen(false); }}
              className="px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer">{o}</div>
          )) : <div className="px-3 py-1.5 text-xs text-slate-400 italic">No match</div>}
        </div>
      )}
    </div>
  );
}

// ── Place of Supply logic ─────────────────────────────────────────
function calcPlaceOfSupply(billState, shipState, isShippingDiff) {
  const state = isShippingDiff && shipState ? shipState : (billState || '');
  const code  = STATE_CODES[state] || '';
  return state ? `${code}-${state}` : '';
}

// ── Main Component ────────────────────────────────────────────────
const BLANK_CLIENT_FORM = {
  name:'', email:'', phone:'', currency:'INR (₹)', creditPeriod:15, gstin:'',
  address1:'', address2:'', address3:'', city:'', pincode:'', state:'', country:'India'
};

const BLANK_SHIP = { address1:'', address2:'', address3:'', state:'', pincode:'' };

export default function CreateInvoice({ navigateTo }) {
  const [clients, setClients]           = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [invoices, setInvoices]         = useState([]);
  const [masterItems, setMasterItems]   = useState([]);
  const [countries, setCountries]       = useState([]);
  const [settings, setSettings]         = useState({ prefix:'INV', nextStart:'001', suffix:'', startDate:'', resetDate:'', adminOverride:false });

  // ── Client search dropdown ─────────────────────────────────────
  const [clientSearch, setClientSearch] = useState('');
  const [clientDropOpen, setClientDropOpen] = useState(false);
  const clientDropRef = useRef(null);

  // ── Add New Customer modal (same as Clients page) ──────────────
  const [clientModal, setClientModal]   = useState(false);
  const [clientForm, setClientForm]     = useState(BLANK_CLIENT_FORM);
  const [savingClient, setSavingClient] = useState(false);

  // ── Shipping address popup ──────────────────────────────────────
  const [shipPopup, setShipPopup]       = useState(false);
  const [shipForm, setShipForm]         = useState(BLANK_SHIP);

  // ── Settings modal ─────────────────────────────────────────────
  const [settingsModal, setSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm]   = useState({ prefix:'INV', nextStart:'001', suffix:'', startDate:'', resetDate:'', adminOverride:false });

  // ── Item master modal ───────────────────────────────────────────
  const [itemModal, setItemModal]       = useState(false);
  const [itemForm, setItemForm]         = useState({ name:'', description:'', hsn:'9983', rate:0, gstRate:18 });

  // ── Item import modal ───────────────────────────────────────────
  const [importOpen, setImportOpen]           = useState(false);
  const [importParsed, setImportParsed]       = useState([]);
  const [importError, setImportError]         = useState('');
  const [importLoading, setImportLoading]     = useState(false);
  const [isDragOver, setIsDragOver]           = useState(false);
  const fileInputRef = useRef(null);

  const downloadItemTemplate = () => {
    const csvContent = "name,description,hsn,rate,gstRate\nConsulting,General consultation,9983,5000,18";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'items_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeImport = () => { setImportOpen(false); setImportParsed([]); setImportError(''); setIsDragOver(false); };

  const validateItem = (i) => i.name && !isNaN(parseFloat(i.rate));

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
            const obj = { id: `i${Date.now()}${Math.random().toString(36).substr(2,5)}` };
            headers.forEach((h, i) => obj[h] = vals[i]);
            obj.rate = parseFloat(obj.rate) || 0;
            obj.gstRate = parseInt(obj.gstRate) || 18;
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
    const valid = importParsed.filter(validateItem);
    if (!valid.length) return;
    setImportLoading(true);
    const res = await fetch('/api/master_items/batch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(valid) });
    setImportLoading(false);
    if (res.ok) { const d = await res.json(); alert(`Import complete: ${d.saved} saved, ${d.failed} failed`); const mi = await ApiClient.getMasterItems(); setMasterItems(mi); closeImport(); }
    else alert('Batch import failed');
  };

  // ── Selected client & invoice form ─────────────────────────────
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceForm, setInvoiceForm]   = useState({
    id:'', date:new Date().toISOString().split('T')[0], dueDate:'', creditPeriod:'15 Days',
    poNo:'', poDate:'', ewayBillNo:'', vehicleNo:'',
    clientName:'', clientGstin:'',
    // address stored as structured fields
    billAddress1:'', billAddress2:'', billAddress3:'', billCity:'', billPincode:'', billState:'', billCountry:'',
    isShippingDifferent:false,
    // shipping stored in shipForm state (popup)
    accountName:'', bankName:'', accountNumber:'', ifscCode:'', branchName:'', accountType:'Current Account',
    termsNotes:''
  });

  const [items, setItems] = useState([
    { name:'', description:'', hsn:'9983', quantity:1, rate:0, gstRate:18 }
  ]);

  // ── Outside click for client dropdown ──────────────────────────
  useEffect(() => {
    const h = (e) => { if (clientDropRef.current && !clientDropRef.current.contains(e.target)) setClientDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [cl, pr, inv, mi, co, ns] = await Promise.all([
      ApiClient.getClients(), ApiClient.getCompanyProfile(), ApiClient.getInvoices(),
      ApiClient.getMasterItems(), ApiClient.getCountries(), ApiClient.getInvoiceSettings()
    ]);
    setClients(cl || []);
    setCompanyProfile(pr);
    setInvoices(inv || []);
    setMasterItems(mi || []);
    setCountries(co || []);
    if (ns) { setSettings(ns); setSettingsForm(ns); }
    if (pr) {
      setInvoiceForm(p => ({ ...p,
        accountName: pr.accountName || '', bankName: pr.bankName || '',
        accountNumber: pr.accountNumber || '', ifscCode: pr.ifscCode || '',
        branchName: pr.branchName || '', accountType: pr.accountType || 'Current Account'
      }));
    }
  };

  // ── Invoice number generation ───────────────────────────────────
  const genInvoiceNum = (dateStr, s) => {
    if (s.adminOverride) return invoiceForm.id;
    const prefix = s.prefix || '', suffix = s.suffix || '';
    const startNum = parseInt(s.nextStart || '1', 10) || 1;
    const startDate = s.startDate ? new Date(s.startDate) : null;
    const resetDate = s.resetDate ? new Date(s.resetDate) : null;
    const invDate   = dateStr ? new Date(dateStr) : new Date();
    let count = 0;
    (invoices || []).forEach(inv => {
      const d = new Date(inv.date), id = inv.id || '';
      if (!id.startsWith(prefix) || (suffix && !id.endsWith(suffix))) return;
      if (resetDate && invDate >= resetDate) { if (d >= resetDate) count++; }
      else if (startDate) { if (resetDate ? (d >= startDate && d < resetDate) : d >= startDate) count++; }
      else { if (!resetDate || d < resetDate) count++; }
    });
    const seq = String(startNum + count).padStart((s.nextStart || '001').length, '0');
    return `${prefix}${prefix && !prefix.endsWith('/') && !prefix.endsWith('-') ? '/' : ''}${seq}${suffix}`;
  };

  useEffect(() => {
    if (invoices.length >= 0) {
      setInvoiceForm(p => ({ ...p, id: genInvoiceNum(p.date, settings) }));
    }
  }, [invoiceForm.date, invoices, settings]);

  useEffect(() => {
    const days = parseInt(invoiceForm.creditPeriod.replace(/\D/g, '')) || 0;
    const d = new Date(invoiceForm.date);
    d.setDate(d.getDate() + days);
    setInvoiceForm(p => ({ ...p, dueDate: d.toISOString().split('T')[0] }));
  }, [invoiceForm.date, invoiceForm.creditPeriod]);

  // ── Auto-compute Place of Supply (never stored in form, computed on-the-fly) ──
  const placeOfSupply = calcPlaceOfSupply(invoiceForm.billState, shipForm.state, invoiceForm.isShippingDifferent);

  // ── Select client ───────────────────────────────────────────────
  const selectClient = (c) => {
    setSelectedClient(c);
    setClientSearch(c.name);
    setClientDropOpen(false);
    setInvoiceForm(p => ({
      ...p,
      clientName: c.name, clientGstin: c.gstin || '',
      billAddress1: c.address1 || '', billAddress2: c.address2 || '',
      billAddress3: c.address3 || '', billCity: c.city || '',
      billPincode: c.pincode || '', billState: c.state || '', billCountry: c.country || '',
      creditPeriod: `${c.creditPeriod || 15} Days`
    }));
    if (c.bankAccounts?.length) {
      const b = c.bankAccounts.find(a => a.isDefault) || c.bankAccounts[0];
      setInvoiceForm(p => ({ ...p, accountName:b.accountHolderName, bankName:b.bankName,
        accountNumber:b.accountNumber, ifscCode:b.ifscCode, branchName:b.branchName||'', accountType:b.accountType||'Savings' }));
    }
  };

  // ── New Client submit ───────────────────────────────────────────
  // (Handled by CustomerModal component)

  // ── Settings submit ─────────────────────────────────────────────
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (settingsForm.resetDate && settingsForm.startDate && new Date(settingsForm.resetDate) < new Date(settingsForm.startDate))
      { alert('Reset date cannot be before start date.'); return; }
    await ApiClient.saveInvoiceSettings(settingsForm);
    setSettings(settingsForm); setSettingsModal(false);
  };

  // ── Master item submit ──────────────────────────────────────────
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.rate) { alert('Name and rate required.'); return; }
    await ApiClient.saveMasterItem({ id:`i${Date.now()}`, ...itemForm });
    const mi = await ApiClient.getMasterItems(); setMasterItems(mi);
    setItemModal(false); setItemForm({ name:'', description:'', hsn:'9983', rate:0, gstRate:18 });
  };

  // ── Line items ──────────────────────────────────────────────────
  const updateItem = (idx, field, val) => {
    const arr = [...items];
    arr[idx][field] = val;
    if (field === 'name') {
      const m = masterItems.find(i => i.name === val);
      if (m) { arr[idx].description = m.description||''; arr[idx].rate = m.rate; arr[idx].gstRate = m.gstRate||18; arr[idx].hsn = m.hsn||'9983'; }
    }
    setItems(arr);
  };

  // ── Calculations ────────────────────────────────────────────────
  const billState = invoiceForm.billState || '';
  const isIntra   = placeOfSupply.toLowerCase().includes(billState.toLowerCase()) && billState;
  let cgst = 0, sgst = 0, igst = 0;
  items.forEach(it => {
    const val = (it.quantity||0) * (it.rate||0);
    const tax = val * ((it.gstRate||18) / 100);
    if (isIntra) { cgst += tax/2; sgst += tax/2; } else { igst += tax; }
  });
  const taxable = items.reduce((s,it) => s + (it.quantity||0)*(it.rate||0), 0);
  const total   = taxable + cgst + sgst + igst;

  // ── Generate / Save draft ───────────────────────────────────────
  const buildPayload = (status) => ({
    ...invoiceForm,
    shippingAddress: invoiceForm.isShippingDifferent
      ? [shipForm.address1, shipForm.address2, shipForm.address3, shipForm.state, shipForm.pincode].filter(Boolean).join('\n')
      : '',
    clientAddress: [invoiceForm.billAddress1, invoiceForm.billAddress2, invoiceForm.billAddress3,
      invoiceForm.billCity, invoiceForm.billState, invoiceForm.billPincode, invoiceForm.billCountry].filter(Boolean).join('\n'),
    placeOfSupply, amount:total, status, items,
    initials: invoiceForm.clientName.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2)
  });

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!invoiceForm.id.trim()) { alert('Invoice number required.'); return; }
    if (!invoiceForm.clientName.trim()) { alert('Please select a client.'); return; }
    if (items.some(i => !i.name.trim() || i.rate <= 0)) { alert('Fill all line items.'); return; }
    const res = await ApiClient.saveInvoice(buildPayload('Pending'));
    if (res.success) { alert(`Invoice ${invoiceForm.id} generated!`); navigateTo('invoices'); }
    else alert(`Error: ${res.error}`);
  };

  const handleDraft = async () => {
    if (!invoiceForm.id.trim()) { alert('Invoice number required.'); return; }
    if (!invoiceForm.clientName.trim()) { alert('Please select a client.'); return; }
    const res = await ApiClient.saveInvoice(buildPayload('Draft'));
    if (res.success) { alert(`Saved as draft: ${invoiceForm.id}`); navigateTo('invoices'); }
    else alert(`Error: ${res.error}`);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.tradeName || '').toLowerCase().includes(clientSearch.toLowerCase())
  );
  const setClientField  = k => e => setClientForm(p => ({ ...p, [k]: e.target.value }));
  const setShipField    = k => e => setShipForm(p => ({ ...p, [k]: e.target.value }));

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto pb-24 space-y-6">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-slate-400"/> Create New Invoice
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the details to generate a GST-compliant invoice.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDraft}
            className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
            Save Draft
          </button>
          <button onClick={handleGenerate}
            className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
            <CheckCircle size={16}/> Generate Invoice
          </button>
        </div>
      </div>

      {/* ── Bill To + Invoice Details ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BILL TO ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bill To</h3>
            <button onClick={() => { setClientForm(BLANK_CLIENT_FORM); setClientModal(true); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              <Plus size={13}/> Add New Customer
            </button>
          </div>

          {/* Client search */}
          <div className="relative" ref={clientDropRef}>
            <Inp
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setClientDropOpen(true); setInvoiceForm(p => ({ ...p, clientName: e.target.value })); }}
              onFocus={() => setClientDropOpen(true)}
              placeholder="Search or type customer name..."
            />
            {clientDropOpen && clientSearch.trim() && (
              <div className="absolute z-40 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                {filteredClients.length ? filteredClients.map(c => (
                  <div key={c.id} onMouseDown={() => selectClient(c)}
                    className="px-3 py-2.5 text-sm hover:bg-blue-50 cursor-pointer flex items-center gap-2">
                    <span className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{c.initials}</span>
                    <div><p className="font-medium">{c.name}</p><p className="text-[10px] text-slate-400">{c.email}</p></div>
                  </div>
                )) : <div className="px-3 py-2.5 text-xs text-slate-400 italic">No customers found</div>}
              </div>
            )}
          </div>

          {/* Display selected client address as text */}
          {(invoiceForm.billAddress1 || invoiceForm.billCity || invoiceForm.billState) ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-1">Billing Address</p>
              <p>
                {[invoiceForm.billAddress1, invoiceForm.billAddress2, invoiceForm.billAddress3].filter(Boolean).join(', ')}
                {([invoiceForm.billAddress1, invoiceForm.billAddress2, invoiceForm.billAddress3].filter(Boolean).length > 0) && <br/>}
                {[invoiceForm.billCity, invoiceForm.billState].filter(Boolean).join(', ')}
                {invoiceForm.billPincode && ` - ${invoiceForm.billPincode}`}
                {invoiceForm.billCountry && `, ${invoiceForm.billCountry}`}
              </p>
              {invoiceForm.clientGstin && (
                <p className="mt-1"><span className="font-semibold">GSTIN:</span> {invoiceForm.clientGstin}</p>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50">
              Select a customer to view billing details.
            </div>
          )}

          {/* Shipping toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="ship-toggle"
              checked={invoiceForm.isShippingDifferent}
              onChange={e => {
                setInvoiceForm(p => ({ ...p, isShippingDifferent: e.target.checked }));
                if (e.target.checked) setShipPopup(true);
              }}
              className="rounded border-slate-300 text-black focus:ring-black h-4 w-4" />
            <label htmlFor="ship-toggle" className="text-xs text-slate-600 select-none flex items-center gap-1 cursor-pointer">
              <Truck size={13}/> Shipping address is different
            </label>
          </div>

          {/* Show shipping summary if set */}
          {invoiceForm.isShippingDifferent && (shipForm.address1 || shipForm.state) && (
            <div className="flex items-start justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 mb-0.5 flex items-center gap-1"><Truck size={11}/> Shipping Address</p>
                {[shipForm.address1, shipForm.address2, shipForm.address3, shipForm.state, shipForm.pincode].filter(Boolean).join(', ')}
              </div>
              <button onClick={() => setShipPopup(true)} className="text-xs text-blue-600 font-bold hover:underline shrink-0">Edit</button>
            </div>
          )}
        </div>

        {/* INVOICE DETAILS ─────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3">Invoice Details</h3>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Invoice #">
              <div className="flex gap-1">
                <Inp readOnly={!settings.adminOverride} value={invoiceForm.id}
                  onChange={e => setInvoiceForm(p => ({ ...p, id: e.target.value }))}
                  className={!settings.adminOverride ? 'bg-slate-50 cursor-default' : ''}/>
                <button onClick={() => setSettingsModal(true)} title="Numbering settings"
                  className="px-2 py-2 border border-slate-200 rounded-lg text-slate-400 hover:text-black hover:border-slate-400 transition-colors shrink-0">
                  <Settings2 size={14}/>
                </button>
              </div>
            </Field>
            <Field label="Invoice Date">
              <Inp type="date" value={invoiceForm.date} onChange={e => setInvoiceForm(p => ({ ...p, date: e.target.value }))}/>
            </Field>
            <Field label="Credit Period">
              <Inp value={invoiceForm.creditPeriod} onChange={e => setInvoiceForm(p => ({ ...p, creditPeriod: e.target.value }))} placeholder="30 Days"/>
            </Field>
            <Field label="Due Date">
              <Inp type="date" value={invoiceForm.dueDate} onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))}/>
            </Field>
            <Field label="PO Number (optional)">
              <Inp value={invoiceForm.poNo} onChange={e => setInvoiceForm(p => ({ ...p, poNo: e.target.value }))} placeholder="PO-12345"/>
            </Field>
            <Field label="PO Date (optional)">
              <Inp type="date" value={invoiceForm.poDate} onChange={e => setInvoiceForm(p => ({ ...p, poDate: e.target.value }))}/>
            </Field>
            <Field label="E-way Bill No (optional)">
              <Inp value={invoiceForm.ewayBillNo} onChange={e => setInvoiceForm(p => ({ ...p, ewayBillNo: e.target.value }))} placeholder="12-digit number"/>
            </Field>
            <Field label="Vehicle No (optional)">
              <Inp value={invoiceForm.vehicleNo} onChange={e => setInvoiceForm(p => ({ ...p, vehicleNo: e.target.value }))} placeholder="MH-12-AB-1234"/>
            </Field>
          </div>

          {/* Place of Supply — read-only preview */}
          {placeOfSupply && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <MapPin size={13} className="text-amber-500 shrink-0"/>
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Place of Supply (Auto-calculated)</p>
                <p className="text-sm font-semibold text-slate-800">{placeOfSupply}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Line Items ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Line Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-3 py-3 w-10 text-center">#</th>
                <th className="px-3 py-3">Item / Service</th>
                <th className="px-3 py-3 w-24 text-center">HSN</th>
                <th className="px-3 py-3 w-16 text-center">Qty</th>
                <th className="px-3 py-3 w-28 text-right">Rate (₹)</th>
                <th className="px-3 py-3 w-24 text-center">GST %</th>
                <th className="px-3 py-3 w-28 text-right">Amount (₹)</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const amt = (item.quantity||0) * (item.rate||0);
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-center text-slate-400 font-bold">{String(idx+1).padStart(2,'0')}</td>
                    <td className="px-3 py-2 space-y-1">
                      <ItemSearchDropdown value={item.name} onChange={v => updateItem(idx,'name',v)}
                        options={masterItems.map(m=>m.name)} placeholder="Item / Service"/>
                      <input type="text" value={item.description} onChange={e => updateItem(idx,'description',e.target.value)}
                        className="w-full px-2 py-1 border border-slate-100 rounded text-[11px] text-slate-500 focus:border-slate-300 outline-none"
                        placeholder="Description (optional)"/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.hsn} onChange={e => updateItem(idx,'hsn',e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-center focus:border-black outline-none"/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx,'quantity',parseInt(e.target.value)||0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-center font-semibold focus:border-black outline-none"/>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(idx,'rate',parseFloat(e.target.value)||0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono focus:border-black outline-none"/>
                    </td>
                    <td className="px-3 py-2">
                      <select value={item.gstRate} onChange={e => updateItem(idx,'gstRate',parseInt(e.target.value)||0)}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-white focus:border-black outline-none">
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold">₹{fmtPrice(amt)}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => { if(items.length>1) setItems(it => it.filter((_,i) => i!==idx)); }}
                        disabled={items.length===1}
                        className="text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <button onClick={() => setItems(p => [...p, { name:'', description:'', hsn:'9983', quantity:1, rate:0, gstRate:18 }])}
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-black transition-colors">
            <Plus size={14}/> Add Line Item
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-800 transition-colors">
              <Upload size={14}/> Import Master Items
            </button>
            <button onClick={() => setItemModal(true)}
              className="flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={14}/> Add to Master List
            </button>
          </div>
        </div>
      </div>

      {/* ── Banking + Summary ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Banking */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3">Payment Terms & Banking</h3>

          {selectedClient?.bankAccounts?.length > 0 && (
            <Field label="Select Bank Account">
              <select onChange={e => {
                const i = e.target.value;
                if (i === 'custom') return;
                const b = selectedClient.bankAccounts[i];
                setInvoiceForm(p => ({ ...p, accountName:b.accountHolderName, bankName:b.bankName,
                  accountNumber:b.accountNumber, ifscCode:b.ifscCode, branchName:b.branchName||'', accountType:b.accountType||'Savings' }));
              }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-black outline-none">
                {selectedClient.bankAccounts.map((b, i) => (
                  <option key={i} value={i}>{b.bankName} — •••{b.accountNumber.slice(-4)} {b.isDefault?'(Default)':''}</option>
                ))}
                <option value="custom">Custom details</option>
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[['accountName','Account Name'],['bankName','Bank Name'],['accountNumber','Account Number'],
              ['ifscCode','IFSC Code'],['branchName','Branch'],['accountType','Account Type']].map(([k, lbl]) => (
              <Field key={k} label={lbl}>
                <Inp value={invoiceForm[k]} onChange={e => setInvoiceForm(p => ({ ...p, [k]:e.target.value }))} placeholder={lbl}/>
              </Field>
            ))}
          </div>

          <Field label="Terms & Conditions / Notes (optional)">
            <textarea rows="3" value={invoiceForm.termsNotes}
              onChange={e => setInvoiceForm(p => ({ ...p, termsNotes: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:border-black outline-none placeholder:text-slate-300"
              placeholder="Payment terms, late fees, notes..."/>
          </Field>
        </div>

        {/* Tax Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">Tax Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value</span>
              <span className="font-mono font-semibold">₹{fmtPrice(taxable)}</span>
            </div>
            {igst > 0 && <div className="flex justify-between text-slate-600"><span>IGST</span><span className="font-mono">₹{fmtPrice(igst)}</span></div>}
            {cgst > 0 && <div className="flex justify-between text-slate-600"><span>CGST</span><span className="font-mono">₹{fmtPrice(cgst)}</span></div>}
            {sgst > 0 && <div className="flex justify-between text-slate-600"><span>SGST</span><span className="font-mono">₹{fmtPrice(sgst)}</span></div>}
            {placeOfSupply && (
              <div className="flex justify-between text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <span className="flex items-center gap-1"><MapPin size={11}/> Place of Supply</span>
                <span className="font-semibold">{placeOfSupply}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="font-bold text-slate-900 uppercase text-xs tracking-wider">Total Invoice Value</span>
              <span className="text-2xl font-bold font-mono text-slate-900">₹{fmtPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SHIPPING ADDRESS POPUP
      ══════════════════════════════════════════════════════════ */}
      {shipPopup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShipPopup(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Truck size={16} className="text-slate-500"/> Shipping Address</h3>
              <button onClick={() => setShipPopup(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-3">
              {[['address1','Address Line 1'],['address2','Address Line 2'],['address3','Address Line 3']].map(([k,lbl]) => (
                <Field key={k} label={lbl} required={k==='address1'}>
                  <Inp value={shipForm[k]} onChange={setShipField(k)} placeholder={lbl}/>
                </Field>
              ))}
              <Field label="State" required>
                <StateDropdown value={shipForm.state} onChange={v => setShipForm(p => ({ ...p, state:v }))} placeholder="Select shipping state"/>
              </Field>
              <Field label="Pin Code">
                <Inp value={shipForm.pincode} onChange={setShipField('pincode')} placeholder="e.g. 400001"/>
              </Field>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => { setShipPopup(false); setShipForm(BLANK_SHIP); setInvoiceForm(p => ({ ...p, isShippingDifferent:false })); }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={() => setShipPopup(false)}
                className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
                <CheckCircle size={15}/> Apply Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD NEW CUSTOMER MODAL
      ══════════════════════════════════════════════════════════ */}
      <CustomerModal 
        isOpen={clientModal} 
        onClose={() => setClientModal(false)} 
        onSave={async (client) => { 
          const cl = await ApiClient.getClients(); 
          setClients(cl); 
          setClientModal(false); 
          setClientForm(BLANK_CLIENT_FORM);
          selectClient(client); 
        }} 
        initialData={clientForm.name ? clientForm : null}
      />

      {/* ══════════════════════════════════════════════════════════
          INVOICE NUMBER SETTINGS MODAL
      ══════════════════════════════════════════════════════════ */}
      {settingsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setSettingsModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Settings2 size={16} className="text-slate-500"/> Invoice Number Settings</h3>
              <button onClick={() => setSettingsModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>
            <form onSubmit={handleSettingsSubmit}>
              <div className="p-6 space-y-4 text-sm">
                <Field label="Prefix"><Inp value={settingsForm.prefix} onChange={e => setSettingsForm(p => ({ ...p, prefix:e.target.value }))} placeholder="INV"/></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Next Start Number"><Inp value={settingsForm.nextStart} onChange={e => setSettingsForm(p => ({ ...p, nextStart:e.target.value }))} placeholder="001"/></Field>
                  <Field label="Suffix"><Inp value={settingsForm.suffix} onChange={e => setSettingsForm(p => ({ ...p, suffix:e.target.value }))} placeholder=""/></Field>
                  <Field label="Start Date"><Inp type="date" value={settingsForm.startDate} onChange={e => setSettingsForm(p => ({ ...p, startDate:e.target.value }))}/></Field>
                  <Field label="Reset Date"><Inp type="date" value={settingsForm.resetDate} onChange={e => setSettingsForm(p => ({ ...p, resetDate:e.target.value }))}/></Field>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="ao" checked={settingsForm.adminOverride}
                    onChange={e => setSettingsForm(p => ({ ...p, adminOverride:e.target.checked }))}
                    className="rounded border-slate-300 text-black h-4 w-4"/>
                  <label htmlFor="ao" className="text-xs text-slate-600 select-none">Allow manual invoice number editing</label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setSettingsModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MASTER ITEM MODAL
      ══════════════════════════════════════════════════════════ */}
      {itemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setItemModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-900">Add to Master Item List</h3>
              <button onClick={() => setItemModal(false)} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
            </div>
            <form onSubmit={handleItemSubmit}>
              <div className="p-6 space-y-4 text-sm">
                <Field label="Item / Service Name" required><Inp required value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name:e.target.value }))}/></Field>
                <Field label="Description">
                  <textarea rows="2" value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description:e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:border-black outline-none"/>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="HSN Code"><Inp value={itemForm.hsn} onChange={e => setItemForm(p => ({ ...p, hsn:e.target.value }))} placeholder="9983"/></Field>
                  <Field label="Default Rate" required><Inp type="number" required min="0" step="0.01" value={itemForm.rate} onChange={e => setItemForm(p => ({ ...p, rate:parseFloat(e.target.value)||0 }))}/></Field>
                  <Field label="GST Rate" required>
                    <select value={itemForm.gstRate} onChange={e => setItemForm(p => ({ ...p, gstRate:parseInt(e.target.value)||0 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-black outline-none">
                      <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option>
                      <option value="18">18%</option><option value="28">28%</option>
                    </select>
                  </Field>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button type="button" onClick={() => setItemModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2">
                  <Plus size={14}/> Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Import Item Modal ───────────────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && closeImport()}>
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Upload size={20} className="text-sky-600" /> Import Master Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload a JSON or CSV file to batch-import items to the master list.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={downloadItemTemplate} className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
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
              const valid = importParsed.filter(validateItem);
              const invalid = importParsed.filter(i => !validateItem(i));
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
                        <tr>{['Name','Rate','GST %','✓'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsed.map((item, i) => {
                          const ok = validateItem(item);
                          return (
                            <tr key={i} className={ok ? '' : 'bg-red-50/60'}>
                              <td className="px-3 py-2 font-bold">{item.name || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2">{item.rate || 0}</td>
                              <td className="px-3 py-2">{item.gstRate || 0}%</td>
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
                <button onClick={executeImport} disabled={!importParsed.length || importLoading || importParsed.filter(validateItem).length === 0}
                  className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 disabled:shadow-none flex items-center gap-2">
                  {importLoading ? 'Importing...' : <><CheckCircle size={16}/> Import {importParsed.filter(validateItem).length} Items</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
