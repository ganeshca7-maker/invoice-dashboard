import { AppState, initializeSearchableDropdown, INDIAN_STATES_AND_UTS } from '../app.js';

export async function renderClients(container, router) {
    let clients = await AppState.getClients();
    let searchQuery = '';

    container.innerHTML = `
        <div id="view-search-target" class="space-y-lg">
            <!-- Page Header -->
            <div class="flex justify-between items-end mb-xl">
                <div>
                    <h2 class="font-headline-md text-headline-md text-primary mb-xs">Client Directory</h2>
                    <p class="text-on-surface-variant font-body-md">Manage client details, billing profiles, and active contracts.</p>
                </div>
                <button id="btn-add-client" class="flex items-center gap-xs bg-primary text-white px-lg py-md rounded-lg font-label-caps text-label-caps hover:opacity-90 active:scale-95 transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">person_add</span>
                    Add Client
                </button>
            </div>

            <!-- Client Grid container -->
            <div id="clients-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
                <!-- Cards dynamically populated -->
            </div>

            <!-- Add Client Modal -->
            <div id="add-client-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-2xl shadow-lg space-y-md max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <h3 class="font-headline-sm text-primary">Add New Customer</h3>
                        <button id="btn-close-modal" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form id="add-client-form" class="space-y-md">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <!-- Basic details -->
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant">Customer Name *</label>
                                <input id="client-name-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Customer Name"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant">Billing Email</label>
                                <input id="client-email-input" type="email" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. billing@company.com"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant">Phone Number</label>
                                <input id="client-phone-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. +1-555-0100"/>
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant">Currency *</label>
                                <select id="client-currency-input" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary outline-none bg-white" required>
                                    <option value="" disabled selected>Select Currency</option>
                                    <option value="USD ($)">USD ($)</option>
                                    <option value="EUR (€)">EUR (€)</option>
                                    <option value="INR (₹)">INR (₹)</option>
                                    <option value="GBP (£)">GBP (£)</option>
                                    <option value="AUD ($)">AUD ($)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Address details -->
                        <div class="border-t border-outline-variant pt-md space-y-md">
                            <h4 class="font-label-caps text-primary font-bold">Billing Address</h4>
                            
                            <div class="grid grid-cols-1 gap-md">
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant">Address Line 1 *</label>
                                    <input id="client-address1-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Address Line 1"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant">Address Line 2</label>
                                    <input id="client-address2-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter Address Line 2"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant">Address Line 3</label>
                                    <input id="client-address3-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="Enter Address Line 3"/>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-md">
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant">City *</label>
                                    <input id="client-city-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter City"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                    <label class="font-label-caps text-on-surface-variant">Pincode / ZIP Code *</label>
                                    <input id="client-pincode-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Enter Pincode"/>
                                </div>
                                <div class="flex flex-col gap-xs">
                                     <label class="font-label-caps text-on-surface-variant">State *</label>
                                     <input id="client-state-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Select or type state..."/>
                                 </div>
                                 <div class="flex flex-col gap-xs">
                                     <label class="font-label-caps text-on-surface-variant">Country *</label>
                                     <input id="client-country-input" type="text" class="p-md border border-outline-variant rounded-lg font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none" required placeholder="Select or type country..."/>
                                 </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="flex justify-end pt-sm gap-sm">
                            <button id="btn-cancel-modal" type="button" class="px-lg py-md border border-outline-variant rounded-lg font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                            <button type="submit" class="px-lg py-md bg-primary text-white rounded-lg font-label-caps text-label-caps hover:opacity-90 transition-colors">Create Customer</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Bank Accounts Management Modal -->
            <div id="bank-accounts-modal" class="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[100] flex items-center justify-center hidden">
                <div class="bg-white border border-outline-variant rounded-xl p-lg w-full max-w-3xl shadow-lg space-y-md max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                    <div class="flex justify-between items-center pb-sm border-b border-outline-variant">
                        <div>
                            <h3 class="font-headline-sm text-primary font-bold">Manage Bank Accounts</h3>
                            <p id="bank-modal-client-name" class="text-on-surface-variant font-body-sm"></p>
                        </div>
                        <button id="btn-close-bank-modal" class="text-on-surface-variant hover:text-primary transition-colors">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <!-- Toast / Message area inside Modal -->
                    <div id="bank-modal-message" class="hidden p-sm rounded text-xs"></div>

                    <!-- Add / Edit Bank Form Section (Initially Hidden) -->
                    <div id="bank-form-container" class="hidden border border-outline-variant rounded-lg p-md bg-surface-container-lowest space-y-sm">
                        <h4 id="bank-form-title" class="font-bold text-xs uppercase tracking-wider text-primary">Add Bank Account</h4>
                        <form id="bank-account-form" class="grid grid-cols-1 md:grid-cols-2 gap-sm">
                            <input type="hidden" id="bank-account-index-input" value="-1" />
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">Bank Name *</label>
                                <input id="bank-name-input" type="text" class="p-2 border border-outline-variant rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" required placeholder="e.g. HDFC Bank" />
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">Account Holder Name *</label>
                                <input id="bank-holder-input" type="text" class="p-2 border border-outline-variant rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" required placeholder="e.g. Acme Corp" />
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">Account Number *</label>
                                <input id="bank-number-input" type="text" class="p-2 border border-outline-variant rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" required placeholder="Enter Account Number" />
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">IFSC Code *</label>
                                <input id="bank-ifsc-input" type="text" class="p-2 border border-outline-variant rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" required placeholder="e.g. HDFC0001234" />
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">Branch Name</label>
                                <input id="bank-branch-input" type="text" class="p-2 border border-outline-variant rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. BKC Branch" />
                            </div>
                            <div class="flex flex-col gap-xs">
                                <label class="font-label-caps text-on-surface-variant text-[10px]">Account Type</label>
                                <select id="bank-type-input" class="p-2 border border-outline-variant rounded-md text-xs outline-none bg-white focus:border-primary focus:ring-1 focus:ring-primary">
                                    <option value="Savings">Savings</option>
                                    <option value="Current">Current</option>
                                </select>
                            </div>
                            <div class="col-span-1 md:col-span-2 flex justify-end gap-sm pt-sm">
                                <button id="btn-cancel-bank-form" type="button" class="px-4 py-1.5 border border-outline-variant rounded-md text-[10px] uppercase font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">Cancel</button>
                                <button type="submit" id="btn-save-bank-account" class="px-4 py-1.5 bg-primary text-white rounded-md text-[10px] uppercase font-bold hover:opacity-90 transition-colors">Save Account</button>
                            </div>
                        </form>
                    </div>

                    <!-- Bank Details List / Grid inside Modal -->
                    <div class="space-y-sm flex-1 flex flex-col min-h-0">
                        <div class="flex justify-between items-center">
                            <h4 class="font-label-caps text-label-caps text-primary font-bold">Bank Accounts Registered</h4>
                            <button id="btn-show-add-bank-form" class="flex items-center gap-xs bg-primary text-white px-3 py-1.5 rounded-md text-[10px] font-bold hover:opacity-90 transition-all uppercase">
                                <span class="material-symbols-outlined text-[14px]">add</span>
                                Add Bank
                            </button>
                        </div>

                        <div class="border border-outline-variant rounded-lg overflow-hidden flex-1 overflow-y-auto">
                            <table class="w-full text-left border-collapse text-xs">
                                <thead class="bg-surface-container-high text-on-surface font-bold">
                                    <tr>
                                        <th class="p-2.5 border-b border-outline-variant">Bank Name</th>
                                        <th class="p-2.5 border-b border-outline-variant">Account Number</th>
                                        <th class="p-2.5 border-b border-outline-variant">IFSC Code</th>
                                        <th class="p-2.5 border-b border-outline-variant text-center">Default</th>
                                        <th class="p-2.5 border-b border-outline-variant text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="bank-accounts-table-body" class="divide-y divide-outline-variant">
                                    <!-- Dynamic rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const renderGrid = () => {
        const grid = document.getElementById('clients-grid');
        if (!grid) return;

        const filtered = clients.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.phone && c.phone.includes(searchQuery))
        );

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-xl text-center text-on-surface-variant font-body-lg">
                    No clients found.
                </div>
            `;
            return;
        }

        grid.innerHTML = filtered.map(c => {
            const isInactive = c.status === 'Inactive';
            const addressString = [c.address1, c.address2, c.city, c.state, c.country].filter(Boolean).join(', ');
            const numBanks = c.bankAccounts ? c.bankAccounts.length : 0;
            return `
                <div class="p-lg bg-white border border-outline-variant rounded-xl cursor-default transition-all group hover:border-primary flex flex-col justify-between h-full min-h-[220px]">
                    <div>
                        <div class="flex justify-between items-start mb-md">
                            <div class="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary font-bold text-lg">
                                ${c.initials}
                            </div>
                            <span class="font-label-caps text-label-caps ${isInactive ? 'text-on-surface-variant bg-surface-container-high' : 'text-secondary bg-secondary-container'} uppercase px-sm py-[2px] rounded-full">
                                ${c.status}
                            </span>
                        </div>
                        <h4 class="font-headline-sm text-headline-sm font-bold text-primary">${c.name}</h4>
                        <p class="font-body-sm text-body-sm text-on-surface-variant mt-xs">${c.email || 'No Email'} • ${c.phone || 'No Phone'}</p>
                        ${addressString ? `<p class="text-[11px] text-on-surface-variant mt-sm italic truncate" title="${addressString}">${addressString}</p>` : ''}
                    </div>
                    <div class="mt-md pt-md border-t border-outline-variant flex justify-between items-center text-xs text-on-surface-variant gap-2 flex-wrap">
                        <span>Currency: <strong class="text-primary font-bold">${c.currency || 'USD ($)'}</strong></span>
                        <button class="btn-manage-banks flex items-center gap-xs text-primary hover:opacity-85 transition-all font-bold" data-client-id="${c.id}">
                            <span class="material-symbols-outlined text-[16px]">account_balance</span>
                            Banks (${numBanks})
                        </button>
                        <span class="font-data-mono">Last: ${c.lastInvoice}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Bind manage bank accounts click listeners
        grid.querySelectorAll('.btn-manage-banks').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const clientId = btn.getAttribute('data-client-id');
                openBankAccountsModal(clientId);
            });
        });
    };

    // Bank Accounts Modal Logic and Operations
    let currentBankModalClientId = null;

    const showBankMessage = (text, isError = false) => {
        const msgEl = document.getElementById('bank-modal-message');
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.className = `p-sm rounded text-xs ${isError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`;
        msgEl.classList.remove('hidden');
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 4000);
    };

    const renderBankAccountsTable = (client) => {
        const tbody = document.getElementById('bank-accounts-table-body');
        if (!tbody) return;

        const accounts = client.bankAccounts || [];
        if (accounts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-on-surface-variant italic">No bank accounts registered.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = accounts.map((acc, index) => {
            const maskedNo = acc.accountNumber.length > 4 
                ? '•••• •••• ' + acc.accountNumber.slice(-4) 
                : acc.accountNumber;
            const defaultBadge = acc.isDefault 
                ? `<span class="bg-secondary-container text-secondary font-bold px-2 py-0.5 rounded text-[10px] uppercase">Default</span>`
                : `<button data-set-default-idx="${index}" class="text-primary hover:underline font-bold text-[10px]">Set Default</button>`;
            
            return `
                <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="p-2.5 border-b border-outline-variant font-bold text-on-surface">${acc.bankName}</td>
                    <td class="p-2.5 border-b border-outline-variant font-data-mono">${maskedNo}</td>
                    <td class="p-2.5 border-b border-outline-variant font-data-mono uppercase">${acc.ifscCode}</td>
                    <td class="p-2.5 border-b border-outline-variant text-center">${defaultBadge}</td>
                    <td class="p-2.5 border-b border-outline-variant text-right space-x-2">
                        <button data-edit-idx="${index}" class="text-primary hover:opacity-85" title="Edit"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                        <button data-delete-idx="${index}" class="text-error hover:opacity-85" title="Delete"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind table action listeners
        tbody.querySelectorAll('[data-set-default-idx]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.getAttribute('data-set-default-idx'));
                accounts.forEach((a, i) => a.isDefault = (i === idx));
                await AppState.updateClient(client);
                renderBankAccountsTable(client);
                renderGrid();
                showBankMessage('Default bank account updated.');
            });
        });

        tbody.querySelectorAll('[data-edit-idx]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-edit-idx'));
                const acc = accounts[idx];
                
                document.getElementById('bank-account-index-input').value = idx;
                document.getElementById('bank-name-input').value = acc.bankName;
                document.getElementById('bank-holder-input').value = acc.accountHolderName;
                document.getElementById('bank-number-input').value = acc.accountNumber;
                document.getElementById('bank-ifsc-input').value = acc.ifscCode;
                document.getElementById('bank-branch-input').value = acc.branchName || '';
                document.getElementById('bank-type-input').value = acc.accountType || 'Savings';

                document.getElementById('bank-form-title').textContent = 'Edit Bank Account';
                document.getElementById('bank-form-container').classList.remove('hidden');
            });
        });

        tbody.querySelectorAll('[data-delete-idx]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.getAttribute('data-delete-idx'));
                if (confirm('Are you sure you want to delete this bank account?')) {
                    const deleted = accounts.splice(idx, 1)[0];
                    if (deleted.isDefault && accounts.length > 0) {
                        accounts[0].isDefault = true;
                    }
                    await AppState.updateClient(client);
                    renderBankAccountsTable(client);
                    renderGrid();
                    showBankMessage('Bank account deleted.');
                }
            });
        });
    };

    const openBankAccountsModal = async (clientId) => {
        const clientsList = await AppState.getClients();
        const client = clientsList.find(c => c.id === clientId);
        if (!client) return;

        currentBankModalClientId = clientId;
        document.getElementById('bank-modal-client-name').textContent = `Client: ${client.name}`;
        
        document.getElementById('bank-form-container').classList.add('hidden');
        document.getElementById('bank-account-form').reset();
        document.getElementById('bank-account-index-input').value = "-1";

        renderBankAccountsTable(client);
        document.getElementById('bank-accounts-modal').classList.remove('hidden');
    };

    const closeBankModal = () => {
        document.getElementById('bank-accounts-modal').classList.add('hidden');
        currentBankModalClientId = null;
    };

    // Initial render
    renderGrid();

    // Initialize searchable dropdowns for client modal
    const clientStateInput = document.getElementById('client-state-input');
    const clientCountryInput = document.getElementById('client-country-input');
    if (clientStateInput) {
        initializeSearchableDropdown(clientStateInput, () => INDIAN_STATES_AND_UTS);
    }
    if (clientCountryInput) {
        initializeSearchableDropdown(clientCountryInput, () => AppState.getCountries(), (newCountry) => {
            AppState.saveCountry(newCountry);
        });
    }

    // Modal Logic
    const modal = document.getElementById('add-client-modal');
    const form = document.getElementById('add-client-form');
    
    document.getElementById('btn-add-client').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    const closeModal = () => {
        modal.classList.add('hidden');
        form.reset();
    };

    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('client-name-input').value;
        const email = document.getElementById('client-email-input').value;
        const phone = document.getElementById('client-phone-input').value;
        const currency = document.getElementById('client-currency-input').value;
        const address1 = document.getElementById('client-address1-input').value;
        const address2 = document.getElementById('client-address2-input').value;
        const address3 = document.getElementById('client-address3-input').value;
        const city = document.getElementById('client-city-input').value;
        const pincode = document.getElementById('client-pincode-input').value;
        const state = document.getElementById('client-state-input').value;
        const country = document.getElementById('client-country-input').value;

        // Calculate initials
        const parts = name.trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();

        const newClient = {
            id: `c${Date.now()}`,
            name,
            email,
            phone,
            currency,
            address1,
            address2,
            address3,
            city,
            pincode,
            state,
            country,
            status: 'Active',
            initials,
            lastInvoice: 'Never',
            bankAccounts: []
        };

        const result = await AppState.saveClient(newClient);
        if (result.success) {
            clients = await AppState.getClients(); // refresh local memory
            renderGrid();
            closeModal();
        } else {
            alert(result.error);
        }
    });

    // Bank account form events
    document.getElementById('btn-show-add-bank-form').addEventListener('click', () => {
        document.getElementById('bank-account-form').reset();
        document.getElementById('bank-account-index-input').value = "-1";
        document.getElementById('bank-form-title').textContent = 'Add Bank Account';
        document.getElementById('bank-form-container').classList.remove('hidden');
    });

    document.getElementById('btn-cancel-bank-form').addEventListener('click', () => {
        document.getElementById('bank-form-container').classList.add('hidden');
        document.getElementById('bank-account-form').reset();
    });

    document.getElementById('btn-close-bank-modal').addEventListener('click', closeBankModal);

    document.getElementById('bank-account-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientsList = await AppState.getClients();
        const client = clientsList.find(c => c.id === currentBankModalClientId);
        if (!client) return;

        const idx = parseInt(document.getElementById('bank-account-index-input').value);
        const bankName = document.getElementById('bank-name-input').value.trim();
        const accountHolderName = document.getElementById('bank-holder-input').value.trim();
        const accountNumber = document.getElementById('bank-number-input').value.trim();
        const ifscCode = document.getElementById('bank-ifsc-input').value.trim();
        const branchName = document.getElementById('bank-branch-input').value.trim();
        const accountType = document.getElementById('bank-type-input').value;

        // Validation: duplicate account numbers for same client
        const accounts = client.bankAccounts || [];
        const isDuplicate = accounts.some((acc, i) => i !== idx && acc.accountNumber === accountNumber);
        if (isDuplicate) {
            showBankMessage('A bank account with this Account Number already exists for this client.', true);
            return;
        }

        const accountData = {
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            branchName,
            accountType,
            isDefault: idx >= 0 ? accounts[idx].isDefault : (accounts.length === 0)
        };

        if (idx >= 0) {
            accounts[idx] = accountData;
            showBankMessage('Bank account updated successfully.');
        } else {
            accounts.push(accountData);
            showBankMessage('Bank account added successfully.');
        }

        client.bankAccounts = accounts;
        await AppState.updateClient(client);

        // Hide form & refresh
        document.getElementById('bank-form-container').classList.add('hidden');
        document.getElementById('bank-account-form').reset();
        document.getElementById('bank-account-index-input').value = "-1";

        renderBankAccountsTable(client);
        clients = await AppState.getClients(); // refresh client list memory
        renderGrid();
    });

    // Listen to global search
    const searchTarget = document.getElementById('view-search-target');
    if (searchTarget) {
        searchTarget.addEventListener('app-search', (e) => {
            searchQuery = e.detail.query;
            renderGrid();
        });
    }
}
