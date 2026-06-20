"use client";
import { useState, useEffect } from 'react';
import { ApiClient } from '../lib/apiClient';

export default function InvoiceDetail({ invoiceId, navigateTo }) {
  const [inv, setInv] = useState(null);
  const [client, setClient] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  const loadData = async () => {
    setIsLoading(true);
    const invoices = await ApiClient.getInvoices();
    const clients = await ApiClient.getClients();
    const profile = await ApiClient.getCompanyProfile();

    const selectedInv = invoices.find(i => i.id === invoiceId);
    if (selectedInv) {
      setInv(selectedInv);
      setCompanyProfile(profile);
      const selectedClient = clients.find(c => c.name.toLowerCase() === selectedInv.clientName.toLowerCase());
      setClient(selectedClient);
    }
    setIsLoading(false);
  };

  const handleRecordPayment = async () => {
    if (!inv) return;
    const updated = {
      ...inv,
      status: 'Paid'
    };
    await ApiClient.saveInvoice(updated);
    setInv(updated);
    alert(`Invoice ${inv.id} has been marked as Paid.`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-bold text-sm">Loading Invoice Detail...</p>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="p-lg text-center max-w-md mx-auto">
        <h3 className="font-headline-md text-error text-xl font-bold">Invoice Not Found</h3>
        <p className="font-body-md text-on-surface-variant mt-2 text-sm">The invoice with ID {invoiceId} could not be located.</p>
        <button
          onClick={() => navigateTo('invoices')}
          className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-xs font-bold"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  // Sample items for default mock invoices that don't have items array
  const invItems = inv.items || [
    { name: 'Consulting Services', description: 'Consulting & Software Integration Services', quantity: 1, rate: inv.amount, gstRate: 18, hsn: '9983' }
  ];

  let currencySymbol = '$';
  if (client && client.currency) {
    if (client.currency.includes('₹') || client.currency.includes('INR')) {
      currencySymbol = '₹';
    } else if (client.currency.includes('€') || client.currency.includes('EUR')) {
      currencySymbol = '€';
    } else if (client.currency.includes('£') || client.currency.includes('GBP')) {
      currencySymbol = '£';
    }
  }

  const pSupply = inv.placeOfSupply || (client && client.state ? client.state : '27-Maharashtra');
  const isIntraState = pSupply.toLowerCase().includes('maharashtra') || pSupply.startsWith('27');

  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  invItems.forEach(item => {
    const itemVal = item.quantity * item.rate;
    const rate = item.gstRate !== undefined ? item.gstRate : 18;
    const itemTax = itemVal * (rate / 100);
    if (isIntraState) {
      cgstTotal += itemTax / 2;
      sgstTotal += itemTax / 2;
    } else {
      igstTotal += itemTax;
    }
  });

  const taxableValue = invItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalInvoiceValue = taxableValue + cgstTotal + sgstTotal + igstTotal;

  const formatPrice = (val) => {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const cleanNum = Math.floor(num);
    if (cleanNum === 0) return 'Zero';

    const g = (n) => {
      if (n < 20) return a[n];
      const digit = n % 10;
      return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    };

    const chunk = (n) => {
      let str = '';
      if (n >= 100) {
        str += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n > 0) {
        str += g(n) + ' ';
      }
      return str;
    };

    let rem = cleanNum;
    let word = '';

    if (currencySymbol === '₹') {
      if (rem >= 10000000) {
        word += chunk(Math.floor(rem / 10000000)) + 'Crore ';
        rem %= 10000000;
      }
      if (rem >= 100000) {
        word += chunk(Math.floor(rem / 100000)) + 'Lakh ';
        rem %= 100000;
      }
      if (rem >= 1000) {
        word += chunk(Math.floor(rem / 1000)) + 'Thousand ';
        rem %= 1000;
      }
      if (rem > 0) {
        word += chunk(rem);
      }
      return 'Rupees ' + word.trim() + ' Only';
    } else {
      if (rem >= 1000000) {
        word += chunk(Math.floor(rem / 1000000)) + 'Million ';
        rem %= 1000000;
      }
      if (rem >= 1000) {
        word += chunk(Math.floor(rem / 1000)) + 'Thousand ';
        rem %= 1000;
      }
      if (rem > 0) {
        word += chunk(rem);
      }
      return word.trim() + ' Dollars Only';
    }
  };

  const formattedDate = new Date(inv.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col items-center w-full space-y-md">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide app wrappers, navigations, sidebars, headers, setting panels, modals when printing */
          header, aside, footer, nav, .no-print, #top-progress-bar, #company-profile-modal {
            display: none !important;
          }
          /* Adjust layout for raw canvas */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .print-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 32px;
            box-shadow: none !important;
            border: none !important;
          }
        }
        .a4-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 32px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
        }
        .gst-table th {
          background-color: #051125;
          color: white;
          text-transform: uppercase;
        }
        .status-paid {
          background-color: #e6f4ea;
          color: #1e7e34;
        }
      `}} />

      {/* Invoice Toolbar */}
      <div className="w-full max-w-[210mm] mb-stack-md flex justify-between items-end no-print p-sm flex-wrap gap-4">
        <div>
          <h1 className="font-display-invoice text-primary text-2xl md:text-3xl font-bold">{inv.status === 'Paid' ? 'Tax Invoice' : 'Proforma Invoice'}</h1>
          <p className="text-on-surface-variant font-body-main text-xs">Final Preview - Ready for Issuance</p>
        </div>
        <div className="flex gap-2 flex-wrap text-xs font-bold">
          <button
            onClick={() => navigateTo('invoices')}
            className="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <button
            onClick={() => window.print()}
            className="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print
          </button>
          <button
            onClick={() => alert(`Emailing invoice ${inv.id} to ${inv.clientName}...`)}
            className="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Email
          </button>
          {inv.status !== 'Paid' && (
            <button
              onClick={handleRecordPayment}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              Record Payment
            </button>
          )}
          <button
            onClick={() => alert(`Access Log for ${inv.id}:\n- Created on: ${inv.date}\n- Viewed on: ${new Date().toLocaleString()}`)}
            className="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Logs
          </button>
        </div>
      </div>

      {/* Print Canvas */}
      <div className="a4-page print-container relative overflow-hidden text-on-surface">
        {/* Header Section */}
        <header className="flex justify-between items-start mb-6 border-b border-outline-variant pb-6 flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-primary text-on-primary flex items-center justify-center rounded mr-2">
                <span className="material-symbols-outlined text-[24px]">{companyProfile?.logoIcon || 'domain'}</span>
              </div>
              <h1 className="font-display-invoice text-2xl font-bold text-primary">{inv.status === 'Paid' ? 'TAX INVOICE' : 'PROFORMA INVOICE'}</h1>
            </div>
            <div className="font-body-main text-on-surface-variant max-w-xs text-xs md:text-sm">
              <p className="font-bold text-primary">{companyProfile?.name}</p>
              <p>{companyProfile?.address1}</p>
              {companyProfile?.address2 && <p>{companyProfile.address2}</p>}
              {companyProfile?.address3 && <p>{companyProfile.address3}</p>}
              <p>{companyProfile?.city || ''}{companyProfile?.city && companyProfile?.state ? ', ' : ''}{companyProfile?.state || ''}{companyProfile?.pincode ? ' - ' + companyProfile.pincode : ''}</p>
              <p>GSTIN: {companyProfile?.gstin}</p>
              <p>Contact: {companyProfile?.phone} | {companyProfile?.email}</p>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="inline-block px-3 py-1 rounded-sm status-paid font-label-caps mb-2 text-xs font-bold">ORIGINAL FOR RECIPIENT</div>
            <div className="bg-surface-container-low border border-outline-variant p-2 rounded-lg text-left mt-2 p-2">
              <p className="font-label-caps text-on-surface-variant text-[10px] uppercase font-bold">QR Code Validation</p>
              <div className="w-20 h-20 bg-white mt-1 border border-outline-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-outline" style={{fontSize: '48px'}}>qr_code_2</span>
              </div>
            </div>
          </div>
        </header>

        {/* Metadata Row */}
        <div className="grid grid-cols-4 border-t border-b border-outline-variant py-2 mb-6 bg-surface-container-lowest text-xs md:text-sm">
          <div className="px-4 border-r border-outline-variant">
            <p className="font-label-caps text-on-surface-variant text-[10px] uppercase font-bold">Invoice Number</p>
            <p className="font-body-tabular text-primary font-bold">{inv.id}</p>
          </div>
          <div className="px-4 border-r border-outline-variant">
            <p class="font-label-caps text-on-surface-variant text-[10px] uppercase font-bold">Invoice Date</p>
            <p className="font-body-tabular text-primary font-bold">{formattedDate}</p>
          </div>
          <div className="px-4 border-r border-outline-variant">
            <p class="font-label-caps text-on-surface-variant text-[10px] uppercase font-bold">P.O. Number</p>
            <p className="font-body-tabular text-primary font-bold">{inv.poNo || 'N/A'}</p>
          </div>
          <div className="px-4">
            <p class="font-label-caps text-on-surface-variant text-[10px] uppercase font-bold">Transport Mode</p>
            <p className="font-body-tabular text-primary font-bold">{(inv.ewayBillNo || inv.vehicleNo) ? 'Road Cargo' : 'N/A'}</p>
          </div>
        </div>

        {/* Address Boxes Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-outline-variant rounded-lg p-4 bg-white">
            <div className="flex items-center mb-2 border-b border-outline-variant pb-1">
              <span className="material-symbols-outlined text-primary text-lg mr-1">receipt</span>
              <h2 className="font-headline-section text-primary uppercase text-sm font-bold">Bill To</h2>
            </div>
            <div className="font-body-main space-y-1 text-xs md:text-sm">
              <p className="font-bold text-primary">{inv.clientName}</p>
              <p>{client && client.address1 ? (
                `${client.address1}, ${client.address2 ? client.address2 + ', ' : ''}${client.address3 ? client.address3 + ', ' : ''}${client.city}, ${client.state} - ${client.pincode}`
              ) : (
                "Suite 201, Innovator Towers, Whitefield, Bengaluru, Karnataka - 560066"
              )}</p>
              <p className="mt-2 text-primary"><strong>GSTIN:</strong> {client && client.gstin ? client.gstin : 'N/A'}</p>
              <p><strong>Place of Supply:</strong> {pSupply}</p>
            </div>
          </div>
          <div className="border border-outline-variant rounded-lg p-4 bg-white">
            <div className="flex items-center mb-2 border-b border-outline-variant pb-1">
              <span className="material-symbols-outlined text-primary text-lg mr-1">local_shipping</span>
              <h2 className="font-headline-section text-primary uppercase text-sm font-bold">Ship To</h2>
            </div>
            <div className="font-body-main space-y-1 text-xs md:text-sm">
              <p className="font-bold text-primary">{inv.clientName}</p>
              <p>{client && client.address1 ? (
                `${client.address1}, ${client.city}, ${client.state} - ${client.pincode}`
              ) : (
                "Survey No. 15/2, Electronic City Phase II, Near Central Hub, Bengaluru, Karnataka - 560100"
              )}</p>
              {inv.ewayBillNo && <p className="mt-2 text-primary"><strong>E-way Bill:</strong> {inv.ewayBillNo}</p>}
              {inv.vehicleNo && <p><strong>Vehicle No:</strong> {inv.vehicleNo}</p>}
            </div>
          </div>
        </div>

        {/* Item Table */}
        <table className="w-full gst-table border-collapse mb-6 text-xs md:text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-label-caps w-10 p-2">#</th>
              <th className="px-4 py-3 text-left font-label-caps p-2">Item Description</th>
              <th className="px-4 py-3 text-center font-label-caps p-2">HSN/SAC</th>
              <th className="px-4 py-3 text-right font-label-caps p-2">Qty</th>
              <th className="px-4 py-3 text-right font-label-caps p-2">Rate</th>
              <th className="px-4 py-3 text-right font-label-caps p-2">Disc%</th>
              <th className="px-4 py-3 text-right font-label-caps p-2">Taxable Val.</th>
            </tr>
          </thead>
          <tbody className="font-body-tabular text-primary">
            {invItems.map((item, index) => (
              <tr key={index} className={`border-b border-outline-variant ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}`}>
                <td className="px-4 py-3 text-on-surface-variant text-center p-2">{String(index + 1).padStart(2, '0')}</td>
                <td className="px-4 py-3 p-2">
                  <p className="font-bold text-primary">{item.name || 'Services'}</p>
                  {item.description && <p className="text-xs text-on-surface-variant font-normal mt-0.5">{item.description}</p>}
                </td>
                <td className="px-4 py-3 text-center p-2">{item.hsn || '9983'}</td>
                <td className="px-4 py-3 text-right p-2">{item.quantity}.00</td>
                <td className="px-4 py-3 text-right p-2">{formatPrice(item.rate)}</td>
                <td className="px-4 py-3 text-right p-2">0%</td>
                <td className="px-4 py-3 text-right p-2">{formatPrice(item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculations */}
        <div className="flex justify-between items-start gap-6 mb-6 flex-wrap md:flex-nowrap">
          <div className="w-full md:w-3/5 text-xs md:text-sm">
            <div className="mb-4">
              <p className="font-label-caps text-on-surface-variant mb-1 text-[10px] uppercase font-bold">Amount in Words</p>
              <p className="font-body-main italic text-primary font-bold">{numberToWords(totalInvoiceValue)}</p>
            </div>
            <div className="bg-surface-container border border-outline-variant p-4 rounded-lg">
              <h3 className="font-label-caps text-primary mb-2 text-[10px] uppercase font-bold border-b pb-1">Bank Account Details</h3>
              <div className="grid grid-cols-2 gap-y-1 font-body-main text-xs">
                <span className="text-on-surface-variant">Account Name:</span>
                <span className="font-bold">{inv.accountName || companyProfile?.accountName}</span>
                <span className="text-on-surface-variant">Bank Name:</span>
                <span className="font-bold">{inv.bankName || companyProfile?.bankName}</span>
                <span className="text-on-surface-variant">Account Number:</span>
                <span className="font-bold">{inv.accountNumber || companyProfile?.accountNumber}</span>
                <span className="text-on-surface-variant">IFSC Code:</span>
                <span className="font-bold">{inv.ifscCode || companyProfile?.ifscCode}</span>
                <span className="text-on-surface-variant">Branch:</span>
                <span className="font-bold">{inv.branchName || companyProfile?.branchName || 'BKC, Mumbai'}</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/5 text-xs md:text-sm">
            <div className="border-t-4 border-primary bg-surface-container-low p-4 rounded-b-lg">
              <div className="space-y-2 mb-2 border-b border-outline-variant pb-2">
                <div className="flex justify-between font-body-main">
                  <span className="text-on-surface-variant">Total Taxable Value</span>
                  <span className="font-body-tabular font-semibold">{currencySymbol}{formatPrice(taxableValue)}</span>
                </div>
                <div className={`flex justify-between font-body-main ${igstTotal <= 0 ? 'opacity-30' : ''}`}>
                  <span className="text-on-surface-variant">IGST</span>
                  <span className="font-body-tabular">{currencySymbol}{formatPrice(igstTotal)}</span>
                </div>
                <div className={`flex justify-between font-body-main ${cgstTotal <= 0 ? 'opacity-30' : ''}`}>
                  <span className="text-on-surface-variant">CGST</span>
                  <span className="font-body-tabular">{currencySymbol}{formatPrice(cgstTotal)}</span>
                </div>
                <div className={`flex justify-between font-body-main ${sgstTotal <= 0 ? 'opacity-30' : ''}`}>
                  <span className="text-on-surface-variant">SGST</span>
                  <span className="font-body-tabular">{currencySymbol}{formatPrice(sgstTotal)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-primary mt-2">
                <span className="font-headline-section uppercase text-xs font-bold">Total Invoice Value</span>
                <span className="font-display-invoice text-xl font-bold">{currencySymbol}{formatPrice(totalInvoiceValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-outline-variant pt-4 mt-6 text-xs">
          <div className="flex justify-between items-end gap-6 flex-wrap md:flex-nowrap">
            <div className="w-full md:w-2/3">
              <h3 className="font-label-caps text-primary mb-2 uppercase text-[10px] font-bold">Terms &amp; Conditions</h3>
              <ul className="font-label-sm text-on-surface-variant space-y-1 list-disc pl-4 text-[10px]">
                {(inv.termsNotes || '').trim() ? (
                  (inv.termsNotes || '').split('\n').filter(line => line.trim()).map((line, idx) => <li key={idx}>{line}</li>)
                ) : (
                  <>
                    <li>Payment is due within 15 days of the invoice date.</li>
                    <li>All disputes are subject to Mumbai Jurisdiction only.</li>
                    <li>GST breakdown is calculated based on the Place of Supply provided.</li>
                    <li>Please include the Invoice Number with your wire transfer.</li>
                  </>
                )}
              </ul>
            </div>
            <div className="text-center w-full md:w-64">
              <p className="font-label-caps text-primary mb-12 text-[10px] font-bold uppercase">For {companyProfile?.name}</p>
              <div className="border-t border-primary pt-2 mt-8">
                <p className="font-label-caps text-primary text-[10px] font-bold">Authorized Signatory</p>
                <p className="font-label-sm text-on-surface-variant italic text-[9px]">(Digitally Signed Document)</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
