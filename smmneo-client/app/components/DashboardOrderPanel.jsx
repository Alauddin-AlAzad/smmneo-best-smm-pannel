import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';

// Mock services data
const mockServices = [
  {
    serviceId: 1001,
    name: "Instagram Likes",
    category: "Instagram",
    price: 5.50,
    minQuantity: 100,
    maxQuantity: 10000,
  },
  {
    serviceId: 1002,
    name: "Instagram Followers",
    category: "Instagram",
    price: 8.00,
    minQuantity: 50,
    maxQuantity: 5000,
  },
  {
    serviceId: 1003,
    name: "TikTok Likes",
    category: "TikTok",
    price: 4.50,
    minQuantity: 200,
    maxQuantity: 20000,
  },
  {
    serviceId: 1004,
    name: "YouTube Views",
    category: "YouTube",
    price: 6.00,
    minQuantity: 100,
    maxQuantity: 50000,
  },
];

const DashboardOrderPanel = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [quantity, setQuantity] = useState("");
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load mock services
    setServices(mockServices);
    if (mockServices.length > 0) {
      setSelectedService(mockServices[0]);
    }
  }, []);

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!selectedService || !link || !quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (qty < selectedService.minQuantity || qty > selectedService.maxQuantity) {
      toast.error(`Quantity must be between ${selectedService.minQuantity} and ${selectedService.maxQuantity}`);
      return;
    }

    // Show success message
    toast.success(`Order created: ${selectedService.name} x${quantity}`);
    setLink("");
    setQuantity("");
  };

  if (loading) {
    return <div className="p-6 text-center">Loading services...</div>;
  }

  const serviceInfo = selectedService ? {
    id: selectedService.serviceId.toString(),
    title: `${selectedService.serviceId} ~ ${selectedService.name} ~ ≈ ৳${(selectedService.price * 55.5).toFixed(2)} per 1000`,
    description: {
      link: link || "https://example.com",
      start: "0-1 mint",
      speed: "100M/days",
      refill: selectedService.category,
    },
    notes: [
      "When the service is experiencing high demand, the starting speed may vary.",
      "Please avoid placing a second order on the same link until the current order is fully completed in the system.",
      "If you encounter any issues with the service, kindly reach out to our support team for assistance.",
      "Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.",
    ],
    min: selectedService.minQuantity,
    max: selectedService.maxQuantity,
    averageTime: "2 minutes",
    recentTimes: [
      "5000 = 2 min 22 sec",
      "250 = 1 min 6 sec",
      "10000 = 1 min 12 sec",
    ],
  } : null;

  const charge = quantity && selectedService
    ? ((parseFloat(quantity) / 1000) * selectedService.price).toFixed(4)
    : "";

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[1.5fr_1fr] w-full overflow-hidden">
      {/* LEFT PANEL */}
      <div className="rounded-[3px] border border-slate-200/70 bg-white p-3 md:p-5 shadow-sm w-full min-w-0 overflow-x-hidden">
        {/* Tabs */}
        <div className="mb-4 md:mb-5 flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 rounded-full px-3 md:px-5 py-2 text-xs md:text-sm font-bold transition ${
              activeTab === "new"
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-violet-50"
            }`}
          >
            🛒 New Order
          </button>
          <button
            onClick={() => setActiveTab("mass")}
            className={`flex items-center gap-2 rounded-full px-3 md:px-5 py-2 text-xs md:text-sm font-bold transition ${
              activeTab === "mass"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📋 Mass Order
          </button>
        </div>

        <div className="space-y-3 md:space-y-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs md:text-sm">🔍</span>
            <input
              type="search"
              placeholder="Search"
              className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 md:py-2.5 pl-8 md:pl-9 pr-3 md:pr-4 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Category</label>
            <select 
              value={selectedService?.category || ''}
              onChange={(e) => {
                const service = services.find(s => s.category === e.target.value);
                if (service) setSelectedService(service);
              }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              {services.map((service, idx) => (
                <option key={idx} value={service.category}>{service.category}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Service</label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-800 w-full min-w-0 overflow-hidden">
              <span className="shrink-0 rounded-full bg-violet-600 px-2 md:px-2.5 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                {selectedService?.serviceId}
              </span>
              <span className="truncate text-slate-700 flex-1 overflow-hidden text-ellipsis">
                – {selectedService?.name} ~ ≈ ৳{selectedService ? (selectedService.price * 55.5).toFixed(2) : "0"} pe...
              </span>
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Link</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder=""
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <p className="mt-0.5 md:mt-1 text-xs text-slate-500">
              Min: {selectedService?.minQuantity.toLocaleString()} – Max: {selectedService?.maxQuantity.toLocaleString()}
            </p>
          </div>

          {/* Average Time */}
          <div>
            <label className="mb-1 md:mb-1.5 flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-800">
              Average time
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] text-white font-bold cursor-help">i</span>
            </label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-700">
              {serviceInfo?.averageTime}
            </div>
          </div>

          {/* Recent Completed Time */}
          <div>
            <label className="mb-1.5 md:mb-2 block text-xs md:text-sm font-bold text-slate-800">Recent Completed Time</label>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {serviceInfo?.recentTimes.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-500 px-2 md:px-3 py-1 text-[11px] md:text-xs font-semibold text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Charge */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Charge</label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-700 min-h-[42px]">
              {charge ? `৳${charge}` : ""}
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full rounded-lg bg-violet-600 py-2 md:py-3 text-xs md:text-sm font-bold text-white transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="rounded-[3px] border border-slate-200/70 bg-white p-3 md:p-5 shadow-sm w-full min-w-0 overflow-x-hidden">
        {/* Service Header Banner */}
        <div className="rounded-md bg-gradient-to-br from-violet-700 via-violet-600 to-fuchsia-600 px-3 md:px-5 pt-3 md:pt-4 pb-4 md:pb-5 text-white text-center">
          <span className="inline-block rounded-full bg-yellow-400 px-3 md:px-4 py-0.5 md:py-1 text-xs md:text-sm font-bold text-slate-900 mb-2 md:mb-3">
            # {serviceInfo?.id}
          </span>
          <p className="text-xs md:text-sm font-semibold leading-snug">
            {serviceInfo?.title}
          </p>
        </div>

        {/* Description */}
        <div className="mt-3 md:mt-5 space-y-3 md:space-y-4 text-xs md:text-sm text-slate-700 w-full min-w-0 overflow-x-hidden">
          <div className="w-full min-w-0 overflow-x-hidden">
            <p className="font-bold text-slate-900 mb-1">Description</p>
            <p className="break-words">Link: {serviceInfo?.description.link}</p>
            <p className="break-words">Start: {serviceInfo?.description.start}</p>
            <p className="break-words">Speed: {serviceInfo?.description.speed}</p>
            <p className="break-words">Refill: {serviceInfo?.description.refill}</p>
          </div>

          <div className="w-full min-w-0 overflow-x-hidden">
            <p className="font-bold text-slate-900 mb-1 md:mb-2">Important Notes:</p>
            <ul className="space-y-1.5 md:space-y-2">
              {serviceInfo?.notes.map((note, i) => (
                <li key={i} className="flex gap-2 w-full min-w-0">
                  <span className="mt-0.5 shrink-0 text-slate-400">•</span>
                  <span className="break-words">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOrderPanel;