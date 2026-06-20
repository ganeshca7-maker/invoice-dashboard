"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/apiClient';
import Link from 'next/link';

export default function Step3() {
  const router = useRouter();

  // Wizard state from step 1 & 2
  const [step1Data, setStep1Data] = useState({});
  const [step2Data, setStep2Data] = useState({});

  // Line items list state
  const [items, setItems] = useState([
    { name: '', hsn: '9983', qty: 1, rate: 0 }
  ]);

  // Bank profile state
  const [bankProfile, setBankProfile] = useState({});
  const [bankSelect, setBankSelect] = useState('primary');

  // Summary calculations state
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    roundOff: 0,
    grandTotal: 0,
    wordTotal: 'Rupees Zero only'
  });

  useEffect(() => {
    // Load wizard steps
    const s1 = JSON.parse(localStorage.getItem('invoice_draft_step1') || '{}');
    const s2 = JSON.parse(localStorage.getItem('invoice_draft_step2') || '{}');
    setStep1Data(s1);
    setStep2Data(s2);

    // Load saved items if any
    const savedItems = JSON.parse(localStorage.getItem('invoice_draft_step3_items') || '[]');
    if (savedItems.length > 0) {
      setItems(savedItems);
    }

    loadBankDetails();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [items, step2Data.placeOfSupply]);

  const loadBankDetails = async () => {
    const profile = await ApiClient.getCompanyProfile();
    if (profile) {
      setBankProfile(profile);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addRow = () => {
    setItems([...items, { name: '', hsn: '9983', qty: 1, rate: 0 }]);
  };

  const duplicateRow = (index) => {
    const target = items[index];
    setItems([...items, { ...target }]);
  };

  const removeRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      subtotal += q * r;
    });

    const discount = subtotal * 0.05; // 5% discount
    const taxable = subtotal - discount;

    // Place of Supply checks for intra-state vs inter-state
    const pSupply = step2Data.placeOfSupply || 'Maharashtra (27)';
    const isIntraState = pSupply.toLowerCase().includes('maharashtra') || pSupply.includes('27');

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
      cgst = taxable * 0.09; // 9% CGST
      sgst = taxable * 0.09; // 9% SGST
    } else {
      igst = taxable * 0.18; // 18% IGST
    }

    const rawTotal = taxable + cgst + sgst + igst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;

    const wordTotal = numberToWords(grandTotal) + ' only';
    const formattedWordTotal = wordTotal.charAt(0).toUpperCase() + wordTotal.slice(1).toLowerCase();

    setTotals({
      subtotal,
      discount,
      taxable,
      cgst,
      sgst,
      igst,
      roundOff,
      grandTotal,
      wordTotal: formattedWordTotal
    });
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Rupees Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function g(n) {
      if (n < 20) return a[n];
      const d = n % 10;
      return b[Math.floor(n / 10)] + (d ? ' ' + a[d] : '');
    }

    function h(n) {
      if (n === 0) return '';
      let words = '';
      if (n >= 100) {
        words += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 0) {
        words += g(n);
      }
      return words;
    }

    let words = 'Rupees ';
    let temp = num;

    // Crores
    if (temp >= 10000000) {
      words += h(Math.floor(temp / 10000000)) + ' Crore ';
      temp %= 10000000;
    }
    // Lakhs
    if (temp >= 100000) {
      words += h(Math.floor(temp / 100000)) + ' Lakh ';
      temp %= 100000;
    }
    // Thousands
    if (temp >= 1000) {
      words += h(Math.floor(temp / 1000)) + ' Thousand ';
      temp %= 1000;
    }
    // Hundreds/Tens
    if (temp > 0) {
      words += h(temp);
    }

    return words.trim();
  };

  const saveDraftOnly = () => {
    localStorage.setItem('invoice_draft_step3_items', JSON.stringify(items));
    alert('Draft saved locally.');
  };

  const submitInvoice = async () => {
    if (items.some(i => !i.name.trim() || Number(i.rate) <= 0)) {
      alert('Please fill in name and rate for all line items.');
      return;
    }

    if (!step1Data.id || !step2Data.clientName) {
      alert('Wizard state is incomplete. Please complete Step 1 and Step 2.');
      return;
    }

    const payloadItems = items.map(item => ({
      name: item.name.trim(),
      hsnCode: item.hsn.trim(),
      qty: Number(item.qty) || 1,
      rate: Number(item.rate) || 0,
      description: item.name.trim(),
      gstPercent: 18,
      isService: true
    }));

    // Build invoice record
    const invoiceData = {
      id: step1Data.id,
      date: step1Data.date,
      poNumber: step1Data.poNumber,
      poDate: step1Data.poDate,
      ewayBillNumber: step1Data.ewayBillNumber,
      vehicleNumber: step1Data.vehicleNumber,
      transportationMode: step1Data.transportationMode,

      clientName: step2Data.clientName,
      clientEmail: step2Data.contactEmail,
      clientPhone: step2Data.contactPhone,
      initials: step2Data.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CL',
      customerGst: step2Data.gstin,
      customerState: step2Data.billingState,
      shippingState: step2Data.shippingState,
      customerAddressLine1: step2Data.billingStreet,
      customerCity: step2Data.billingCity,
      customerPinCode: step2Data.billingPin,

      shippingAddressLine1: step2Data.shippingStreet,
      shippingCity: step2Data.shippingCity,
      shippingPinCode: step2Data.shippingPin,

      amount: totals.grandTotal,
      subtotal: totals.subtotal,
      totalGst: totals.cgst + totals.sgst + totals.igst,
      grandTotal: totals.grandTotal,
      status: 'Pending',
      items: payloadItems,
      bankDetails: {
        bankName: bankProfile.bankName,
        accountNumber: bankProfile.accountNumber,
        ifscCode: bankProfile.ifscCode,
        accountName: bankProfile.accountName
      }
    };

    const res = await ApiClient.saveInvoice(invoiceData);
    if (res.success || res.id) {
      // Clear draft storage
      localStorage.removeItem('invoice_draft_step1');
      localStorage.removeItem('invoice_draft_step2');
      localStorage.removeItem('invoice_draft_step3_items');

      alert('Invoice successfully created and saved in central database!');
      router.push('/mobile');
    } else {
      alert('Failed to save invoice: ' + (res.error || 'Unknown error'));
    }
  };

  const pSupply = step2Data.placeOfSupply || 'Maharashtra (27)';
  const isIntraState = pSupply.toLowerCase().includes('maharashtra') || pSupply.includes('27');

  return (
    <div className="theme-mobile bg-background text-on-surface antialiased pb-32">
      {/* Top AppBar */}
      <header className="bg-surface shadow-sm docked full-width top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
            <Link href="/mobile" className="font-display-lg text-xl text-primary font-bold cursor-pointer">BillSimple</Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="material-symbols-outlined text-on-surface-variant p-2 rounded-full hover:bg-slate-100">notifications</button>
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkuKU9Wyf2iyhMNP90AOn7rjeDQeG0H894aS8kD8Zm3ZaszoXozYOrbkbnXTMpBbgfIPRD9zNoybl5BaZrl-3lEVzZ6E-GIpydcHNr3mMUccQVyEpc9NMU-96npm0fRBgkmbd1xDeJOYZjkRQarTpNrvz9f3J8j_mSOmULbGFH2FKWi8rOJ3jKaSu69XXrmeFMNTlkywMBcJHD1nc5seXwei2ZMrwy7aj_gx2hVO_shkhU98IjB6BOIyg_6htUylpSYSY4TSGp_SI"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
            <Link href="/create-invoice-step1" className="flex flex-col items-center cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span className="font-label-md text-[10px] uppercase font-bold mt-2 text-secondary">Details</span>
            </Link>
            <div className="flex-1 h-1 bg-secondary mx-4 rounded-full"></div>
            <Link href="/create-invoice-step2" className="flex flex-col items-center cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span className="font-label-md text-[10px] uppercase font-bold mt-2 text-secondary">Client</span>
            </Link>
            <div className="flex-1 h-1 bg-secondary mx-4 rounded-full"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold ring-4 ring-slate-100 bg-slate-900">
                3
              </div>
              <span className="font-label-md text-[10px] uppercase font-bold mt-2 text-slate-900">Items</span>
            </div>
          </div>
          <div className="text-center mt-6">
            <h2 className="font-bold text-lg">Step 3 of 3: Item Details</h2>
            <p className="text-on-surface-variant text-xs">Define the services or products for this invoice.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dynamic Item Grid */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-md">Line Items</h3>
              <button
                type="button"
                className="flex items-center gap-1 px-4 py-2 bg-green-50 text-secondary rounded-lg hover:bg-secondary hover:text-white transition-colors font-semibold text-xs"
                onClick={addRow}
              >
                <span className="material-symbols-outlined">add</span> Add New Item
              </button>
            </div>
            
            <div className="space-y-4" id="items-container">
              {items.map((item, index) => {
                const itemAmount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                return (
                  <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className="md:col-span-5 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-on-surface-variant block">Item Name / Service</label>
                        <input
                          type="text"
                          placeholder="Search or type item..."
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="md:col-span-2 flex flex-col gap-1">
                        <label className="text-xs font-semibold text-on-surface-variant block">HSN/SAC</label>
                        <input
                          type="text"
                          placeholder="9983"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 md:col-span-5 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-on-surface-variant block">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-on-surface-variant block">Rate</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm text-center"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-on-surface-variant block">Amount</label>
                          <div className="w-full px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-center font-bold">
                            {itemAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => duplicateRow(index)}
                        className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span> Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span> Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bank Selection Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-md mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">account_balance</span> Bank Details
              </h3>
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-on-surface-variant block mb-1">Select Receiving Account</label>
                  <select
                    id="bank-select"
                    className="w-full px-3 py-3 border border-slate-200 rounded-lg bg-white h-[44px]"
                    value={bankSelect}
                    onChange={(e) => setBankSelect(e.target.value)}
                  >
                    {bankProfile.bankName ? (
                      <option value="primary">{bankProfile.bankName} - XXXX{(bankProfile.accountNumber || '').slice(-4)} (Primary)</option>
                    ) : (
                      <option value="none">No accounts configured</option>
                    )}
                  </select>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4 border border-dashed border-slate-300">
                  <div>
                    <p className="text-on-surface-variant text-[10px]">Account Name</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{bankProfile.accountName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px]">IFSC Code</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{bankProfile.ifscCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px]">Account Type</p>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{bankProfile.accountType || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Summary Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24 space-y-6">
              <h3 className="font-bold text-md border-b border-slate-100 pb-2">Invoice Summary</h3>
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Sub Total</span>
                  <span>₹ {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-secondary">
                  <span>Discount (5%)</span>
                  <span>- ₹ {totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-slate-800">
                  <span>Taxable Value</span>
                  <span>₹ {totals.taxable.toFixed(2)}</span>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Gst breakdown</p>
                  {isIntraState ? (
                    <>
                      <div className="flex justify-between items-center text-slate-600 text-xs">
                        <span>CGST (9%)</span>
                        <span>₹ {totals.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 text-xs">
                        <span>SGST (9%)</span>
                        <span>₹ {totals.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-slate-600 text-xs">
                      <span>IGST (18%)</span>
                      <span>₹ {totals.igst.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Round Off</span>
                  <span>{totals.roundOff >= 0 ? '+' : ''}₹ {totals.roundOff.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                <span className="font-bold text-sm">Grand Total</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">₹ {totals.grandTotal.toFixed(2)}</p>
                  <p className="text-[9px] opacity-75 tracking-wider uppercase mt-1">{totals.wordTotal}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={submitInvoice}
                  className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt</span> Generate Invoice
                </button>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => router.back()}
                    className="w-full py-3 border border-slate-200 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                  </button>
                  <button
                    onClick={saveDraftOnly}
                    className="w-full py-3 border border-slate-200 rounded-lg font-bold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span> Save Draft
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer Actions (Mobile Only Floating) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg border-t border-slate-100 flex gap-4 z-40">
        <button
          onClick={submitInvoice}
          className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
        >
          Generate
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-4 bg-slate-100 rounded-xl text-slate-800 active:scale-95 transition-transform flex items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white shadow-lg rounded-t-xl md:hidden">
        <Link href="/mobile" className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-[10px] font-bold">Dashboard</span>
        </Link>
        <Link href="/create-invoice-step1" className="flex flex-col items-center justify-center bg-green-50 text-secondary rounded-full px-5 py-1">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <span className="font-label-md text-[10px] font-bold">Invoices</span>
        </Link>
        <button className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-[10px] font-bold">Settings</span>
        </button>
      </nav>
    </div>
  );
}
