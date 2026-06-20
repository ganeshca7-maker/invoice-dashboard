import { AppState, initializeSearchableDropdown, INDIAN_STATES_AND_UTS } from '../app.js';

export async function renderCreateInvoice(container, router) {
    const clients = await AppState.getClients();
    const companyProfile = await AppState.getCompanyProfile();
    const allInvoices = await AppState.getInvoices();

    // Fetch master items and settings from backend database
    const masterItemsRes = await fetch('/api/master_items');
    let masterItems = await masterItemsRes.json();

    const settingsRes = await fetch('/api/invoice_settings');
    let numberSettings = await settingsRes.json();

    const saveMasterItem = async (item) => {
        await fetch('/api/master_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
    };

    const saveNumberSettings = async (settings) => {
        await fetch('/api/invoice_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    };

    const getNumberSettings = () => numberSettings;

    let masterItemsList = masterItems;
    
    // Invoicing Form State
    let selectedClient = null;
    let invoiceDate = new Date().toISOString().split('T')[0];

    const generateInvoiceNumber = (dateStr) => {
        const settings = getNumberSettings();
        if (settings.adminOverride) {
            return invoiceId;
        }

        const prefix = settings.prefix || '';
        const suffix = settings.suffix || '';
        const startNumStr = settings.nextStart || '1';
        const startNum = parseInt(startNumStr, 10) || 1;
        const startDate = settings.startDate ? new Date(settings.startDate) : null;
        const resetDate = settings.resetDate ? new Date(settings.resetDate) : null;
        const invoiceDateObj = dateStr ? new Date(dateStr) : new Date();

        let matchCount = 0;
        allInvoices.forEach(inv => {
            const invDate = new Date(inv.date);
            const id = inv.id || '';
            const matchesPrefix = id.startsWith(prefix);
            const matchesSuffix = suffix ? id.endsWith(suffix) : true;
            if (!matchesPrefix || !matchesSuffix) return;

            if (resetDate && invoiceDateObj >= resetDate) {
                if (invDate >= resetDate) {
                    matchCount++;
                }
            } else if (startDate) {
                if (resetDate) {
                    if (invDate >= startDate && invDate < resetDate) {
                        matchCount++;
                    }
                } else {
                    if (invDate >= startDate) {
                        matchCount++;
                    }
                }
            } else {
                if (resetDate && invDate >= resetDate) {
                    return;
                }
                matchCount++;
            }
        });

        const seqNum = startNum + matchCount;
        const len = startNumStr.length;
        const seqNumStr = String(seqNum).padStart(len, '0');

        let result = prefix;
        if (result && !result.endsWith('/') && !result.endsWith('-')) {
            result += '/';
        }
        result += seqNumStr;
        result += suffix;

        return result;
    };

    let invoiceId = generateInvoiceNumber(invoiceDate);
    let dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    let poNo = '';
    let poDate = '';
    let ewayBillNo = '';
    let vehicleNo = '';
    let creditPeriod = '15 Days';
    
    let clientName = '';
    let clientGstin = '';
    let clientAddress = '';
    let shippingAddress = '';
    let isShippingDifferent = false;
    let placeOfSupply = '27-Maharashtra'; // Default company state code is 27

    const stateCodeMap = {
        '27': '27-Maharashtra',
        '07': '07-Delhi',
        '29': '29-Karnataka'
    };
    const deriveStateFromGstin = (gstin) => {
        if (!gstin) return null;
        const code = gstin.trim().substring(0, 2);
        return stateCodeMap[code] || null;
    };
    const deriveStateFromAddress = (address) => {
        if (!address) return null;
        const text = address.toLowerCase();
        if (text.includes('maharashtra') || text.includes('27-maharashtra') || text.includes('state code: 27')) {
            return '27-Maharashtra';
        }
        if (text.includes('delhi') || text.includes('07-delhi') || text.includes('state code: 07')) {
            return '07-Delhi';
        }
        if (text.includes('karnataka') || text.includes('29-karnataka') || text.includes('state code: 29')) {
            return '29-Karnataka';
        }
        return null;
    };
    const updatePlaceOfSupply = () => {
        let derived = null;
        if (isShippingDifferent) {
            derived = deriveStateFromAddress(shippingAddress);
        } else {
            derived = deriveStateFromGstin(clientGstin) || deriveStateFromAddress(clientAddress);
        }
        if (derived) {
            placeOfSupply = derived;
            const selectEl = document.getElementById('select-place-of-supply');
            if (selectEl) {
                selectEl.value = placeOfSupply;
            }
            calculateAndRenderTotals();
        }
    };

    const updateDueDateFromCreditPeriod = () => {
        if (!invoiceDate) return;
        
        const days = parseInt(creditPeriod.replace(/[^0-9]/g, '')) || 0;
        
        const baseDate = new Date(invoiceDate);
        baseDate.setDate(baseDate.getDate() + days);
        
        dueDate = baseDate.toISOString().split('T')[0];
        
        const dueInput = document.getElementById('input-due-date');
        if (dueInput) {
            dueInput.value = dueDate;
        }
    };

    let accountName = companyProfile.accountName || '';
    let bankName = companyProfile.bankName || '';
    let accountNumber = companyProfile.accountNumber || '';
    let ifscCode = companyProfile.ifscCode || '';
    let branchName = companyProfile.branchName || '';
    let accountType = companyProfile.accountType || 'Current Account';
    let termsNotes = '';

    let items = [{ name: '', description: '', hsn: '9983', quantity: 1, rate: 0.00, gstRate: 18 }];

    // Render primary HTML layout
    const renderForm = () => {
        container.innerHTML = `
            <div class="max-w-[1200px] mx-auto mt-stack-sm pb-24 text-on-surface">
                <!-- Header Section -->
                <div class="flex justify-between items-end mb-stack-lg border-b border-outline-variant pb-stack-md">
                    <div>
                        <h2 class="font-headline-section text-headline-section text-primary text-[22px] font-bold">Create New Invoice</h2>
                        <p class="text-on-surface-variant font-body-main mt-1 text-sm">Fill in the details below to generate a compliance-ready GST invoice.</p>
                    </div>
                    <div class="flex gap-3 no-print">
                        <button id="btn-save-draft" class="px-6 py-2 border border-outline text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-low transition-all text-xs">
                            Save Draft
                        </button>
                        <button id="btn-generate-invoice-top" class="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-md hover:opacity-90 transition-all flex items-center gap-2 text-xs">
                            <span class="material-symbols-outlined text-[18px]">verified</span>
                            Generate Invoice
                        </button>
                    </div>
                </div>

                <!-- Business, Client, and Invoice Info -->
                <div class="grid grid-cols-1 gap-stack-lg mb-section-gap md:grid-cols-2">
                    <!-- Client Info -->
                    <div class="col-span-1 bg-white p-stack-md rounded-xl border border-outline-variant p-md">
                        <div class="flex justify-between items-center mb-stack-sm pb-1 border-b border-outline-variant">
                            <h3 class="font-label-caps text-label-caps text-on-secondary-container font-bold">BILL TO</h3>
                            <button id="btn-add-customer-direct" class="text-primary font-bold text-[11px] uppercase hover:underline">Add New Customer</button>
                        </div>
                        <div class="space-y-stack-sm space-y-2">
                            <div class="relative">
                                <input id="input-client-name" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Customer Name" type="text" value="${clientName}" autocomplete="one-time-code">
                                <div id="autocomplete-dropdown" class="absolute left-0 right-0 top-full mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-[100] max-h-48 overflow-y-auto hidden"></div>
                            </div>
                            <input id="input-client-gstin" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="GSTIN (Optional)" type="text" value="${clientGstin}" autocomplete="new-password">
                            <textarea id="input-client-address" class="form-input text-xs resize-none w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Billing Address" rows="3" autocomplete="new-password">${clientAddress}</textarea>
                            
                            <div class="flex items-center gap-2 py-1">
                                <input type="checkbox" id="shipping-toggle" class="rounded border-outline-variant text-primary focus:ring-primary" ${isShippingDifferent ? 'checked' : ''}>
                                <label for="shipping-toggle" class="text-label-sm text-on-surface-variant text-xs">Shipping address is different</label>
                            </div>
                            
                            ${isShippingDifferent ? `
                            <div class="space-y-1 pb-2">
                                <textarea id="input-shipping-address" class="form-input text-xs resize-none w-full px-2 py-1.5 border border-outline-variant rounded-md font-body-main" placeholder="Shipping Address" rows="3" autocomplete="new-password">${shippingAddress}</textarea>
                            </div>
                            ` : ''}
                            
                            <div class="pt-2 border-t border-outline-variant">
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs font-bold">Place of Supply</label>
                                <select id="select-place-of-supply" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md bg-white">
                                    <option value="27-Maharashtra" ${placeOfSupply === '27-Maharashtra' ? 'selected' : ''}>27-Maharashtra</option>
                                    <option value="07-Delhi" ${placeOfSupply === '07-Delhi' ? 'selected' : ''}>07-Delhi</option>
                                    <option value="29-Karnataka" ${placeOfSupply === '29-Karnataka' ? 'selected' : ''}>29-Karnataka</option>
                                    <option value="01-Singapore" ${placeOfSupply === '01-Singapore' ? 'selected' : ''}>01-Singapore / International</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Invoice Details -->
                    <div class="bg-white p-stack-md rounded-xl border border-outline-variant p-md">
                        <h3 class="font-label-caps text-label-caps text-on-secondary-container mb-stack-sm font-bold pb-1 border-b border-outline-variant">INVOICE DETAILS</h3>
                        <div class="grid grid-cols-2 gap-stack-sm gap-2">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <label class="text-label-sm text-on-surface-variant text-xs">Invoice #</label>
                                    <button id="btn-invoice-settings" class="text-primary hover:underline text-[10px] font-bold flex items-center gap-0.5 no-print" type="button">
                                        <span class="material-symbols-outlined text-[12px]">settings</span>
                                    </button>
                                </div>
                                <input id="input-invoice-number" class="form-input text-xs bg-surface-container-low w-full px-2 py-1.5 border border-outline-variant rounded-md" ${getNumberSettings().adminOverride ? '' : 'readonly'} type="text" value="${invoiceId}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Invoice Date</label>
                                <input id="input-invoice-date" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" type="date" value="${invoiceDate}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Credit Period</label>
                                <input id="input-credit-period" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="e.g. 30 Days" type="text" value="${creditPeriod}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Due Date</label>
                                <input id="input-due-date" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" type="date" value="${dueDate}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Purchase Order No (Optional)</label>
                                <input id="input-po-no" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="PO-12345" type="text" value="${poNo}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Purchase Order Date (Optional)</label>
                                <input id="input-po-date" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" type="date" value="${poDate}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">E-way Bill No (Optional)</label>
                                <input id="input-eway-no" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="12-digit number" type="text" value="${ewayBillNo}">
                            </div>
                            <div>
                                <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Vehicle No <span id="vehicle-required-star" class="text-error hidden">*</span></label>
                                <input id="input-vehicle-no" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="e.g. MH-12-AB-1234" type="text" value="${vehicleNo}">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- LINE ITEMS -->
                <section class="mt-12 pt-6 border-t border-outline-variant mb-section-gap mb-8">
                    <h3 class="font-label-caps text-label-caps text-on-secondary-container mb-stack-sm font-bold">LINE ITEMS</h3>
                    <div class="border border-outline-variant rounded-xl overflow-visible bg-white">
                        <table class="w-full border-collapse text-left bg-white text-xs" style="table-layout: fixed;">
                            <colgroup>
                                <col style="width: 40px;">
                                <col>
                                <col style="width: 80px;">
                                <col style="width: 64px;">
                                <col style="width: 112px;">
                                <col style="width: 80px;">
                                <col style="width: 112px;">
                                <col style="width: 40px;">
                            </colgroup>
                            <thead class="bg-primary text-on-primary">
                                <tr>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-center text-[10px]">#</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-[10px]">Item / Service</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-center text-[10px]">HSN</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-center text-[10px]">Qty</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-right text-[10px]">Rate</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-center text-[10px]">GST %</th>
                                    <th class="px-3 py-2.5 font-label-caps text-label-caps text-right text-[10px]">Amount</th>
                                    <th class="px-3 py-2.5 w-10"></th>
                                </tr>
                            </thead>
                            <tbody id="invoice-items">
                                <!-- Dynamic rows injected here -->
                            </tbody>
                        </table>
                        <div class="p-4 bg-surface-container-low flex justify-between items-center flex-wrap gap-4">
                            <button id="btn-add-item" class="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-85">
                                <span class="material-symbols-outlined">add_circle</span>
                                Add New Line Item
                            </button>
                            <button id="btn-add-item-master" class="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-85">
                                <span class="material-symbols-outlined">playlist_add</span>
                                Add Item to Master List
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Summary & Tax Breakdown -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-stack-lg items-start gap-8">
                    <div class="space-y-stack-lg space-y-6">
                        <!-- Payment & Notes -->
                        <div class="bg-white p-stack-md rounded-xl border border-outline-variant p-md">
                            <h3 class="font-label-caps text-label-caps text-on-secondary-container mb-stack-sm font-bold pb-1 border-b border-outline-variant">PAYMENT TERMS & BANKING</h3>
                            <div class="grid grid-cols-1 gap-4">
                                ${selectedClient && selectedClient.bankAccounts && selectedClient.bankAccounts.length > 0 ? `
                                <div>
                                    <label class="text-label-sm text-on-surface-variant mb-1 block text-xs font-bold text-primary">Select Client Bank Account</label>
                                    <select id="select-client-bank" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md bg-white">
                                        ${selectedClient.bankAccounts.map((acc, idx) => {
                                            const isSel = acc.accountNumber === accountNumber ? 'selected' : '';
                                            return `<option value="${idx}" ${isSel}>${acc.bankName} - ${acc.accountNumber.slice(-4)} (${acc.isDefault ? 'Default' : acc.accountType})</option>`;
                                        }).join('')}
                                        <option value="custom" ${!selectedClient.bankAccounts.some(acc => acc.accountNumber === accountNumber) ? 'selected' : ''}>Custom / Other Details</option>
                                    </select>
                                </div>
                                ` : ''}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Account Name</label>
                                        <input id="input-bank-acc-name" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="e.g. John Doe" type="text" value="${accountName}">
                                    </div>
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Bank Name</label>
                                        <input id="input-bank-name" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="e.g. HDFC Bank" type="text" value="${bankName}">
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Account Number</label>
                                        <input id="input-bank-acc-no" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Enter account number" type="text" value="${accountNumber}">
                                    </div>
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">IFSC Code</label>
                                        <input id="input-bank-ifsc" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="HDFC0001234" type="text" value="${ifscCode}">
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Branch Name</label>
                                        <input id="input-bank-branch" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Branch Name" type="text" value="${branchName}">
                                    </div>
                                    <div>
                                        <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Account Type</label>
                                        <input id="input-bank-type" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Savings / Current" type="text" value="${accountType}">
                                    </div>
                                </div>
                                <div class="w-full">
                                    <label class="text-label-sm text-on-surface-variant mb-1 block text-xs">Terms & Conditions / Notes (Optional)</label>
                                    <textarea id="input-terms-notes" class="form-input text-xs resize-none w-full px-2 py-1.5 border border-outline-variant rounded-md" placeholder="Enter payment terms, late fees, or additional notes..." rows="3">${termsNotes}</textarea>
                                </div>
                            </div>
                        </div>
                        
                        <!-- QR Integration -->
                        <div class="relative overflow-hidden rounded-xl h-28 border border-outline-variant flex items-center bg-primary text-white p-4">
                            <div class="p-stack-md z-10">
                                <h4 class="font-bold text-sm">Fast-Track Payments</h4>
                                <p class="text-on-primary/70 text-xs">Enable UPI QR code on the invoice for 3x faster settlements.</p>
                                <button class="mt-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded font-bold text-[10px]" onclick="alert('UPI QR integration enabled!')">Activate UPI</button>
                            </div>
                            <div class="absolute right-[-20px] top-[-20px] opacity-10">
                                <span class="material-symbols-outlined text-[140px]">qr_code_2</span>
                            </div>
                        </div>
                    </div>

                    <!-- Totals Card -->
                    <div id="totals-calculation-card" class="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                        <!-- Calculated dynamically -->
                    </div>
                </div>
            </div>

            <!-- Customer Selection Overlay Modal -->
            <div id="customer-select-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-md shadow-lg space-y-md p-6">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <h3 class="font-headline-sm text-primary font-bold">Select Customer</h3>
                        <button id="btn-close-select-modal" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div class="space-y-sm space-y-3">
                        <div class="flex gap-2 items-center">
                            <input id="client-search" class="flex-1 p-md border border-outline-variant rounded-lg font-body-md outline-none text-sm" placeholder="Search customers..." type="text"/>
                            <button id="btn-add-customer-inline" class="h-10 px-sm bg-primary text-white rounded-lg font-label-caps text-[10px]">
                                + Add New
                            </button>
                        </div>
                        <div id="clients-list-container" class="space-y-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                            <!-- Customers listed dynamically -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add New Customer Inline Modal -->
            <div id="inline-add-client-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[110] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-2xl shadow-lg space-y-md max-h-[90vh] overflow-y-auto custom-scrollbar p-6">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <h3 class="font-headline-sm text-primary font-bold">Add New Customer</h3>
                        <button id="btn-close-inline-modal" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form id="inline-add-client-form" class="space-y-md space-y-3">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Customer Name *</label>
                                <input id="inline-client-name" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Customer Name"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Billing Email</label>
                                <input id="inline-client-email" type="email" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. billing@company.com"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Phone Number</label>
                                <input id="inline-client-phone" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. +1-555-0100"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Currency *</label>
                                <select id="inline-client-currency" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary outline-none bg-white" required>
                                    <option value="" disabled selected>Select Currency</option>
                                    <option value="USD ($)">USD ($)</option>
                                    <option value="EUR (€)">EUR (€)</option>
                                    <option value="INR (₹)">INR (₹)</option>
                                    <option value="GBP (£)">GBP (£)</option>
                                    <option value="AUD ($)">AUD ($)</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Credit Period (Days)</label>
                                <input id="inline-client-credit-period" type="number" min="0" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" placeholder="e.g. 30" value="15"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">GSTIN / GST No</label>
                                <input id="inline-client-gstin" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" placeholder="e.g. 27AAAAA1111A1Z5"/>
                            </div>
                        </div>

                        <div class="border-t border-outline-variant pt-md space-y-md">
                            <h4 class="font-label-caps text-primary font-bold text-xs">Billing Address</h4>
                            
                            <div class="grid grid-cols-1 gap-md">
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant text-xs">Address Line 1 *</label>
                                    <input id="inline-client-address1" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Address Line 1"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant text-xs">Address Line 2</label>
                                    <input id="inline-client-address2" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter Address Line 2"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant text-xs">Address Line 3</label>
                                    <input id="inline-client-address3" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter Address Line 3"/>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-md">
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant text-xs">City *</label>
                                    <input id="inline-client-city" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter City"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant text-xs">Pincode *</label>
                                    <input id="inline-client-pincode" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Pincode"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                     <label class="font-label-caps text-on-surface-variant text-xs">State *</label>
                                     <input id="inline-client-state" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" required placeholder="Select or type state..."/>
                                 </div>
                                 <div class="flex flex-col gap-xs">
                                     <label class="font-label-caps text-on-surface-variant text-xs">Country *</label>
                                     <input id="inline-client-country" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white text-sm" required placeholder="Select or type country..."/>
                                 </div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-sm gap-sm">
                            <button id="btn-cancel-inline-modal" type="button" class="px-lg py-md border border-outline-variant rounded-lg font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                            <button type="submit" class="px-lg py-md bg-primary text-white rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-colors">Save Customer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Item to Master List Modal -->
            <div id="item-master-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[110] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-md shadow-lg space-y-md p-6">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <h3 class="font-headline-sm text-primary font-bold">Add Item to Master List</h3>
                        <button id="btn-close-item-master-modal" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form id="item-master-form" class="space-y-md space-y-3">
                        <div class="flex flex-col gap-xs">
                            <label class="font-label-caps text-on-surface-variant text-xs">Item / Service Name *</label>
                            <input id="master-item-name" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="e.g. Graphic Designing"/>
                        </div>
                        <div class="flex flex-col gap-xs">
                            <label class="font-label-caps text-on-surface-variant text-xs">Default Description</label>
                            <textarea id="master-item-desc" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter default description" rows="2"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-md">
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">HSN Code</label>
                                <input id="master-item-hsn" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="9983"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs">Default Rate *</label>
                                <input id="master-item-rate" type="number" min="0" step="0.01" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="0.00"/>
                            </div>
                        </div>
                        <div class="flex flex-col gap-xs">
                            <label class="font-label-caps text-on-surface-variant text-xs">GST Rate *</label>
                            <select id="master-item-gst" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary outline-none bg-white" required>
                                <option value="18">18%</option>
                                <option value="12">12%</option>
                                <option value="5">5%</option>
                                <option value="28">28%</option>
                                <option value="0">0%</option>
                            </select>
                        </div>
                        <div class="flex justify-end pt-sm gap-sm">
                            <button id="btn-cancel-item-master-modal" type="button" class="px-lg py-md border border-outline-variant rounded-lg font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                            <button type="submit" class="px-lg py-md bg-primary text-white rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-colors">Save Item</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Invoice Number Settings Modal -->
            <div id="invoice-settings-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[110] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-md shadow-lg space-y-md p-6">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <h3 class="font-headline-sm text-primary font-bold">Invoice Number Settings</h3>
                        <button id="btn-close-invoice-settings" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form id="invoice-settings-form" class="space-y-md space-y-3">
                        <div class="flex flex-col gap-xs">
                            <label class="font-label-caps text-on-surface-variant text-xs font-bold">Prefix</label>
                            <input id="settings-prefix" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs" placeholder="e.g. GST, INV, HOTEL"/>
                        </div>
                        <div class="grid grid-cols-2 gap-md gap-4">
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs font-bold">Next Start Number</label>
                                <input id="settings-next-start" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs" placeholder="e.g. 0001, 1"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs font-bold">Suffix</label>
                                <input id="settings-suffix" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs" placeholder="e.g. /2026"/>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-md gap-4">
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs font-bold">Start Date</label>
                                <input id="settings-start-date" type="date" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs bg-white"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-xs font-bold">Reset Date</label>
                                <input id="settings-reset-date" type="date" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none text-xs bg-white"/>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 py-1">
                            <input type="checkbox" id="settings-admin-override" class="rounded border-outline-variant text-primary focus:ring-primary">
                            <label for="settings-admin-override" class="text-label-sm text-on-surface-variant text-xs font-bold">Admin Override (Allow manual editing)</label>
                        </div>
                        <div class="flex justify-end pt-sm gap-sm gap-2">
                            <button id="btn-cancel-invoice-settings" type="button" class="px-lg py-md border border-outline-variant rounded-lg font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-low transition-colors text-xs">Cancel</button>
                            <button type="submit" class="px-lg py-md bg-primary text-white rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-colors text-xs font-bold">Save Settings</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Sticky Bottom Action Bar -->
            <footer class="bg-surface-container-highest border-t border-outline-variant fixed bottom-0 left-0 w-full px-container-padding py-stack-md flex justify-between items-center z-40 p-4">
                <div class="hidden md:flex gap-6 text-xs text-on-surface-variant">
                    <span>© 2024 ${companyProfile.name}. All GST calculations are indicative.</span>
                </div>
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="flex items-center gap-2 mr-4 md:mr-8">
                        <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">security</span>
                        <span class="text-[10px] font-label-caps text-primary">SECURE ENCRYPTION</span>
                    </div>
                    <button id="btn-generate-send" class="flex-grow md:flex-none px-8 py-3 bg-primary text-on-primary font-bold rounded-lg shadow-lg hover:bg-opacity-90 transition-all text-xs uppercase tracking-wider">
                        Generate & Send
                    </button>
                </div>
            </footer>
        `;

        renderItems();
        calculateAndRenderTotals();
        setupInteractiveHandlers();
    };

    const setupInteractiveHandlers = () => {
        // Direct Inputs Bindings
        const clientInput = document.getElementById('input-client-name');
        clientInput.addEventListener('input', (e) => {
            clientName = e.target.value;
            const currentClients = clients;
            const query = e.target.value.trim().toLowerCase();
            const dropdown = document.getElementById('autocomplete-dropdown');
            if (!query) {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
                return;
            }
            const matches = currentClients.filter(c => 
                c.name.toLowerCase().includes(query) ||
                (c.company && c.company.toLowerCase().includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query)) ||
                (c.phone && c.phone.includes(query))
            );
            if (matches.length > 0) {
                dropdown.classList.remove('hidden');
                dropdown.innerHTML = matches.map(c => `
                    <div data-autocomplete-id="${c.id}" class="px-4 py-2 hover:bg-surface-container-low cursor-pointer text-xs md:text-sm text-primary flex justify-between items-center border-b border-outline-variant last:border-0">
                        <div>
                            <p class="font-bold">${c.name}</p>
                            ${c.company ? `<p class="text-[10px] text-on-surface-variant">${c.company}</p>` : ''}
                        </div>
                        <span class="text-[10px] text-on-surface-variant font-data-mono bg-surface-container-low px-1 rounded">${c.currency || 'USD'}</span>
                    </div>
                `).join('');
                
                dropdown.querySelectorAll('[data-autocomplete-id]').forEach(el => {
                    el.addEventListener('click', () => {
                        const cid = el.getAttribute('data-autocomplete-id');
                        const c = currentClients.find(item => item.id === cid);
                        if (c) {
                            selectedClient = c;
                            clientName = c.name;
                            clientAddress = [c.address1, c.address2, `${c.city}, ${c.state} - ${c.pincode}`, c.country].filter(Boolean).join('\n');
                            clientGstin = c.gstin || '';
                            creditPeriod = c.creditPeriod || '15 Days';
                            updatePlaceOfSupply();
                            updateDueDateFromCreditPeriod();
                            renderForm();
                        }
                    });
                });
            } else {
                dropdown.classList.add('hidden');
                dropdown.innerHTML = '';
            }
        });

        // Close autocomplete dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('autocomplete-dropdown');
            const input = document.getElementById('input-client-name');
            if (dropdown && input && !dropdown.contains(e.target) && e.target !== input) {
                dropdown.classList.add('hidden');
            }
        });
        document.getElementById('input-client-gstin').addEventListener('input', (e) => { 
            clientGstin = e.target.value; 
            updatePlaceOfSupply();
        });
        document.getElementById('input-client-address').addEventListener('input', (e) => { 
            clientAddress = e.target.value; 
            updatePlaceOfSupply();
        });
        document.getElementById('select-place-of-supply').addEventListener('change', (e) => { 
            placeOfSupply = e.target.value; 
            calculateAndRenderTotals();
        });

        // Shipping toggle & Shipping address bindings
        const shippingToggle = document.getElementById('shipping-toggle');
        if (shippingToggle) {
            shippingToggle.addEventListener('change', (e) => {
                isShippingDifferent = e.target.checked;
                updatePlaceOfSupply();
                renderForm();
            });
        }
        const shippingAddressInput = document.getElementById('input-shipping-address');
        if (shippingAddressInput) {
            shippingAddressInput.addEventListener('input', (e) => {
                shippingAddress = e.target.value;
                updatePlaceOfSupply();
            });
        }
        document.getElementById('input-invoice-date').addEventListener('input', (e) => { 
            invoiceDate = e.target.value; 
            updateDueDateFromCreditPeriod();
            if (!getNumberSettings().adminOverride) {
                invoiceId = generateInvoiceNumber(invoiceDate);
                const invNumEl = document.getElementById('input-invoice-number');
                if (invNumEl) {
                    invNumEl.value = invoiceId;
                }
            }
        });

        const invNumEl = document.getElementById('input-invoice-number');
        if (invNumEl) {
            invNumEl.addEventListener('input', (e) => {
                invoiceId = e.target.value;
            });
        }

        // Invoice settings modal triggers
        const btnInvoiceSettings = document.getElementById('btn-invoice-settings');
        const invoiceSettingsModal = document.getElementById('invoice-settings-modal');
        if (btnInvoiceSettings && invoiceSettingsModal) {
            btnInvoiceSettings.addEventListener('click', () => {
                const settings = getNumberSettings();
                document.getElementById('settings-prefix').value = settings.prefix || '';
                document.getElementById('settings-next-start').value = settings.nextStart || '001';
                document.getElementById('settings-suffix').value = settings.suffix || '';
                document.getElementById('settings-start-date').value = settings.startDate || '';
                document.getElementById('settings-reset-date').value = settings.resetDate || '';
                document.getElementById('settings-admin-override').checked = !!settings.adminOverride;
                invoiceSettingsModal.classList.remove('hidden');
            });
        }

        const btnCloseInvoiceSettings = document.getElementById('btn-close-invoice-settings');
        if (btnCloseInvoiceSettings) {
            btnCloseInvoiceSettings.addEventListener('click', () => {
                invoiceSettingsModal.classList.add('hidden');
            });
        }

        const btnCancelInvoiceSettings = document.getElementById('btn-cancel-invoice-settings');
        if (btnCancelInvoiceSettings) {
            btnCancelInvoiceSettings.addEventListener('click', () => {
                invoiceSettingsModal.classList.add('hidden');
            });
        }

        const invoiceSettingsForm = document.getElementById('invoice-settings-form');
        if (invoiceSettingsForm) {
            invoiceSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const settings = {
                    prefix: document.getElementById('settings-prefix').value.trim(),
                    nextStart: document.getElementById('settings-next-start').value.trim() || '001',
                    suffix: document.getElementById('settings-suffix').value.trim(),
                    startDate: document.getElementById('settings-start-date').value,
                    resetDate: document.getElementById('settings-reset-date').value,
                    adminOverride: document.getElementById('settings-admin-override').checked
                };
                await saveNumberSettings(settings);
                numberSettings = settings;
                invoiceSettingsModal.classList.add('hidden');
                
                invoiceId = generateInvoiceNumber(invoiceDate);
                renderForm();
                alert('Invoice number settings saved successfully!');
            });
        }
        document.getElementById('input-po-no').addEventListener('input', (e) => { poNo = e.target.value; });
        document.getElementById('input-po-date').addEventListener('input', (e) => { poDate = e.target.value; });
        const ewayInput = document.getElementById('input-eway-no');
        const vehicleStar = document.getElementById('vehicle-required-star');
        const updateVehicleRequirement = () => {
            if (ewayInput && vehicleStar) {
                if (ewayInput.value.trim() !== '') {
                    vehicleStar.classList.remove('hidden');
                } else {
                    vehicleStar.classList.add('hidden');
                }
            }
        };
        if (ewayInput) {
            ewayInput.addEventListener('input', (e) => {
                ewayBillNo = e.target.value;
                updateVehicleRequirement();
            });
            updateVehicleRequirement();
        }
        const vehicleInput = document.getElementById('input-vehicle-no');
        if (vehicleInput) {
            vehicleInput.addEventListener('input', (e) => {
                vehicleNo = e.target.value;
            });
        }
        document.getElementById('input-credit-period').addEventListener('input', (e) => { 
            creditPeriod = e.target.value; 
            updateDueDateFromCreditPeriod();
        });
        document.getElementById('input-due-date').addEventListener('input', (e) => { dueDate = e.target.value; });

        document.getElementById('input-bank-acc-name').addEventListener('input', (e) => { accountName = e.target.value; });
        document.getElementById('input-bank-name').addEventListener('input', (e) => { bankName = e.target.value; });
        document.getElementById('input-bank-acc-no').addEventListener('input', (e) => { accountNumber = e.target.value; });
        document.getElementById('input-bank-ifsc').addEventListener('input', (e) => { ifscCode = e.target.value; });
        const bankBranchEl = document.getElementById('input-bank-branch');
        if (bankBranchEl) bankBranchEl.addEventListener('input', (e) => { branchName = e.target.value; });
        const bankTypeEl = document.getElementById('input-bank-type');
        if (bankTypeEl) bankTypeEl.addEventListener('input', (e) => { accountType = e.target.value; });
        
        const selectClientBank = document.getElementById('select-client-bank');
        if (selectClientBank) {
            selectClientBank.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                    const idx = parseInt(val);
                    const acc = selectedClient.bankAccounts[idx];
                    if (acc) {
                        accountName = acc.accountHolderName;
                        bankName = acc.bankName;
                        accountNumber = acc.accountNumber;
                        ifscCode = acc.ifscCode;
                        branchName = acc.branchName || '';
                        accountType = acc.accountType || 'Savings';

                        document.getElementById('input-bank-acc-name').value = accountName;
                        document.getElementById('input-bank-name').value = bankName;
                        document.getElementById('input-bank-acc-no').value = accountNumber;
                        document.getElementById('input-bank-ifsc').value = ifscCode;
                        document.getElementById('input-bank-branch').value = branchName;
                        document.getElementById('input-bank-type').value = accountType;
                    }
                }
            });
        }

        document.getElementById('input-terms-notes').addEventListener('input', (e) => { termsNotes = e.target.value; });

        // Item Master Modal triggers
        const itemMasterModal = document.getElementById('item-master-modal');
        const btnAddItemMaster = document.getElementById('btn-add-item-master');
        if (btnAddItemMaster) {
            btnAddItemMaster.addEventListener('click', () => {
                itemMasterModal.classList.remove('hidden');
            });
        }
        const btnCloseItemMaster = document.getElementById('btn-close-item-master-modal');
        if (btnCloseItemMaster) {
            btnCloseItemMaster.addEventListener('click', () => {
                itemMasterModal.classList.add('hidden');
            });
        }
        const btnCancelItemMaster = document.getElementById('btn-cancel-item-master-modal');
        if (btnCancelItemMaster) {
            btnCancelItemMaster.addEventListener('click', () => {
                itemMasterModal.classList.add('hidden');
            });
        }

        // Save Item to Master list
        const itemMasterForm = document.getElementById('item-master-form');
        if (itemMasterForm) {
            itemMasterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('master-item-name').value.trim();
                const description = document.getElementById('master-item-desc').value.trim();
                const hsn = document.getElementById('master-item-hsn').value.trim() || '9983';
                const rate = parseFloat(document.getElementById('master-item-rate').value) || 0;
                const gstRate = parseInt(document.getElementById('master-item-gst').value) || 18;

                if (masterItems.some(mi => mi.name.toLowerCase() === name.toLowerCase())) {
                    alert('An item or service with this name already exists in the master list.');
                    return;
                }

                const newItem = {
                    id: `i${Date.now()}`,
                    name,
                    description,
                    hsn,
                    rate,
                    gstRate
                };

                await saveMasterItem(newItem);
                masterItems.unshift(newItem);
                renderItems();
                itemMasterForm.reset();
                itemMasterModal.classList.add('hidden');
                alert('Item saved to master list successfully!');
            });
        }

        // Direct Add Customer trigger
        document.getElementById('btn-add-customer-direct').addEventListener('click', () => {
            const inlineModal = document.getElementById('inline-add-client-modal');
            inlineModal.classList.remove('hidden');
        });

        const btnCloseSelectModal = document.getElementById('btn-close-select-modal');
        if (btnCloseSelectModal) {
            btnCloseSelectModal.addEventListener('click', () => {
                const selModal = document.getElementById('customer-select-modal');
                if (selModal) selModal.classList.add('hidden');
            });
        }

        // Add Customer Inline triggers
        const inlineModal = document.getElementById('inline-add-client-modal');
        document.getElementById('btn-add-customer-inline').addEventListener('click', () => {
            inlineModal.classList.remove('hidden');
        });

        document.getElementById('btn-close-inline-modal').addEventListener('click', () => {
            inlineModal.classList.add('hidden');
        });
        document.getElementById('btn-cancel-inline-modal').addEventListener('click', () => {
            inlineModal.classList.add('hidden');
        });

        // Initialize searchable dropdowns for new customer modal
        const inlineStateInput = document.getElementById('inline-client-state');
        const inlineCountryInput = document.getElementById('inline-client-country');
        if (inlineStateInput) {
            initializeSearchableDropdown(inlineStateInput, () => INDIAN_STATES_AND_UTS);
        }
        if (inlineCountryInput) {
            initializeSearchableDropdown(inlineCountryInput, () => AppState.getCountries(), (newCountry) => {
                AppState.saveCountry(newCountry);
            });
        }

        // City/District input auto-fill for state and country
        const cityInput = document.getElementById('inline-client-city');
        if (cityInput) {
            const cityToStateCountry = {
                'mumbai': { state: 'Maharashtra', country: 'India' },
                'pune': { state: 'Maharashtra', country: 'India' },
                'nagpur': { state: 'Maharashtra', country: 'India' },
                'thane': { state: 'Maharashtra', country: 'India' },
                'navi mumbai': { state: 'Maharashtra', country: 'India' },
                'bengaluru': { state: 'Karnataka', country: 'India' },
                'bangalore': { state: 'Karnataka', country: 'India' },
                'mysore': { state: 'Karnataka', country: 'India' },
                'delhi': { state: 'Delhi', country: 'India' },
                'new delhi': { state: 'Delhi', country: 'India' },
                'noida': { state: 'Uttar Pradesh', country: 'India' },
                'gurugram': { state: 'Haryana', country: 'India' },
                'gurgaon': { state: 'Haryana', country: 'India' },
                'chennai': { state: 'Tamil Nadu', country: 'India' },
                'hyderabad': { state: 'Telangana', country: 'India' },
                'kolkata': { state: 'West Bengal', country: 'India' },
                'ahmedabad': { state: 'Gujarat', country: 'India' },
                'surat': { state: 'Gujarat', country: 'India' },
                'singapore': { state: 'Singapore', country: 'Singapore' },
                'new york': { state: 'New York', country: 'United States' },
                'san francisco': { state: 'California', country: 'United States' },
                'london': { state: 'London', country: 'United Kingdom' }
            };
            cityInput.addEventListener('input', (e) => {
                const cityVal = e.target.value.trim().toLowerCase();
                if (cityToStateCountry[cityVal]) {
                    const info = cityToStateCountry[cityVal];
                    const stateEl = document.getElementById('inline-client-state');
                    const countryEl = document.getElementById('inline-client-country');
                    if (stateEl) stateEl.value = info.state;
                    if (countryEl) countryEl.value = info.country;
                }
            });
        }

        // Inline Add Customer Form Submit
        document.getElementById('inline-add-client-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('inline-client-name').value;
            const email = document.getElementById('inline-client-email').value;
            const phone = document.getElementById('inline-client-phone').value;
            const currency = document.getElementById('inline-client-currency').value;
            const creditPeriodVal = document.getElementById('inline-client-credit-period').value || '15';
            const address1 = document.getElementById('inline-client-address1').value;
            const address2 = document.getElementById('inline-client-address2').value;
            const address3 = document.getElementById('inline-client-address3').value;
            const city = document.getElementById('inline-client-city').value;
            const pincode = document.getElementById('inline-client-pincode').value;
            const state = document.getElementById('inline-client-state').value;
            const country = document.getElementById('inline-client-country').value;

            const parts = name.trim().split(' ');
            const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();

            const inlineGstinInput = document.getElementById('inline-client-gstin');
            const gstin = inlineGstinInput ? inlineGstinInput.value.trim() : '';

            const newClient = {
                id: `c${Date.now()}`,
                name,
                email,
                phone,
                currency,
                creditPeriod: `${creditPeriodVal} Days`,
                gstin,
                address1,
                address2,
                address3,
                city,
                pincode,
                state,
                country,
                status: 'Active',
                initials,
                lastInvoice: 'Never'
            };

            const result = await AppState.saveClient(newClient);
            if (result.success) {
                // Refresh local clients list
                const updatedClients = await AppState.getClients();
                clients.length = 0;
                clients.push(...updatedClients);

                // Select customer
                selectedClient = newClient;
                clientName = newClient.name;
                clientAddress = [newClient.address1, newClient.address2, `${newClient.city}, ${newClient.state} - ${newClient.pincode}`, newClient.country].filter(Boolean).join('\n');
                clientGstin = newClient.gstin || '';
                creditPeriod = newClient.creditPeriod;
                updatePlaceOfSupply();
                updateDueDateFromCreditPeriod();

                // Re-render Form
                renderForm();
                inlineModal.classList.add('hidden');
            } else {
                alert(result.error);
            }
        });

        const calculateTotal = () => {
            const taxableValue = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
            let taxTotal = 0;
            items.forEach(item => {
                const itemVal = item.quantity * item.rate;
                taxTotal += itemVal * (item.gstRate / 100);
            });
            return taxableValue + taxTotal;
        };

        // Save Draft & Generate actions
        const saveInvoiceAction = async (status) => {
            if (!clientName) {
                alert('Please provide a Client Name.');
                return;
            }
            if (items.some(it => !it.name || it.rate <= 0)) {
                alert('Please select an item and provide positive rates for all line items.');
                return;
            }
            if (ewayBillNo.trim() !== '' && vehicleNo.trim() === '') {
                alert('Vehicle Number is mandatory when E-way Bill Number is provided.');
                return;
            }
            const newInvoice = {
                id: invoiceId,
                clientName,
                clientEmail: selectedClient ? selectedClient.email : '',
                initials: selectedClient ? selectedClient.initials : clientName.substring(0,2).toUpperCase(),
                date: invoiceDate,
                dueDate: dueDate,
                amount: calculateTotal(),
                status,
                items,
                placeOfSupply,
                bankName,
                accountName,
                accountNumber,
                ifscCode,
                branchName,
                accountType,
                termsNotes,
                poNo,
                poDate,
                ewayBillNo,
                vehicleNo
            };
            await AppState.saveInvoice(newInvoice);
            alert(`Invoice ${status === 'Draft' ? 'saved as Draft' : 'generated'} successfully!`);
            router.navigateTo('invoices');
        };

        document.getElementById('btn-save-draft').addEventListener('click', () => saveInvoiceAction('Draft'));
        document.getElementById('btn-generate-invoice-top').addEventListener('click', () => saveInvoiceAction('Pending'));
        document.getElementById('btn-generate-send').addEventListener('click', () => saveInvoiceAction('Pending'));
        const btnExit = document.getElementById('btn-exit');
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (confirm('Discard edits and leave?')) router.navigateTo('dashboard');
            });
        }
    };

    const renderCustomerList = () => {
        const list = document.getElementById('clients-list-container');
        const searchInput = document.getElementById('client-search');
        if (!list) return;

        const populate = async (filter = '') => {
            const currentClients = await AppState.getClients();
            const filtered = currentClients.filter(c => 
                c.name.toLowerCase().includes(filter.toLowerCase()) ||
                (c.email && c.email.toLowerCase().includes(filter.toLowerCase())) ||
                (c.phone && c.phone.includes(filter))
            );

            list.innerHTML = filtered.map(c => `
                <div data-client-id="${c.id}" class="p-sm p-2 border border-outline-variant hover:border-primary rounded-lg cursor-pointer transition-all flex items-center justify-between text-xs">
                    <span class="font-bold text-primary">${c.name}</span>
                    <span class="text-[10px] text-on-surface-variant font-data-mono bg-surface-container-low px-1 rounded">${c.currency || 'USD'}</span>
                </div>
            `).join('');

            list.querySelectorAll('[data-client-id]').forEach(el => {
                el.addEventListener('click', () => {
                    const cid = el.getAttribute('data-client-id');
                    const c = currentClients.find(item => item.id === cid);
                    if (c) {
                        selectedClient = c;
                        clientName = c.name;
                        clientAddress = [c.address1, c.address2, `${c.city}, ${c.state} - ${c.pincode}`, c.country].filter(Boolean).join('\n');
                        clientGstin = c.gstin || '';
                        creditPeriod = c.creditPeriod || '15 Days';

                        // Populating client bank accounts
                        const accounts = c.bankAccounts || [];
                        if (accounts.length > 0) {
                            const defaultAcc = accounts.find(a => a.isDefault) || accounts[0];
                            accountName = defaultAcc.accountHolderName;
                            bankName = defaultAcc.bankName;
                            accountNumber = defaultAcc.accountNumber;
                            ifscCode = defaultAcc.ifscCode;
                            branchName = defaultAcc.branchName || '';
                            accountType = defaultAcc.accountType || 'Savings';
                        } else {
                            // Fallback to company profile
                            accountName = companyProfile.accountName || '';
                            bankName = companyProfile.bankName || '';
                            accountNumber = companyProfile.accountNumber || '';
                            ifscCode = companyProfile.ifscCode || '';
                            branchName = companyProfile.branchName || '';
                            accountType = companyProfile.accountType || 'Current';
                        }

                        updatePlaceOfSupply();
                        updateDueDateFromCreditPeriod();
                        renderForm();
                    }
                });
            });
        };

        populate();
        searchInput.addEventListener('input', (e) => populate(e.target.value));
    };

    const renderItems = () => {
        const tbody = document.getElementById('invoice-items');
        if (!tbody) return;

        tbody.innerHTML = items.map((it, idx) => `
            <tr class="border-b ${it.name ? 'border-outline-variant/40' : 'border-outline-variant'} hover:bg-surface-container-low/50 transition-colors align-middle">
                <td class="px-3 py-2 text-center text-label-sm text-on-surface-variant w-10">${idx + 1}</td>
                <td class="px-3 py-2 min-w-[180px]">
                    <div class="relative">
                        <input data-index="${idx}" data-field="name" type="text" class="form-input text-xs border border-outline-variant rounded-md w-full px-2 py-1.5 bg-white" placeholder="Select or type item..." value="${it.name || ''}" autocomplete="off">
                        <div id="autocomplete-dropdown-item-${idx}" class="dropdown-menu-custom hidden"></div>
                    </div>
                </td>
                <td class="px-3 py-2 w-20">
                    <input data-index="${idx}" data-field="hsn" class="form-input text-xs border border-outline-variant rounded-md text-center w-full px-2 py-1.5 bg-white" placeholder="9983" type="text" value="${it.hsn}">
                </td>
                <td class="px-3 py-2 w-16">
                    <input data-index="${idx}" data-field="quantity" class="form-input text-xs border border-outline-variant rounded-md text-center w-full px-2 py-1.5 bg-white" type="number" min="1" value="${it.quantity}">
                </td>
                <td class="px-3 py-2 w-28">
                    <input data-index="${idx}" data-field="rate" class="form-input text-xs border border-outline-variant rounded-md text-right w-full px-2 py-1.5 bg-white" placeholder="0.00" type="number" min="0" step="0.01" value="${it.rate}">
                </td>
                <td class="px-3 py-2 w-20">
                    <select data-index="${idx}" data-field="gstRate" class="form-input text-xs border border-outline-variant rounded-md text-center px-1 py-1.5 bg-white w-full">
                        <option value="18" ${it.gstRate === 18 ? 'selected' : ''}>18%</option>
                        <option value="12" ${it.gstRate === 12 ? 'selected' : ''}>12%</option>
                        <option value="5" ${it.gstRate === 5 ? 'selected' : ''}>5%</option>
                        <option value="28" ${it.gstRate === 28 ? 'selected' : ''}>28%</option>
                        <option value="0" ${it.gstRate === 0 ? 'selected' : ''}>0%</option>
                    </select>
                </td>
                <td class="px-3 py-2 text-right font-body-tabular text-on-surface text-xs w-28 font-semibold">₹ ${(it.quantity * it.rate).toFixed(2)}</td>
                <td class="px-3 py-2 text-center w-10">
                    <button data-delete-idx="${idx}" class="text-error hover:opacity-80 hover:scale-110 transition-all"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                </td>
            </tr>
            ${it.name ? `
            <tr class="border-b border-outline-variant bg-surface-container-lowest/50">
                <td class="px-3 pb-2 pt-0" colspan="1"></td>
                <td class="px-3 pb-2 pt-0" colspan="1">
                    <textarea data-index="${idx}" data-field="description" class="form-input text-xs w-full px-2 py-1.5 border border-outline-variant/60 rounded-md bg-white/80 font-body-main text-on-surface-variant resize-none" placeholder="Description (optional)..." rows="1" style="min-height:28px;">${it.description || ''}</textarea>
                </td>
                <td colspan="6"></td>
            </tr>` : ''}
        `).join('');

        // Bind inner input changes
        tbody.querySelectorAll('input, select, textarea').forEach(input => {
            const idx = parseInt(input.getAttribute('data-index'));
            const field = input.getAttribute('data-field');

            if (field === 'name') {
                input.addEventListener('input', (e) => {
                    const query = e.target.value.trim().toLowerCase();
                    const dropdown = document.getElementById(`autocomplete-dropdown-item-${idx}`);
                    
                    items[idx].name = e.target.value;

                    if (!query) {
                        dropdown.classList.add('hidden');
                        dropdown.innerHTML = '';
                        return;
                    }

                    const matches = masterItems.filter(mi => 
                        mi.name.toLowerCase().includes(query) ||
                        (mi.description && mi.description.toLowerCase().includes(query))
                    );

                    let html = '';
                    if (matches.length > 0) {
                        html += matches.map(mi => `
                            <div data-item-id="${mi.id}" class="dropdown-item-custom flex justify-between items-center text-xs">
                                <div>
                                    <p class="font-bold text-primary">${mi.name}</p>
                                    ${mi.description ? `<p class="text-[10px] text-on-surface-variant truncate max-w-[150px]">${mi.description}</p>` : ''}
                                </div>
                                <span class="text-[10px] text-on-surface-variant font-data-mono bg-white/80 px-1.5 py-0.5 rounded border border-outline-variant/30">₹ ${mi.rate.toFixed(2)}</span>
                            </div>
                        `).join('');
                    } else {
                        html = `<div class="dropdown-item-custom italic text-on-surface-variant text-xs">No results found</div>`;
                    }

                    dropdown.innerHTML = html;
                    dropdown.classList.remove('hidden');

                    // Bind item click
                    dropdown.querySelectorAll('[data-item-id]').forEach(el => {
                        el.addEventListener('mousedown', (e) => {
                            e.preventDefault();
                            const itemId = el.getAttribute('data-item-id');
                            const matchedItem = masterItems.find(mi => mi.id === itemId);
                            if (matchedItem) {
                                items[idx].name = matchedItem.name;
                                items[idx].rate = matchedItem.rate;
                                items[idx].gstRate = matchedItem.gstRate;
                                items[idx].hsn = matchedItem.hsn;
                                items[idx].description = matchedItem.description || '';
                                
                                renderItems();
                                calculateAndRenderTotals();
                            }
                        });
                    });
                });

                input.addEventListener('blur', () => {
                    setTimeout(() => {
                        const dropdown = document.getElementById(`autocomplete-dropdown-item-${idx}`);
                        if (dropdown) dropdown.classList.add('hidden');
                    }, 200);
                });
            } else {
                input.addEventListener('input', (e) => {
                    let val = e.target.value;
                    if (field === 'quantity') val = parseInt(val) || 0;
                    if (field === 'rate') val = parseFloat(val) || 0;
                    if (field === 'gstRate') val = parseInt(val) || 0;

                    items[idx][field] = val;

                    const rowAmountCell = input.closest('tr').querySelector('.font-body-tabular');
                    if (rowAmountCell) {
                        rowAmountCell.textContent = `₹ ${(items[idx].quantity * items[idx].rate).toFixed(2)}`;
                    }
                    calculateAndRenderTotals();
                });
            }
        });

        // Bind delete row
        tbody.querySelectorAll('[data-delete-idx]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(btn.getAttribute('data-delete-idx'));
                if (items.length > 1) {
                    items.splice(idx, 1);
                    renderItems();
                    calculateAndRenderTotals();
                } else {
                    alert('You must have at least one item.');
                }
            });
        });
    };

    const calculateAndRenderTotals = () => {
        const card = document.getElementById('totals-calculation-card');
        if (!card) return;

        // Calculate dynamic tax split based on supply location
        const isIntraState = placeOfSupply.startsWith('27'); // BKC office in MH is state 27

        const taxableValue = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        items.forEach(item => {
            const itemVal = item.quantity * item.rate;
            const itemTax = itemVal * (item.gstRate / 100);
            if (isIntraState) {
                cgstTotal += itemTax / 2;
                sgstTotal += itemTax / 2;
            } else {
                igstTotal += itemTax;
            }
        });

        const totalInvoiceValue = taxableValue + cgstTotal + sgstTotal + igstTotal;

        // Helper to convert number to words
        const numberToWordsRupees = (num) => {
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
        };

        card.innerHTML = `
            <div class="p-stack-md space-y-4 p-4">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-on-surface-variant font-body-main">Taxable Value</span>
                    <span class="font-body-tabular font-bold">₹ ${taxableValue.toFixed(2)}</span>
                </div>
                <div class="space-y-2 border-t border-outline-variant pt-4">
                    <div class="flex justify-between items-center text-sm ${!isIntraState ? 'opacity-40' : ''}">
                        <span class="text-on-surface-variant font-body-main">CGST</span>
                        <span class="font-body-tabular">₹ ${cgstTotal.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm ${!isIntraState ? 'opacity-40' : ''}">
                        <span class="text-on-surface-variant font-body-main">SGST</span>
                        <span class="font-body-tabular">₹ ${sgstTotal.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm ${isIntraState ? 'opacity-40' : ''}">
                        <span class="text-on-surface-variant font-body-main">IGST</span>
                        <span class="font-body-tabular">₹ ${igstTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <div class="bg-primary p-stack-md flex justify-between items-center text-on-primary border-t-4 border-secondary-container p-4">
                <div>
                    <p class="font-label-caps text-[10px] opacity-70">TOTAL AMOUNT</p>
                    <p class="font-body-main text-[9px] uppercase mt-1 italic leading-tight max-w-[280px]">
                        ${numberToWordsRupees(totalInvoiceValue)}
                    </p>
                </div>
                <div class="text-right">
                    <p class="font-display-invoice text-[22px] font-bold text-white">₹ ${totalInvoiceValue.toFixed(2)}</p>
                </div>
            </div>
        `;
    };

    // Initial Trigger
    renderForm();
    
    // Add default row if empty
    document.getElementById('btn-add-item').addEventListener('click', () => {
        items.push({ name: '', description: '', hsn: '9983', quantity: 1, rate: 0.00, gstRate: 18 });
        renderItems();
        calculateAndRenderTotals();
    });
}
