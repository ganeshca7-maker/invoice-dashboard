import { AppState } from '../app.js';

export async function renderInvoiceDetail(container, router, invoiceId) {
    const invoices = await AppState.getInvoices();
    const clients = await AppState.getClients();
    const companyProfile = await AppState.getCompanyProfile();

    // Find selected invoice
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) {
        container.innerHTML = `
            <div class="p-lg text-center">
                <h3 class="font-headline-md text-error">Invoice Not Found</h3>
                <p class="font-body-md text-on-surface-variant mt-sm">The invoice with ID ${invoiceId} could not be located.</p>
                <button id="btn-back-invoices" class="mt-md bg-primary text-white px-lg py-md rounded-lg font-label-caps text-label-caps">
                    Back to Invoices
                </button>
            </div>
        `;
        document.getElementById('btn-back-invoices').addEventListener('click', () => {
            router.navigateTo('invoices');
        });
        return;
    }

    // Find client details to pull billing address
    const client = clients.find(c => c.name.toLowerCase() === inv.clientName.toLowerCase());

    // Sample items for default mock invoices that don't have items array
    const invItems = inv.items || [
        { description: 'Consulting & Software Integration Services', quantity: 1, rate: inv.amount }
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

    // Helper to format currency
    const formatPrice = (val) => {
        return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Helper to convert number to words
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
    const formattedPoDate = inv.poDate ? new Date(inv.poDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    container.innerHTML = `
        <style>
            @media print {
                body {
                    background: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                /* Hide sidebar, headers, navs, progress bar, and modal overlays when printing */
                #app-layout > aside, 
                #app-layout > header, 
                #app-layout > div > header, 
                #app-layout > nav, 
                .no-print, 
                #top-progress-bar, 
                #company-profile-modal {
                    display: none !important;
                }
                /* Reset margins and paddings for the main layout to allow full-width print */
                .md\:ml-64 {
                    margin-left: 0 !important;
                }
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
        </style>

        <div class="flex flex-col items-center w-full space-y-md">
            <!-- Invoice Toolbar -->
            <div class="w-full max-w-[210mm] mb-stack-md flex justify-between items-end no-print p-sm">
                <div>
                    <h1 class="font-display-invoice text-display-invoice text-primary text-2xl md:text-3xl">${inv.status === 'Paid' ? 'Tax Invoice' : 'Proforma Invoice'}</h1>
                    <p class="text-on-surface-variant font-body-main">Final Preview - Ready for Issuance</p>
                </div>
                <div class="flex gap-stack-sm flex-wrap">
                    <button id="btn-back-to-list" class="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-stack-md py-stack-sm rounded-lg flex items-center gap-2 font-bold hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                        Back
                    </button>
                    <button id="btn-print-invoice" class="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-stack-md py-stack-sm rounded-lg flex items-center gap-2 font-bold hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">print</span>
                        Print
                    </button>
                    <button id="btn-email-client" class="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-stack-md py-stack-sm rounded-lg flex items-center gap-2 font-bold hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">mail</span>
                        Email
                    </button>
                    ${inv.status !== 'Paid' ? `
                    <button id="btn-record-payment" class="bg-primary text-on-primary px-stack-md py-stack-sm rounded-lg flex items-center gap-2 font-bold hover:opacity-90 transition-colors">
                        <span class="material-symbols-outlined text-[18px]">payments</span>
                        Record Payment
                    </button>
                    ` : ''}
                    <button id="btn-activity-log" class="bg-surface-container-highest text-on-surface-variant border border-outline-variant px-stack-md py-stack-sm rounded-lg flex items-center gap-2 font-bold hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-[18px]">history</span>
                        Logs
                    </button>
                </div>
            </div>

            <!-- Print Canvas -->
            <div class="a4-page print-container relative overflow-hidden text-on-surface">
                <!-- Header Section -->
                <header class="flex justify-between items-start mb-stack-lg mb-6 border-b border-outline-variant pb-6">
                    <div class="flex flex-col gap-stack-xs">
                        <div class="flex items-center gap-stack-sm mb-stack-xs">
                            <div class="w-10 h-10 bg-primary text-on-primary flex items-center justify-center rounded mr-2">
                                <span class="material-symbols-outlined text-[24px]">${companyProfile.logoIcon || 'domain'}</span>
                            </div>
                            <h1 class="font-display-invoice text-2xl font-bold text-primary">${inv.status === 'Paid' ? 'TAX INVOICE' : 'PROFORMA INVOICE'}</h1>
                        </div>
                        <div class="font-body-main text-on-surface-variant max-w-xs text-xs md:text-sm">
                            <p class="font-bold text-primary">${companyProfile.name}</p>
                            <p>${companyProfile.address1}</p>
                            ${companyProfile.address2 ? `<p>${companyProfile.address2}</p>` : ''}
                            ${companyProfile.address3 ? `<p>${companyProfile.address3}</p>` : ''}
                            <p>${companyProfile.city || ''}${companyProfile.city && companyProfile.state ? ', ' : ''}${companyProfile.state || ''}${companyProfile.pincode ? ' - ' + companyProfile.pincode : ''}</p>
                            <p>GSTIN: ${companyProfile.gstin}</p>
                            <p>Contact: ${companyProfile.phone} | ${companyProfile.email}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="inline-block px-3 py-1 rounded-sm status-paid font-label-caps mb-stack-sm text-xs font-bold">ORIGINAL FOR RECIPIENT</div>
                        <div class="bg-surface-container-low border border-outline-variant p-stack-sm rounded-lg text-left mt-2 p-2">
                            <p class="font-label-caps text-on-surface-variant text-[10px] uppercase">QR Code Validation</p>
                            <div class="w-20 h-20 bg-white mt-1 border border-outline-variant flex items-center justify-center">
                                <span class="material-symbols-outlined text-outline" style="font-size: 48px;">qr_code_2</span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Metadata Row (Single Compact Horizontal Line) -->
                <div class="grid grid-cols-4 border-t border-b border-outline-variant py-2 mb-stack-lg bg-surface-container-lowest text-xs md:text-sm mb-6">
                    <div class="px-4 border-r border-outline-variant">
                        <p class="font-label-caps text-on-surface-variant text-[10px] uppercase">Invoice Number</p>
                        <p class="font-body-tabular text-primary font-bold">${inv.id}</p>
                    </div>
                    <div class="px-4 border-r border-outline-variant">
                        <p class="font-label-caps text-on-surface-variant text-[10px] uppercase">Invoice Date</p>
                        <p class="font-body-tabular text-primary font-bold">${formattedDate}</p>
                    </div>
                    <div class="px-4 border-r border-outline-variant">
                        <p class="font-label-caps text-on-surface-variant text-[10px] uppercase">P.O. Number</p>
                        <p class="font-body-tabular text-primary font-bold">${inv.poNo || 'N/A'}</p>
                    </div>
                    <div class="px-4">
                        <p class="font-label-caps text-on-surface-variant text-[10px] uppercase">Transport Mode</p>
                        <p class="font-body-tabular text-primary font-bold">${(inv.ewayBillNo || inv.vehicleNo) ? 'Road Cargo' : 'N/A'}</p>
                    </div>
                </div>

                <!-- Address Boxes Side-by-Side -->
                <div class="grid grid-cols-2 gap-stack-lg gap-6 mb-stack-lg mb-6">
                    <div class="border border-outline-variant rounded-lg p-stack-md bg-white p-4">
                        <div class="flex items-center gap-stack-xs mb-stack-sm border-b border-outline-variant pb-stack-xs pb-1 mb-2">
                            <span class="material-symbols-outlined text-primary text-lg mr-1">receipt</span>
                            <h2 class="font-headline-section text-primary uppercase text-sm font-bold">Bill To</h2>
                        </div>
                        <div class="font-body-main space-y-1 text-xs md:text-sm">
                            <p class="font-bold text-primary">${inv.clientName}</p>
                            <p>${client && client.address1 ? `
                                ${client.address1}, ${client.address2 ? client.address2 + ', ' : ''}${client.address3 ? client.address3 + ', ' : ''}${client.city}, ${client.state} - ${client.pincode}
                            ` : `
                                Suite 201, Innovator Towers, Whitefield, Bengaluru, Karnataka - 560066
                            `}</p>
                            <p class="mt-2 text-primary"><strong>GSTIN:</strong> ${client && client.gstin ? client.gstin : 'N/A'}</p>
                            <p><strong>Place of Supply:</strong> ${pSupply}</p>
                        </div>
                    </div>
                    <div class="border border-outline-variant rounded-lg p-stack-md bg-white p-4">
                        <div class="flex items-center gap-stack-xs mb-stack-sm border-b border-outline-variant pb-stack-xs pb-1 mb-2">
                            <span class="material-symbols-outlined text-primary text-lg mr-1">local_shipping</span>
                            <h2 class="font-headline-section text-primary uppercase text-sm font-bold">Ship To</h2>
                        </div>
                        <div class="font-body-main space-y-1 text-xs md:text-sm">
                            <p class="font-bold text-primary">${inv.clientName}</p>
                            <p>${client && client.address1 ? `
                                ${client.address1}, ${client.city}, ${client.state} - ${client.pincode}
                            ` : `
                                Survey No. 15/2, Electronic City Phase II, Near Central Hub, Bengaluru, Karnataka - 560100
                            `}</p>
                            ${inv.ewayBillNo ? `<p class="mt-2 text-primary"><strong>E-way Bill:</strong> ${inv.ewayBillNo}</p>` : ''}
                            ${inv.vehicleNo ? `<p><strong>Vehicle No:</strong> ${inv.vehicleNo}</p>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Item Table -->
                <table class="w-full gst-table border-collapse mb-stack-md mb-6 text-xs md:text-sm">
                    <thead>
                        <tr>
                            <th class="px-4 py-3 text-left font-label-caps w-10 p-2">#</th>
                            <th class="px-4 py-3 text-left font-label-caps p-2">Item Description</th>
                            <th class="px-4 py-3 text-center font-label-caps p-2">HSN/SAC</th>
                            <th class="px-4 py-3 text-right font-label-caps p-2">Qty</th>
                            <th class="px-4 py-3 text-right font-label-caps p-2">Rate</th>
                            <th class="px-4 py-3 text-right font-label-caps p-2">Disc%</th>
                            <th class="px-4 py-3 text-right font-label-caps p-2">Taxable Val.</th>
                        </tr>
                    </thead>
                    <tbody class="font-body-tabular text-primary">
                        ${invItems.map((item, index) => `
                            <tr class="border-b border-outline-variant ${index % 2 === 1 ? 'bg-surface-container-low/20' : ''}">
                                <td class="px-4 py-3 text-on-surface-variant text-center p-2">${String(index + 1).padStart(2, '0')}</td>
                                <td class="px-4 py-3 p-2">
                                    <p class="font-bold text-primary">${item.name || 'Services'}</p>
                                    ${item.description ? `<p class="text-xs text-on-surface-variant font-normal mt-0.5">${item.description}</p>` : ''}
                                </td>
                                <td class="px-4 py-3 text-center p-2">${item.hsn || '9983'}</td>
                                <td class="px-4 py-3 text-right p-2">${item.quantity}.00</td>
                                <td class="px-4 py-3 text-right p-2">${formatPrice(item.rate)}</td>
                                <td class="px-4 py-3 text-right p-2">0%</td>
                                <td class="px-4 py-3 text-right p-2">${formatPrice(item.quantity * item.rate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Calculations & GST Breakdown -->
                <div class="flex justify-between items-start gap-stack-lg gap-6 mb-6">
                    <!-- Left Side: Bank Details & Amount in Words -->
                    <div class="w-3/5 text-xs md:text-sm">
                        <div class="mb-stack-md mb-4">
                            <p class="font-label-caps text-on-surface-variant mb-1 text-[10px] uppercase">Amount in Words</p>
                            <p class="font-body-main italic text-primary font-bold">${numberToWords(totalInvoiceValue)}</p>
                        </div>
                        <div class="bg-surface-container border border-outline-variant p-stack-md rounded-lg p-4">
                            <h3 class="font-label-caps text-primary mb-stack-sm text-[10px] uppercase font-bold border-b pb-1 mb-2">Bank Account Details</h3>
                            <div class="grid grid-cols-2 gap-y-1 font-body-main text-xs">
                                <span class="text-on-surface-variant">Account Name:</span>
                                <span class="font-bold">${inv.accountName || companyProfile.accountName}</span>
                                <span class="text-on-surface-variant">Bank Name:</span>
                                <span class="font-bold">${inv.bankName || companyProfile.bankName}</span>
                                <span class="text-on-surface-variant">Account Number:</span>
                                <span class="font-bold">${inv.accountNumber || companyProfile.accountNumber}</span>
                                <span class="text-on-surface-variant">IFSC Code:</span>
                                <span class="font-bold">${inv.ifscCode || companyProfile.ifscCode}</span>
                                <span class="text-on-surface-variant">Branch:</span>
                                <span class="font-bold">${inv.branchName || companyProfile.branchName || 'BKC, Mumbai'}</span>
                            </div>
                        </div>
                    </div>
                    <!-- Right Side: Tax Summary -->
                    <div class="w-2/5 text-xs md:text-sm">
                        <div class="border-t-4 border-primary bg-surface-container-low p-stack-md rounded-b-lg p-4">
                            <div class="space-y-2 mb-stack-md border-b border-outline-variant pb-stack-sm pb-2 mb-2">
                                <div class="flex justify-between font-body-main">
                                    <span class="text-on-surface-variant">Total Taxable Value</span>
                                    <span class="font-body-tabular font-semibold">${currencySymbol}${formatPrice(taxableValue)}</span>
                                </div>
                                <div class="flex justify-between font-body-main ${igstTotal <= 0 ? 'opacity-30' : ''}">
                                    <span class="text-on-surface-variant">IGST</span>
                                    <span class="font-body-tabular">${currencySymbol}${formatPrice(igstTotal)}</span>
                                </div>
                                <div class="flex justify-between font-body-main ${cgstTotal <= 0 ? 'opacity-30' : ''}">
                                    <span class="text-on-surface-variant">CGST</span>
                                    <span class="font-body-tabular">${currencySymbol}${formatPrice(cgstTotal)}</span>
                                </div>
                                <div class="flex justify-between font-body-main ${sgstTotal <= 0 ? 'opacity-30' : ''}">
                                    <span class="text-on-surface-variant">SGST</span>
                                    <span class="font-body-tabular">${currencySymbol}${formatPrice(sgstTotal)}</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-primary mt-2">
                                <span class="font-headline-section uppercase text-xs font-bold">Total Invoice Value</span>
                                <span class="font-display-invoice text-xl font-bold">${currencySymbol}${formatPrice(totalInvoiceValue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer: T&C and Signatory -->
                <footer class="mt-section-gap border-t border-outline-variant pt-stack-md mt-6 pt-4 text-xs">
                    <div class="flex justify-between items-end gap-6">
                        <div class="w-2/3">
                            <h3 class="font-label-caps text-primary mb-stack-sm uppercase text-[10px] font-bold">Terms &amp; Conditions</h3>
                            <ul class="font-label-sm text-on-surface-variant space-y-1 list-disc pl-4 text-[10px]">
                                ${(inv.termsNotes || '').trim() ? `
                                    ${(inv.termsNotes || '').split('\n').filter(line => line.trim()).map(line => `<li>${line}</li>`).join('')}
                                ` : `
                                    <li>Payment is due within 15 days of the invoice date.</li>
                                    <li>All disputes are subject to Mumbai Jurisdiction only.</li>
                                    <li>GST breakdown is calculated based on the Place of Supply provided.</li>
                                    <li>Please include the Invoice Number with your wire transfer.</li>
                                `}
                            </ul>
                        </div>
                        <div class="text-center w-64">
                            <p class="font-label-caps text-primary mb-12 text-[10px] font-bold">For ${companyProfile.name}</p>
                            <div class="border-t border-primary pt-2 mt-8">
                                <p class="font-label-caps text-primary text-[10px] font-bold">Authorized Signatory</p>
                                <p class="font-label-sm text-on-surface-variant italic text-[9px]">(Digitally Signed Document)</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    `;

    // Bind UI actions
    const backBtn = document.getElementById('btn-back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            router.navigateTo('invoices');
        });
    }

    const printBtn = document.getElementById('btn-print-invoice');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const emailBtn = document.getElementById('btn-email-client');
    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            alert(`Emailing invoice ${inv.id} to ${inv.clientName}...`);
        });
    }

    const recordPaymentBtn = document.getElementById('btn-record-payment');
    if (recordPaymentBtn) {
        recordPaymentBtn.addEventListener('click', async () => {
            inv.status = 'Paid';
            await AppState.saveInvoice(inv); // Save state updates
            alert(`Invoice ${inv.id} has been marked as Paid.`);
            renderInvoiceDetail(container, router, invoiceId); // re-render
        });
    }

    const activityBtn = document.getElementById('btn-activity-log');
    if (activityBtn) {
        activityBtn.addEventListener('click', () => {
            alert(`Access Log for ${inv.id}:\n- Created on: ${inv.date}\n- Viewed on: ${new Date().toLocaleString()}`);
        });
    }
}
