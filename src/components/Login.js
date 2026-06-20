"use client";
import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock successful login flow
    setTimeout(() => {
      setIsSuccess(true);
      setTimeout(() => {
        localStorage.setItem('is_logged_in', 'true');
        setIsLoading(false);
        setIsSuccess(false);
        onLogin();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-sky-950 rounded-xl text-sky-400">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">SwiftInvoice Pro</h2>
          <p className="text-slate-400 text-sm">Sign in to access GK Fintrics web dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 tracking-wider">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm"
              placeholder="you@domain.com"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 tracking-wider">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember-me"
              className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 h-4 w-4"
            />
            <label htmlFor="remember-me" className="ml-2 text-xs text-slate-400 select-none">
              Keep me signed in on this device
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-sky-900/30 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : isSuccess ? (
              "Signed In Successfully!"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@complianceready.com');
              setPassword('password');
            }}
            className="w-full py-2 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <img className="w-4 h-4" src="https://lh3.googleusercontent.com/COxitlgoAK1FJBg58w7O4AxQOHebwR7t44R65wHm4COxocjQP3aN7472yEre9g" alt="Google Logo" />
            Sign in with Google
          </button>
          <button
            type="button"
            className="w-full py-2 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">vpn_key</span>
            Enterprise Single Sign-On (SSO)
          </button>
        </div>
      </div>
    </div>
  );
}
