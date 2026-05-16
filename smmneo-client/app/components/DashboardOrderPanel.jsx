import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { useCategoryHierarchy } from "../hooks/useCategoryHierarchy.js";

const DashboardOrderPanel = ({ selectedCategory = "Everything", onCategoryChange = null }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [quantity, setQuantity] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('[class*="relative"]')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

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

  // Custom Dropdown Component
  const CustomDropdown = ({ id, label, value, options, onChange, isOpen, setIsOpen, getDisplayText }) => {
    return (
      <div className="relative">
        {label && <label className="mb-1.5 block text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide sr-only">{label}</label>}
        <button
          onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 md:py-3 text-xs md:text-sm text-slate-900 font-semibold outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm cursor-pointer text-left flex items-center justify-between hover:bg-slate-50"
        >
          <span className="truncate">{getDisplayText(value)}</span>
          <span className="ml-2 flex-shrink-0 text-slate-400">▼</span>
        </button>
        
        {openDropdown === id && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpenDropdown(null);
                }}
                className={`w-full px-4 py-2.5 text-left text-xs md:text-sm border-b border-slate-100 last:border-b-0 transition whitespace-normal break-words ${
                  value === option.value
                    ? 'bg-violet-100 text-violet-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  

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
            {selectedCategory === "Everything" ? (
              <CustomDropdown
                id="categoryDropdown"
                value={`${selectedCategory}||`}
                options={Array.isArray(allSubCategories) ? allSubCategories.flatMap((group) =>
                  group.subcategories.map((sub) => ({
                    value: `${group.main}||${sub}`,
                    label: `${group.main} - ${sub}`,
                  }))
                ) : []}
                onChange={(val) => {
                  if (!val) return;
                  const [main, sub] = val.split('||');
                  if (typeof onCategoryChange === 'function') onCategoryChange(main);
                  setPendingSubCategory(sub || null);
                }}
                isOpen={openDropdown === "categoryDropdown"}
                setIsOpen={setOpenDropdown}
                getDisplayText={(val) => {
                  const match = Array.isArray(allSubCategories) 
                    ? allSubCategories.find(g => val.startsWith(g.main))
                    : null;
                  if (!match) return "Select Category";
                  const [main, sub] = val.split('||');
                  return `${main} - ${sub || ''}`;
                }}
              />
            ) : (
              <CustomDropdown
                id="categoryDropdown"
                value={`${selectedCategory}||${selectedSubCategory || ''}`}
                options={subCategories.map((subcat) => ({
                  value: `${selectedCategory}||${subcat}`,
                  label: subcat,
                }))}
                onChange={(val) => {
                  const [cat, subcat] = val.split('||');
                  if (subcat) {
                    handleSelectSubCategory(subcat);
                  }
                }}
                isOpen={openDropdown === "categoryDropdown"}
                setIsOpen={setOpenDropdown}
                getDisplayText={(val) => {
                  const [cat, sub] = val.split('||');
                  return sub || selectedCategory;
                }}
              />
            )}
          </div>

          {/* Service Dropdown */}
          <div>
            {filteredServices.length > 0 ? (
              <CustomDropdown
                id="serviceDropdown"
                label="Service"
                value={String(selectedService?.serviceId || "")}
                options={filteredServices.map((service) => ({
                  value: String(service.serviceId),
                  label: `${service.serviceId} - ${service.name} ~ $${service.price.toFixed(4)}/1k`,
                }))}
                onChange={(val) => {
                  const service = filteredServices.find(
                    (s) => String(s.serviceId) === val
                  );
                  if (service) setSelectedService(service);
                }}
                isOpen={openDropdown === "serviceDropdown"}
                setIsOpen={setOpenDropdown}
                getDisplayText={(val) => {
                  if (!val || val === "") return "-- Select Service --";
                  const service = filteredServices.find(
                    (s) => String(s.serviceId) === String(val)
                  );
                  if (!service) return "-- Select Service --";
                  return `${service.serviceId} - ${service.name}`;
                }}
              />
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 text-center">
                No services available
              </div>
            )}
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
          <div className="bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 px-4 md:px-6 py-4 md:py-6 text-white relative">
            <div className="flex flex-wrap items-start gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm md:text-xl font-bold leading-tight break-words">
                  {selectedService.name}
                </h3>
              </div>
              <span className="inline-block rounded-full bg-yellow-300 text-slate-900 px-2 md:px-4 py-1 md:py-2 text-xs font-bold flex-shrink-0">
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