import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { Link, useNavigate } from "react-router";

const Hero = ({ id }) => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      // Error handled by toast in AuthContext
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      // Error handled by toast in AuthContext
    }
    setLoading(false);
  };
  return (
    <section id={id} className="relative overflow-hidden bg-[#ebe5f3]">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(120,119,198,0.10) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120,119,198,0.10) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />



      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="relative z-20">
            <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-700">
              Best & Cheap SMM Panel
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Best &{" "}
              <span className="text-violet-700">Cheap SMM Panel</span> for
              Social Media Growth
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              SMMGen is the cheapest SMM Panel that helps your business grow on
              social media. Get more followers, likes, and views instantly with
              fast and affordable services.
            </p>

            {/* LOGIN CARD */}
            <form onSubmit={handleEmailLogin} className="mt-10 w-full max-w-xl rounded-[32px] border border-white/50 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              {/* Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Email */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </span>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </span>

                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pl-12 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" />
                  Remember me
                </label>

                <button className="font-medium text-violet-700 hover:underline">
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-14 w-full rounded-[3px] md:rounded-2xl bg-violet-700 text-base font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-600 disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200"></div>
                <span className="text-sm text-slate-400">OR</span>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-[3px] md:rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold">
                  G
                </span>
                Continue with Google
              </button>

              {/* Signup */}
              <p className="mt-6 text-center text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-semibold text-violet-700 hover:underline">
                  Signup Now
                </Link>
              </p>
            </form>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow */}
            <div className="absolute top-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

            {/* Image Wrapper */}
            <div className="relative w-full max-w-md">
              {/* Main Image */}
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
                  <h3 className="text-sm font-bold text-slate-900">
                    Facebook Followers
                  </h3>

                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Start Count</span>
                    <span className="font-semibold text-slate-900">
                      25,145
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Remain</span>
                    <span className="font-semibold text-slate-900">
                      1,145
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-3">
                    <span className="text-slate-500">Time</span>
                    <span className="font-semibold text-slate-900">
                      2 Minutes
                    </span>
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