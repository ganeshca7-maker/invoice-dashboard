import { AppState } from '../app.js';

export async function renderDashboard(container, router) {
    const invoices = await AppState.getInvoices();
    
    // Calculate dynamic stats
    const paidTotal = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingTotal = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + i.amount, 0);
    const overdueTotal = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);
    const totalReceivables = paidTotal + pendingTotal + overdueTotal;

    const pendingCount = invoices.filter(i => i.status === 'Pending').length;
    const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

    // Render Main Dashboard Layout
    container.innerHTML = `
        <div id="view-search-target" class="space-y-stack-lg max-w-7xl mx-auto w-full">
            <!-- KPI Section -->
            <section class="grid grid-cols-1 md:grid-cols-3 gap-stack-md">
                <!-- Total Revenue -->
                <div class="bg-surface-container-lowest border border-outline-variant p-stack-md rounded-xl card-hover transition-all duration-300 p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase text-xs font-bold">Total Revenue (FY24)</span>
                        <span class="material-symbols-outlined text-on-primary-container">trending_up</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <h3 class="font-display-invoice text-display-invoice text-primary text-[28px] font-bold">₹${(paidTotal / 100000).toFixed(2)}L</h3>
                        <span class="text-status-paid-text font-bold text-xs">+12.4%</span>
                    </div>
                    <div class="mt-4 h-8 w-full flex items-end gap-[2px]">
                        <div class="flex-1 bg-primary/10 h-1/2 rounded-t-sm"></div>
                        <div class="flex-1 bg-primary/10 h-3/4 rounded-t-sm"></div>
                        <div class="flex-1 bg-primary/20 h-2/3 rounded-t-sm"></div>
                        <div class="flex-1 bg-primary/30 h-full rounded-t-sm"></div>
                        <div class="flex-1 bg-primary/20 h-1/2 rounded-t-sm"></div>
                        <div class="flex-1 bg-primary/50 h-5/6 rounded-t-sm"></div>
                        <div class="flex-1 bg-primary h-full rounded-t-sm"></div>
                    </div>
                </div>
                <!-- Pending GST -->
                <div class="bg-surface-container-lowest border border-outline-variant p-stack-md rounded-xl card-hover transition-all duration-300 p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase text-xs font-bold">Pending GST Liability</span>
                        <span class="material-symbols-outlined text-secondary">schedule</span>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <h3 class="font-display-invoice text-display-invoice text-primary text-[28px] font-bold">₹${((pendingTotal * 0.18) / 100000).toFixed(2)}L</h3>
                    </div>
                    <div class="mt-4 flex items-center gap-2 text-on-surface-variant">
                        <span class="font-label-sm text-label-sm text-xs">Due in 5 days</span>
                        <div class="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                            <div class="w-[70%] h-full bg-secondary"></div>
                        </div>
                    </div>
                </div>
                <!-- Overdue Invoices -->
                <div class="bg-error-container border border-error/20 p-stack-md rounded-xl card-hover transition-all duration-300 p-4">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-label-caps text-label-caps text-error uppercase text-xs font-bold">Overdue Invoices</span>
                        <span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">warning</span>
                    </div>
                    <h3 class="font-display-invoice text-display-invoice text-error text-[28px] font-bold">${overdueCount}</h3>
                    <p class="font-label-sm text-label-sm text-on-error-container mt-4 text-xs">Immediate attention required for ${overdueCount} accounts.</p>
                </div>
            </section>

            <!-- Middle Section: Chart & Side List -->
            <section class="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg gap-6">
                <!-- GST Summary Chart Area -->
                <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
                    <div class="p-stack-md border-b border-outline-variant flex justify-between items-center p-4">
                        <h4 class="font-headline-section text-headline-section font-bold">GST Summary Breakdown</h4>
                        <div class="flex gap-2">
                            <button class="text-xs font-bold px-2 py-1 bg-surface-container-high rounded">Monthly</button>
                            <button class="text-xs font-medium px-2 py-1 text-on-surface-variant">Quarterly</button>
                        </div>
                    </div>
                    <div class="flex-1 min-h-[300px] p-stack-lg flex flex-col justify-end p-6">
                        <!-- Chart Mockup -->
                        <div class="flex items-end justify-between h-48 gap-4 px-4">
                            <!-- Monthly Bars -->
                            <div class="flex-1 flex flex-col gap-1 items-center">
                                <div class="w-full flex flex-col-reverse gap-[2px] h-full">
                                    <div class="h-[20%] bg-primary rounded-sm w-full" title="IGST"></div>
                                    <div class="h-[30%] bg-secondary rounded-sm w-full" title="CGST"></div>
                                    <div class="h-[15%] bg-outline-variant rounded-sm w-full" title="SGST"></div>
                                </div>
                                <span class="font-label-sm text-[10px] text-on-surface-variant">APR</span>
                            </div>
                            <div class="flex-1 flex flex-col gap-1 items-center">
                                <div class="w-full flex flex-col-reverse gap-[2px] h-full">
                                    <div class="h-[25%] bg-primary rounded-sm w-full"></div>
                                    <div class="h-[25%] bg-secondary rounded-sm w-full"></div>
                                    <div class="h-[20%] bg-outline-variant rounded-sm w-full"></div>
                                </div>
                                <span class="font-label-sm text-[10px] text-on-surface-variant">MAY</span>
                            </div>
                            <div class="flex-1 flex flex-col gap-1 items-center">
                                <div class="w-full flex flex-col-reverse gap-[2px] h-full">
                                    <div class="h-[40%] bg-primary rounded-sm w-full"></div>
                                    <div class="h-[20%] bg-secondary rounded-sm w-full"></div>
                                    <div class="h-[30%] bg-outline-variant rounded-sm w-full"></div>
                                </div>
                                <span class="font-label-sm text-[10px] text-on-surface-variant">JUN</span>
                            </div>
                            <div class="flex-1 flex flex-col gap-1 items-center">
                                <div class="w-full flex flex-col-reverse gap-[2px] h-full">
                                    <div class="h-[15%] bg-primary rounded-sm w-full"></div>
                                    <div class="h-[45%] bg-secondary rounded-sm w-full"></div>
                                    <div class="h-[25%] bg-outline-variant rounded-sm w-full"></div>
                                </div>
                                <span class="font-label-sm text-[10px] text-on-surface-variant">JUL</span>
                            </div>
                            <div class="flex-1 flex flex-col gap-1 items-center">
                                <div class="w-full flex flex-col-reverse gap-[2px] h-full">
                                    <div class="h-[30%] bg-primary rounded-sm w-full"></div>
                                    <div class="h-[30%] bg-secondary rounded-sm w-full"></div>
                                    <div class="h-[10%] bg-outline-variant rounded-sm w-full"></div>
                                </div>
                                <span class="font-label-sm text-[10px] text-on-surface-variant">AUG</span>
                            </div>
                        </div>
                        <!-- Legend -->
                        <div class="mt-8 flex justify-center gap-6 border-t border-outline-variant pt-4">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 bg-primary rounded-full"></span>
                                <span class="font-label-sm text-label-sm text-on-surface-variant">IGST</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 bg-secondary rounded-full"></span>
                                <span class="font-label-sm text-label-sm text-on-surface-variant">CGST</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 bg-outline-variant rounded-full"></span>
                                <span class="font-label-sm text-label-sm text-on-surface-variant">SGST</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Upcoming Filings -->
                <div class="bg-surface-container-low border border-outline-variant rounded-xl flex flex-col">
                    <div class="p-stack-md border-b border-outline-variant p-4">
                        <h4 class="font-headline-section text-headline-section font-bold">Upcoming Filings</h4>
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="p-3 bg-surface-container-lowest border-l-4 border-primary rounded-r-lg shadow-sm">
                            <div class="flex justify-between items-start">
                                <h5 class="font-body-tabular font-bold">GSTR-1</h5>
                                <span class="px-2 py-1 bg-error-container text-error font-bold text-[10px] rounded uppercase">Critical</span>
                            </div>
                            <p class="font-label-sm text-on-surface-variant mt-1 text-xs text-on-surface-variant">Monthly Statement of Outward Supplies</p>
                            <div class="mt-3 flex justify-between items-center">
                                <span class="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">event</span> 11 Oct 2024
                                </span>
                                <button class="text-primary font-bold text-xs hover:underline" onclick="alert('Filing GSTR-1...')">File Now</button>
                            </div>
                        </div>
                        <div class="p-3 bg-surface-container-lowest border-l-4 border-secondary rounded-r-lg shadow-sm">
                            <div class="flex justify-between items-start">
                                <h5 class="font-body-tabular font-bold">GSTR-3B</h5>
                                <span class="px-2 py-1 bg-surface-container-high text-on-surface-variant font-bold text-[10px] rounded uppercase">Upcoming</span>
                            </div>
                            <p class="font-label-sm text-on-surface-variant mt-1 text-xs text-on-surface-variant">Monthly Summary Return</p>
                            <div class="mt-3 flex justify-between items-center">
                                <span class="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">event</span> 20 Oct 2024
                                </span>
                                <button class="text-on-surface-variant font-bold text-xs opacity-50 cursor-not-allowed text-xs" disabled>Open 15th</button>
                            </div>
                        </div>
                        <div class="p-3 bg-surface-container-lowest border-l-4 border-outline-variant rounded-r-lg shadow-sm">
                            <div class="flex justify-between items-start">
                                <h5 class="font-body-tabular font-bold">CMP-08</h5>
                                <span class="px-2 py-1 bg-status-paid-bg text-status-paid-text font-bold text-[10px] rounded uppercase">Complete</span>
                            </div>
                            <p class="font-label-sm text-on-surface-variant mt-1 text-xs text-on-surface-variant">Quarterly Statement for Composition Tax</p>
                            <div class="mt-3 flex justify-between items-center">
                                <span class="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                    <span class="material-symbols-outlined text-sm">check_circle</span> Filed 18 Sep
                                </span>
                                <button class="text-primary font-bold text-xs hover:underline" onclick="alert('CMP-08 already completed!')">View Receipt</button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-auto p-4 border-t border-outline-variant">
                        <button class="w-full text-center font-label-caps text-label-caps text-secondary hover:text-primary transition-colors text-xs font-bold uppercase">VIEW ALL COMPLIANCE EVENTS</button>
                    </div>
                </div>
            </section>

            <!-- Recent Invoices Table -->
            <section class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
                <div class="p-stack-md border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
                    <h4 class="font-headline-section text-headline-section font-bold">Recent Invoices</h4>
                    <div class="flex items-center bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant w-full sm:w-64">
                        <span class="material-symbols-outlined text-on-surface-variant mr-2">search</span>
                        <input id="dashboard-search-input" class="bg-transparent border-none focus:ring-0 text-sm w-full p-0 outline-none" placeholder="Search invoices..." type="text"/>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead class="bg-primary text-on-primary">
                            <tr>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Invoice No</th>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Client</th>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Date</th>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Amount</th>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Status</th>
                                <th class="p-table-cell-padding font-label-caps text-label-caps uppercase tracking-widest p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="recent-activity-rows" class="divide-y divide-outline-variant">
                            <!-- Rows dynamically injected -->
                        </tbody>
                    </table>
                </div>
                <div class="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
                    <span class="font-label-sm text-on-surface-variant text-xs" id="dashboard-pagination-info">Showing recent invoices</span>
                    <button id="btn-view-all-invoices" class="text-xs font-bold text-primary hover:underline">View All Invoices</button>
                </div>
            </section>
        </div>
    `;

    // Copy and Record Payment helper actions
    const copyInvoice = async (invoiceId) => {
        const invoicesList = await AppState.getInvoices();
        const target = invoicesList.find(i => i.id === invoiceId);
        if (!target) return;

        const timestamp = Date.now().toString().slice(-4);
        const newId = `${target.id}-COPY-${timestamp}`;

        const copied = {
            ...target,
            id: newId,
            date: new Date().toISOString().split('T')[0],
            status: 'Draft'
        };

        await AppState.saveInvoice(copied);
        alert(`Invoice copied successfully as Draft: ${newId}`);
        renderDashboard(container, router);
    };

    const recordPayment = async (invoiceId) => {
        const invoicesList = await AppState.getInvoices();
        const target = invoicesList.find(i => i.id === invoiceId);
        if (!target) return;

        target.status = 'Paid';
        await AppState.saveInvoice(target);
        alert(`Invoice ${invoiceId} marked as Paid.`);
        renderDashboard(container, router);
    };

    // Render rows helper
    const renderRows = (filterQuery = '') => {
        const rowsContainer = document.getElementById('recent-activity-rows');
        if (!rowsContainer) return;

        // Filter and get top 5 invoices
        const filteredInvoices = invoices.filter(inv => {
            if (!filterQuery) return true;
            const q = filterQuery.toLowerCase();
            return inv.id.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q);
        }).slice(0, 5);

        if (filteredInvoices.length === 0) {
            rowsContainer.innerHTML = `
                <tr>
                    <td colspan="6" class="px-lg py-lg text-center text-on-surface-variant font-body-md">No recent invoices found</td>
                </tr>
            `;
            return;
        }

        rowsContainer.innerHTML = filteredInvoices.map(inv => {
            let statusClass = 'bg-surface-container-highest text-primary';
            if (inv.status === 'Paid') statusClass = 'bg-secondary-container text-on-secondary-container';
            if (inv.status === 'Pending') statusClass = 'bg-amber-100 text-amber-700';
            if (inv.status === 'Overdue') statusClass = 'bg-error-container text-error';

            return `
                <tr data-invoice-id="${inv.id}" class="data-table-row transition-colors cursor-pointer group">
                    <td class="px-lg py-md font-data-mono text-data-mono text-primary">${inv.id}</td>
                    <td class="px-lg py-md">
                        <div class="flex items-center gap-sm">
                            <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-[11px]">${inv.initials}</div>
                            <span class="font-body-md font-bold">${inv.clientName}</span>
                        </div>
                    </td>
                    <td class="px-lg py-md text-on-surface-variant">${new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="px-lg py-md text-right font-data-mono text-primary font-bold">₹${inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="px-lg py-md">
                        <span class="px-sm py-[2px] ${statusClass} font-label-caps text-[10px] rounded-full">${inv.status}</span>
                    </td>
                    <td class="px-lg py-md text-center relative">
                        <button class="btn-invoice-actions text-on-surface-variant hover:text-primary transition-colors focus:outline-none">
                            <span class="material-symbols-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-actions hidden absolute right-2 top-full mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-50 py-1 text-left min-w-[140px] no-print">
                            <button data-action="copy" data-id="${inv.id}" class="w-full text-left px-4 py-2 hover:bg-surface-container-low text-xs font-semibold text-primary flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px]">content_copy</span>
                                Copy Invoice
                            </button>
                            ${inv.status !== 'Paid' ? `
                            <button data-action="record-payment" data-id="${inv.id}" class="w-full text-left px-4 py-2 hover:bg-surface-container-low text-xs font-semibold text-primary flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px]">payments</span>
                                Record Payment
                            </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind row clicks
        rowsContainer.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const invId = row.getAttribute('data-invoice-id');
                if (invId) router.navigateTo('invoice-detail', invId);
            });
        });

        // Bind action menu button toggle
        rowsContainer.querySelectorAll('.btn-invoice-actions').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other action dropdowns
                document.querySelectorAll('.dropdown-actions').forEach(el => {
                    if (el !== btn.nextElementSibling) el.classList.add('hidden');
                });
                btn.nextElementSibling.classList.toggle('hidden');
            });
        });

        // Bind dropdown buttons
        rowsContainer.querySelectorAll('.dropdown-actions button').forEach(subBtn => {
            subBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const action = subBtn.getAttribute('data-action');
                const invId = subBtn.getAttribute('data-id');
                if (action === 'copy') {
                    await copyInvoice(invId);
                } else if (action === 'record-payment') {
                    await recordPayment(invId);
                }
            });
        });
    };

    // Close dropdowns on clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-actions').forEach(el => el.classList.add('hidden'));
    });

    // Initial render
    renderRows();

    // Event listeners
    const localSearch = document.getElementById('dashboard-search-input');
    if (localSearch) {
        localSearch.addEventListener('input', (e) => {
            renderRows(e.target.value);
        });
    }

    const btnViewAll = document.getElementById('btn-view-all-invoices');
    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            router.navigateTo('invoices');
        });
    }

    // Listen to the custom global search dispatch
    const searchTarget = document.getElementById('view-search-target');
    if (searchTarget) {
        searchTarget.addEventListener('app-search', (e) => {
            renderRows(e.detail.query);
        });
    }
}
