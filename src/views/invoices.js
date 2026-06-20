import { AppState } from '../app.js';

export async function renderInvoices(container, router) {
    const invoices = await AppState.getInvoices();
    let currentFilter = 'All';
    let searchQuery = '';

    // Calculate invoice stats
    const totalOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.amount, 0);
    const overdueTotal = invoices.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0);
    const activeCount = invoices.length;

    container.innerHTML = `
        <div id="view-search-target" class="space-y-lg">
            <!-- Page Header & Filters -->
            <div class="flex flex-col gap-lg mb-xl">
                <div class="flex justify-between items-end">
                    <div>
                        <h2 class="font-headline-md text-headline-md text-primary mb-xs">Invoices</h2>
                        <p class="text-on-surface-variant font-body-md">Manage your billing and track payment status across all clients.</p>
                    </div>
                    <div class="flex gap-sm">
                        <button id="btn-import-invoices" class="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-body-md hover:bg-surface-container-low transition-all text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100">
                            <span class="material-symbols-outlined text-[18px]">upload_file</span>
                            Import
                        </button>
                        <button id="btn-export-invoices" class="flex items-center gap-xs px-md py-sm border border-outline-variant rounded-lg font-body-md hover:bg-surface-container-low transition-all">
                            <span class="material-symbols-outlined text-[18px]">file_download</span>
                            Export CSV
                        </button>
                    </div>
                </div>
                <!-- Tabs Filter -->
                <div class="flex items-center gap-lg border-b border-outline-variant">
                    <button data-filter="All" class="filter-tab pb-sm px-xs text-primary font-bold border-b-2 border-primary font-label-caps transition-all">All Invoices</button>
                    <button data-filter="Pending" class="filter-tab pb-sm px-xs text-on-surface-variant hover:text-primary font-label-caps transition-all">Pending</button>
                    <button data-filter="Paid" class="filter-tab pb-sm px-xs text-on-surface-variant hover:text-primary font-label-caps transition-all">Paid</button>
                    <button data-filter="Overdue" class="filter-tab pb-sm px-xs text-on-surface-variant hover:text-primary font-label-caps transition-all">Overdue</button>
                </div>
            </div>

            <!-- Bento Summary Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
                <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant hover:border-tertiary/20 transition-all">
                    <p class="font-label-caps text-on-surface-variant mb-xs">Total Outstanding</p>
                    <p class="font-display-lg text-display-lg font-data-mono text-primary">₹${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <div class="mt-md flex items-center text-body-sm text-secondary gap-xs">
                        <span class="material-symbols-outlined text-[16px]">trending_up</span>
                        <span>+12.5% from last month</span>
                    </div>
                </div>
                <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant hover:border-tertiary/20 transition-all">
                    <p class="font-label-caps text-on-surface-variant mb-xs">Average Payment Time</p>
                    <p class="font-display-lg text-display-lg font-data-mono text-primary">14 Days</p>
                    <div class="mt-md flex items-center text-body-sm text-on-surface-variant gap-xs">
                        <span class="material-symbols-outlined text-[16px]">schedule</span>
                        <span>Stable performance</span>
                    </div>
                </div>
                <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant hover:border-tertiary/20 transition-all">
                    <p class="font-label-caps text-on-surface-variant mb-xs">Overdue Total</p>
                    <p class="font-display-lg text-display-lg font-data-mono text-error">₹${overdueTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <div class="mt-md flex items-center text-body-sm text-error gap-xs">
                        <span class="material-symbols-outlined text-[16px]">priority_high</span>
                        <span>Needs attention</span>
                    </div>
                </div>
                <div class="relative bg-primary overflow-hidden p-lg rounded-xl flex flex-col justify-center text-white">
                    <p class="font-label-caps text-on-primary/60 mb-xs z-10">Active Invoices</p>
                    <p class="font-display-lg text-display-lg font-data-mono text-on-primary z-10">${activeCount}</p>
                </div>
            </div>

            <!-- Data Table Container -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
                <div class="overflow-x-auto custom-scrollbar">
                    <table class="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr class="bg-surface-container-low border-b border-outline-variant">
                                <th class="px-lg py-md font-label-caps text-on-surface-variant">Invoice #</th>
                                <th class="px-lg py-md font-label-caps text-on-surface-variant">Client</th>
                                <th class="px-lg py-md font-label-caps text-on-surface-variant">Date</th>
                                <th class="px-lg py-md font-label-caps text-on-surface-variant">Due Date</th>
                                <th class="px-lg py-md font-label-caps text-on-surface-variant text-right">Amount</th>
                                <th class="px-lg py-md font-label-caps text-on-surface-variant">Status</th>
                                <th class="px-lg py-md"></th>
                            </tr>
                        </thead>
                        <tbody id="invoices-table-rows" class="divide-y divide-outline-variant">
                            <!-- Rows dynamically populated -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination Footer -->
                <div id="pagination-footer" class="px-lg py-md bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
                    <!-- Dynamic details -->
                </div>
            </div>
        </div>
    `;

    // Filter and Render Table Rows Helper
    const renderTable = () => {
        const rowsContainer = document.getElementById('invoices-table-rows');
        const paginationContainer = document.getElementById('pagination-footer');
        if (!rowsContainer || !paginationContainer) return;

        // Apply filters & search
        const filtered = invoices.filter(inv => {
            const matchesFilter = (currentFilter === 'All') || (inv.status === currentFilter);
            const matchesSearch = !searchQuery || 
                inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.amount.toString().includes(searchQuery);
            return matchesFilter && matchesSearch;
        });

        // Paginate (simple show all or limit to 10 for simplicity)
        if (filtered.length === 0) {
            rowsContainer.innerHTML = `
                <tr>
                    <td colspan="7" class="px-lg py-lg text-center text-on-surface-variant font-body-md">No invoices match selected criteria</td>
                </tr>
            `;
            paginationContainer.innerHTML = `<p class="text-body-sm text-on-surface-variant">Showing 0 of 0 results</p>`;
            return;
        }

        rowsContainer.innerHTML = filtered.map(inv => {
            let statusClass = 'bg-surface-container-highest text-primary';
            if (inv.status === 'Paid') statusClass = 'bg-secondary-container text-on-secondary-container';
            if (inv.status === 'Pending') statusClass = 'bg-amber-100 text-amber-700';
            if (inv.status === 'Overdue') statusClass = 'bg-error-container text-error';

            return `
                <tr data-invoice-id="${inv.id}" class="hover:bg-surface-container-low/50 transition-colors cursor-pointer group">
                    <td class="px-lg py-md font-data-mono text-primary font-bold">${inv.id}</td>
                    <td class="px-lg py-md">
                        <div class="flex items-center gap-sm">
                            <div class="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center font-bold text-primary text-[12px]">${inv.initials}</div>
                            <div>
                                <p class="font-semibold text-primary">${inv.clientName}</p>
                                <p class="text-body-sm text-on-surface-variant">${inv.clientEmail}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-lg py-md text-on-surface-variant">${new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="px-lg py-md ${inv.status === 'Overdue' ? 'text-error' : 'text-on-surface-variant'} font-medium">
                        ${new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td class="px-lg py-md text-right font-data-mono font-bold">₹${inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="px-lg py-md">
                        <span class="inline-flex items-center px-sm py-xs rounded ${statusClass} font-label-caps text-[10px]">
                            ${inv.status}
                        </span>
                    </td>
                    <td class="px-lg py-md text-right">
                        <button class="p-sm text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind row clicks to details page
        rowsContainer.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const invId = row.getAttribute('data-invoice-id');
                if (invId) router.navigateTo('invoice-detail', invId);
            });
        });

        paginationContainer.innerHTML = `
            <p class="text-body-sm text-on-surface-variant">Showing 1 to ${filtered.length} of ${filtered.length} results</p>
            <div class="flex gap-xs">
                <button class="p-xs rounded hover:bg-surface-container-highest transition-colors disabled:opacity-50" disabled>
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <button class="w-8 h-8 rounded bg-primary text-on-primary text-body-sm font-bold">1</button>
                <button class="p-xs rounded hover:bg-surface-container-highest transition-colors disabled:opacity-50" disabled>
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        `;
    };

    // Initial render
    renderTable();

    // Import listener
    const importBtn = document.getElementById('btn-import-invoices');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (typeof window.openImportModal === 'function') {
                window.openImportModal();
            } else {
                alert('Import modal is not available. Please refresh the page.');
            }
        });
    }

    // Export listener (CSV)
    document.getElementById('btn-export-invoices').addEventListener('click', () => {
        if (!invoices || invoices.length === 0) { alert('No invoices to export.'); return; }
        const headers = ['id', 'clientName', 'clientEmail', 'date', 'dueDate', 'amount', 'status'];
        const rows = invoices.map(inv => headers.map(h => `"${(inv[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Tab switcher binding
    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            container.querySelectorAll('.filter-tab').forEach(b => {
                b.classList.remove('text-primary', 'font-bold', 'border-b-2', 'border-primary');
                b.classList.add('text-on-surface-variant');
            });
            tab.classList.add('text-primary', 'font-bold', 'border-b-2', 'border-primary');
            tab.classList.remove('text-on-surface-variant');

            currentFilter = tab.getAttribute('data-filter');
            renderTable();
        });
    });

    // Listen to global search
    const searchTarget = document.getElementById('view-search-target');
    if (searchTarget) {
        searchTarget.addEventListener('app-search', (e) => {
            searchQuery = e.detail.query;
            renderTable();
        });
    }
}
