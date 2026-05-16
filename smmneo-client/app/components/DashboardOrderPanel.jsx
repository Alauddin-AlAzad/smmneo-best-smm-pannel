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
          {/* Category Display */}
          <div>
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Category</label>
            <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 font-semibold truncate">
              {selectedCategory}
            </div>
          </div>

          {/* Subcategory Dropdown - Shows if category has subcategories */}
          {subCategories.length > 0 && (
            <div>
              <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Subcategory</label>
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
            <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">Service</label>
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
                    {service.serviceId} - {service.name} ~ ≈ ৳{(service.price * 55.5).toFixed(2)} per 1000
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
              <div className="rounded-md border border-violet-200 bg-violet-50 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 w-full min-w-0 overflow-hidden">
                <div className="font-semibold text-violet-900 truncate">
                  #{selectedService.serviceId} - {selectedService.name}
                </div>
                <div className="mt-1 text-xs text-violet-700">
                  Price: ≈ ৳{(selectedService.price * 55.5).toFixed(2)} per 1000
                </div>
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
            <div className="rounded-md border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-3 md:px-4 py-3 md:py-3.5 text-sm md:text-base font-bold text-slate-900 min-h-[50px] flex items-center">
              {charge ? (
                <span className="text-base md:text-lg">
                  <span className="text-violet-600">৳</span>
                  {charge}
                </span>
              ) : (
                <span className="text-slate-400">Enter quantity to calculate</span>
              )}
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 md:py-3 text-xs md:text-sm font-bold text-white transition hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {submitting ? "Processing..." : "🛒 Submit Order"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL - Service Details */}
      <div className="rounded-[3px] border border-slate-200/70 bg-white p-4 md:p-6 shadow-sm w-full min-w-0 overflow-x-hidden overflow-y-auto max-h-[600px]">
        {selectedService ? (
          <>
            {/* Service Header */}
            <div className="rounded-md bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 px-4 md:px-5 py-4 md:py-5 text-white mb-4 md:mb-5">
              <div className="flex items-start gap-3 mb-2">
                <span className="inline-block rounded-full bg-yellow-300 px-3 md:px-4 py-1 text-xs md:text-sm font-bold text-slate-900 whitespace-nowrap">
                  # {selectedService.serviceId}
                </span>
              </div>
              <p className="text-xs md:text-sm font-semibold leading-snug break-words">
                {selectedService.name}
              </p>
              <p className="text-xs md:text-sm mt-2 font-medium opacity-95">
                Price: ≈ ৳{(selectedService.price * 55.5).toFixed(2)} per 1000
              </p>
            </div>

            {/* Service Details */}
            <div className="space-y-4 md:space-y-5 text-xs md:text-sm text-slate-700">
              {/* Details Grid */}
              <div className="bg-slate-50 rounded-md p-3 md:p-4 space-y-2 border border-slate-200">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-800">Link:</span>
                  <span className="text-right break-words">{link || '(Enter link above)'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-800">Start:</span>
                  <span className="text-right">{selectedService.dripFeed ? 'Instant to 24 hours' : 'Instant to 1 minute'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-800">Speed:</span>
                  <span className="text-right">{selectedService.dripFeed ? '3k-5k/day' : '100k+/day'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-slate-800">Refill:</span>
                  <span className="text-right font-semibold">{selectedService.refill ? '✅ Yes (30 days)' : '❌ No'}</span>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <p className="font-bold text-slate-900 mb-2 md:mb-3">⚠️ Important Notes:</p>
                <ul className="space-y-1.5 md:space-y-2 bg-amber-50 border border-amber-200 rounded-md p-3 md:p-4">
                  <li className="flex gap-2 w-full min-w-0 text-xs md:text-sm">
                    <span className="mt-0.5 shrink-0 text-amber-600 font-bold">•</span>
                    <span className="break-words text-slate-700">Do not place orders for private accounts or private links.</span>
                  </li>
                  <li className="flex gap-2 w-full min-w-0 text-xs md:text-sm">
                    <span className="mt-0.5 shrink-0 text-amber-600 font-bold">•</span>
                    <span className="break-words text-slate-700">Avoid placing a second order on the same link until the current order is fully completed.</span>
                  </li>
                  <li className="flex gap-2 w-full min-w-0 text-xs md:text-sm">
                    <span className="mt-0.5 shrink-0 text-amber-600 font-bold">•</span>
                    <span className="break-words text-slate-700">When experiencing high demand, starting speed may vary.</span>
                  </li>
                  {selectedService.cancel && (
                    <li className="flex gap-2 w-full min-w-0 text-xs md:text-sm">
                      <span className="mt-0.5 shrink-0 text-green-600 font-bold">✓</span>
                      <span className="break-words text-slate-700">Cancellation available up to 90% completion.</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-center text-slate-500">
            <p className="text-sm md:text-base">Select a service to view details →</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOrderPanel;