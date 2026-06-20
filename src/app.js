import { renderDashboard } from './views/dashboard.js';
import { renderInvoices } from './views/invoices.js';
import { renderClients } from './views/clients.js';
import { renderCreateInvoice } from './views/create-invoice.js';
import { renderInvoiceDetail } from './views/invoice-detail.js';

// Mock Data Configuration
const DEFAULT_CLIENTS = [
    {
        id: 'c1',
        name: 'Acme Global Holdings',
        company: 'Acme Corp',
        email: 'billing@acme.com',
        phone: '+1-555-0199',
        status: 'Active',
        initials: 'AG',
        lastInvoice: '12 days ago',
        address1: '100 Main Street',
        address2: 'Suite 400',
        address3: '',
        city: 'New York',
        pincode: '10001',
        state: 'NY',
        country: 'United States',
        currency: 'USD ($)'
    },
    {
        id: 'c2',
        name: 'TechFlow Solutions',
        company: 'TechFlow Ltd',
        email: 'accounts@stellar.io',
        phone: '+1-555-0245',
        status: 'Active',
        initials: 'TF',
        lastInvoice: '2 months ago',
        address1: '45 Science Park',
        address2: 'Building B',
        address3: 'Floor 2',
        city: 'San Francisco',
        pincode: '94107',
        state: 'CA',
        country: 'United States',
        currency: 'USD ($)'
    },
    {
        id: 'c3',
        name: 'Jonathan Wright',
        company: 'Individual',
        email: 'j.wright@personal.me',
        phone: '+44-7911-123456',
        status: 'Active',
        initials: 'JW',
        lastInvoice: 'Oct 24, 2023',
        address1: '74 High Street',
        address2: '',
        address3: '',
        city: 'Oxford',
        pincode: 'OX1 4DP',
        state: 'Oxfordshire',
        country: 'United Kingdom',
        currency: 'EUR (€)'
    },
    {
        id: 'c4',
        name: 'Nexus Partners',
        company: 'Nexus Inc',
        email: 'contact@nexuspartners.com',
        phone: '+65-6123-4567',
        status: 'Inactive',
        initials: 'NP',
        lastInvoice: 'Never',
        address1: '12 Marina Boulevard',
        address2: 'Tower 3',
        address3: '#18-02',
        city: 'Singapore',
        pincode: '018982',
        state: 'Downtown Core',
        country: 'Singapore',
        currency: 'USD ($)'
    }
];

const DEFAULT_INVOICES = [
    { id: 'INV-2024-001', clientName: 'Starlight Networks', clientEmail: 'billing@starlight.io', initials: 'SN', date: '2023-10-12', dueDate: '2023-11-12', amount: 12450.00, status: 'Overdue' },
    { id: 'INV-2024-002', clientName: 'Acme Labs', clientEmail: 'finance@acme.com', initials: 'AL', date: '2023-11-01', dueDate: '2023-12-01', amount: 3200.00, status: 'Paid' },
    { id: 'INV-2024-003', clientName: 'Urban Dynamics', clientEmail: 'ap@urbandynamics.com', initials: 'UD', date: '2023-11-15', dueDate: '2023-12-15', amount: 8900.00, status: 'Pending' },
    { id: 'INV-2024-004', clientName: 'Global Tech', clientEmail: 'billing@globaltech.net', initials: 'GT', date: '2023-11-20', dueDate: '2023-12-20', amount: 1500.00, status: 'Paid' },
    { id: 'INV-2024-005', clientName: 'Vanguard Systems', clientEmail: 'payouts@vanguard.com', initials: 'VS', date: '2023-10-28', dueDate: '2023-11-28', amount: 15800.00, status: 'Overdue' }
];

// App State Management
export class AppState {
    static async getInvoices() {
        try {
            const res = await fetch('/api/invoices');
            return await res.json();
        } catch (err) {
            console.error('Error fetching invoices:', err);
            return [];
        }
    }

    static async saveInvoice(invoice) {
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice)
            });
            return await res.json();
        } catch (err) {
            console.error('Error saving invoice:', err);
            return { success: false, error: err.message };
        }
    }

    static async getClients() {
        try {
            const res = await fetch('/api/clients');
            return await res.json();
        } catch (err) {
            console.error('Error fetching clients:', err);
            return [];
        }
    }

    static async saveClient(client) {
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (!res.ok) {
                const data = await res.json();
                return { success: false, error: data.error };
            }
            return await res.json();
        } catch (err) {
            console.error('Error saving client:', err);
            return { success: false, error: err.message };
        }
    }

    static async updateClient(client) {
        try {
            const res = await fetch(`/api/clients/${client.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (!res.ok) {
                const data = await res.json();
                return { success: false, error: data.error };
            }
            return await res.json();
        } catch (err) {
            console.error('Error updating client:', err);
            return { success: false, error: err.message };
        }
    }

    static async getCompanyProfile() {
        try {
            const res = await fetch('/api/company_profile');
            return await res.json();
        } catch (err) {
            console.error('Error fetching company profile:', err);
            return {};
        }
    }

    static async saveCompanyProfile(profile) {
        try {
            const res = await fetch('/api/company_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });
            return await res.json();
        } catch (err) {
            console.error('Error saving company profile:', err);
            return { success: false, error: err.message };
        }
    }

    static async getCountries() {
        try {
            const res = await fetch('/api/master_countries');
            return await res.json();
        } catch (err) {
            console.error('Error fetching countries:', err);
            return [];
        }
    }

    static async saveCountry(country) {
        try {
            await fetch('/api/master_countries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ country })
            });
        } catch (err) {
            console.error('Error saving country:', err);
        }
    }
}

// Router & Controller
class AppController {
    constructor() {
        this.activeTab = 'dashboard';
        this.activeArgs = null;
        this.views = {
            dashboard: renderDashboard,
            invoices: renderInvoices,
            clients: renderClients,
            'create-invoice': renderCreateInvoice,
            'invoice-detail': renderInvoiceDetail
        };
        this.init();
    }

    init() {
        // Check authentication
        this.checkAuth();

        // Bind Authentication actions
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button[type="submit"]');
                const originalContent = btn.innerHTML;
                
                btn.disabled = true;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Authenticating...';
                
                setTimeout(() => {
                    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> Welcome back';
                    btn.classList.remove('bg-primary');
                    btn.classList.add('bg-green-600');
                    
                    setTimeout(() => {
                        localStorage.setItem('is_logged_in', 'true');
                        // Reset button
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                        btn.classList.remove('bg-green-600');
                        btn.classList.add('bg-primary');
                        
                        this.checkAuth();
                        this.renderActiveView();
                    }, 1000);
                }, 1500);
            });
        }

        const togglePasswordBtn = document.getElementById('btn-toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const input = document.getElementById('password');
                const icon = this.querySelector('.material-symbols-outlined');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.innerText = 'visibility_off';
                } else {
                    input.type = 'password';
                    icon.innerText = 'visibility';
                }
            });
        }

        const logoutBtn = document.getElementById('btn-logout-desktop');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('is_logged_in');
                this.checkAuth();
            });
        }

        // Bind Nav Clicks
        document.querySelectorAll('[data-tab]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = el.getAttribute('data-tab');
                this.navigateTo(tab);
            });
        });

        // Bind Create Invoice buttons
        const createBtnDesktop = document.getElementById('btn-create-invoice-desktop');
        const createBtnMobile = document.getElementById('btn-create-invoice-mobile');
        if (createBtnDesktop) createBtnDesktop.addEventListener('click', () => this.navigateTo('create-invoice'));
        if (createBtnMobile) createBtnMobile.addEventListener('click', () => this.navigateTo('create-invoice'));

        // Bind Global Search Input
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Update Sidebar/Header UI with Company Name from profile
        this.updateHeaderCompanyName();

        // Bind Sidebar Header & Mobile Header click to open Company Profile modal
        const sidebarHeader = document.getElementById('sidebar-header-btn');
        const mobileHeader = document.getElementById('mobile-header-btn');
        const btnSettingsCompany = document.getElementById('btn-settings-company');
        if (sidebarHeader) sidebarHeader.addEventListener('click', () => this.openCompanyProfileModal());
        if (mobileHeader) mobileHeader.addEventListener('click', () => this.openCompanyProfileModal());
        if (btnSettingsCompany) btnSettingsCompany.addEventListener('click', () => this.openCompanyProfileModal());

        // Bind Company Modal Close/Submit
        const companyModal = document.getElementById('company-profile-modal');
        const btnCloseCompany = document.getElementById('btn-close-company-modal');
        const btnCancelCompany = document.getElementById('btn-cancel-company-modal');
        const companyForm = document.getElementById('company-profile-form');

        if (btnCloseCompany) btnCloseCompany.addEventListener('click', () => companyModal.classList.add('hidden'));
        if (btnCancelCompany) btnCancelCompany.addEventListener('click', () => companyModal.classList.add('hidden'));
        if (companyForm) {
            companyForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Custom mandatory validation for bank fields
                const branchVal = document.getElementById('company-bank-branch').value.trim();
                const accTypeVal = document.getElementById('company-bank-acc-type').value.trim();
                const accNameVal = document.getElementById('company-bank-acc-name').value.trim();
                const bankNameVal = document.getElementById('company-bank-name').value.trim();
                const accNoVal = document.getElementById('company-bank-acc-no').value.trim();
                const ifscVal = document.getElementById('company-bank-ifsc').value.trim();

                if (!accNameVal || !bankNameVal || !accNoVal || !ifscVal || !branchVal || !accTypeVal) {
                    alert('Please fill in all mandatory bank details (marked with *) before saving.');
                    return;
                }

                const VALID_ACCOUNT_TYPES = [
                    'Savings Account', 'Current Account', 'Cash Credit (CC)',
                    'Overdraft (OD)', 'NRE Account', 'NRO Account', 'Other'
                ];
                if (!VALID_ACCOUNT_TYPES.includes(accTypeVal)) {
                    alert(`"${accTypeVal}" is not a valid Account Type. Please select a value from the dropdown list.`);
                    return;
                }

                const profile = {
                    name: document.getElementById('company-name').value.trim(),
                    logoIcon: 'corporate_fare',
                    gstin: document.getElementById('company-gstin').value.trim(),
                    email: document.getElementById('company-email').value.trim(),
                    phone: document.getElementById('company-phone').value.trim(),
                    address1: document.getElementById('company-address1').value.trim(),
                    address2: document.getElementById('company-address2').value.trim(),
                    address3: document.getElementById('company-address3').value.trim(),
                    city: document.getElementById('company-city').value.trim(),
                    pincode: document.getElementById('company-pincode').value.trim(),
                    state: document.getElementById('company-state').value.trim(),
                    country: document.getElementById('company-country').value.trim(),
                    bankName: bankNameVal,
                    accountNumber: accNoVal,
                    ifscCode: ifscVal,
                    accountName: accNameVal,
                    branchName: branchVal,
                    accountType: accTypeVal
                };
                AppState.saveCompanyProfile(profile);
                this.updateHeaderCompanyName();
                companyModal.classList.add('hidden');

                // Refresh active view so any changes in invoice screens are reflected
                this.renderActiveView();
                alert('Company Profile saved successfully!');
            });
        }

        // Render Initial View
        this.renderActiveView();

        // NeDB Health Check – ping every 30s and update status badge
        this.checkDbConnection();
        setInterval(() => this.checkDbConnection(), 30000);

        // Wire up the Import Invoices modal (opened from invoices view)
        this._wireImportModal();
    }

    async checkDbConnection() {
        const dot = document.getElementById('db-status-dot');
        const text = document.getElementById('db-status-text');
        const badge = document.getElementById('db-status-badge');
        if (!dot || !text) return;
        try {
            const res = await fetch('/api/invoices', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
            if (res.ok) {
                dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
                text.textContent = 'NeDB Connected';
                badge.title = 'NeDB API server is online and responding';
            } else {
                throw new Error('Non-OK response');
            }
        } catch {
            dot.className = 'w-2 h-2 rounded-full bg-red-500 animate-pulse';
            text.textContent = 'DB Offline';
            badge.title = 'NeDB API server is not reachable. Run: npm run server';
        }
    }

    _wireImportModal() {
        const modal    = document.getElementById('import-invoices-modal');
        const fileInput = document.getElementById('import-invoices-file');
        const dropZone  = document.getElementById('import-drop-zone');
        const browseLink = document.getElementById('import-browse-link');
        const closeBtn   = document.getElementById('btn-close-import-modal');
        const cancelBtn  = document.getElementById('btn-import-cancel');
        const clearBtn   = document.getElementById('btn-import-clear');
        const confirmBtn = document.getElementById('btn-import-confirm');
        const previewSection = document.getElementById('import-preview-section');
        const previewRows    = document.getElementById('import-preview-rows');
        const countEl   = document.getElementById('import-count');
        const validEl   = document.getElementById('import-valid-count');
        const invalidEl = document.getElementById('import-invalid-count');
        const errorBanner = document.getElementById('import-error-banner');
        const errorText   = document.getElementById('import-error-text');
        if (!modal) return;

        let parsedInvoices = [];

        const resetModal = () => {
            parsedInvoices = [];
            if (previewSection) previewSection.classList.add('hidden');
            if (errorBanner) errorBanner.classList.add('hidden');
            if (clearBtn) clearBtn.classList.add('hidden');
            if (confirmBtn) { confirmBtn.disabled = true; }
            if (fileInput) fileInput.value = '';
        };

        const closeModal = () => { modal.classList.add('hidden'); resetModal(); };
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (clearBtn) clearBtn.addEventListener('click', resetModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // Expose openImportModal globally so invoices view can call it
        window.openImportModal = () => { resetModal(); modal.classList.remove('hidden'); };

        const showError = (msg) => {
            if (errorBanner) errorBanner.classList.remove('hidden');
            if (errorText) errorText.textContent = msg;
            if (previewSection) previewSection.classList.add('hidden');
            if (confirmBtn) confirmBtn.disabled = true;
        };

        const validateInvoice = (inv) => {
            return inv.id && inv.clientName && inv.date && (inv.amount !== undefined && inv.amount !== null);
        };

        const renderPreview = (invoices) => {
            if (!invoices || invoices.length === 0) { showError('No invoice records found in the file.'); return; }
            parsedInvoices = invoices;
            const valid   = invoices.filter(validateInvoice);
            const invalid = invoices.filter(i => !validateInvoice(i));

            if (countEl) countEl.textContent = invoices.length;
            if (validEl) validEl.textContent = `${valid.length} valid`;
            if (invalidEl) {
                invalidEl.textContent = `${invalid.length} invalid`;
                invalidEl.classList.toggle('hidden', invalid.length === 0);
            }

            const statusColors = { Paid: 'text-emerald-600 bg-emerald-50', Pending: 'text-amber-600 bg-amber-50', Overdue: 'text-red-600 bg-red-50', Draft: 'text-slate-600 bg-slate-100' };
            if (previewRows) {
                previewRows.innerHTML = invoices.map(inv => {
                    const isValid = validateInvoice(inv);
                    const sc = statusColors[inv.status] || 'text-slate-600 bg-slate-100';
                    return `<tr class="${isValid ? '' : 'bg-red-50/60'}">
                        <td class="px-3 py-2 font-mono text-primary font-bold">${inv.id || '<span class="text-red-500">Missing</span>'}</td>
                        <td class="px-3 py-2">${inv.clientName || '<span class="text-red-500">Missing</span>'}</td>
                        <td class="px-3 py-2 text-slate-500">${inv.date || '-'}</td>
                        <td class="px-3 py-2 text-right font-mono font-bold">₹${Number(inv.amount || 0).toLocaleString('en-IN')}</td>
                        <td class="px-3 py-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${sc}">${inv.status || 'Unknown'}</span></td>
                        <td class="px-3 py-2 text-center">${isValid ? '<span class="material-symbols-outlined text-emerald-500 text-sm" style="font-variation-settings:&#39;FILL&#39; 1">check_circle</span>' : '<span class="material-symbols-outlined text-red-400 text-sm" style="font-variation-settings:&#39;FILL&#39; 1">cancel</span>'}</td>
                    </tr>`;
                }).join('');
            }

            if (previewSection) previewSection.classList.remove('hidden');
            if (errorBanner) errorBanner.classList.add('hidden');
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (confirmBtn) confirmBtn.disabled = valid.length === 0;
        };

        const parseCSV = (text) => {
            const lines = text.trim().split('\n').filter(l => l.trim());
            if (lines.length < 2) return [];
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            return lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const obj = {};
                headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
                if (obj.amount) obj.amount = parseFloat(obj.amount) || 0;
                if (!obj.initials && obj.clientName) {
                    obj.initials = obj.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                }
                return obj;
            });
        };

        const handleFile = (file) => {
            if (!file) return;
            const ext = file.name.split('.').pop().toLowerCase();
            if (!['json', 'csv'].includes(ext)) { showError(`Unsupported file type: .${ext}. Please upload a .json or .csv file.`); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let data;
                    if (ext === 'json') {
                        data = JSON.parse(e.target.result);
                        if (!Array.isArray(data)) data = [data];
                    } else {
                        data = parseCSV(e.target.result);
                    }
                    renderPreview(data);
                } catch (err) {
                    showError(`Failed to parse file: ${err.message}`);
                }
            };
            reader.readAsText(file);
        };

        if (browseLink) browseLink.addEventListener('click', (e) => { e.stopPropagation(); if (fileInput) fileInput.click(); });
        if (dropZone) dropZone.addEventListener('click', () => { if (fileInput) fileInput.click(); });
        if (fileInput) fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-sky-400', 'bg-sky-50/40'); });
            dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-sky-400', 'bg-sky-50/40'); });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-sky-400', 'bg-sky-50/40');
                handleFile(e.dataTransfer.files[0]);
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const validInvoices = parsedInvoices.filter(validateInvoice);
                if (validInvoices.length === 0) return;

                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Saving to NeDB...';

                let savedCount = 0;
                let failCount = 0;

                try {
                    // Use batch endpoint for efficiency
                    const res = await fetch('/api/invoices/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(validInvoices)
                    });
                    const data = await res.json();
                    savedCount = data.saved || 0;
                    failCount  = data.failed || 0;
                } catch (err) {
                    // Fallback: one-by-one if batch fails
                    for (const inv of validInvoices) {
                        try {
                            const r = await AppState.saveInvoice(inv);
                            if (r && r.success) savedCount++; else failCount++;
                        } catch { failCount++; }
                    }
                }

                closeModal();

                // Show a premium success notification
                const notif = document.createElement('div');
                notif.className = 'fixed top-6 right-6 z-[9999] flex items-start gap-3 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl max-w-xs';
                notif.style.cssText = 'animation: slideInRight 0.3s ease-out;';
                notif.innerHTML = `
                    <span class="material-symbols-outlined text-emerald-400 text-2xl shrink-0" style="font-variation-settings:'FILL' 1">check_circle</span>
                    <div>
                        <p class="font-bold text-sm">Import Complete</p>
                        <p class="text-xs text-slate-300 mt-0.5">${savedCount} invoice${savedCount !== 1 ? 's' : ''} saved to NeDB.${failCount > 0 ? ` ${failCount} failed.` : ''}</p>
                    </div>
                `;
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 4500);

                // Refresh current view if on invoices tab
                if (window.appInstance && window.appInstance.activeTab === 'invoices') {
                    window.appInstance.renderActiveView();
                }
                // Also refresh DB status badge
                if (window.appInstance) window.appInstance.checkDbConnection();
            });
        }
    }

    checkAuth() {
        const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
        const loginLayout = document.getElementById('login-layout');
        const appLayout = document.getElementById('app-layout');
        
        if (isLoggedIn) {
            if (loginLayout) loginLayout.classList.add('hidden');
            if (appLayout) appLayout.classList.remove('hidden');
            document.body.classList.remove('h-screen', 'overflow-hidden');
        } else {
            if (loginLayout) loginLayout.classList.remove('hidden');
            if (appLayout) appLayout.classList.add('hidden');
            document.body.classList.add('h-screen', 'overflow-hidden');
        }
    }

    updateHeaderCompanyName() {
        const profile = AppState.getCompanyProfile();
        const asideGstin = document.getElementById('aside-gstin-display');
        if (asideGstin && profile.gstin) {
            asideGstin.textContent = `GSTIN: ${profile.gstin}`;
        }
    }

    openCompanyProfileModal() {
        const ACCOUNT_TYPE_OPTIONS = [
            'Savings Account',
            'Current Account',
            'Cash Credit (CC)',
            'Overdraft (OD)',
            'NRE Account',
            'NRO Account',
            'Other'
        ];

        const profile = AppState.getCompanyProfile();
        document.getElementById('company-name').value = profile.name || '';
        document.getElementById('company-gstin').value = profile.gstin || '';
        document.getElementById('company-email').value = profile.email || '';
        document.getElementById('company-phone').value = profile.phone || '';
        document.getElementById('company-address1').value = profile.address1 || '';
        document.getElementById('company-address2').value = profile.address2 || '';
        document.getElementById('company-address3').value = profile.address3 || '';
        document.getElementById('company-city').value = profile.city || '';
        document.getElementById('company-pincode').value = profile.pincode || '';
        document.getElementById('company-state').value = profile.state || '';
        document.getElementById('company-country').value = profile.country || '';
        document.getElementById('company-bank-name').value = profile.bankName || '';
        document.getElementById('company-bank-acc-no').value = profile.accountNumber || '';
        document.getElementById('company-bank-ifsc').value = profile.ifscCode || '';
        document.getElementById('company-bank-acc-name').value = profile.accountName || '';
        document.getElementById('company-bank-branch').value = profile.branchName || '';
        document.getElementById('company-bank-acc-type').value = profile.accountType || '';

        // Initialize searchable dropdowns for company state, country, and account type
        const stateInput = document.getElementById('company-state');
        const countryInput = document.getElementById('company-country');
        const accTypeInput = document.getElementById('company-bank-acc-type');

        initializeSearchableDropdown(stateInput, () => INDIAN_STATES_AND_UTS);
        initializeSearchableDropdown(countryInput, () => AppState.getCountries(), (newCountry) => {
            AppState.saveCountry(newCountry);
        });
        initializeSearchableDropdown(accTypeInput, () => ACCOUNT_TYPE_OPTIONS);

        const companyModal = document.getElementById('company-profile-modal');
        if (companyModal) companyModal.classList.remove('hidden');
    }

    navigateTo(tab, args = null) {
        this.activeTab = tab;
        this.activeArgs = args;
        this.renderActiveView();

        // Clear global search on page transition
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) globalSearch.value = '';

        // Reset progress bar visibility unless we are in create-invoice
        const progressBar = document.getElementById('top-progress-bar');
        if (progressBar) {
            if (tab === 'create-invoice') {
                progressBar.classList.remove('hidden');
            } else {
                progressBar.classList.add('hidden');
            }
        }
    }

    async renderActiveView() {
        // Update Nav UI
        document.querySelectorAll('[data-tab]').forEach(el => {
            const tab = el.getAttribute('data-tab');
            const isSidebar = el.closest('aside') !== null;
            if (tab === this.activeTab) {
                if (isSidebar) {
                    el.classList.add('bg-secondary-container', 'text-on-secondary-container', 'font-bold');
                    el.classList.remove('text-on-surface-variant', 'hover:bg-surface-container-highest');
                } else {
                    el.classList.add('text-on-primary', 'font-bold', 'border-b-2', 'border-on-primary', 'pb-1');
                    el.classList.remove('text-on-primary/70');
                }
            } else {
                if (isSidebar) {
                    el.classList.remove('bg-secondary-container', 'text-on-secondary-container', 'font-bold');
                    el.classList.add('text-on-surface-variant', 'hover:bg-surface-container-highest');
                } else {
                    el.classList.remove('text-on-primary', 'font-bold', 'border-b-2', 'border-on-primary', 'pb-1');
                    el.classList.add('text-on-primary/70');
                }
            }
        });

        // Update top app bar title display
        const titleDisplay = document.getElementById('app-title-display');
        if (titleDisplay) {
            const tabNameMap = {
                dashboard: 'Dashboard',
                invoices: 'Sales / Invoices',
                clients: 'Clients Directory',
                'create-invoice': 'Create New Invoice',
                'invoice-detail': 'Invoice Detail'
            };
            titleDisplay.textContent = tabNameMap[this.activeTab] || 'GST Invoicer';
        }

        // Clear and render active view
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p class="text-on-surface-variant font-body-main text-sm font-bold">Loading data...</p>
            </div>
        `;
        const viewRenderer = this.views[this.activeTab];
        if (viewRenderer) {
            try {
                await viewRenderer(container, this, this.activeArgs);
            } catch (err) {
                console.error(err);
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-[400px] gap-4 text-error">
                        <span class="material-symbols-outlined text-4xl">error</span>
                        <p class="font-bold">Error loading view</p>
                        <p class="text-xs text-on-surface-variant">${err.message}</p>
                    </div>
                `;
            }
        }
    }

    handleSearch(query) {
        // Dispatches search event to custom active view search function if implemented
        const searchTarget = document.getElementById('view-search-target');
        if (searchTarget) {
            const event = new CustomEvent('app-search', { detail: { query } });
            searchTarget.dispatchEvent(event);
        }
    }
}

// Predefined Indian States & Union Territories
export const INDIAN_STATES_AND_UTS = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman & Nicobar Islands',
    'Chandigarh',
    'Dadra & Nagar Haveli and Daman & Diu',
    'Delhi (NCT)',
    'Jammu & Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry'
];

// Reusable Searchable Dropdown Initializer
export function initializeSearchableDropdown(inputEl, optionsFetcher, onAddCustomOption = null) {
    if (!inputEl) return;

    // Ensure parent is relative for dropdown positioning
    const parent = inputEl.parentElement;
    if (parent) {
        parent.classList.add('relative');
    }

    // Check if dropdown menu already exists
    let dropdownId = `${inputEl.id}-dropdown-menu`;
    let dropdownMenu = document.getElementById(dropdownId);
    if (!dropdownMenu) {
        dropdownMenu = document.createElement('div');
        dropdownMenu.id = dropdownId;
        dropdownMenu.className = 'dropdown-menu-custom hidden';
        inputEl.after(dropdownMenu);
    }

    const renderOptions = (filterQuery = '') => {
        const query = filterQuery.toLowerCase().trim();
        if (!query) {
            dropdownMenu.classList.add('hidden');
            return;
        }

        const optionsList = typeof optionsFetcher === 'function' ? optionsFetcher() : optionsFetcher;
        let matches = optionsList.filter(opt => opt.toLowerCase().includes(query));

        let html = '';
        if (matches.length > 0) {
            html += matches.map(opt => `
                <div data-value="${opt}" class="dropdown-item-custom">
                    ${opt}
                </div>
            `).join('');
        }

        // Show option to add custom value if query is not empty and onAddCustomOption is provided
        if (onAddCustomOption && !optionsList.some(opt => opt.toLowerCase() === query)) {
            const displayQuery = filterQuery.trim();
            html += `
                <div data-add-custom="${displayQuery}" class="dropdown-item-custom font-bold text-primary">
                    + Add "${displayQuery}"
                </div>
            `;
        }

        if (!html) {
            html = `<div class="dropdown-item-custom italic text-on-surface-variant">No results found</div>`;
        }

        dropdownMenu.innerHTML = html;
        dropdownMenu.classList.remove('hidden');

        // Bind item click handlers
        dropdownMenu.querySelectorAll('.dropdown-item-custom').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // prevent blur from firing before mousedown resolves selection
                if (item.hasAttribute('data-add-custom')) {
                    const customVal = item.getAttribute('data-add-custom');
                    if (onAddCustomOption) {
                        onAddCustomOption(customVal);
                    }
                    inputEl.value = customVal;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (item.getAttribute('data-value')) {
                    const val = item.getAttribute('data-value');
                    inputEl.value = val;
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
                dropdownMenu.classList.add('hidden');
            });
        });
    };

    inputEl.addEventListener('input', (e) => {
        renderOptions(e.target.value);
    });

    inputEl.addEventListener('blur', () => {
        // Delay hiding so clicks inside dropdown can register
        setTimeout(() => {
            dropdownMenu.classList.add('hidden');
        }, 200);
    });
}

// Instantiate Controller on Load
window.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new AppController();
});
