import Footer from "../components/Footer.jsx";

// ─── Inline SVG icons ────────────────────────────────────────────────────────
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2" className="w-6 h-6"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6"><defs><radialGradient id="ig" cx="30%" cy="107%"><stop offset="0%" stopColor="#fdf497"/><stop offset="5%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs><path fill="url(#ig)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
);
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1DA1F2" className="w-6 h-6"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417a9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FF0000" className="w-6 h-6"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
);
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" fill="#0A66C2" className="w-6 h-6"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.41 3.38 2 2 0 0 1 3.38 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="m22 2-7 20-4-9-9-4Z"/>
    <path d="M22 2 11 13"/>
  </svg>
);
const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" fill="#000" className="w-6 h-6"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
);
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="#26A5E4" className="w-6 h-6"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);
const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" fill="#1DB954" className="w-6 h-6"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="#5865F2" className="w-6 h-6"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
);
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="#BD081C" className="w-6 h-6"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
);
const SoundcloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="#FF5500" className="w-6 h-6"><path d="M1.175 12.225c-.015 0-.023.01-.024.022l-.272 2.248.272 2.248c.001.012.01.02.024.02.013 0 .021-.008.024-.02l.308-2.248-.308-2.248c-.003-.012-.011-.022-.024-.022zm.97-.042c-.016 0-.026.011-.026.026l-.233 2.264.233 2.264c0 .015.01.026.026.026.016 0 .026-.011.026-.026l.264-2.264-.264-2.264c0-.015-.01-.026-.026-.026zm.98-.052c-.018 0-.031.013-.031.031l-.194 2.316.194 2.316c0 .018.013.031.031.031s.031-.013.031-.031l.22-2.316-.22-2.316c0-.018-.013-.031-.031-.031zm.98-.07c-.02 0-.035.016-.035.036l-.155 2.386.155 2.386c0 .02.015.036.035.036s.035-.016.035-.036l.176-2.386-.176-2.386c0-.02-.015-.036-.035-.036zm1.01-.072c-.022 0-.039.017-.039.04l-.116 2.458.116 2.458c0 .022.017.04.039.04s.039-.018.039-.04l.131-2.458-.131-2.458c0-.023-.017-.04-.039-.04zm.98-.05c-.024 0-.043.019-.043.043l-.077 2.508.077 2.508c0 .024.019.043.043.043s.043-.019.043-.043l.088-2.508-.088-2.508c0-.024-.019-.043-.043-.043zm1.01-.044c-.026 0-.047.021-.047.047l-.038 2.552.038 2.552c0 .026.021.047.047.047s.047-.021.047-.047l.044-2.552-.044-2.552c0-.026-.021-.047-.047-.047zM9.115 9.5c-.028 0-.05.022-.05.05v5.9c0 .028.022.05.05.05h.001L9.115 9.5zm14.826 1.63c-.508 0-.994.1-1.44.28-.296-3.359-3.092-5.979-6.514-5.979-1.107 0-2.152.3-3.049.82-.327.198-.414.4-.417.574v10.97c.003.18.147.326.327.328H23.94c.033 0 .06-.027.06-.06v-6.87c0-1.697-1.38-3.063-3.059-3.063z"/></svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
);

// ─── Services data ────────────────────────────────────────────────────────────
const services = [
  { icon: <FacebookIcon />, name: "Facebook SMM Panel", desc: "Maximizing engagement and reach." },
  { icon: <InstagramIcon />, name: "Instagram SMM Panel", desc: "Enhancing visibility and follower growth." },
  { icon: <TwitterIcon />, name: "Twitter SMM Panel", desc: "Building influence and brand recognition." },
  { icon: <YoutubeIcon />, name: "YouTube SMM Panel", desc: "Increasing views and subscriber numbers." },
  { icon: <LinkedinIcon />, name: "LinkedIn SMM Panel", desc: "Professional networking and lead generation." },
  { icon: <TiktokIcon />, name: "TikTok SMM Panel", desc: "Tapping into viral marketing." },
  { icon: <TelegramIcon />, name: "Telegram SMM Panel", desc: "Expanding messaging and community engagement." },
  { icon: <SpotifyIcon />, name: "Spotify SMM Panel", desc: "Boosting music streaming and artist visibility." },
  { icon: <DiscordIcon />, name: "Discord SMM Panel", desc: "Community building and interaction." },
  { icon: <PinterestIcon />, name: "Pinterest SMM Panel", desc: "Driving traffic through visual content." },
  { icon: <SoundcloudIcon />, name: "SoundCloud SMM Panel", desc: "Enhancing audio content reach." },
  { icon: <GlobeIcon />, name: "Website Traffic", desc: "Improving online visibility and digital footfall." },
];

// ─── Contact Page ─────────────────────────────────────────────────────────────
const Contact = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-16 lg:py-24"
        style={{ background: "linear-gradient(120deg, #e9d5ff 0%, #fde8d8 50%, #e0e7ff 100%)" }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Get In Touch</span>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                <span className="text-orange-500">Connect</span> with Us for{" "}
                <span className="text-purple-700">Unparalleled SMM Solutions</span>
              </h1>
              <p className="mt-5 text-base leading-8 text-slate-600 max-w-xl">
                Embark on your journey to social media success with SMMSecure. Reach out to us for a consultation,
                to explore our services, or to start a partnership that transforms your digital presence.
              </p>
              <button className="mt-8 rounded-full bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-all">
                Send a Message
              </button>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-full bg-purple-300 opacity-30 blur-2xl"></div>
                <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-orange-100 to-purple-200 flex items-center justify-center shadow-2xl border-4 border-white">
                  <span className="text-8xl select-none">💬</span>
                  <div className="absolute bottom-3 right-1 bg-white rounded-xl px-2.5 py-1 shadow-md text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                    Online Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Info Cards ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Reach Us</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 leading-snug">
              Multiple Ways to <span className="text-orange-500">Get In Touch</span>
            </h2>
            <p className="mt-3 text-slate-600 text-sm max-w-xl mx-auto">
              Our team is ready to assist you through any channel you prefer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <MailIcon />, accent: "bg-indigo-600", label: "Email Us", value: "support@smmssecure.com", sub: "We reply within 24 hours" },
              { icon: <PhoneIcon />, accent: "bg-purple-500", label: "Call Us", value: "+1 (555) 123-4567", sub: "Mon–Fri, 9AM–6PM EST" },
              { icon: <LocationIcon />, accent: "bg-orange-500", label: "Our Office", value: "123 Digital Ave, NY", sub: "United States" },
              { icon: <ClockIcon />, accent: "bg-violet-600", label: "Support Hours", value: "Mon–Fri: 9AM – 6PM", sub: "Weekend: 10AM – 4PM EST" },
            ].map((card, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="relative p-4 mb-5">
                  <div className={`absolute inset-0 -rotate-6 rounded-2xl ${card.accent}`} />
                  <div className="relative w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-indigo-600">
                    {card.icon}
                  </div>
                </div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{card.label}</p>
                <p className="mt-1 font-bold text-slate-900 text-sm">{card.value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form + Info ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
            {/* Left — info */}
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Why Contact Us</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 leading-snug">
                We're Here to Help You <span className="text-purple-700">Grow Faster</span>
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Whether you're a startup exploring your first SMM campaign or an established agency
                looking to scale, our team brings tailored expertise to every conversation. No
                generic scripts—just real solutions built around your goals.
              </p>

              {/* Feature bullets */}
              <ul className="mt-6 space-y-3">
                {[
                  "24/7 customer support availability",
                  "Dedicated account managers",
                  "Fast response — under 2 hours",
                  "Multilingual support team",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex justify-start">
                <div className="relative">
                  <div className="absolute inset-0 -rotate-6 rounded-[3rem] bg-purple-500 opacity-90"></div>
                  <div className="relative rounded-[2.5rem] bg-gradient-to-br from-purple-100 to-orange-100 w-64 h-64 flex items-end justify-center overflow-hidden shadow-xl">
                    <span className="text-8xl mb-4 select-none">😊</span>
                    <div className="absolute top-4 right-4 text-3xl">👋</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Send Us a Message</h3>
              <p className="text-sm text-slate-500 mb-7">Fill out the form and we'll get back to you shortly.</p>

              <div className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Service Interested In</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition">
                    <option value="">Select a service…</option>
                    <option>Facebook SMM Panel</option>
                    <option>Instagram SMM Panel</option>
                    <option>YouTube SMM Panel</option>
                    <option>TikTok SMM Panel</option>
                    <option>Twitter SMM Panel</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us how we can help you…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
                  />
                </div>

                {/* Submit */}
                <button className="w-full flex items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500 transition-all mt-2">
                  <SendIcon />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <span className="text-xs font-medium text-orange-400 uppercase tracking-widest">Still Have Questions?</span>
          <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl leading-snug">
            We'd Love to Hear <span className="text-orange-500">From You</span>
          </h2>
          <p className="mt-4 text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Our dedicated support team is always ready to assist you. Whether it's a quick question or
            a full consultation, we're just one message away.
          </p>
          <button className="mt-8 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-white backdrop-blur-sm hover:bg-white hover:text-slate-900 transition-all font-semibold text-sm">
            Contact Us Now
          </button>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Our Services</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Comprehensive Solutions for Every{" "}
              <span className="text-orange-500">Social Media</span> Need
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto text-sm">
              At SMMSecure, we offer a broad spectrum of social media marketing services. Our solutions are
              designed to cater to the unique requirements of each platform.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shadow-sm">
                  {s.icon}
                </div>
                <p className="font-semibold text-slate-800 text-sm leading-snug">{s.name}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-10 max-w-md mx-auto">
            Each service is backed by thorough research and tailored strategies, ensuring optimal results and client satisfaction.
          </p>
          <div className="flex justify-center mt-5">
            <button className="rounded-full bg-indigo-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition">
              Our All Services
            </button>
          </div>
        </div>
      </section>

     
    </div>
  );
};

export default Contact;