"use client";
import { useState, useEffect } from 'react';
import { X, Users, MapPin } from 'lucide-react';
import { ApiClient } from '../lib/apiClient';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli and Daman & Diu',
  'Delhi (NCT)','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'
];

const BLANK_FORM = {
  name: '', tradeName: '', email: '', phone: '', gstin: '', currency: 'INR (₹)',
  address1: '', address2: '', address3: '', city: '', pincode: '', state: '', country: 'India'
};

const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none bg-white placeholder:text-slate-300" />
);

export default function CustomerModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...BLANK_FORM, ...initialData } : BLANK_FORM);
      ApiClient.getCountries().then(c => setCountries(c || []));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const setField = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, address1, city, pincode, state, country, currency } = form;
    if (!name.trim() || !address1.trim() || !city.trim() || !pincode.trim() || !state.trim() || !country.trim() || !currency) {
      alert('Please fill all required fields.'); return;
    }
    setSaving(true);
    const parts = name.trim().split(' ');
    const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    
    // If we have an ID, we are updating. Otherwise, new client.
    const payload = { 
      id: form.id || `c${Date.now()}`, 
      ...form, 
      name: name.trim(), 
      tradeName: form.tradeName?.trim() || '',
      initials, 
      status: form.status || 'Active', 
      lastInvoice: form.lastInvoice || 'Never', 
      bankAccounts: form.bankAccounts || [] 
    };

    let res;
    if (form.id) {
      res = await ApiClient.updateClient(payload);
    } else {
      res = await ApiClient.saveClient(payload);
    }
    
    setSaving(false);
    if (res.success) {
      onSave(res.client || payload);
      onClose();
    } else {
      alert(res.error || 'Failed to save customer.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-slate-500"/> {initialData ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details for the billing profile.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-7 py-6 space-y-6">

            {/* ── Basic Info ──────────────────────────────── */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Customer Name" required>
                  <Input required value={form.name} onChange={setField('name')} placeholder="e.g. Acme Corp Pvt Ltd"/>
                </Field>
                <Field label="Trade Name (Optional)">
                  <Input value={form.tradeName} onChange={setField('tradeName')} placeholder="e.g. Acme"/>
                </Field>
                <Field label="GSTIN">
                  <Input value={form.gstin} onChange={setField('gstin')} placeholder="e.g. 27AAAAA0000A1Z5"/>
                </Field>
                <Field label="Billing Email">
                  <Input type="email" value={form.email} onChange={setField('email')} placeholder="billing@company.com"/>
                </Field>
                <Field label="Phone Number">
                  <Input type="tel" value={form.phone} onChange={setField('phone')} placeholder="+91 98765 43210"/>
                </Field>
                <Field label="Currency" required>
                  <select required value={form.currency} onChange={setField('currency')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-black outline-none bg-white">
                    <option value="">Select currency</option>
                    <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                    <option value="USD ($)">USD ($) — US Dollar</option>
                    <option value="EUR (€)">EUR (€) — Euro</option>
                    <option value="GBP (£)">GBP (£) — British Pound</option>
                    <option value="AED (د.إ)">AED (د.إ) — UAE Dirham</option>
                    <option value="SGD ($)">SGD ($) — Singapore Dollar</option>
                    <option value="AUD ($)">AUD ($) — Australian Dollar</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* ── Billing Address ─────────────────────────── */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <MapPin size={12}/> Billing Address
              </p>
              <div className="space-y-3">
                <Field label="Address Line 1" required>
                  <Input required value={form.address1} onChange={setField('address1')} placeholder="Flat / Floor / Building name"/>
                </Field>
                <Field label="Address Line 2">
                  <Input value={form.address2} onChange={setField('address2')} placeholder="Street / Road / Area"/>
                </Field>
                <Field label="Address Line 3">
                  <Input value={form.address3} onChange={setField('address3')} placeholder="Landmark / Locality (optional)"/>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Field label="City" required>
                  <Input required value={form.city} onChange={setField('city')} placeholder="e.g. Mumbai"/>
                </Field>
                <Field label="Pincode / ZIP" required>
                  <Input required value={form.pincode} onChange={setField('pincode')} placeholder="e.g. 400001"/>
                </Field>
                <Field label="State" required>
                  <select required value={form.state} onChange={setField('state')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-black outline-none">
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Country" required>
                  <select required value={form.country} onChange={setField('country')}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-black outline-none">
                    <option value="India">India</option>
                    {countries.filter(c => c !== 'India').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          <div className="px-7 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-2">
              {saving ? 'Saving...' : (initialData ? 'Save Changes' : 'Save Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
