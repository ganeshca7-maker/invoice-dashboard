"use client";
import { useState, useEffect } from 'react';
import { ApiClient } from '../lib/apiClient';

export default function Dashboard({ navigateTo, searchQuery }) {
  const [invoices, setInvoices] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  useEffect(() => {
    loadInvoices();
    // Close dropdowns on clicking outside
    const handleOutsideClick = () => setActiveDropdownId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const loadInvoices = async () => {
    const data = await ApiClient.getInvoices();
    setInvoices(data);
  };

  // Calculate dynamic stats
  const paidTotal = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingTotal = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
  const overdueTotal = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

  const copyInvoice = async (invoiceId) => {
    const target = invoices.find(i => i.id === invoiceId);
    if (!target) return;

    const timestamp = Date.now().toString().slice(-4);
    const newId = `${target.id}-COPY-${timestamp}`;

    const copied = {
      ...target,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft'
    };

    const res = await ApiClient.saveInvoice(copied);
    if (res.success || res.id) {
      alert(`Invoice copied successfully as Draft: ${newId}`);
      loadInvoices();
    } else {
      alert(`Failed to copy invoice: ${res.error || 'Unknown error'}`);
    }
  };

  const recordPayment = async (invoiceId) => {
    const target = invoices.find(i => i.id === invoiceId);
    if (!target) return;

    const updated = {
      ...target,
      status: 'Paid'
    };
    const res = await ApiClient.saveInvoice(updated);
    if (res.success || res.id) {
      alert(`Invoice ${invoiceId} marked as Paid.`);
      loadInvoices();
    } else {
      alert(`Failed to update invoice: ${res.error || 'Unknown error'}`);
    }
  };

  // Combine parent search query and local search
  const effectiveQuery = searchQuery || searchVal;
  const filteredInvoices = invoices.filter(inv => {
    if (!effectiveQuery) return true;
    const q = effectiveQuery.toLowerCase();
    return inv.id.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q);
  }).slice(0, 5);

  return (
    <div id="view-search-target" className="space-y-stack-lg max-w-7xl mx-auto w-full">
      {/* KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-on-surface-variant uppercase text-xs font-bold">Total Revenue (FY24)</span>
            <span className="material-symbols-outlined text-on-primary-container">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display-invoice text-primary text-[28px] font-bold">₹{(paidTotal / 100000).toFixed(2)}L</h3>
            <span className="text-green-600 font-bold text-xs">+12.4%</span>
          </div>
          <div className="mt-4 h-8 w-full flex items-end gap-[2px]">
            <div className="flex-1 bg-primary/10 h-1/2 rounded-t-sm"></div>
            <div className="flex-1 bg-primary/10 h-3/4 rounded-t-sm"></div>
            <div className="flex-1 bg-primary/20 h-2/3 rounded-t-sm"></div>
            <div className="flex-1 bg-primary/30 h-full rounded-t-sm"></div>
            <div className="flex-1 bg-primary/20 h-1/2 rounded-t-sm"></div>
            <div className="flex-1 bg-primary/50 h-5/6 rounded-t-sm"></div>
            <div className="flex-1 bg-primary h-full rounded-t-sm"></div>
          </div>
        </div>
        {/* Pending GST */}
        <div className="bg-white border border-outline-variant p-4 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-on-surface-variant uppercase text-xs font-bold">Pending GST Liability</span>
            <span className="material-symbols-outlined text-secondary">schedule</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="font-display-invoice text-primary text-[28px] font-bold">₹{((pendingTotal * 0.18) / 100000).toFixed(2)}L</h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
            <span className="font-label-sm text-xs">Due in 5 days</span>
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[70%] h-full bg-slate-600"></div>
            </div>
          </div>
        </div>
        {/* Overdue Invoices */}
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-red-600 uppercase text-xs font-bold">Overdue Invoices</span>
            <span className="material-symbols-outlined text-red-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <h3 className="font-display-invoice text-red-600 text-[28px] font-bold">{overdueCount}</h3>
          <p className="font-label-sm text-red-800 mt-4 text-xs">Immediate attention required for {overdueCount} accounts.</p>
        </div>
      </section>

      {/* Middle Section: Chart & Side List */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GST Summary Chart Area */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h4 className="font-headline-section font-bold">GST Summary Breakdown</h4>
            <div className="flex gap-2">
              <button className="text-xs font-bold px-2 py-1 bg-slate-100 rounded">Monthly</button>
              <button className="text-xs font-medium px-2 py-1 text-on-surface-variant">Quarterly</button>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] p-6 flex flex-col justify-end">
            {/* Chart Mockup */}
            <div className="flex items-end justify-between h-48 gap-4 px-4">
              {/* Monthly Bars */}
              <div className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col-reverse gap-[2px] h-full">
                  <div className="h-[20%] bg-primary rounded-sm w-full" title="IGST"></div>
                  <div className="h-[30%] bg-secondary rounded-sm w-full" title="CGST"></div>
                  <div className="h-[15%] bg-outline-variant rounded-sm w-full" title="SGST"></div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">APR</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col-reverse gap-[2px] h-full">
                  <div className="h-[25%] bg-primary rounded-sm w-full"></div>
                  <div className="h-[25%] bg-secondary rounded-sm w-full"></div>
                  <div className="h-[20%] bg-outline-variant rounded-sm w-full"></div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">MAY</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col-reverse gap-[2px] h-full">
                  <div className="h-[40%] bg-primary rounded-sm w-full"></div>
                  <div className="h-[20%] bg-secondary rounded-sm w-full"></div>
                  <div className="h-[30%] bg-outline-variant rounded-sm w-full"></div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">JUN</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col-reverse gap-[2px] h-full">
                  <div className="h-[15%] bg-primary rounded-sm w-full"></div>
                  <div className="h-[45%] bg-secondary rounded-sm w-full"></div>
                  <div className="h-[25%] bg-outline-variant rounded-sm w-full"></div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">JUL</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full flex flex-col-reverse gap-[2px] h-full">
                  <div className="h-[30%] bg-primary rounded-sm w-full"></div>
                  <div className="h-[30%] bg-secondary rounded-sm w-full"></div>
                  <div className="h-[10%] bg-outline-variant rounded-sm w-full"></div>
                </div>
                <span className="font-label-sm text-[10px] text-on-surface-variant">AUG</span>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-8 flex justify-center gap-6 border-t border-outline-variant pt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full"></span>
                <span className="font-label-sm text-on-surface-variant">IGST</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-secondary rounded-full"></span>
                <span className="font-label-sm text-on-surface-variant">CGST</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-outline-variant rounded-full"></span>
                <span className="font-label-sm text-on-surface-variant">SGST</span>
              </div>
            </div>
          </div>
        </div>
        {/* Upcoming Filings */}
        <div className="bg-slate-50 border border-outline-variant rounded-xl flex flex-col">
          <div className="p-4 border-b border-outline-variant">
            <h4 className="font-headline-section font-bold">Upcoming Filings</h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-3 bg-white border-l-4 border-primary rounded-r-lg shadow-sm">
              <div className="flex justify-between items-start">
                <h5 className="font-body-tabular font-bold">GSTR-1</h5>
                <span className="px-2 py-1 bg-red-100 text-red-700 font-bold text-[10px] rounded uppercase">Critical</span>
              </div>
              <p className="font-label-sm text-on-surface-variant mt-1 text-xs">Monthly Statement of Outward Supplies</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event</span> 11 Oct 2024
                </span>
                <button className="text-primary font-bold text-xs hover:underline" onClick={() => alert('Filing GSTR-1...')}>File Now</button>
              </div>
            </div>
            <div className="p-3 bg-white border-l-4 border-secondary rounded-r-lg shadow-sm">
              <div className="flex justify-between items-start">
                <h5 className="font-body-tabular font-bold">GSTR-3B</h5>
                <span className="px-2 py-1 bg-slate-100 text-on-surface-variant font-bold text-[10px] rounded uppercase">Upcoming</span>
              </div>
              <p className="font-label-sm text-on-surface-variant mt-1 text-xs">Monthly Summary Return</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event</span> 20 Oct 2024
                </span>
                <button className="text-on-surface-variant font-bold text-xs opacity-50 cursor-not-allowed text-xs" disabled>Open 15th</button>
              </div>
            </div>
            <div className="p-3 bg-white border-l-4 border-outline-variant rounded-r-lg shadow-sm">
              <div className="flex justify-between items-start">
                <h5 className="font-body-tabular font-bold">CMP-08</h5>
                <span className="px-2 py-1 bg-green-100 text-green-700 font-bold text-[10px] rounded uppercase">Complete</span>
              </div>
              <p className="font-label-sm text-on-surface-variant mt-1 text-xs">Quarterly Statement for Composition Tax</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Filed 18 Sep
                </span>
                <button className="text-primary font-bold text-xs hover:underline" onClick={() => alert('CMP-08 already completed!')}>View Receipt</button>
              </div>
            </div>
          </div>
          <div className="mt-auto p-4 border-t border-outline-variant">
            <button className="w-full text-center font-label-caps text-secondary hover:text-primary transition-colors text-xs font-bold uppercase">VIEW ALL COMPLIANCE EVENTS</button>
          </div>
        </div>
      </section>

      {/* Recent Invoices Table */}
      <section className="bg-white border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4">
          <h4 className="font-headline-section font-bold">Recent Invoices</h4>
          <div className="flex items-center bg-slate-50 px-3 py-2 rounded-lg border border-outline-variant w-full sm:w-64">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 outline-none"
              placeholder="Search invoices..."
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-primary text-on-primary">
              <tr>
                <th className="p-3 font-label-caps uppercase tracking-widest">Invoice No</th>
                <th className="p-3 font-label-caps uppercase tracking-widest">Client</th>
                <th className="p-3 font-label-caps uppercase tracking-widest">Date</th>
                <th className="p-3 font-label-caps uppercase tracking-widest">Amount</th>
                <th className="p-3 font-label-caps uppercase tracking-widest">Status</th>
                <th className="p-3 font-label-caps uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody id="recent-activity-rows" className="divide-y divide-outline-variant">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => {
                  let statusClass = 'bg-surface-container-highest text-primary';
                  if (inv.status === 'Paid') statusClass = 'bg-secondary-container text-on-secondary-container';
                  if (inv.status === 'Pending') statusClass = 'bg-amber-100 text-amber-700';
                  if (inv.status === 'Overdue') statusClass = 'bg-error-container text-error';

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigateTo('invoice-detail', inv.id)}
                      className="transition-colors cursor-pointer group hover:bg-slate-50/55"
                    >
                      <td className="p-3 font-data-mono text-primary">{inv.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary text-[11px]">{inv.initials}</div>
                          <span className="font-bold">{inv.clientName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-on-surface-variant">
                        {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-right font-data-mono text-primary font-bold">
                        ₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-[2px] ${statusClass} font-label-caps text-[10px] rounded-full`}>{inv.status}</span>
                      </td>
                      <td className="p-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === inv.id ? null : inv.id)}
                          className="text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                        {activeDropdownId === inv.id && (
                          <div className="absolute right-2 top-full mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-50 py-1 text-left min-w-[140px] no-print">
                            <button
                              onClick={() => {
                                copyInvoice(inv.id);
                                setActiveDropdownId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-primary flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-[16px]">content_copy</span>
                              Copy Invoice
                            </button>
                            {inv.status !== 'Paid' && (
                              <button
                                onClick={() => {
                                  recordPayment(inv.id);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-primary flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-[16px]">payments</span>
                                Record Payment
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-on-surface-variant font-medium">No recent invoices found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-outline-variant flex justify-between items-center">
          <span className="text-on-surface-variant text-xs">Showing recent invoices</span>
          <button onClick={() => navigateTo('invoices')} className="text-xs font-bold text-primary hover:underline">View All Invoices</button>
        </div>
      </section>
    </div>
  );
}
