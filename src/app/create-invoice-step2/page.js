"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/apiClient';
import Link from 'next/link';

export default function Step2() {
  const router = useRouter();

  // Client dropdown references and suggestions lists
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Form states
  const [gstin, setGstin] = useState('');
  const [placeSupply, setPlaceSupply] = useState('Maharashtra (27)');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPin, setBillingPin] = useState('');
  const [billingState, setBillingState] = useState('');

  const [sameAddress, setSameAddress] = useState(true);
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPin, setShippingPin] = useState('');
  const [shippingState, setShippingState] = useState('');

  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    fetchClients();
    loadDraft();

    // Click outside listener for suggestions
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchClients = async () => {
    const data = await ApiClient.getClients();
    setClients(data);
  };

  const loadDraft = () => {
    const draft = JSON.parse(localStorage.getItem('invoice_draft_step2') || '{}');
    if (draft.clientName) {
      setClientSearch(draft.clientName);
      setGstin(draft.gstin || '');
      setPlaceSupply(draft.placeOfSupply || 'Maharashtra (27)');
      setBillingStreet(draft.billingStreet || '');
      setBillingCity(draft.billingCity || '');
      setBillingPin(draft.billingPin || '');
      setBillingState(draft.billingState || '');

      setSameAddress(draft.sameAddress !== false);
      setShippingStreet(draft.shippingStreet || '');
      setShippingCity(draft.shippingCity || '');
      setShippingPin(draft.shippingPin || '');
      setShippingState(draft.shippingState || '');

      setContactPerson(draft.contactPerson || '');
      setContactEmail(draft.contactEmail || '');
      setContactPhone(draft.contactPhone || '');
    }
  };

  const handleAutofillClient = (client) => {
    setClientSearch(client.name);
    setGstin(client.gstin || '');

    // Match place of supply
    const matchOptions = ['Maharashtra (27)', 'Delhi (07)', 'Karnataka (29)', 'Tamil Nadu (33)'];
    if (client.state) {
      const match = matchOptions.find(o => o.toLowerCase().includes(client.state.toLowerCase()));
      if (match) setPlaceSupply(match);
    }

    const fullStreet = [client.address1, client.address2, client.address3].filter(Boolean).join(', ');
    setBillingStreet(fullStreet);
    setBillingCity(client.city || '');
    setBillingPin(client.pincode || '');
    setBillingState(client.state || '');

    setContactPerson(client.name || '');
    setContactEmail(client.email || '');
    setContactPhone(client.phone ? client.phone.replace('+91', '').trim() : '');

    setShowSuggestions(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const finalShippingStreet = sameAddress ? billingStreet : shippingStreet;
    const finalShippingCity = sameAddress ? billingCity : shippingCity;
    const finalShippingPin = sameAddress ? billingPin : shippingPin;
    const finalShippingState = sameAddress ? billingState : shippingState;

    const step2Data = {
      clientName: clientSearch.trim(),
      gstin: gstin.trim(),
      placeOfSupply: placeSupply,
      billingStreet: billingStreet.trim(),
      billingCity: billingCity.trim(),
      billingPin: billingPin.trim(),
      billingState: billingState.trim(),
      sameAddress,
      shippingStreet: finalShippingStreet.trim(),
      shippingCity: finalShippingCity.trim(),
      shippingPin: finalShippingPin.trim(),
      shippingState: finalShippingState.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim()
    };

    localStorage.setItem('invoice_draft_step2', JSON.stringify(step2Data));
    router.push('/create-invoice-step3');
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase().trim()) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase().trim()))
  );

  return (
    <div className="theme-mobile bg-surface text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm docked full-width top-0 z-50 sticky">
        <div className="flex justify-between items-center w-full px-4 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-slate-100 p-2 rounded-full transition-colors active:scale-95 duration-150">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <Link href="/mobile" className="font-display-lg text-xl text-primary font-bold cursor-pointer">BillSimple</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary p-2 hover:bg-slate-100 rounded-full cursor-pointer">notifications</span>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-outline-variant">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFCJboC-ryyF8tH1iXuhUK8WI0fADx6zGFVX9CM4PBDhjl9DAiYtblemMjvSXLg9RVzVgSit5-Rl0ZDUeCkNR0NlkT6R_7GOuPjwkGFzr5rSPDlMM3POIlQ7dLWlzR0fwkMtTJwk5DvsK6Tts7BzeStf1oIXtb5KmlecQlqqCUxmmkIkLhEfwbohWmEh287Xpg5dKKNlHe8tvD6hvhwE3zQCZRTspi9V2AoHJYsIsnPt_peWPHdT-Gy0MkzI-WKmbRKBOBwizz_is"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-6 pb-32">
        {/* Progress Stepper */}
        <nav className="mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2 z-0"></div>
            <div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-secondary -translate-y-1/2 z-0 transition-all duration-500"></div>
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <Link href="/create-invoice-step1" className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-base">check</span>
              </Link>
              <span className="font-label-md text-[10px] uppercase font-bold text-on-surface">General Info</span>
            </div>
            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shadow-md border-4 border-white">
                2
              </div>
              <span className="font-label-md text-[10px] uppercase font-bold text-slate-900">Customer Details</span>
            </div>
            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm border-2 border-slate-300">
                3
              </div>
              <span className="font-label-md text-[10px] uppercase font-bold text-slate-400">Line Items</span>
            </div>
          </div>
        </nav>

        {/* Form Content */}
        <form id="client-details-form" onSubmit={handleFormSubmit} className="space-y-6">
          {/* Customer Selection Card */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
            <header className="mb-4">
              <h2 className="font-bold text-md text-on-surface">Client Identity</h2>
              <p className="text-on-surface-variant text-xs">Select an existing client or enter details manually.</p>
            </header>
            <div className="space-y-4">
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1" htmlFor="client-name">Client Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                  <input
                    required
                    className="w-full h-[52px] pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                    id="client-name"
                    placeholder="Search for a client..."
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {/* Suggestions dropdown */}
                {showSuggestions && clientSearch.trim() && (
                  <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleAutofillClient(c)}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100"
                        >
                          <div className="w-8 h-8 rounded-full bg-green-50 text-secondary flex items-center justify-center font-bold text-xs">
                            {c.initials || c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.email || c.company || ''}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs italic text-slate-400">No customers found</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1" htmlFor="gstin">GSTIN (Optional)</label>
                  <input
                    className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm uppercase font-semibold"
                    id="gstin"
                    placeholder="22AAAAA0000A1Z5"
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1" htmlFor="place-supply">Place of Supply</label>
                  <select
                    className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold h-[52px]"
                    id="place-supply"
                    value={placeSupply}
                    onChange={(e) => setPlaceSupply(e.target.value)}
                  >
                    <option value="Maharashtra (27)">Maharashtra (27)</option>
                    <option value="Delhi (07)">Delhi (07)</option>
                    <option value="Karnataka (29)">Karnataka (29)</option>
                    <option value="Tamil Nadu (33)">Tamil Nadu (33)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Addresses Section (Bento Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Address */}
            <section className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">receipt_long</span> Billing Address
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Street Address</label>
                  <textarea
                    required
                    id="billing-street"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold resize-none"
                    placeholder="123 Business Avenue, Park Street"
                    rows="2"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">City</label>
                    <input
                      required
                      id="billing-city"
                      className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                      placeholder="Mumbai"
                      type="text"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">PIN Code</label>
                    <input
                      required
                      id="billing-pin"
                      className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                      placeholder="400001"
                      type="text"
                      value={billingPin}
                      onChange={(e) => setBillingPin(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">State</label>
                  <input
                    required
                    id="billing-state"
                    className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                    placeholder="Maharashtra"
                    type="text"
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h2 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">local_shipping</span> Shipping Address
                </h2>
                <label className="flex items-center gap-2 cursor-pointer group select-none">
                  <input
                    className="w-5 h-5 rounded border-slate-350 text-secondary focus:ring-secondary cursor-pointer"
                    id="same-address"
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                  />
                  <span className="text-xs font-semibold text-on-surface-variant group-hover:text-secondary transition-colors">Same as Billing</span>
                </label>
              </div>
              <div className={`space-y-4 transition-all duration-300 ${sameAddress ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Street Address</label>
                  <textarea
                    id="shipping-street"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold resize-none"
                    placeholder="123 Business Avenue, Park Street"
                    rows="2"
                    value={sameAddress ? billingStreet : shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">City</label>
                    <input
                      id="shipping-city"
                      className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                      placeholder="Mumbai"
                      type="text"
                      value={sameAddress ? billingCity : shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1">PIN Code</label>
                    <input
                      id="shipping-pin"
                      className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                      placeholder="400001"
                      type="text"
                      value={sameAddress ? billingPin : shippingPin}
                      onChange={(e) => setShippingPin(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">State</label>
                  <input
                    id="shipping-state"
                    className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                    placeholder="Maharashtra"
                    type="text"
                    value={sameAddress ? billingState : shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Contact Information */}
          <section className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
            <header className="mb-4">
              <h2 className="font-bold text-sm text-on-surface">Contact Personnel</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Contact Person</label>
                <input
                  id="contact-person"
                  className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                  placeholder="John Doe"
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email Address</label>
                <input
                  id="contact-email"
                  className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                  placeholder="john.doe@client.com"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-bold">
                    +91
                  </span>
                  <input
                    id="contact-phone"
                    className="w-full h-[52px] px-4 bg-slate-50 border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-semibold"
                    placeholder="98765 43210"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>
        </form>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-40 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/create-invoice-step1"
            className="flex-1 h-[52px] flex items-center justify-center gap-2 text-slate-800 border-2 border-slate-800 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95 duration-150"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </Link>
          <button
            form="client-details-form"
            type="submit"
            className="flex-[2] h-[52px] flex items-center justify-center gap-2 bg-secondary text-on-secondary rounded-xl font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95 duration-150"
          >
            Save and Continue
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
