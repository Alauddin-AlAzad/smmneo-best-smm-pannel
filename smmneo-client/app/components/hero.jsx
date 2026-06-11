import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { Link, useNavigate } from 'react-router';

const Hero = ({ id }) => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      // Error handled by toast in AuthContext
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      // Error handled by toast in AuthContext
    }
    setLoading(false);
  };

  return (
    <section id={id} className="relative overflow-hidden bg-[#ebe5f3]">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-40 sm:opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(120,119,198,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120,119,198,0.10) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* padding py-14 থেকে কমিয়ে মোবাইলের জন্য py-6 করা হয়েছে */}
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-20">
        {/* gap-14 থেকে কমিয়ে মোবাইলের জন্য gap-6 করা হয়েছে */}
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-14">
          
          {/* LEFT SIDE */}
          <div className="relative z-20 w-full">
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700 sm:px-4 sm:py-2 sm:text-xs">
              Best & Cheap SMM Panel
            </span>

            {/* মোবাইলে টেক্সট সাইজ এবং মার্জিন কমানো হয়েছে */}
            <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:mt-6 sm:text-4xl lg:text-6xl text-center sm:text-left">
              Best & <span className="text-violet-700">Cheap SMM Panel</span> for Social Media Growth
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600 sm:mt-6 sm:text-base lg:text-lg text-center sm:text-left">
              SMMSecure is the cheapest SMM Panel that helps your business grow on social media instantly.
            </p>

            {/* LOGIN CARD - মোবাইলের জন্য প্যাডিং এবং বর্ডার রেডিয়াস অপ্টিমাইজড */}
            <form 
              onSubmit={handleEmailLogin} 
              className="mt-5 w-full max-w-xl rounded-2xl border border-white/50 bg-white/90 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:mt-10 sm:rounded-[32px] sm:p-8"
            >
              {/* Inputs - মোবাইলে ইনপুট হাইট এবং ফন্ট ছোট করা হয়েছে */}
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {/* Email */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-11 sm:h-14 w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 pl-10 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100/50"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="h-11 sm:h-14 w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 pl-10 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100/50"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="mt-3 flex flex-row items-center justify-between text-xs text-slate-600 sm:mt-5 sm:text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded accent-violet-700" />
                  Remember
                </label>
                <button type="button" className="font-medium text-violet-700 hover:underline">
                  Forgot?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 h-11 sm:h-14 w-full rounded-xl sm:rounded-2xl bg-violet-700 text-sm sm:text-base font-semibold text-white shadow-md shadow-violet-500/10 transition hover:bg-violet-600 disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3 sm:my-6">
                <div className="h-px flex-1 bg-slate-200"></div>
                <span className="text-[11px] sm:text-sm text-slate-400 font-medium">OR</span>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex h-11 sm:h-14 w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] sm:text-xs">
                  G
                </span>
                Continue with Google
              </button>

              {/* Signup Link */}
              <p className="mt-4 text-center text-xs sm:text-sm text-slate-600 sm:mt-6">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-semibold text-violet-700 hover:underline">
                  Signup Now
                </Link>
              </p>
            </form>
          </div>

          {/* RIGHT SIDE (IMAGE SECTION) - মোবাইলে স্ক্রোলিং এড়াতে hidden এবং বড় স্ক্রিনে lg:flex করা হয়েছে */}
          <div className="hidden lg:flex relative justify-center lg:justify-end">
            <div className="absolute top-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative w-full max-w-md">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1000"
                alt="Girl"
                className="relative z-10 w-full object-contain"
              />

              {/* Floating Card 1 */}
              <div className="absolute left-0 top-10 z-20 w-52 rounded-3xl bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>Follower Growth</span>
                  <span>16.2K</span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <div className="h-10 w-6 rounded-full bg-violet-300"></div>
                  <div className="h-16 w-6 rounded-full bg-violet-400"></div>
                  <div className="h-20 w-6 rounded-full bg-violet-500"></div>
                  <div className="h-12 w-6 rounded-full bg-violet-400"></div>
                  <div className="h-14 w-6 rounded-full bg-violet-600"></div>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute bottom-8 right-0 z-20 w-64 rounded-3xl bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Facebook Followers</h3>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Active</span>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Start Count</span>
                    <span className="font-semibold text-slate-900">25,145</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remain</span>
                    <span className="font-semibold text-slate-900">1,145</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-slate-900">2 Minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END RIGHT */}

        </div>
      </div>
    </section>
  );
};

export default Hero;