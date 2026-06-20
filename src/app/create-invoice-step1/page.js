"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Step1() {
  const router = useRouter();
  
  // Invoice form fields state
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState('');
  const [ewayBill, setEwayBill] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transportMode, setTransportMode] = useState('Road');

  // Optional fields collapsible state
  const [showOptional, setShowOptional] = useState(false);

  // Numbering settings modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startNo, setStartNo] = useState(1);
  const [numWidth, setNumWidth] = useState(4);
  const [prefillZero, setPrefillZero] = useState(true);
  const [prefix, setPrefix] = useState('INV-');
  const [suffix, setSuffix] = useState('');
  const [startDate, setStartDate] = useState('');
  const [resetDate, setResetDate] = useState('');
  
  // Validation errors
  const [dateError, setDateError] = useState(false);

  useEffect(() => {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    setInvoiceDate(today);
    setStartDate(today);

    // Load draft if it exists
    const draft = JSON.parse(localStorage.getItem('invoice_draft_step1') || '{}');
    if (draft.id) {
      setInvoiceNo(draft.id);
      if (draft.date) setInvoiceDate(draft.date);
      if (draft.poNumber) setPoNo(draft.poNumber);
      if (draft.poDate) setPoDate(draft.poDate);
      if (draft.ewayBillNumber) setEwayBill(draft.ewayBillNumber);
      if (draft.vehicleNumber) setVehicleNo(draft.vehicleNumber);
      if (draft.transportationMode) setTransportMode(draft.transportationMode);
      
      // Popup settings load
      if (draft.startNo) setStartNo(draft.startNo);
      if (draft.numWidth) setNumWidth(draft.numWidth);
      if (draft.prefillZero !== undefined) setPrefillZero(draft.prefillZero);
      if (draft.prefix !== undefined) setPrefix(draft.prefix);
      if (draft.suffix !== undefined) setSuffix(draft.suffix);
      if (draft.startDate) setStartDate(draft.startDate);
      if (draft.resetDate) setResetDate(draft.resetDate);
    } else {
      // Set initial invoice number layout
      setInvoiceNo(getFormattedInvoiceNo('INV-', 1, 4, true, ''));
    }
  }, []);

  const getFormattedInvoiceNo = (pref, start, width, prefill, suff) => {
    let numStr = String(start);
    if (prefill) {
      numStr = numStr.padStart(width, '0');
    }
    return `${pref}${numStr}${suff}`;
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();

    if (resetDate && startDate && new Date(resetDate) < new Date(startDate)) {
      setDateError(true);
      return;
    }

    setDateError(false);
    const generatedNo = getFormattedInvoiceNo(prefix, startNo, numWidth, prefillZero, suffix);
    setInvoiceNo(generatedNo);
    setIsModalOpen(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const step1Data = {
      id: invoiceNo,
      date: invoiceDate,
      poNumber: poNo,
      poDate: poDate,
      ewayBillNumber: ewayBill,
      vehicleNumber: vehicleNo,
      transportationMode: transportMode,
      
      // Save settings too
      startNo,
      numWidth,
      prefillZero,
      prefix,
      suffix,
      startDate,
      resetDate
    };

    localStorage.setItem('invoice_draft_step1', JSON.stringify(step1Data));
    router.push('/create-invoice-step2');
  };

  return (
    <div className="theme-mobile bg-background text-on-background min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-surface shadow-sm docked full-width top-0 z-40 sticky">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/mobile" className="font-display-lg text-xl text-primary font-bold tracking-tight">BillSimple</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-slate-100">notifications</button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-outline-variant">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgPHWtz890Ea3FXYoWaXA5TR3RjK0LoUDVUnZ_DvipMqQA9KeGzjscFsPDFi22bvEdRxVIVObgY85enN09232h-vbOIt0GAG_LXN33JQohkCC7LtXLgUaacdLv13LqApvYdJka_RiQkih7eHWuoruNBFfsGDIc3yPxXKMge8H-mV98ZDlBCUCkVLSzH2q295FXmU9uyANEAqc8cfbPP2sg_bS1WVZm4l52mQ8SSLNLrbsmi1WrIwQ2I2xCW4TbkKcZSuLnoRQV6QU"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-6 mb-20">
        {/* Progress Stepper */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg text-on-surface">Step 1 of 3: Invoice Details</h2>
            <span className="text-on-surface-variant text-xs font-semibold">33% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-1/3 transition-all duration-500 ease-out"></div>
          </div>
          <div className="mt-4 flex justify-between">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-secondary/20">1</div>
              <span className="text-xs font-semibold text-secondary">Details</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">2</div>
              <span className="text-xs font-medium text-on-surface-variant">Client</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-40">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-xs font-medium text-on-surface-variant">Items</span>
            </div>
          </div>
        </section>

        {/* Invoice Form */}
        <form id="invoice-details-form" onSubmit={handleFormSubmit} className="bg-white border border-outline-variant rounded-xl p-4 md:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Fields */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant">Invoice number</label>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                </button>
              </div>
              <input
                required
                className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all font-semibold w-full text-sm"
                id="invoice-num"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-0001"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-on-surface-variant">Invoice date</label>
              <input
                required
                className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all w-full text-sm"
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          {/* Collapsible Optional Fields Panel */}
          <div className="border border-outline-variant rounded-xl overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-100 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">add_circle</span>
                <span className="font-semibold text-xs text-on-surface text-left">Optional Fields (PO Details, E-Way Bill, Transport)</span>
              </div>
              <span
                className="material-symbols-outlined transition-transform duration-300"
                style={{ transform: showOptional ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>
            
            {showOptional && (
              <div className="border-t border-outline-variant/30 p-4 space-y-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-on-surface-variant">Customer PO number (Optional)</label>
                    <input
                      className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-xs w-full"
                      id="po-num"
                      placeholder="PO-98765"
                      type="text"
                      value={poNo}
                      onChange={(e) => setPoNo(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-on-surface-variant">Customer PO date (Optional)</label>
                    <input
                      className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-xs w-full"
                      id="po-date"
                      type="date"
                      value={poDate}
                      onChange={(e) => setPoDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-on-surface-variant">E-way bill number (Optional)</label>
                    <input
                      className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-xs w-full font-semibold"
                      id="eway-bill"
                      placeholder="12-digit number"
                      type="text"
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-on-surface-variant">Vehicle number (Optional)</label>
                    <input
                      className="h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-xs w-full"
                      id="vehicle-no"
                      placeholder="e.g. MH-12-AB-1234"
                      type="text"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs font-semibold text-on-surface-variant">Mode of transport (Optional)</label>
                    <div className="relative">
                      <select
                        id="transport-mode"
                        className="w-full h-[52px] px-4 rounded-lg border border-outline-variant bg-slate-50 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all appearance-none cursor-pointer text-xs"
                        value={transportMode}
                        onChange={(e) => setTransportMode(e.target.value)}
                      >
                        <option value="Road">Road</option>
                        <option value="Air">Air</option>
                        <option value="Rail">Rail</option>
                        <option value="Ship">Ship</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end items-center gap-4">
          <Link href="/mobile" className="px-6 py-[14px] font-semibold text-secondary hover:bg-slate-100 rounded-lg transition-colors text-sm">Cancel</Link>
          <button
            form="invoice-details-form"
            type="submit"
            className="px-6 py-[14px] bg-secondary text-white font-semibold rounded-lg hover:shadow-lg active:scale-[0.97] transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            Next Step
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </main>

      {/* Numbering Settings Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col">
            <div className="px-4 py-4 bg-slate-50 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">settings</span>
                Numbering Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="material-symbols-outlined text-slate-400 hover:text-slate-700 transition-colors"
              >
                close
              </button>
            </div>
            
            <form onSubmit={handleSettingsSubmit} className="p-4 space-y-4 text-xs font-semibold text-slate-600">
              {/* Starting Number */}
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider">Starting no. *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                  value={startNo}
                  onChange={(e) => setStartNo(parseInt(e.target.value) || 1)}
                />
              </div>
              {/* Width of Numerical Part */}
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider">Width of numerical part *</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                  value={numWidth}
                  onChange={(e) => setNumWidth(parseInt(e.target.value) || 1)}
                />
              </div>
              {/* Prefill with Zero */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-outline-variant/20">
                <label className="uppercase tracking-wider cursor-pointer select-none" htmlFor="popup-prefill-zero">Prefill with zero</label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    id="popup-prefill-zero"
                    type="checkbox"
                    className="sr-only peer"
                    checked={prefillZero}
                    onChange={(e) => setPrefillZero(e.target.checked)}
                  />
                  <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
              {/* Prefix */}
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider">Prefix</label>
                <input
                  type="text"
                  className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                  placeholder="e.g. INV-"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
              </div>
              {/* Suffix */}
              <div className="flex flex-col gap-1">
                <label className="uppercase tracking-wider">Suffix</label>
                <input
                  type="text"
                  className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                  placeholder="e.g. FY26"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                />
              </div>
              {/* Starting Date & Reset Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wider">Starting date *</label>
                  <input
                    type="date"
                    required
                    className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="uppercase tracking-wider">Reset date</label>
                  <input
                    type="date"
                    className="h-10 px-3 border border-outline-variant rounded-lg bg-slate-50 focus:border-secondary outline-none text-xs w-full"
                    value={resetDate}
                    onChange={(e) => setResetDate(e.target.value)}
                  />
                </div>
              </div>
              {dateError && <p id="date-error" className="text-[10px] text-red-600">Reset Date cannot be earlier than Starting Date.</p>}

              <div className="flex justify-end pt-3 gap-2 border-t border-outline-variant/20">
                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold hover:shadow-md transition-colors"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white shadow-lg rounded-t-xl">
        <Link href="/mobile" className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-[10px] font-bold">Dashboard</span>
        </Link>
        <button className="flex flex-col items-center justify-center bg-green-50 text-secondary rounded-full px-5 py-1">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="font-label-md text-[10px] font-bold">Invoices</span>
        </button>
        <button className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Floating Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-100 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 opacity-40 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
