import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase_init.js';
import { useLocation } from 'react-router';
import { useCategoryHierarchy } from '../hooks/useCategoryHierarchy.js';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { useAuth } from './AuthContext.jsx';
import { checkUserStatus, createOrder, checkLinkActiveOrder } from '../services/adminDashboardAPI.js';

function getServiceLabel(service, formatCurrency, currency) {
  if (!service) return '-- Select Service --';
  return `${service.serviceId} - ${service.name} ~ ${formatCurrency(Number(service.price || 0), currency)}/1k`;
}

function matchesSearchTerm(service, term) {
  const normalizedTerm = String(term || '').trim().toLowerCase();
  if (!normalizedTerm) return false;

  const serviceId = String(service?.serviceId ?? '').toLowerCase();
  const name = String(service?.name ?? '').toLowerCase();
  const category = String(service?.category ?? '').toLowerCase();
  const subCategory = String(service?.subCategory ?? '').toLowerCase();

  if (/^\d+$/.test(normalizedTerm)) {
    return serviceId === normalizedTerm || serviceId.startsWith(normalizedTerm);
  }

  return serviceId.includes(normalizedTerm) || name.includes(normalizedTerm) || category.includes(normalizedTerm) || subCategory.includes(normalizedTerm);
}

export default function DashboardOrderPanel({ selectedCategory = 'Everything', onCategoryChange = null }) {
  const { user, refreshUserProfile, refreshBalance } = useAuth();
  const { currency, formatCurrency } = useCurrency();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('new');
  const [quantity, setQuantity] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [link, setLink] = useState('');
  const [massOrderText, setMassOrderText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [pendingOrderConflict, setPendingOrderConflict] = useState(null);
  const [pendingSubCategory, setPendingSubCategory] = useState(null);

  const {
    allServices,
    subCategories,
    filteredServices,
    selectedSubCategory,
    handleSelectSubCategory,
    allSubCategories,
  } = useCategoryHierarchy(selectedCategory);

  useEffect(() => {
    if (!pendingSubCategory) return;
    if (selectedCategory && selectedCategory !== 'Everything') {
      handleSelectSubCategory(pendingSubCategory);
      setPendingSubCategory(null);
    }
  }, [pendingSubCategory, selectedCategory, handleSelectSubCategory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const orderAgainLink = localStorage.getItem('smmssecure:orderAgainLink') || localStorage.getItem('smmssecure:orderAgainLink');
    if (!orderAgainLink) return;
    setLink(orderAgainLink);
    localStorage.removeItem('smmssecure:orderAgainLink');
    localStorage.removeItem('smmssecure:orderAgainLink');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || allServices.length === 0) return;
    const params = new URLSearchParams(location.search || window.location.search);
    const serviceId = String(params.get('service') || '').trim();
    if (!serviceId) return;

    const matchedService = allServices.find((service) => String(service.serviceId) === serviceId);
    if (!matchedService) return;

    setSelectedService(matchedService);
    setSearchInput('');

    if (typeof onCategoryChange === 'function' && matchedService.category && matchedService.category !== selectedCategory) {
      onCategoryChange(matchedService.category);
    }

    if (matchedService.subCategory) {
      handleSelectSubCategory(matchedService.subCategory);
    }
  }, [allServices, location.search, onCategoryChange, selectedCategory, handleSelectSubCategory]);

  useEffect(() => {
    if (!pendingOrderConflict) return;

    const currentLink = link.trim();
    const conflictLink = pendingOrderConflict.link || '';

    if (currentLink && currentLink !== conflictLink) {
      setPendingOrderConflict(null);
      setLastError(null);
    }
  }, [link, pendingOrderConflict]);

  const visibleServices = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return filteredServices;
    return allServices.filter((service) => matchesSearchTerm(service, term));
  }, [searchInput, filteredServices, allServices]);

  const searchSuggestions = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) return [];
    return allServices.filter((service) => matchesSearchTerm(service, term)).slice(0, 8);
  }, [searchInput, allServices]);

  useEffect(() => {
    if (visibleServices.length > 0 && !selectedService) {
      setSelectedService(visibleServices[0]);
      return;
    }

    if (visibleServices.length > 0 && selectedService) {
      const stillExists = visibleServices.some((service) => String(service.serviceId) === String(selectedService.serviceId));
      if (!stillExists) setSelectedService(visibleServices[0]);
      return;
    }

    if (searchInput.trim()) setSelectedService(null);
  }, [visibleServices, selectedService, searchInput]);

  useEffect(() => {
    const term = searchInput.trim();
    if (!term || visibleServices.length === 0) return;

    const bestMatch = visibleServices[0];
    if (!bestMatch) return;

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

  useEffect(() => {
    if (subCategories.length > 0 && !selectedSubCategory) {
      handleSelectSubCategory(subCategories[0]);
    }
  }, [subCategories, selectedSubCategory, handleSelectSubCategory]);

  useEffect(() => {
    if (selectedCategory === 'Everything' && Array.isArray(allSubCategories) && allSubCategories.length > 0 && !selectedSubCategory) {
      const firstGroup = allSubCategories[0];
      const firstSub = firstGroup?.subcategories?.[0];
      if (firstGroup && firstSub) {
        if (typeof onCategoryChange === 'function') onCategoryChange(firstGroup.main);
        setPendingSubCategory(firstSub);
      }
    }
  }, [selectedCategory, allSubCategories, selectedSubCategory, onCategoryChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('[class*="relative"]')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const charge = quantity && selectedService
    ? formatCurrency((parseFloat(quantity) / 1000) * selectedService.price, currency)
    : '';

  const serviceInfo = selectedService
    ? {
        averageTime: selectedService.averageTime || '2-4 minutes',
        start: selectedService.start || '0-1 minute',
        speed: selectedService.speed || 'Not specified',
        refill: selectedService.refill ? 'Refill available' : 'No refill info',
        quality: selectedService.quality || 'Standard',
        location: selectedService.location || 'Global',
      }
    : null;

  const serviceById = useMemo(
    () => new Map(allServices.map((service) => [String(service.serviceId), service])),
    [allServices],
  );

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    if (!selectedService || !link || !quantity) {
      setLastError('Please fill in all required fields');
      setLastOrder(null);
      return;
    }

    const qty = parseInt(quantity, 10);
    if (qty < Number(selectedService.minQuantity || 0) || qty > Number(selectedService.maxQuantity || 0)) {
      setLastError(`Quantity must be between ${selectedService.minQuantity} and ${selectedService.maxQuantity}`);
      setLastOrder(null);
      return;
    }

    setSubmitting(true);

    try {
      const statusData = user?.email ? await checkUserStatus(user.email) : null;
      if (statusData?.status === 'suspended') {
        setLastError('❌ Your account has been suspended. You cannot place new orders. Please contact support.');
        setLastOrder(null);
        return;
      }

      if (statusData?.status === 'inactive') {
        setLastError('⚠️ Your account is inactive. Please contact support to reactivate your account.');
        setLastOrder(null);
        return;
      }

      const linkCheckData = user?.email ? await checkLinkActiveOrder(user.email, link) : null;
      if (linkCheckData?.hasActiveOrder) {
        const activeOrder = linkCheckData.activeOrder;
        setPendingOrderConflict({
          link: link.trim(),
          orderId: activeOrder?.orderId || 'Unknown',
          service: activeOrder?.service || 'Service',
          status: activeOrder?.status || 'pending',
        });
        setLastError('× You have active order with this link. Please wait until order being completed.');
        setLastOrder(null);
        return;
      }

      const chargeNumeric = parseFloat(charge.replace(/[^0-9.-]/g, '')) || 0;
      const orderData = await createOrder(user.email, selectedService.name, link, quantity, chargeNumeric, currency, selectedService.serviceId);

      setLastOrder({
        id: orderData.orderId,
        service: selectedService.name,
        link,
        quantity,
        charge,
        balance: formatCurrency(orderData.newBalance, currency),
      });
      setLastError(null);
      setPendingOrderConflict(null);
      setLink('');
      setQuantity('');

      // Immediately refresh balance from the server so MongoDB remains the source of truth.
      await refreshBalance();
      await refreshUserProfile();
    } catch (err) {
      setLastError(err.message || 'Failed to create order');
      setLastOrder(null);
    } finally {
      setSubmitting(false);
    }
  };

  const parseMassOrders = () => {
    return String(massOrderText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const parts = line.split('|').map((part) => part.trim());
        if (parts.length < 3) {
          throw new Error(`Line ${index + 1} must use service_id | link | quantity`);
        }

        const [serviceId, orderLink, quantityValue] = parts;
        const service = serviceById.get(String(serviceId));
        if (!service) {
          throw new Error(`Unknown service ID on line ${index + 1}: ${serviceId}`);
        }

        const parsedQuantity = Number(quantityValue);
        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
          throw new Error(`Invalid quantity on line ${index + 1}`);
        }

        return { service, link: orderLink, quantity: parsedQuantity };
      });
  };

  const handleMassSubmitOrder = async (event) => {
    event.preventDefault();

    let orders;
    try {
      orders = parseMassOrders();
    } catch (err) {
      setLastError(err.message || 'Please check your mass order lines');
      setLastOrder(null);
      return;
    }

    if (!orders.length) {
      setLastError('Please paste at least one mass order line');
      setLastOrder(null);
      return;
    }

    setSubmitting(true);

    try {
      const statusData = user?.email ? await checkUserStatus(user.email) : null;
      if (statusData?.status === 'suspended') {
        setLastError('❌ Your account has been suspended. You cannot place new orders. Please contact support.');
        setLastOrder(null);
        return;
      }

      if (statusData?.status === 'inactive') {
        setLastError('⚠️ Your account is inactive. Please contact support to reactivate your account.');
        setLastOrder(null);
        return;
      }

      const createdOrders = [];
      for (const order of orders) {
        const chargeNumeric = (order.quantity / 1000) * Number(order.service.price || 0);
        const orderData = await createOrder(user.email, order.service.name, order.link, order.quantity, chargeNumeric, currency, order.service.serviceId);
        createdOrders.push({ orderData, chargeNumeric, service: order.service, link: order.link, quantity: order.quantity });
      }

      const totalCharge = createdOrders.reduce((sum, item) => sum + item.chargeNumeric, 0);
      const lastCreated = createdOrders[createdOrders.length - 1];
      setLastOrder({
        id: `${createdOrders.length} orders submitted`,
        service: 'Mass Order',
        link: lastCreated?.link || 'See order history',
        quantity: String(createdOrders.length),
        charge: formatCurrency(totalCharge, currency),
        balance: formatCurrency(lastCreated?.orderData?.newBalance || 0, currency),
      });
      setLastError(null);
      setPendingOrderConflict(null);
      setMassOrderText('');

      await refreshBalance();
      await refreshUserProfile();

      toast.success(`Submitted ${createdOrders.length} orders`);
    } catch (err) {
      setLastError(err.message || 'Failed to create mass order');
      setLastOrder(null);
    } finally {
      setSubmitting(false);
    }
  };

  const CustomDropdown = ({ id, label, value, options, onChange, isOpen, getDisplayText }) => (
    <div className="relative">
      {label && <label className="sr-only mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700 md:text-sm">{label}</label>}
      <button
        type="button"
        onClick={() => setOpenDropdown(openDropdown === id ? null : id)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 md:py-3 md:text-sm"
      >
        <span className="truncate">{getDisplayText(value)}</span>
        <span className="ml-2 shrink-0 text-slate-400">▼</span>
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpenDropdown(null);
              }}
              className={`w-full border-b border-slate-100 px-4 py-2.5 text-left text-xs transition last:border-b-0 md:text-sm ${
                value === option.value ? 'bg-violet-100 font-bold text-violet-900' : 'text-slate-900 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid w-full grid-cols-1 gap-4 overflow-hidden md:gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="w-full min-w-0 overflow-hidden rounded-[3px] border border-slate-200/70 bg-white p-3 shadow-sm md:p-5">
        <div className="mb-4 flex flex-wrap gap-2 md:mb-5 md:gap-3">
          <button type="button" onClick={() => setActiveTab('new')} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition md:px-5 md:text-sm ${activeTab === 'new' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            🛒 New Order
          </button>
          <button type="button" onClick={() => setActiveTab('mass')} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition md:px-5 md:text-sm ${activeTab === 'mass' ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-violet-50'}`}>
            📋 Mass Order
          </button>
        </div>

        {lastOrder && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-start gap-3">
                <span className="shrink-0 text-2xl font-bold text-green-600">✓</span>
                <h3 className="text-lg font-bold text-green-900">Your order received</h3>
              </div>
              <div className="space-y-1.5 text-sm text-green-900">
                <div><span className="font-semibold">ID:</span> {lastOrder.id}</div>
                <div><span className="font-semibold">Service:</span> {lastOrder.service}</div>
                <div><span className="font-semibold">Link:</span> {lastOrder.link}</div>
                <div><span className="font-semibold">Quantity:</span> {lastOrder.quantity}</div>
                <div><span className="font-semibold">Charge:</span> {lastOrder.charge}</div>
                <div><span className="font-semibold">Balance:</span> ${lastOrder.balance}</div>
              </div>
            </div>
            <button type="button" onClick={() => setLastOrder(null)} className="shrink-0 text-lg font-bold text-green-700 hover:text-green-900">×</button>
          </div>
        )}

        {lastError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3" role="alert" aria-live="polite">
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-2 text-sm font-bold text-red-900">
                <span className="text-base">✕</span>
                {pendingOrderConflict ? 'Order Conflict' : 'Error'}
              </h3>
              <p className="mt-2 text-xs text-red-800">{lastError}</p>
              {pendingOrderConflict && (
                <div className="mt-3 border-t border-red-200 pt-3">
                  <div className="space-y-1 rounded bg-red-100 p-2 text-xs">
                    <p><span className="font-semibold">Order ID:</span> {pendingOrderConflict.orderId}</p>
                    <p><span className="font-semibold">Service:</span> {pendingOrderConflict.service}</p>
                    <p><span className="font-semibold">Status:</span> <span className="font-bold uppercase text-yellow-700">{pendingOrderConflict.status}</span></p>
                    <p className="mt-2 font-semibold italic text-red-700">⏱️ Please check back once this order is completed.</p>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => { setLastError(null); setPendingOrderConflict(null); }} className="shrink-0 text-lg font-bold text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        {activeTab === 'mass' ? (
          <div className="space-y-4">
            <div>
              <h2 className="mb-3 text-lg font-extrabold text-slate-900 md:text-xl">One order per line in format</h2>
              <textarea
                value={massOrderText}
                onChange={(e) => { setMassOrderText(e.target.value); setLastError(null); }}
                placeholder="service_id | link | quantity"
                className="min-h-90 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 md:min-h-105"
              />
            </div>
            <button type="button" onClick={handleMassSubmitOrder} disabled={submitting} className="w-full rounded-md bg-linear-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-bold text-white shadow-md transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg disabled:opacity-50">
              {submitting ? 'Processing...' : 'Submit'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="🔍 Search any category, service name, ID, or price"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-900 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 md:text-sm"
              />
              {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                  {searchSuggestions.map((service) => (
                    <button
                      key={`${service.serviceId}-${service.name}`}
                      type="button"
                      onClick={() => { setSearchInput(''); setSelectedService(service); if (typeof onCategoryChange === 'function' && service.category) onCategoryChange(service.category); if (service.subCategory) handleSelectSubCategory(service.subCategory); setOpenDropdown(null); }}
                      className="flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-violet-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{getServiceLabel(service, formatCurrency, currency)}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{service.category}{service.subCategory ? ` · ${service.subCategory}` : ''}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">{service.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {selectedCategory === 'Everything' ? (
                <CustomDropdown
                  id="categoryDropdown"
                  value={`${selectedCategory}||`}
                  options={Array.isArray(allSubCategories) ? allSubCategories.flatMap((group) => group.subcategories.map((sub) => ({ value: `${group.main}||${sub}`, label: `${group.main} - ${sub}` }))) : []}
                  onChange={(val) => {
                    if (!val) return;
                    const [main, sub] = val.split('||');
                    setSearchInput('');
                    setSelectedService(null);
                    if (typeof onCategoryChange === 'function') onCategoryChange(main);
                    setPendingSubCategory(sub || null);
                  }}
                  isOpen={openDropdown === 'categoryDropdown'}
                  getDisplayText={(val) => {
                    const match = Array.isArray(allSubCategories) ? allSubCategories.find((group) => val.startsWith(group.main)) : null;
                    if (!match) return 'Select Category';
                    const [main, sub] = val.split('||');
                    return `${main} - ${sub || ''}`;
                  }}
                />
              ) : (
                <CustomDropdown
                  id="categoryDropdown"
                  value={`${selectedCategory}||${selectedSubCategory || ''}`}
                  options={subCategories.map((subcat) => ({ value: `${selectedCategory}||${subcat}`, label: subcat }))}
                  onChange={(val) => {
                    const [, subcat] = val.split('||');
                    if (subcat) {
                      setSearchInput('');
                      setSelectedService(null);
                      handleSelectSubCategory(subcat);
                    }
                  }}
                  isOpen={openDropdown === 'categoryDropdown'}
                  getDisplayText={(val) => {
                    const [, sub] = val.split('||');
                    return sub || selectedCategory;
                  }}
                />
              )}
            </div>

            <div>
              {visibleServices.length > 0 ? (
                <CustomDropdown
                  id="serviceDropdown"
                  label="Service"
                  value={String(selectedService?.serviceId || '')}
                  options={visibleServices.map((service) => ({ value: String(service.serviceId), label: getServiceLabel(service, formatCurrency, currency) }))}
                  onChange={(val) => {
                    const service = visibleServices.find((item) => String(item.serviceId) === val);
                    if (service) setSelectedService(service);
                  }}
                  isOpen={openDropdown === 'serviceDropdown'}
                  getDisplayText={(val) => {
                    if (!val) return '-- Select Service --';
                    const service = visibleServices.find((item) => String(item.serviceId) === String(val));
                    return service ? getServiceLabel(service, formatCurrency, currency) : '-- Select Service --';
                  }}
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
                  {searchInput.trim() ? 'No services match your search' : 'No services available'}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800 md:mb-1.5 md:text-sm">Link</label>
              <input type="text" value={link} onChange={(e) => { setLink(e.target.value); setLastError(null); }} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 md:px-3 md:py-2.5 md:text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800 md:mb-1.5 md:text-sm">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => { setQuantity(e.target.value); setLastError(null); }} className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 md:px-3 md:py-2.5 md:text-sm" />
              <p className="mt-0.5 text-xs text-slate-500 md:mt-1">Min: {selectedService?.minQuantity ? Number(selectedService.minQuantity).toLocaleString() : '—'} – Max: {selectedService?.maxQuantity ? Number(selectedService.maxQuantity).toLocaleString() : '—'}</p>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-800 md:mb-1.5 md:text-sm">
                Average time
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">i</span>
              </label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 md:px-3 md:py-2.5 md:text-sm">{serviceInfo?.averageTime || '—'}</div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-800 md:mb-2 md:text-sm">Recent Completed Time</label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {selectedService ? [
                  `${selectedService.maxQuantity || 'N/A'} = ${serviceInfo?.averageTime || '—'}`,
                  `${selectedService.minQuantity || 'N/A'} = ${serviceInfo?.start || '—'}`,
                ].map((item, index) => (
                  <span key={index} className="rounded-full bg-blue-500 px-2 py-1 text-[11px] font-semibold text-white md:px-3 md:text-xs">{item}</span>
                )) : null}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-800 md:mb-1.5 md:text-sm">Charge</label>
              <div className="flex min-h-12.5 items-center rounded-md border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 px-3 py-3 text-sm font-bold text-slate-900 md:px-4 md:py-3.5 md:text-base">
                {charge ? <span className="text-base font-bold md:text-lg">{charge}</span> : <span className="text-slate-400">Enter quantity to calculate</span>}
              </div>
            </div>

            <button type="button" onClick={handleSubmitOrder} disabled={submitting} className="w-full rounded-md bg-linear-to-r from-violet-600 to-fuchsia-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 md:py-3 md:text-sm">
              {submitting ? 'Processing...' : '🛒 Submit Order'}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'mass' ? (
        <div className="flex min-w-0 flex-col overflow-hidden rounded-[3px] border border-slate-200/70 bg-white shadow-sm">
          <div className="bg-white px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-violet-600 text-white shadow-md">
                <span className="text-base font-bold">i</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 md:text-2xl">How Mass Order works ?</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700 md:text-base">
              <p>You put the service ID followed by | followed by the link followed by | followed by quantity on each line.</p>
              <p>To get the service ID of a service please check here: <a href="https://smmssecure.com/services" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://smmssecure.com/services</a></p>
              <p>Let’s say you want to use the Mass Order to add Instagram Followers to your 3 accounts: abcd, asdf, qwer</p>
              <p>From the Services List, the service ID for this service “Instagram Followers [100% Real - 30 Days Guarantee- NEW SERVICE” is 3740</p>
              <p>Let’s say you want to add 1000 followers for each account, the output will be like this:</p>
              <p>ID|Link|Quantity</p>
              <p>or in this example:</p>
              <ul className="list-disc space-y-1 pl-6">
                <li>3740|abcd|1000</li>
                <li>3740|asdf|1000</li>
                <li>3740|qwer|1000</li>
                <li>3740|eoir|1000</li>
              </ul>
            </div>
          </div>
        </div>
      ) : selectedService ? (
        <div className="flex min-w-0 flex-col overflow-hidden rounded-[3px] border border-slate-200/70 bg-white shadow-sm">
          <div className="relative bg-linear-to-br from-violet-600 via-fuchsia-500 to-rose-500 px-4 py-4 text-white md:px-6 md:py-6">
            <div className="flex flex-wrap items-start gap-2 md:gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="wrap-break-word text-sm font-bold leading-tight md:text-xl">{getServiceLabel(selectedService, formatCurrency, currency)}</h3>
              </div>
              <span className="inline-block shrink-0 rounded-full bg-yellow-300 px-2 py-1 text-xs font-bold text-slate-900 md:px-4 md:py-2"># {selectedService.serviceId}</span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:p-5">
              <h4 className="text-xs font-bold text-slate-900 md:text-sm">Description</h4>
              <div className="space-y-2 text-sm text-slate-900 md:text-base">
                <div><span className="font-medium text-slate-700">Category: </span><span>{selectedService.category || '—'}</span></div>
                <div><span className="font-medium text-slate-700">Subcategory: </span><span>{selectedService.subCategory || '—'}</span></div>
                <div><span className="font-medium text-slate-700">Price: </span><span>{formatCurrency(Number(selectedService.price || 0), currency)} per 1000</span></div>
                <div><span className="font-medium text-slate-700">Min: </span><span>{selectedService.minQuantity || '—'}</span></div>
                <div><span className="font-medium text-slate-700">Max: </span><span>{selectedService.maxQuantity || '—'}</span></div>
              </div>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold text-slate-900 md:text-sm">⚠️ Important Notes:</h4>
              <ul className="space-y-2 text-xs text-slate-700 md:text-sm">
                {[
                  'When the service is experiencing high demand, the starting speed may vary.',
                  'Please avoid placing a second order on the same link until the current order is fully completed in the system.',
                  'If you encounter any issues with the service, kindly reach out to our support team for assistance.',
                  'Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.',
                ].map((note, index) => (
                  <li key={`${index}-${note}`} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 font-bold text-amber-600">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-64 min-w-0 items-center justify-center rounded-[3px] border border-slate-200/70 bg-white p-6 shadow-sm md:h-full md:p-8">
          <p className="text-sm text-slate-500 md:text-base">👈 Select a service to view details</p>
        </div>
      )}
    </div>
  );
}