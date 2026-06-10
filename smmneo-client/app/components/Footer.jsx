const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.8fr_1fr_1fr_1.1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white text-lg font-black">S</div>
              <div>
                <p className="text-xl font-semibold text-white">SMMSecure</p>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Affordable social media marketing services for fast growth, backed by reliable support.
                </p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Company</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-400">
              <li><a href="#" className="transition hover:text-white">Home</a></li>
              <li><a href="#" className="transition hover:text-white">Blog</a></li>
              <li><a href="#" className="transition hover:text-white">About Us</a></li>
              <li><a href="#" className="transition hover:text-white">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Support</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-400">
              <li><a href="#" className="transition hover:text-white">Tickets Support</a></li>
              <li><a href="#" className="transition hover:text-white">Contact Us</a></li>
              <li><a href="#" className="transition hover:text-white">WhatsApp Community</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Reach Out</p>
            <div className="mt-6 space-y-3 text-sm text-slate-400">
              <p>@SMMSecure_Update</p>
              <p>support@smmssecure.com</p>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 SMMSecure. All Rights Reserved.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a href="#" className="transition hover:text-white">Privacy Policy</a>
              <a href="#" className="transition hover:text-white">Terms & Conditions</a>
              <a href="#" className="transition hover:text-white">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;