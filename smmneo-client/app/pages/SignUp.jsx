import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../components/AuthContext.jsx";
import toast from "react-hot-toast";

const SignUp = () => {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }
    if (form.username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);
    try {
      await signupWithEmail(form.email, form.password, form.username);
      navigate("/dashboard");
    } catch (err) {
      // Error handled by toast in AuthContext
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
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
    <div style={{ fontFamily: "'Sora', sans-serif" }} className="relative min-h-screen overflow-x-hidden bg-[#f5f6fa] px-4 py-10 flex flex-col items-center">

      {/* Background diamond decorations */}
      <div className="pointer-events-none fixed right-[-80px] top-[60px] h-[260px] w-[260px] rotate-45 rounded border-2 border-[#d8d0f5] opacity-50" />
      <div className="pointer-events-none fixed bottom-[80px] left-[-60px] h-[180px] w-[180px] rotate-45 rounded border-2 border-[#d8d0f5] opacity-40" />

      <div className="w-full max-w-[480px] animate-[fadeUp_0.5s_ease_both]">
        {/* Heading */}
        <h1 className="mb-2.5 text-center text-[2.4rem] font-extrabold tracking-tight text-[#1a1a2e]">
          Signup Now
        </h1>
        <p className="mx-auto mb-7 max-w-[360px] text-center text-[0.85rem] leading-relaxed text-[#6b6b8a]">
          Discover the cheapest SMM panel in Bangladesh – a cost-effective
          solution for amazing business growth. Save money, gain new followers,
          and easily boost your online presence.
        </p>

        {/* Card */}
        <div className="w-full rounded-[20px] border border-[#e2e0f0] bg-white px-7 py-7 shadow-[0_8px_40px_rgba(79,39,212,0.08)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">

            {/* Username */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a2e]">
                Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#7c5cbf]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M3 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border-[1.5px] border-[#e2e0f0] bg-[#fafafa] py-3 pl-10 pr-4 font-[Sora] text-[0.87rem] text-[#1a1a2e] placeholder-[#b5b3c9] outline-none transition focus:border-[#4f27d4] focus:bg-white focus:shadow-[0_0_0_3px_rgba(79,39,212,0.10)]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a2e]">
                Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#7c5cbf]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-[1.5px] border-[#e2e0f0] bg-[#fafafa] py-3 pl-10 pr-4 font-[Sora] text-[0.87rem] text-[#1a1a2e] placeholder-[#b5b3c9] outline-none transition focus:border-[#4f27d4] focus:bg-white focus:shadow-[0_0_0_3px_rgba(79,39,212,0.10)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[0.82rem] font-semibold text-[#1a1a2e]">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#7c5cbf]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-[1.5px] border-[#e2e0f0] bg-[#fafafa] py-3 pl-10 pr-4 font-[Sora] text-[0.87rem] text-[#1a1a2e] placeholder-[#b5b3c9] outline-none transition focus:border-[#4f27d4] focus:bg-white focus:shadow-[0_0_0_3px_rgba(79,39,212,0.10)]"
                />
              </div>
            </div>

            {/* Sign up button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-[#4f27d4] py-3.5 font-[Sora] text-[0.95rem] font-bold tracking-wide text-white shadow-[0_4px_20px_rgba(79,39,212,0.30)] transition hover:-translate-y-0.5 hover:bg-[#3d1fb3] hover:shadow-[0_6px_24px_rgba(79,39,212,0.40)] active:translate-y-0 disabled:opacity-50"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-[#e2e0f0]" />
            <span className="text-[0.75rem] text-[#bbb]">or</span>
            <div className="h-px flex-1 bg-[#e2e0f0]" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-[#e2e0f0] bg-white py-3 font-[Sora] text-[0.84rem] font-semibold text-[#1a1a2e] transition hover:border-[#aaa] hover:shadow-[0_2px_10px_rgba(0,0,0,0.07)] disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Google আকাউন্ট দিয়ে সাইন-আপ করুন
          </button>

          {/* Sign in link */}
          <p className="mt-4 text-center text-[0.82rem] text-[#6b6b8a]">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-[#4f27d4] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Sora font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SignUp;