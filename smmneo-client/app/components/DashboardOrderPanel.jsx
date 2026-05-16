import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { useCategoryHierarchy } from "../hooks/useCategoryHierarchy.js";

const DashboardOrderPanel = ({ selectedCategory = "Everything" }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [quantity, setQuantity] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Use category hierarchy hook - category comes from parent or prop
  const {
    categoryServices,
    subCategories,
    filteredServices,
    selectedSubCategory,
    loading,
    handleSelectSubCategory,
  } = useCategoryHierarchy(selectedCategory);

  // Auto-select first service when filtered services change
  useEffect(() => {
    if (filteredServices.length > 0 && !selectedService) {
      setSelectedService(filteredServices[0]);
    } else if (filteredServices.length > 0 && selectedService) {
      const serviceStillExists = filteredServices.some(
        (s) => String(s.serviceId) === String(selectedService.serviceId)
      );
      if (!serviceStillExists) {
        setSelectedService(filteredServices[0]);
      }
    }
  }, [filteredServices, selectedService]);

  const handleSubmitOrder = (e) => {
    e.preventDefault();

    if (!selectedService || !link || !quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const qty = parseInt(quantity);
    if (qty < selectedService.minQuantity || qty > selectedService.maxQuantity) {
      toast.error(`Quantity must be between ${selectedService.minQuantity} and ${selectedService.maxQuantity}`);
      return;
    }

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
      start: selectedService.dripFeed ? "0-2 hours (drip feed)" : "0-1 minute",
      speed: "100-200 per day",
      refill: selectedService.refill ? "Yes (refill enabled)" : "No (no refill)",
    },
    notes: [
      "When the service is experiencing high demand, the starting speed may vary.",
      "Please avoid placing a second order on the same link until the current order is fully completed in the system.",
      "If you encounter any issues with the service, kindly reach out to our support team for assistance.",
      "Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.",
      selectedService.cancel ? "Cancellation available up to 90% completion." : "Cancellation is not available for this service.",
    ],
    min: selectedService.minQuantity,
    max: selectedService.maxQuantity,
    averageTime: selectedService.dripFeed ? "24-72 hours" : "2-4 minutes",
    recentTimes: [
      `${selectedService.maxQuantity} = ${selectedService.dripFeed ? "24-48 hours" : "2-4 minutes"}`,
      `${Math.round(selectedService.maxQuantity / 2)} = ${selectedService.dripFeed ? "12-24 hours" : "1-2 minutes"}`,
      `${selectedService.minQuantity} = ${selectedService.dripFeed ? "2-6 hours" : "30-60 seconds"}`,
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
          {/* Subcategory Dropdown - Shows if category has subcategories */}
          {subCategories.length > 0 && (
            <div>
              <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">🏷️ Subcategory</label>
              <select
                value={selectedSubCategory || ""}
                onChange={(e) => handleSelectSubCategory(e.target.value || null)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">-- All Services --</option>
                {subCategories.map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Service Dropdown */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">⚙️ Service</label>
            {filteredServices.length > 0 ? (
              <select
                value={selectedService?.serviceId || ""}
                onChange={(e) => {
                  const service = filteredServices.find(
                    (s) => String(s.serviceId) === e.target.value
                  );
                  if (service) setSelectedService(service);
                }}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">-- Select Service --</option>
                {filteredServices.map((service) => (
                  <option key={service.serviceId} value={service.serviceId}>
                    {service.serviceId} ~ {service.name} ~ ${service.price.toFixed(4)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                No services available
              </div>
            )}
          </div>

          {/* Selected Service Display */}
          {selectedService && (
            <div>
              <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">✅ Selected Service</label>
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-800 w-full min-w-0 overflow-hidden">
                <span className="shrink-0 rounded-full bg-violet-600 px-2 md:px-2.5 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                  {selectedService.serviceId}
                </span>
                <span className="truncate text-slate-700 flex-1 overflow-hidden text-ellipsis">
                  – {selectedService.name} ~ ≈ ৳{(selectedService.price * 55.5).toFixed(2)} per 1000
                </span>
              </div>
            </div>
          )}

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