import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { useCategoryHierarchy } from "../hooks/useCategoryHierarchy.js";

const DashboardOrderPanel = ({ selectedCategory = "Everything", onCategoryChange = null }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [quantity, setQuantity] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Use category hierarchy hook - category comes from parent or prop
  const {
    categorySummary,
    totalServicesCount,
    currentCategoryCount,
    categoryServices,
    subCategories,
    filteredServices,
    selectedSubCategory,
    loading,
    handleSelectSubCategory,
    allSubCategories,
  } = useCategoryHierarchy(selectedCategory);

  const [pendingSubCategory, setPendingSubCategory] = useState(null);

  // If we have a pending subcategory after switching from Everything to a main category,
  // apply it to the hook's selected subcategory once the main category is active.
  useEffect(() => {
    if (!pendingSubCategory) return;
    if (selectedCategory && selectedCategory !== 'Everything') {
      handleSelectSubCategory(pendingSubCategory);
      setPendingSubCategory(null);
    }
  }, [pendingSubCategory, selectedCategory, handleSelectSubCategory]);

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

  // Auto-select the first available subcategory when a category's subcategories load.
  useEffect(() => {
    if (subCategories && subCategories.length > 0 && !selectedSubCategory) {
      handleSelectSubCategory(subCategories[0]);
    }
  }, [subCategories, selectedSubCategory, handleSelectSubCategory]);

  // When Everything loads, auto-select the first main category -> first subcategory
  useEffect(() => {
    if (selectedCategory === 'Everything' && Array.isArray(allSubCategories) && allSubCategories.length > 0 && !selectedSubCategory) {
      const firstGroup = allSubCategories[0];
      const firstSub = firstGroup?.subcategories?.[0];
      if (firstGroup && firstSub) {
        if (typeof onCategoryChange === 'function') {
          onCategoryChange(firstGroup.main);
          setPendingSubCategory(firstSub);
        }
      }
    }
  }, [selectedCategory, allSubCategories, selectedSubCategory, onCategoryChange]);

  // Note: main categories behave like Everything — user must choose a subcategory explicitly

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

  // Note: we no longer replace the whole panel while loading. Show inline subtle loading UI instead.

  const serviceInfo = selectedService ? {
    id: selectedService.serviceId.toString(),
    title: `${selectedService.serviceId} ~ ${selectedService.name} ~ $${selectedService.price.toFixed(4)} per 1000`,
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

  function sanitizeServiceName(name) {
    if (!name) return '';
    let s = String(name);
    // remove bracketed tags like [ ... ]
    s = s.replace(/\[.*?\]/g, '');
    // take the portion before first tilde (~) if present
    if (s.includes('~')) s = s.split('~')[0];
    return s.replace(/\s+/g, ' ').trim();
  }

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
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm"
              />
            </div>

            {/* Category Dropdown - show main categories when Everything is selected */}
          <div>
            <label className="sr-only">Category</label>
            {selectedCategory === "Everything" ? (
              <select
                onChange={(e) => {
                  const val = e.target.value; // format main||sub
                  if (!val) return;
                  const [main, sub] = val.split('||');
                  if (typeof onCategoryChange === 'function') onCategoryChange(main);
                  setPendingSubCategory(sub || null);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 font-semibold outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm cursor-pointer"
              >
                {Array.isArray(allSubCategories) && allSubCategories.map((group) => (
                  group.subcategories.map((sub) => (
                    <option key={`${group.main}||${sub}`} value={`${group.main}||${sub}`}>{group.main} - {sub}</option>
                  ))
                ))}
              </select>
            ) : (
              <select
                value={`${selectedCategory}||${selectedSubCategory || ''}`}
                onChange={(e) => {
                  const [cat, subcat] = e.target.value.split('||');
                  if (subcat) {
                    handleSelectSubCategory(subcat);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 font-semibold outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm cursor-pointer"
              >
                {subCategories.length > 0 && subCategories.map((subcat) => (
                  <option key={subcat} value={`${selectedCategory}||${subcat}`}>{subcat}</option>
                ))}
              </select>
            )}
          </div>

          {/* Service Dropdown */}
          <div>
            <label className="mb-1.5 block text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">Service</label>
            {filteredServices.length > 0 ? (
              <select
                value={selectedService?.serviceId || ""}
                onChange={(e) => {
                  const service = filteredServices.find(
                    (s) => String(s.serviceId) === e.target.value
                  );
                  if (service) setSelectedService(service);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm cursor-pointer"
              >
                <option value="">-- Select Service --</option>
                {filteredServices.map((service) => (
                  <option key={service.serviceId} value={service.serviceId}>
                    {service.serviceId} - {sanitizeServiceName(service.name)} ~ ${service.price.toFixed(4)}/1k
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 text-center">
                No services available
              </div>
            )}
          </div>

          {/* Selected Service Display */}
          {selectedService && (
            <div>
              <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 md:px-5 py-3 md:py-3.5 text-xs md:text-sm text-slate-900 w-full min-w-0 overflow-hidden shadow-sm">
                <div className="font-bold text-violet-900 truncate text-sm">
                  #{selectedService.serviceId} - {sanitizeServiceName(selectedService.name)}
                </div>
                <div className="mt-1.5 text-xs text-violet-700">
                  Price: ${selectedService.price.toFixed(4)} per 1000
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
                  <span className="text-violet-600">$</span>
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
      {selectedService ? (
        <div className="rounded-[3px] border border-slate-200/70 bg-white p-0 shadow-sm w-full min-w-0 overflow-hidden flex flex-col">
          {/* Service Header - Purple Gradient */}
          <div className="bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 px-5 md:px-6 py-5 md:py-6 text-white relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold leading-tight mb-1">
                  {selectedService.name}
                </h3>
                <p className="text-xs md:text-sm font-medium opacity-95">
                  ${selectedService.price.toFixed(4)} per 1000
                </p>
              </div>
              <span className="inline-block rounded-full bg-yellow-300 text-slate-900 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold whitespace-nowrap">
                # {selectedService.serviceId}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
            {/* Key Details */}
            <div className="bg-slate-50 rounded-lg p-4 md:p-5 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-3">Description</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">Link</p>
                  <p className="text-xs md:text-sm text-slate-800 font-medium break-words">
                    {link || 'Profile/Post URL'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">Start</p>
                  <p className="text-xs md:text-sm text-slate-800 font-medium">
                    {selectedService.dripFeed ? 'Instant-24hrs' : 'Instant-1min'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">Speed</p>
                  <p className="text-xs md:text-sm text-slate-800 font-medium">
                    {selectedService.dripFeed ? '3k-5k/day' : '100k+/day'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-semibold mb-1">Refill</p>
                  <p className="text-xs md:text-sm text-slate-800 font-bold">
                    {selectedService.refill ? '✅ 30 Days' : '❌ No Refill'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quality & Important Notes */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-3">Quality</h4>
              <p className="text-xs md:text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                High Quality Service
              </p>
            </div>

            {/* Important Notes */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-3">⚠️ Important Notes:</h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="shrink-0 text-amber-600 font-bold mt-0.5">•</span>
                  <span>When service is experiencing high demand, starting speed may vary.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-amber-600 font-bold mt-0.5">•</span>
                  <span>Avoid placing a second order on the same link until completed.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-amber-600 font-bold mt-0.5">•</span>
                  <span>Do not place orders for private accounts or links.</span>
                </li>
                {selectedService.cancel && (
                  <li className="flex gap-2">
                    <span className="shrink-0 text-green-600 font-bold mt-0.5">✓</span>
                    <span>Cancellation available up to 90% completion.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[3px] border border-slate-200/70 bg-white p-6 md:p-8 shadow-sm w-full min-w-0 flex items-center justify-center h-64 md:h-full">
          <div className="text-center">
            <p className="text-sm md:text-base text-slate-500">👈 Select a service to view details</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrderPanel;