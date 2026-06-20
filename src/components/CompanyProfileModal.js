"use client";
import { useState, useEffect } from 'react';
import { ApiClient } from '../lib/apiClient';

export default function CompanyProfileModal({ isOpen, onClose, onSave }) {
  const [profile, setProfile] = useState({
    name: '',
    gstin: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    pincode: '',
    state: '',
    country: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountName: '',
    branchName: '',
    accountType: 'Current Account'
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    const data = await ApiClient.getCompanyProfile();
    if (data && data.name) {
      setProfile(data);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name || !profile.gstin || !profile.email || !profile.phone || !profile.address1 || !profile.city || !profile.pincode || !profile.state || !profile.country) {
      alert('Please fill in all mandatory fields.');
      return;
    }
    if (!profile.accountName || !profile.bankName || !profile.accountNumber || !profile.ifscCode || !profile.branchName) {
      alert('Please fill in all mandatory bank details.');
      return;
    }

    const payload = {
      ...profile,
      logoIcon: 'corporate_fare'
    };

    await ApiClient.saveCompanyProfile(payload);
    alert('Company Profile saved successfully!');
    if (onSave) onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Company Settings & Defaults</h3>
            <p className="text-xs text-slate-500">Configure your professional profile and bank details.</p>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-slate-400 hover:text-slate-700 transition-colors"
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {/* Section: Business Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-sky-600 tracking-wider border-b border-slate-100 pb-1">Business identity</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Company Name *</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={profile.name}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. GK Fintrics Solutions"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">GSTIN / Tax ID *</label>
                <input
                  id="gstin"
                  type="text"
                  required
                  value={profile.gstin}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Billing Email *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={profile.email}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. finance@gkfintrics.com"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Contact Phone *</label>
                <input
                  id="phone"
                  type="text"
                  required
                  value={profile.phone}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Section: Registered Address */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-sky-600 tracking-wider border-b border-slate-100 pb-1">Registered address</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Address Line 1 *</label>
                <input
                  id="address1"
                  type="text"
                  required
                  value={profile.address1}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. 101, Business Hub"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Address Line 2</label>
                  <input
                    id="address2"
                    type="text"
                    value={profile.address2}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g. Senapati Bapat Marg"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Address Line 3</label>
                  <input
                    id="address3"
                    type="text"
                    value={profile.address3}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g. Lower Parel"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">City *</label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={profile.city}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Pincode *</label>
                  <input
                    id="pincode"
                    type="text"
                    required
                    value={profile.pincode}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="e.g. 400013"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">State *</label>
                  <input
                    id="state"
                    type="text"
                    required
                    value={profile.state}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Select state..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-600">Country *</label>
                  <input
                    id="country"
                    type="text"
                    required
                    value={profile.country}
                    onChange={handleChange}
                    className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Select country..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Default Bank Profile */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-sky-600 tracking-wider border-b border-slate-100 pb-1">Default bank details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Beneficiary Name *</label>
                <input
                  id="accountName"
                  type="text"
                  required
                  value={profile.accountName}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. GK Fintrics Solutions Private Limited"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Bank Name *</label>
                <input
                  id="bankName"
                  type="text"
                  required
                  value={profile.bankName}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. HDFC Bank"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Account Number *</label>
                <input
                  id="accountNumber"
                  type="text"
                  required
                  value={profile.accountNumber}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. 50100200300400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">IFSC Code *</label>
                <input
                  id="ifscCode"
                  type="text"
                  required
                  value={profile.ifscCode}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. HDFC0000001"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Branch Name *</label>
                <input
                  id="branchName"
                  type="text"
                  required
                  value={profile.branchName}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="e.g. BKC Branch"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Account Type *</label>
                <input
                  id="accountType"
                  type="text"
                  required
                  value={profile.accountType}
                  onChange={handleChange}
                  className="form-input text-xs w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Select or type account type..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-2 border-t border-slate-200">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
