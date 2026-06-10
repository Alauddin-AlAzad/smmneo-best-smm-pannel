import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { FaFilter, FaSearch, FaStar, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext.jsx';
import { useCurrency } from '../context/CurrencyContext.jsx';
import DashboardTopbar from '../components/DashboardTopbar.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const PAGE_SIZE = 25;

export async function loader() {
  return null;
}

function normalizeService(service) {
  return {
    id: String(service?.service || service?.id || service?._id || ''),
    name: service?.name || 'Unnamed service',
    category: service?.category || service?.type || 'Uncategorized',
    type: service?.type || '-',
    rate: service?.price ?? service?.sellingPrice ?? service?.rate ?? 0,
    min: service?.min ?? service?.minQuantity ?? '-',
    max: service?.max ?? service?.maxQuantity ?? '-',
    averageTime: service?.averageTime || service?.avgTime || service?.eta || '—',
    refill: Boolean(service?.refill),
    cancel: Boolean(service?.cancel),
    description: service?.description || service?.note || service?.details || '',
    raw: service,
  };
}

export default function DashboardServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasMore: false });
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [detailsService, setDetailsService] = useState(null);
  const sentinelRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const clickedCategory = categoryDropdownRef.current?.contains(target);
      const clickedCurrency = currencyDropdownRef.current?.contains(target);

      if (!clickedCategory && !clickedCurrency) {
        setOpenDropdown(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const fetchPage = useCallback(async (pageToLoad, replace = false, subcategory = selectedSubcategory) => {
    if (replace) setLoadingInitial(true);
    else setLoadingMore(true);

    try {
      setError('');
      const params = new URLSearchParams({
        page: String(pageToLoad),
        limit: String(PAGE_SIZE),
      });

      if (subcategory) {
        params.set('subcategory', subcategory);
      }

      const resp = await fetch(`${API_BASE_URL}/api/provider/services?${params.toString()}`);
      if (!resp.ok) {
        throw new Error(`Failed to load services (${resp.status})`);
      }

      const json = await resp.json();
      if (!json?.success) {
        throw new Error(json?.error || 'Invalid services response');
      }

      const nextServices = Array.isArray(json.data) ? json.data.map(normalizeService) : [];
      const nextPagination = json.pagination || { page: pageToLoad, limit: PAGE_SIZE, total: nextServices.length, totalPages: 1, hasMore: false };

      setPagination(nextPagination);
      setServices((current) => {
        if (replace) return nextServices;

        const merged = new Map(current.map((item) => [item.id, item]));
        nextServices.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values());
      });
    } catch (err) {
      setError(err.message || 'Failed to load services');
      if (replace) {
        setServices([]);
        setPagination({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasMore: false });
      }
    } finally {
      if (replace) setLoadingInitial(false);
      else setLoadingMore(false);
    }
  }, [selectedSubcategory]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/provider/subcategories`);
      if (!resp.ok) return;

      const json = await resp.json();
      if (!json?.success || !Array.isArray(json.data)) return;

      const subcategories = json.data
        .map((group) => ({
          subcategories: Array.isArray(group?.subcategories)
            ? Array.from(new Set(group.subcategories.map((item) => String(item || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
            : [],
        }))
        .flatMap((group) => group.subcategories);

      setAllSubcategories(Array.from(new Set(subcategories)).sort((a, b) => a.localeCompare(b)));
    } catch {
      setAllSubcategories([]);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, true, selectedSubcategory);
    fetchAllCategories();
  }, [fetchAllCategories, fetchPage, selectedSubcategory]);

  const loadMore = useCallback(() => {
    if (loadingInitial || loadingMore || !pagination.hasMore) return;
    fetchPage(pagination.page + 1, false, selectedSubcategory);
  }, [fetchPage, loadingInitial, loadingMore, pagination.hasMore, pagination.page, selectedSubcategory]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setAppliedSearch(searchInput.trim());
    }
  }, [searchInput]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: '300px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const filteredServices = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();
    return services.filter((service) => {
      const exactValues = [service.id, service.name, service.category, service.type, service.description]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      const matchesTerm = !term || exactValues.some((value) => value === term);

      return matchesTerm;
    });
  }, [services, appliedSearch]);

  const categoryOptions = useMemo(() => {
    return allSubcategories;
  }, [allSubcategories]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce((acc, service) => {
      const category = service.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});
  }, [filteredServices]);

  const categoryNames = useMemo(() => Object.keys(groupedServices), [groupedServices]);

  const categoryButtonLabel = selectedSubcategory;
  const currencyButtonLabel = currency === 'USD' ? 'USD $' : 'BDT ৳';

  const formatRate = useCallback((value) => {
    const numeric = Number.parseFloat(value ?? 0) || 0;
    return formatCurrency(numeric, currency);
  }, [currency, formatCurrency]);

  const closeDetailsModal = useCallback(() => {
    setDetailsService(null);
  }, []);

  const openDetailsModal = useCallback((service) => {
    setDetailsService(service);
  }, []);

  const handleBuyNow = useCallback((service) => {
    if (!service) return;

    try {
      localStorage.setItem('smmneo:dashboardSelectedService', JSON.stringify(service));
    } catch {
      // Ignore storage failures and still navigate.
    }

    const serviceId = String(service.id || service.serviceId || service.service || '').trim();
    const targetPath = serviceId ? `/dashboard?service=${encodeURIComponent(serviceId)}` : '/dashboard';
    navigate(targetPath);
  }, [navigate]);

  const serviceQueryId = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      return String(params.get('service') || '').trim();
    } catch {
      return '';
    }
  }, [location.search]);

  useEffect(() => {
    if (!serviceQueryId || services.length === 0) return;
    const serviceToBuy = services.find((service) => String(service.id) === serviceQueryId);
    if (!serviceToBuy) return;
    handleBuyNow(serviceToBuy);
  }, [serviceQueryId, services, handleBuyNow]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-lg">Loading services...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`dashboard-shell min-h-screen bg-slate-50 text-slate-900 ${sidebarOpen ? 'dashboard-sidebar-open' : 'dashboard-sidebar-closed'}`}>
      <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DashboardTopbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`dashboard-main min-w-0 px-2.5 py-6 pt-24 transition-all duration-300 ${sidebarOpen ? 'lg:ml-65 lg:w-[calc(100%-260px)]' : 'lg:ml-0 lg:w-full'}`}>
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4 md:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div ref={categoryDropdownRef} className="relative lg:w-60">
              <button
                type="button"
                onClick={() => setOpenDropdown((current) => (current === 'category' ? null : 'category'))}
                aria-label={selectedSubcategory ? `Filter: ${selectedSubcategory}` : 'Open filters'}
                title={selectedSubcategory || 'Open filters'}
                className={`flex h-12 w-full items-center gap-3 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200 ${selectedSubcategory ? 'justify-between' : 'justify-center'}`}
              >
                <span className={`flex min-w-0 items-center gap-2 ${selectedSubcategory ? 'truncate' : ''}`}>
                  <FaFilter className="text-base" />
                  {categoryButtonLabel ? <span className="truncate">{categoryButtonLabel}</span> : null}
                </span>
                {selectedSubcategory ? <FaChevronDown className="text-[11px] opacity-90" /> : null}
              </button>

              {openDropdown === 'category' && (
                <div className="absolute left-0 top-full z-30 mt-2 w-[min(92vw,720px)] max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Category</p>
                      <p className="text-sm font-semibold text-slate-900">Choose a category</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory('');
                        setAppliedSearch('');
                        setSearchInput('');
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:text-violet-700"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="space-y-3 pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubcategory('');
                        setAppliedSearch('');
                        setSearchInput('');
                        setOpenDropdown(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${!selectedSubcategory ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                    >
                      <span className="truncate text-left">All subcategories</span>
                      <span className="ml-3 shrink-0 text-xs uppercase opacity-70">all</span>
                    </button>

                    {categoryOptions.map((subcategory) => {
                      const active = subcategory === selectedSubcategory;
                      return (
                        <button
                          key={subcategory}
                          type="button"
                          onClick={() => {
                            setSelectedSubcategory(subcategory);
                            setAppliedSearch('');
                            setSearchInput('');
                            setOpenDropdown(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${active ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}
                        >
                          <span className="mr-3 min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-5" title={subcategory}>{subcategory}</span>
                          <span className="ml-3 shrink-0 text-[10px] uppercase opacity-70">sub</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div ref={currencyDropdownRef} className="relative lg:w-60">
              <button
                type="button"
                onClick={() => setOpenDropdown((current) => (current === 'currency' ? null : 'currency'))}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-200"
              >
                <span className="truncate">{currencyButtonLabel}</span>
                <FaChevronDown className="text-[11px] opacity-90" />
              </button>

              {openDropdown === 'currency' && (
                <div className="absolute left-0 top-full z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                  {['BDT', 'USD'].map((option) => {
                    const active = option === currency;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCurrency(option);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-violet-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span>{option}</span>
                        <span>{option === 'USD' ? '$' : '৳'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex h-12 flex-1 items-stretch overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search"
                onKeyDown={handleSearchKeyDown}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none"
              />
              <button type="button" onClick={handleSearch} className="grid w-12 place-items-center bg-violet-600 text-white">
                <FaSearch />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingInitial ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">Loading services...</div>
        ) : categoryNames.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-slate-900">No services found</p>
            <p className="mt-2 text-sm text-slate-500">Try another search term.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-315 w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="w-10 px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700" />
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Service</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Rate per 1000</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Min order</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Max order</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Average time ℹ</th>
                    <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryNames.map((category, categoryIndex) => (
                    <React.Fragment key={category}>
                      <tr>
                        <td colSpan={8} className="bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">
                          {category}
                          <span className="ml-2 text-[10px] font-bold uppercase opacity-90">new</span>
                        </td>
                      </tr>
                      {groupedServices[category].map((service) => (
                        <tr key={`${service.id}-${service.name}`} className="border-t border-slate-200 even:bg-slate-50 hover:bg-slate-100/70">
                          <td className="px-3 py-3 text-slate-500"><FaStar className="inline" /></td>
                          <td className="px-3 py-3 font-semibold text-slate-900 whitespace-nowrap">{service.id}</td>
                          <td className="px-3 py-3 min-w-90 text-slate-900">
                            <div className="leading-6">
                              <div className="font-medium">{service.name}</div>
                              <div className="text-[11px] text-slate-500">{service.type || 'Service'}</div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-900">{formatRate(service.rate)}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-700">{service.min}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-700">{service.max}</td>
                          <td className="px-3 py-3 min-w-44 whitespace-nowrap text-slate-700">
                            <span className="font-medium text-slate-900">{service.averageTime}</span>
                          </td>
                          <td className="px-3 py-3 min-w-60 text-slate-700">
                            <div className="flex flex-col gap-2">
                              <p className="line-clamp-2 text-sm leading-5 text-slate-700" title={service.description || ''}>
                                {service.description || ''}
                              </p>
                              <button
                                type="button"
                                onClick={() => openDetailsModal(service)}
                                className="inline-flex w-fit items-center rounded-full bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div ref={sentinelRef} className="py-2" />

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
              {loadingMore ? (
                <p className="text-sm font-semibold text-slate-600">Loading more services...</p>
              ) : pagination.hasMore ? (
                <p className="text-sm text-slate-600">Scroll down to load more services automatically.</p>
              ) : (
                <p className="text-sm font-semibold text-green-700">You’ve reached the end of the service list.</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Loaded {services.length.toLocaleString()} of {pagination.total.toLocaleString()} services
              </p>
            </div>
          </div>
        )}

        {detailsService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="service-details-title">
            <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={closeDetailsModal}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-rose-100 text-rose-700 transition hover:bg-rose-200"
                aria-label="Close details"
              >
                ×
              </button>

              <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-6">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">#ID : {detailsService.id}</p>
                <h2 id="service-details-title" className="mt-2 pr-10 text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {detailsService.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{detailsService.category} • {detailsService.type}</p>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Price per 1000</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{formatRate(detailsService.rate)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Average time</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{detailsService.averageTime}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Min order</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{detailsService.min}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Max order</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{detailsService.max}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Refill</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{detailsService.refill ? 'Refill available' : 'No refill'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cancel</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{detailsService.cancel ? 'Cancelable' : 'Not cancelable'}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {detailsService.description || ''}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                    <li>• Start: {detailsService.raw?.start || '—'}</li>
                    <li>• Speed: {detailsService.raw?.speed || '—'}</li>
                    <li>• Quality: {detailsService.raw?.quality || '—'}</li>
                    <li>• Location: {detailsService.raw?.location || 'Global'}</li>
                  </ul>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleBuyNow(detailsService)}
                    className="flex-1 rounded-2xl bg-violet-600 px-5 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    onClick={closeDetailsModal}
                    className="rounded-2xl border border-slate-300 px-5 py-4 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}