import React, { useState, useEffect } from "react";

const tabs = [
  { label: "Everything",      faClass: "fas fa-layer-group" },
  { label: "Instagram",       faClass: "fab fa-instagram" },
  { label: "Facebook",        faClass: "fab fa-facebook-f" },
  { label: "Youtube",         faClass: "fab fa-youtube" },
  { label: "Twitter",         faClass: "fab fa-x-twitter" },
  { label: "Spotify",         faClass: "fab fa-spotify" },
  { label: "TikTok",          faClass: "fab fa-tiktok" },
  { label: "Telegram",        faClass: "fab fa-telegram" },
  { label: "LinkedIn",        faClass: "fab fa-linkedin-in" },
  { label: "Discord",         faClass: "fab fa-discord" },
  { label: "Website Traffic", faClass: "fas fa-globe" },
  { label: "Others",          faClass: "fas fa-ellipsis" },
];

const DashboardCategoryTabs = ({ onCategoryChange }) => {
  const [active, setActive] = useState("Everything");

  // Load Font Awesome 6 Free from CDN once
  useEffect(() => {
    const id = "fa6-cdn";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-4 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tabs.map((tab) => {
          const isActive = active === tab.label;
          return (
            <button
              key={tab.label}
              onClick={() => {
                setActive(tab.label);
                if (onCategoryChange) onCategoryChange(tab.label);
              }}
              className={`
                flex flex-row items-center justify-center gap-2
                rounded-[3px] border px-[3px] py-[3px] md:px-4 md:py-3
                text-sm font-semibold text-white transition
                ${
                  isActive
                    ? "border-violet-500 bg-violet-600 shadow-md shadow-violet-900/40"
                    : "border-slate-700 bg-slate-900 hover:border-violet-500 hover:bg-violet-600"
                }
              `}
            >
              {/* Icon — always visible */}
              <i className={`${tab.faClass} text-base text-white`} />
              {/* Label — hidden on small screens */}
              <span className="hidden md:inline text-white">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCategoryTabs;