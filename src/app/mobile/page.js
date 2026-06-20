"use client";
import { useState, useEffect } from 'react';
import { ApiClient } from '../../lib/apiClient';
import Link from 'next/link';

export default function MobilePage() {
  const [invoices, setInvoices] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState('0%');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await ApiClient.getInvoices();
    setInvoices(data);

    let paid = 0;
    let pending = 0;
    data.forEach(inv => {
      if (inv.status === 'Paid') {
        paid += Number(inv.amount) || 0;
      } else if (inv.status === 'Pending') {
        pending += Number(inv.amount) || 0;
      }
    });

    setTotalRevenue(paid);
    setPendingAmount(pending);

    const total = paid + pending;
    const percent = total > 0 ? (pending / total) * 100 : 0;
    setProgressBarWidth(`${percent}%`);
  };

  const getClientIcon = (clientName) => {
    if (!clientName) return 'person';
    const name = clientName.toLowerCase();
    if (name.includes('agency')) return 'corporate_fare';
    if (name.includes('deli') || name.includes('store')) return 'store';
    return 'person';
  };

  const getStatusClass = (status) => {
    if (status === 'Paid') {
      return 'bg-secondary-container text-on-secondary-container';
    } else if (status === 'Pending') {
      return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
    } else {
      return 'bg-error-container text-on-error-container';
    }
  };

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="theme-mobile min-h-screen pb-32 bg-background text-on-background">
      {/* TopAppBar */}
      <header className="bg-surface shadow-sm flex justify-between items-center w-full px-4 h-14 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuClcgte4O073JB95XU2WFxBgaoET3uVKAxe9hfWXahvjjFAHeSBJ6sHSmrLgX-peTTbVO_NcUi3C9usYLGGO32dDrkidpd3h_yeAqukFCP19nZ236MrW7DCVhFEIsfDUApwYly8JsnOgnbQujddKmGn9kK0DLwpqbDtfNcvo7nVZLsZ1sckvqzd1v1_e9ZQuh3oYC70y5rf6LGjbWoCbDgpjjGgawbDI-8EjOSMA-aZdy9rXvXBFPZzlESXJWraVjP7UbMI9omFF9E"
            />
          </div>
          <h1 className="font-display-lg text-xl text-primary font-bold">BillSimple</h1>
        </div>
        <button className="material-symbols-outlined text-primary hover:bg-slate-100 transition-colors p-2 rounded-full active:scale-95 duration-155">
          notifications
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 max-w-2xl mx-auto pt-6 space-y-6">
        {/* Revenue Overview Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
            <p className="font-label-md text-xs text-on-surface-variant tracking-wider uppercase font-semibold">Total revenue</p>
            <h2 className="font-headline-md text-xl text-primary font-bold mt-1">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-2 flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span className="font-label-md text-xs">12% vs last month</span>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
            <p className="font-label-md text-xs text-on-surface-variant tracking-wider uppercase font-semibold">Pending</p>
            <h2 className="font-headline-md text-xl text-on-tertiary-container font-bold mt-1">
              ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-3 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-secondary h-full transition-all duration-500" style={{ width: progressBarWidth }}></div>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <Link
          href="/create-invoice-step1"
          className="w-full h-[52px] bg-secondary text-on-secondary rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md"
        >
          <span className="material-symbols-outlined">add</span>
          Create New Invoice
        </Link>

        {/* Stats Visualization */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-md text-on-surface">Weekly Activity</h3>
            <span className="font-label-md text-xs text-on-surface-variant">Last 7 Days</span>
          </div>
          <div className="h-32 w-full bg-slate-100 rounded-xl flex items-end justify-between px-4 pb-1 gap-2">
            <div className="bg-secondary/20 w-full rounded-t-sm h-[40%]"></div>
            <div className="bg-secondary/20 w-full rounded-t-sm h-[60%]"></div>
            <div className="bg-secondary/20 w-full rounded-t-sm h-[30%]"></div>
            <div className="bg-secondary/40 w-full rounded-t-sm h-[85%]"></div>
            <div className="bg-secondary/20 w-full rounded-t-sm h-[50%]"></div>
            <div className="bg-secondary w-full rounded-t-sm h-[100%]"></div>
            <div className="bg-secondary/30 w-full rounded-t-sm h-[45%]"></div>
          </div>
        </section>

        {/* Recent Invoices List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-md text-on-surface">Recent Invoices</h3>
            <button className="font-label-md text-xs text-secondary hover:underline font-semibold">View All</button>
          </div>

          <div className="space-y-2">
            {recentInvoices.length > 0 ? (
              recentInvoices.map(inv => {
                const formattedDate = new Date(inv.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div
                    key={inv.id}
                    className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex justify-between items-center border border-outline-variant/10 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500">{getClientIcon(inv.clientName)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-primary font-bold">{inv.clientName || 'Anonymous Client'}</p>
                        <p className="text-xs text-on-surface-variant">{inv.id || 'Inv #'} • {formattedDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${inv.status === 'Overdue' ? 'text-red-600' : 'text-primary'}`}>
                        ${(inv.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getStatusClass(inv.status)}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-surface-container-lowest p-4 rounded-xl text-center text-xs text-slate-500 border border-outline-variant/10">
                No invoices found. Create a new one to get started!
              </div>
            )}
          </div>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-safe h-20 bg-white shadow-lg rounded-t-xl">
        <button className="flex flex-col items-center justify-center bg-green-50 text-secondary rounded-full px-5 py-1 transition-transform duration-200">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="font-label-md text-[10px] font-bold">Dashboard</span>
        </button>
        <Link href="/create-invoice-step1" className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">description</span>
          <span className="font-label-md text-[10px] font-bold">Invoices</span>
        </Link>
        <button className="flex flex-col items-center justify-center text-slate-500 px-5 py-1">
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-md text-[10px] font-bold">Settings</span>
        </button>
      </nav>

      {/* Floating Atmosphere Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-100 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-50 opacity-40 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
