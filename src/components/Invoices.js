"use client";
import { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, Download, MoreHorizontal, Plus, ChevronDown,
  ArrowDownLeft, Upload, CheckCircle, XCircle
} from 'lucide-react';
import { ApiClient } from '../lib/apiClient';

const PAGE_SIZE = 10;

// ── Sub-components ───────────────────────────────────────────────
const TableHeader = ({ label, sortable, onClick }) => (
  <th
    onClick={onClick}
    className={`px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap ${sortable ? 'cursor-pointer hover:text-black transition-colors' : ''}`}
  >
    <div className="flex items-center gap-1">
      {label}
      {sortable && <span className="text-[8px] opacity-40">↕</span>}
    </div>
  </th>
);

const MetricCard = ({ label, value, icon, iconBg, dotColor }) => (
  <div className="flex items-start gap-3">
    {icon && (
      <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
    )}
    <div className="space-y-1 min-w-0">
      <div className="flex items-center gap-1.5">
        {dotColor && <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`}></div>}
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">{label}</p>
      </div>
      <p className="text-base font-bold tracking-tight">{value}</p>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────
export default function Invoices({ navigateTo, searchQuery: globalSearch }) {
  const [invoices, setInvoices]               = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [currentPage, setCurrentPage]         = useState(1);
  const [sortDir, setSortDir]                 = useState('desc');
  const [localSearch, setLocalSearch]         = useState('');
  const [rowsPerPage, setRowsPerPage]         = useState(10);

  // ── Import state ────────────────────────────────────────────────
  const [importOpen, setImportOpen]           = useState(false);
  const [importParsed, setImportParsed]       = useState([]);
  const [importError, setImportError]         = useState('');
  const [importLoading, setImportLoading]     = useState(false);
  const [importResult, setImportResult]       = useState(null);
  const [isDragOver, setIsDragOver]           = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    const data = await ApiClient.getInvoices();
    setInvoices(data || []);
  };

  const downloadTemplate = () => {
    const csvContent = "id,clientName,clientEmail,date,dueDate,amount,status\nINV-001,Acme Corp,billing@acme.com,2026-01-01,2026-01-31,5000,Pending\nINV-002,Global Tech,,2026-01-05,2026-02-04,1500,Paid";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Formatters ───────────────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount, clientName = '') => {
    const isUSD = /inc\b|health|technologies inc/i.test(clientName);
    const n = Number(amount) || 0;
    return isUSD
      ? `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `₹${n.toLocaleString('en-IN',  { minimumFractionDigits: 2 })}`;
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    return Math.max(0, Math.ceil((new Date() - new Date(dueDate)) / 86400000));
  };

  const getStatusCell = (inv) => {
    if (inv.status === 'Paid')
      return <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Paid</span>;
    if (inv.status === 'Pending')
      return <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Pending</span>;
    if (inv.status === 'Draft')
      return <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft</span>;
    if (inv.status === 'Overdue') {
      const days = getOverdueDays(inv.dueDate);
      return <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Overdue by {days} Days</span>;
    }
    return <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{inv.status}</span>;
  };

  // ── Payment Summary ──────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const next30 = new Date(); next30.setDate(next30.getDate() + 30);
  const n30str = next30.toISOString().split('T')[0];

  const outstanding = invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const dueToday    = invoices.filter(i => i.status !== 'Paid' && i.dueDate === today).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const due30       = invoices.filter(i => i.status !== 'Paid' && i.dueDate > today && i.dueDate <= n30str).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const overdue     = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // ── Filter / Sort / Page ─────────────────────────────────────────
  const search = localSearch || globalSearch || '';
  const filtered = invoices.filter(inv => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (inv.id || '').toLowerCase().includes(q)
      || (inv.clientName || '').toLowerCase().includes(q)
      || (inv.poNumber || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    const diff = new Date(a.date || 0) - new Date(b.date || 0);
    return sortDir === 'desc' ? -diff : diff;
  });

  const pSize      = rowsPerPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pSize));
  const paginated  = filtered.slice((currentPage - 1) * pSize, currentPage * pSize);

  const toggleAll    = (e) => setSelectedInvoices(e.target.checked ? paginated.map(i => i.id) : []);
  const toggleOne    = (id) => setSelectedInvoices(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // ── Export CSV ───────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!invoices.length) return alert('No invoices to export.');
    const h = ['id','clientName','clientEmail','date','dueDate','amount','status'];
    const rows = invoices.map(inv => h.map(k => `"${(inv[k] ?? '').toString().replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([[h.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `invoices_${today}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
  };

  // ── Import helpers ───────────────────────────────────────────────
  const validateInv = (inv) => inv.id && inv.clientName && inv.date && inv.amount !== undefined;

  const parseCSV = (text) => {
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      if (obj.amount) obj.amount = parseFloat(obj.amount) || 0;
      if (!obj.initials && obj.clientName)
        obj.initials = obj.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      return obj;
    });
  };

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['json','csv'].includes(ext)) { setImportError(`Unsupported: .${ext}`); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data = ext === 'json' ? JSON.parse(e.target.result) : parseCSV(e.target.result);
        if (!Array.isArray(data)) data = [data];
        if (!data.length) { setImportError('No records found.'); return; }
        setImportParsed(data); setImportError('');
      } catch (err) { setImportError(`Parse error: ${err.message}`); setImportParsed([]); }
    };
    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    const valid = importParsed.filter(validateInv);
    if (!valid.length) return;
    setImportLoading(true);
    try {
      const res  = await fetch('/api/invoices/batch', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(valid) });
      const data = await res.json();
      setImportResult({ saved: data.saved || 0, failed: data.failed || 0 });
      closeImport(); loadInvoices();
    } catch {
      let saved = 0, failed = 0;
      for (const inv of valid) { try { await ApiClient.saveInvoice(inv); saved++; } catch { failed++; } }
      setImportResult({ saved, failed }); closeImport(); loadInvoices();
    } finally { setImportLoading(false); }
  };

  const resetImport = () => { setImportParsed([]); setImportError(''); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const closeImport = () => { setImportOpen(false); resetImport(); };

  // ── Pagination numbers ───────────────────────────────────────────
  const pageNums = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    return all.slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 1));
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Payment Summary ──────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Payment Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <MetricCard
            label="Total Outstanding Receivables"
            value={fmt(outstanding)}
            icon={<ArrowDownLeft size={18} className="text-orange-500" />}
            iconBg="bg-orange-50"
          />
          <MetricCard label="Due Today"           value={fmt(dueToday)} dotColor="bg-yellow-400" />
          <MetricCard label="Due Within 30 Days"  value={fmt(due30)}    dotColor="bg-blue-400" />
          <MetricCard label="Overdue Invoice"     value={fmt(overdue)}  dotColor="bg-red-500" />
          <MetricCard label="Avg. Days to Get Paid" value="35 Days" />
        </div>
      </section>

      {/* ── Controls Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={localSearch}
              onChange={e => { setLocalSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search invoices..."
              className="outline-none bg-transparent w-44 text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors text-xs font-medium">
            <Filter size={14} /> Filter
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Import */}
          <button
            onClick={() => { resetImport(); setImportOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 border border-sky-200 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-xs font-semibold"
          >
            <Upload size={14} /> Import
          </button>
          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
            title="Export CSV"
          >
            <Download size={16} className="text-slate-600" />
          </button>
          <button className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
            <MoreHorizontal size={16} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* ── Invoice Table ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    checked={selectedInvoices.length === paginated.length && paginated.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <TableHeader label="Date" sortable onClick={() => { setSortDir(d => d==='desc'?'asc':'desc'); setCurrentPage(1); }} />
                <TableHeader label="Invoice#" />
                <TableHeader label="Order Number" />
                <TableHeader label="Customer Name" />
                <TableHeader label="Status" />
                <TableHeader label="Due Date" />
                <TableHeader label="Amount" />
                <TableHeader label="Balance Due" />
                <th className="px-6 py-4 w-10 text-right">
                  <Search size={14} className="ml-auto text-slate-400" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map(inv => {
                const balanceDue = inv.status === 'Paid' ? 0 : inv.amount;
                return (
                  <tr
                    key={inv.id}
                    onClick={() => navigateTo('invoice-detail', inv.id)}
                    className="border-b border-slate-100 hover:bg-[#faf9f6] transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={() => toggleOne(inv.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{formatDate(inv.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-medium">{inv.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">{inv.poNumber || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{inv.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusCell(inv)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-right">{formatDate(inv.dueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-right">{formatAmount(inv.amount, inv.clientName)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-right">{formatAmount(balanceDue, inv.clientName)}</td>
                    <td className="px-6 py-4 text-right">
                      <MoreHorizontal size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="10" className="py-16 text-center text-slate-400">
                    {search ? `No invoices matching "${search}"` : 'No invoices yet. Click Import or New Invoice to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pSize + 1}–{Math.min(currentPage * pSize, filtered.length)} of {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-slate-200 rounded px-2 py-0.5 outline-none text-xs bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </button>
              {pageNums().map(n => (
                <button key={n} onClick={() => setCurrentPage(n)}
                  className={`w-7 h-7 rounded text-xs font-bold transition-colors ${n===currentPage ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Import Result Toast ────────────────────────────────── */}
      {importResult && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl max-w-xs">
          <CheckCircle size={22} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Import Complete</p>
            <p className="text-xs text-slate-300 mt-0.5">
              {importResult.saved} invoice{importResult.saved !== 1 ? 's' : ''} saved.
              {importResult.failed > 0 ? ` ${importResult.failed} failed.` : ''}
            </p>
          </div>
          <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-white text-xl leading-none ml-1">×</button>
        </div>
      )}

      {/* ── Import Modal ───────────────────────────────────────── */}
      {importOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && closeImport()}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Upload size={20} className="text-sky-600" />
                  Import Sales Invoices
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload a JSON or CSV file to batch-import invoices into NeDB.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={downloadTemplate} className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                  <Download size={14} /> Download CSV Template
                </button>
                <button onClick={closeImport} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".json,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />

            {/* Drop Zone */}
            <div
              className={`m-6 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'border-sky-400 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50/30'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <Upload size={40} className="text-slate-300 mx-auto" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Drag & drop here, or <span className="text-sky-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports <strong>.json</strong> (array) and <strong>.csv</strong> (with headers)</p>
            </div>

            {/* Format guide */}
            <div className="mx-6 mb-4 grid grid-cols-2 gap-3">
              {[
                { label: 'JSON', code: `[{"id":"INV-001","clientName":"Acme","date":"2026-01-01","amount":5000,"status":"Pending"}]` },
                { label: 'CSV',  code: `id,clientName,date,amount,status\nINV-001,Acme,2026-01-01,5000,Pending` }
              ].map(({ label, code }) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label} Format</p>
                  <pre className="text-[10px] text-slate-600 overflow-auto whitespace-pre-wrap">{code}</pre>
                </div>
              ))}
            </div>

            {importError && (
              <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{importError}</p>
              </div>
            )}

            {/* Preview */}
            {importParsed.length > 0 && (() => {
              const valid   = importParsed.filter(validateInv);
              const invalid = importParsed.filter(i => !validateInv(i));
              const statusClr = { Paid:'text-emerald-600 bg-emerald-50', Pending:'text-amber-600 bg-amber-50', Overdue:'text-red-600 bg-red-50', Draft:'text-slate-600 bg-slate-100' };
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
                        <tr>{['Invoice #','Customer','Date','Amount','Status','✓'].map(h => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importParsed.map((inv, i) => {
                          const ok = validateInv(inv);
                          const c  = statusClr[inv.status] || 'text-slate-600 bg-slate-100';
                          return (
                            <tr key={i} className={ok ? '' : 'bg-red-50/60'}>
                              <td className="px-3 py-2 font-mono text-blue-600 font-bold">{inv.id || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2">{inv.clientName || <span className="text-red-400">Missing</span>}</td>
                              <td className="px-3 py-2 text-slate-400">{inv.date || '—'}</td>
                              <td className="px-3 py-2 text-right font-mono">₹{Number(inv.amount||0).toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${c}`}>{inv.status||'?'}</span></td>
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

            {/* Actions */}
            <div className="p-6 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b-2xl">
              {importParsed.length > 0 && (
                <button onClick={resetImport} className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">Clear & Reset</button>
              )}
              <div className="flex gap-3 ml-auto">
                <button onClick={closeImport} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button
                  onClick={handleBatchImport}
                  disabled={importLoading || importParsed.filter(validateInv).length === 0}
                  className="px-5 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importLoading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span> Saving...</>
                    : <><Upload size={14}/> Import to NeDB ({importParsed.filter(validateInv).length})</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
