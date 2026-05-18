import React, { useState, useEffect, useMemo } from "react";
import toast from 'react-hot-toast';
import { useCategoryHierarchy } from "../hooks/useCategoryHierarchy.js";
import { useCurrency } from "../context/CurrencyContext.jsx";

const DashboardOrderPanel = ({ selectedCategory = "Everything", onCategoryChange = null }) => {
  const [activeTab, setActiveTab] = useState("new");
  const [quantity, setQuantity] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open
  const [searchInput, setSearchInput] = useState("");
  const { currency, formatCurrency } = useCurrency();
  
  // Use category hierarchy hook - category comes from parent or prop
  const {
    categorySummary,
    totalServicesCount,
    currentCategoryCount,
    allServices,
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

  const visibleServices = useMemo(() => {
    const term = searchInput.trim().toLowerCase();

    if (!term) {
      return filteredServices;
    }

    return allServices.filter((service) => matchesSearchTerm(service, term));
  }, [searchInput, filteredServices, allServices]);

  const searchSuggestions = useMemo(() => {
    const term = searchInput.trim().toLowerCase();

    if (!term) {
      return [];
    }

    return allServices
      .filter((service) => matchesSearchTerm(service, term))
      .slice(0, 8);
  }, [searchInput, allServices]);

  // Auto-select first service when visible services change
  useEffect(() => {
    if (visibleServices.length > 0 && !selectedService) {
      setSelectedService(visibleServices[0]);
    } else if (visibleServices.length > 0 && selectedService) {
      const serviceStillExists = visibleServices.some(
        (s) => String(s.serviceId) === String(selectedService.serviceId)
      );
      if (!serviceStillExists) {
        setSelectedService(visibleServices[0]);
      }
    } else if (searchInput.trim()) {
      setSelectedService(null);
    }
  }, [visibleServices, selectedService, searchInput]);

  // Keep the category dropdown aligned with the best search match.
  useEffect(() => {
    const term = searchInput.trim();
    if (!term || visibleServices.length === 0) {
      return;
    }

    const bestMatch = visibleServices[0];
    if (!bestMatch) {
      return;
    }

    if (selectedService?.serviceId !== bestMatch.serviceId) {
      setSelectedService(bestMatch);
    }

    if (typeof onCategoryChange === 'function' && bestMatch.category && bestMatch.category !== selectedCategory) {
      onCategoryChange(bestMatch.category);
    }

    if (bestMatch.subCategory && bestMatch.subCategory !== selectedSubCategory) {
      handleSelectSubCategory(bestMatch.subCategory);
    }
  }, [searchInput, visibleServices, selectedService?.serviceId, onCategoryChange, selectedCategory, selectedSubCategory, handleSelectSubCategory]);

  const handleSearchSuggestionSelect = (service) => {
    if (!service) return;

    setSearchInput('');
    setSelectedService(service);

    if (typeof onCategoryChange === 'function' && service.category) {
      onCategoryChange(service.category);
    }

    if (service.subCategory) {
      handleSelectSubCategory(service.subCategory);
    }

    setOpenDropdown(null);
  };

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
    if (charge) toast.success(`Charge: ${charge}`);
    setLink("");
    setQuantity("");
  };

  // Note: we no longer replace the whole panel while loading. Show inline subtle loading UI instead.

  const serviceInfo = selectedService ? {
    id: selectedService.serviceId.toString(),
    title: `${selectedService.serviceId} ~ ${selectedService.name} ~ ${formatCurrency(selectedService.price, currency)} per 1000`,
    description: {
      link: link || "https://example.com",
      text: getServiceDescription(selectedService),
      start: getServiceStartTime(selectedService),
      speed: getServiceSpeed(selectedService),
      refill: getServiceRefill(selectedService),
      quality: getServiceQuality(selectedService),
      location: getServiceLocation(selectedService),
    },
    notes: [
      'When the service is experiencing high demand, the starting speed may vary.',
      'Please avoid placing a second order on the same link until the current order is fully completed in the system.',
      'If you encounter any issues with the service, kindly reach out to our support team for assistance.',
      'Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.',
    ],
    min: selectedService.minQuantity,
    max: selectedService.maxQuantity,
    averageTime: getServiceAverageTime(selectedService),
    recentTimes: [
      `${selectedService.maxQuantity} = ${getServiceAverageTime(selectedService)}`,
      `${Math.round(selectedService.maxQuantity / 2)} = ${getServiceSpeed(selectedService)}`,
      `${selectedService.minQuantity} = ${getServiceStartTime(selectedService)}`,
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

  function formatServicePrice(service) {
    const price = Number.parseFloat(service?.price ?? 0) || 0;
    return `${formatCurrency(price, currency)}/1k`;
  }

  

  function getServiceLabel(service) {
    if (!service) return '-- Select Service --';
    return `${service.serviceId} - ${service.name} ~ ${formatServicePrice(service)}`;
  }

  function matchesSearchTerm(service, term) {
    const normalizedTerm = String(term || '').trim().toLowerCase();
    if (!normalizedTerm) return false;

    const serviceId = String(service?.serviceId ?? '').toLowerCase();
    const name = String(service?.name ?? '').toLowerCase();
    const category = String(service?.category ?? '').toLowerCase();
    const rawCategory = String(service?.rawCategory ?? '').toLowerCase();
    const subCategory = String(service?.subCategory ?? '').toLowerCase();

    const isNumericSearch = /^\d+$/.test(normalizedTerm);
    if (isNumericSearch) {
      return serviceId === normalizedTerm || serviceId.startsWith(normalizedTerm);
    }

    return (
      serviceId.includes(normalizedTerm) ||
      name.includes(normalizedTerm) ||
      category.includes(normalizedTerm) ||
      rawCategory.includes(normalizedTerm) ||
      subCategory.includes(normalizedTerm)
    );
  }

  function normalizeToList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    return String(value)
      .split(/\n|\r|\u2022|\u2023|\u25E6|\u2043|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function findRawField(service, keys) {
    const raw = service?.raw || {};
    for (const key of keys) {
      const value = raw[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
    return '';
  }

  function getServiceDescription(service) {
    const text = findRawField(service, ['description', 'details', 'desc', 'content', 'note', 'notes']);
    if (text) {
      return String(text).trim();
    }

    return `${service?.name || 'Service'} is provided by the selected API provider.`;
  }

  function getServiceTextSource(service) {
    return `${service?.name || ''} ${getServiceDescription(service)}`.trim();
  }

  function extractFieldFromText(text, labels) {
    const source = String(text || '');
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n\\r•|]+)`, 'i');
      const match = source.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  function formatDurationValue(value) {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return '';
    }

    if (/^(no|none|n\/a|na)$/i.test(normalized)) {
      return 'No';
    }

    if (/^lifetime$/i.test(normalized) || /^life\s*time$/i.test(normalized)) {
      return 'Lifetime';
    }

    const dayMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*(?:d|day|days)?$/i);
    if (dayMatch) {
      const amount = dayMatch[1];
      return `${amount}D`;
    }

    return normalized;
  }

  function getServiceRefill(service) {
    const sourceParts = [
      service?.name,
      service?.title,
      service?.description,
      service?.raw?.name,
      service?.raw?.title,
      service?.raw?.description,
      service?.raw?.details,
      service?.raw?.desc,
      service?.raw?.content,
      service?.raw?.note,
      service?.raw?.notes,
      findRawField(service, ['refill_text', 'refill_period', 'refill_days', 'refill_duration', 'refillStatus', 'refil_text', 'refil_period', 'refil_days']),
    ]
      .filter(Boolean)
      .map((value) => String(value).replace(/\s+/g, ' ').trim());

    const source = sourceParts.join(' ').normalize('NFKD').replace(/\s+/g, ' ').toLowerCase();

    const noRefillMatch = source.match(/\bno\s*refil(l)?\b|\bno\s*refill\b/);
    if (noRefillMatch) {
      return 'No';
    }

    const refillMatch = source.match(/\b(?:refill|refil)\b\s*(?:[:\-]?\s*)?(lifetime|\d+(?:\.\d+)?\s*(?:d|day|days)?)\b/)
      || source.match(/\b(lifetime|\d+(?:\.\d+)?\s*(?:d|day|days)?)\b\s*(?:[:\-]?\s*)?\b(?:refill|refil)\b/)
      || source.match(/\b(?:refill|refil)\b\s*(?:[:\-]?\s*)?(\d+\s*-\s*\d+\s*(?:d|day|days)?)\b/);

    if (refillMatch?.[1]) {
      return formatDurationValue(refillMatch[1]);
    }

    if (service?.raw?.refill === true || service?.refill === true) {
      return 'Refill available';
    }

    return 'No refill info';
  }

  function getServiceQuality(service) {
    const sourceParts = [
      service?.name,
      service?.title,
      service?.description,
      service?.raw?.name,
      service?.raw?.title,
      service?.raw?.description,
      service?.raw?.details,
      service?.raw?.desc,
      service?.raw?.content,
      service?.raw?.note,
      service?.raw?.notes,
      findRawField(service, ['quality', 'service_quality', 'account_type', 'typeLabel', 'quality_type', 'qualityType']),
    ]
      .filter(Boolean)
      .map((value) => String(value).replace(/\s+/g, ' ').trim());

    const source = sourceParts.join(' ').normalize('NFKD').replace(/\s+/g, ' ').toLowerCase();

    const explicitQuality = source.match(/\b(?:quality|type|account\s*type)\s*[:\-]\s*([^\n\r•|]+)/i);
    if (explicitQuality?.[1]) {
      const value = explicitQuality[1].trim();
      if (value) return value;
    }

    if (/\breal\s*account\b|\breal\b/i.test(source)) return 'Real';
    if (/\bhidden\b/i.test(source)) return 'Hidden';
    if (/\bbot\b/i.test(source)) return 'Bot';
    if (/\bpremium\b/i.test(source)) return 'Premium';
    if (/\bstandard\b/i.test(source)) return 'Standard';

    return 'Standard';
  }

  function getServiceLocation(service) {
    const explicit = findRawField(service, ['location', 'country', 'region', 'geo', 'area']);
    if (explicit) {
      return String(explicit).trim();
    }

    const source = `${service?.name || ''} ${getServiceDescription(service)}`.toLowerCase();
    if (source.includes('bangladesh') || source.includes('bangladeshi') || source.includes('bd')) return 'Bangladesh';
    if (source.includes('global') || source.includes('worldwide') || source.includes('ww')) return 'Global';
    return 'Global';
  }

  function getServiceSpeed(service) {
    const explicit = findRawField(service, ['speed', 'delivery_speed', 'start_speed', 'process_speed']);
    if (explicit) {
      return String(explicit).trim();
    }

    const source = getServiceTextSource(service);
    const textMatch = extractFieldFromText(source, ['speed', 'daily speed', 'delivery speed', 'start speed']);
    if (textMatch) {
      return textMatch;
    }

    const dayMatch = source.match(/(\d+(?:\.\d+)?\s*(?:k|m)?\s*(?:-\s*\d+(?:\.\d+)?\s*(?:k|m)?)?)\s*(?:\/|per\s*)?(?:day|days|d)\b/i);
    if (dayMatch?.[1]) {
      return `${dayMatch[1].replace(/\s+/g, '')} per day`;
    }

    const instantaneousMatch = source.match(/instant(?:\s+delivery|\s+start)?/i);
    if (instantaneousMatch) {
      return 'Instant';
    }

    return 'Not specified';
  }

  function getServiceStartTime(service) {
    const explicit = findRawField(service, ['start', 'start_time', 'startTime', 'eta']);
    if (explicit) {
      return String(explicit).trim();
    }

    const source = getServiceTextSource(service);
    const textMatch = extractFieldFromText(source, ['start', 'starting time', 'start time', 'delivery time']);
    if (textMatch) {
      return textMatch;
    }

    const hourRange = source.match(/\b\d+\s*-\s*\d+\s*(?:h|hr|hrs|hour|hours)\b/i);
    if (hourRange?.[0]) {
      return hourRange[0].replace(/\s+/g, ' ').replace(/hours?$/i, 'hrs').replace(/hr?s?$/i, 'hrs');
    }

    if (/\binstant\b/i.test(source)) {
      return 'Instant';
    }

    return service?.dripFeed ? '0-2 hours' : '0-1 minute';
  }

  function getServiceAverageTime(service) {
    const explicit = findRawField(service, ['average_time', 'averageTime', 'avg_time', 'eta']);
    if (explicit) {
      return String(explicit).trim();
    }

    return service?.dripFeed ? '24-72 hours' : '2-4 minutes';
  }

  const charge = quantity && selectedService
    ? formatCurrency((parseFloat(quantity) / 1000) * selectedService.price, currency)
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

        {/* Currency selection is handled in the topbar; removed inline toggle */}

        <div className="space-y-3 md:space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="🔍 Search any category, service name, ID, or price"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 shadow-sm"
              />
              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                  {searchSuggestions.map((service) => (
                    <button
                      key={`${service.serviceId}-${service.name}`}
                      type="button"
                      onClick={() => handleSearchSuggestionSelect(service)}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-violet-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{getServiceLabel(service)}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {service.category}{service.subCategory ? ` · ${service.subCategory}` : ''}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">
                        {service.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
                    setSearchInput('');
                    setSelectedService(null);
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
                      setSearchInput('');
                      setSelectedService(null);
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
            {visibleServices.length > 0 ? (
              <CustomDropdown
                id="serviceDropdown"
                label="Service"
                value={String(selectedService?.serviceId || "")}
                options={visibleServices.map((service) => ({
                  value: String(service.serviceId),
                  label: getServiceLabel(service),
                }))}
                onChange={(val) => {
                  const service = visibleServices.find(
                    (s) => String(s.serviceId) === val
                  );
                  if (service) setSelectedService(service);
                }}
                isOpen={openDropdown === "serviceDropdown"}
                setIsOpen={setOpenDropdown}
                getDisplayText={(val) => {
                  if (!val || val === "") return "-- Select Service --";
                  const service = visibleServices.find(
                    (s) => String(s.serviceId) === String(val)
                  );
                  if (!service) return "-- Select Service --";
                  return getServiceLabel(service);
                }}
              />
            ) : (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500 text-center">
                {searchInput.trim() ? 'No services match your search' : 'No services available'}
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
                <span className="text-base md:text-lg font-bold">{charge}</span>
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
                  {getServiceLabel(selectedService)}
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
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:p-5 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs md:text-sm">Description</h4>
              <div className="space-y-2 text-sm md:text-base text-slate-900">
                <div>
                  <span className="font-medium text-slate-700">Link: </span>
                  <span className="break-words">{link || 'Profile/Post URL'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Start: </span>
                  <span>{serviceInfo?.description.start}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Speed: </span>
                  <span>{serviceInfo?.description.speed}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">Refill: </span>
                  <span>{serviceInfo?.description.refill}</span>
                </div>
                {serviceInfo?.description.text && serviceInfo.description.text !== `${selectedService?.name || 'Service'} is provided by the selected API provider.` && (
                  <div className="pt-2 border-t border-slate-200 text-sm text-slate-700 whitespace-pre-line">
                    {serviceInfo.description.text}
                  </div>
                )}
              </div>
            </div>

            {/* Quality & Important Notes */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-3">Quality</h4>
              <p className="text-xs md:text-sm text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-3 font-semibold">
                {serviceInfo?.description.quality}
              </p>
              <p className="mt-2 text-xs md:text-sm text-slate-700">
                Location : <span className="font-semibold">{serviceInfo?.description.location}</span> 🌍
              </p>
            </div>

            {/* Important Notes */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs md:text-sm mb-3">⚠️ Important Notes:</h4>
              <ul className="space-y-2 text-xs md:text-sm text-slate-700">
                {(serviceInfo?.notes?.length ? serviceInfo.notes : [
                  'When the service is experiencing high demand, the starting speed may vary.',
                  'Please avoid placing a second order on the same link until the current order is fully completed in the system.',
                  'If you encounter any issues with the service, kindly reach out to our support team for assistance.',
                  'Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.',
                ]).map((note, index) => (
                  <li key={`${index}-${note}`} className="flex gap-2">
                    <span className="shrink-0 text-amber-600 font-bold mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
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