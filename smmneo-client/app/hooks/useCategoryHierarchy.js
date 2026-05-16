import { useState, useCallback, useEffect, useMemo } from 'react';

// Predefined 12 categories matching DashboardCategoryTabs
export const PREDEFINED_CATEGORIES = [
  { label: "Everything", faClass: "fas fa-layer-group" },
  { label: "Instagram", faClass: "fab fa-instagram" },
  { label: "Facebook", faClass: "fab fa-facebook-f" },
  { label: "Youtube", faClass: "fab fa-youtube" },
  { label: "Twitter", faClass: "fab fa-x-twitter" },
  { label: "Spotify", faClass: "fab fa-spotify" },
  { label: "TikTok", faClass: "fab fa-tiktok" },
  { label: "Telegram", faClass: "fab fa-telegram" },
  { label: "LinkedIn", faClass: "fab fa-linkedin-in" },
  { label: "Discord", faClass: "fab fa-discord" },
  { label: "Website Traffic", faClass: "fas fa-globe" },
  { label: "Others", faClass: "fas fa-ellipsis" },
];

/**
 * Custom hook to organize services by predefined categories
 * Uses the 12 categories from DashboardCategoryTabs
 * 
 * Structure: Category -> SubCategory -> Services
 */
export function useCategoryHierarchy() {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Everything");
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedServices, setSelectedServices] = useState(new Set());

  // Fetch all services from backend proxy
  const fetchAllServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3000/api/provider/services?limit=10000');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format');
      }

      // Handle both array and object responses from provider APIs
      let servicesList = Array.isArray(data.data) ? data.data : Object.values(data.data);

      // Normalize service data structure
      const normalizedServices = servicesList.map((service, index) => {
        const serviceId = service.service_id || service.serviceId || service.id || index;
        const name = service.name || service.title || 'Unknown Service';
        const category = service.category || service.type || 'Others';
        const price = parseFloat(service.rate || service.price || 0);
        const minOrder = parseInt(service.min || service.minQuantity || 1);
        const maxOrder = parseInt(service.max || service.maxQuantity || 10000);
        const refill = service.refill === 1 || service.refill === true || service.refill === 'true';

        return {
          serviceId,
          id: serviceId,
          name,
          category: mapServiceCategoryToMainCategory(category),
          price,
          minQuantity: minOrder,
          maxQuantity: maxOrder,
          refill,
          cancel: service.cancel === 1 || service.cancel === true,
          dripFeed: service.dripfeed === 1 || service.dripfeed === true,
          description: service.description || '',
          raw: service,
        };
      });

      setAllServices(normalizedServices);
      console.log(`✅ Loaded ${normalizedServices.length} services`);
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError(err.message || 'Failed to fetch services');
      setAllServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch services on mount
  useEffect(() => {
    fetchAllServices();
  }, [fetchAllServices]);

  // Get services for selected category
  const categoryServices = useMemo(() => {
    if (!selectedCategory || selectedCategory === "Everything") {
      return allServices;
    }
    
    return allServices.filter((service) => 
      service.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allServices, selectedCategory]);

  // Get unique subcategories for selected category
  const subCategories = useMemo(() => {
    const subs = new Set();
    categoryServices.forEach((service) => {
      const subCat = extractSubCategory(service.name, service.category);
      subs.add(subCat);
    });
    return Array.from(subs).sort();
  }, [categoryServices]);

  // Get services for selected category and subcategory
  const filteredServices = useMemo(() => {
    if (!selectedSubCategory) {
      return categoryServices;
    }

    return categoryServices.filter((service) => {
      const subCat = extractSubCategory(service.name, service.category);
      return subCat === selectedSubCategory;
    });
  }, [categoryServices, selectedSubCategory]);

  // Handle category selection
  const handleSelectCategory = useCallback((categoryLabel) => {
    setSelectedCategory(categoryLabel);
    setSelectedSubCategory(null);
    setSelectedServices(new Set());
  }, []);

  // Handle subcategory selection
  const handleSelectSubCategory = useCallback((subCategory) => {
    setSelectedSubCategory(subCategory);
    setSelectedServices(new Set());
  }, []);

  // Toggle service selection
  const toggleServiceSelection = useCallback((serviceId) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      const key = String(serviceId);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Select all services in current filtered set
  const selectAllFiltered = useCallback(() => {
    const ids = new Set(
      filteredServices.map((s) => String(s.serviceId))
    );
    setSelectedServices(ids);
  }, [filteredServices]);

  // Deselect all services
  const deselectAll = useCallback(() => {
    setSelectedServices(new Set());
  }, []);

  // Get selected service objects
  const getSelectedServiceObjects = useCallback(() => {
    return filteredServices.filter((s) =>
      selectedServices.has(String(s.serviceId))
    );
  }, [filteredServices, selectedServices]);

  return {
    // Predefined categories
    predefinedCategories: PREDEFINED_CATEGORIES,
    
    // Data
    allServices,
    categoryServices,
    subCategories,
    filteredServices,
    selectedServices,
    selectedServiceObjects: getSelectedServiceObjects(),

    // State
    selectedCategory,
    selectedSubCategory,
    loading,
    error,

    // Methods
    handleSelectCategory,
    handleSelectSubCategory,
    toggleServiceSelection,
    selectAllFiltered,
    deselectAll,
    fetchAllServices,

    // Utils
    isServiceSelected: (serviceId) => selectedServices.has(String(serviceId)),
    getSelectedCount: () => selectedServices.size,
  };
}

/**
 * Map service category to one of the 12 predefined categories
 * Matches service categories to the closest predefined category
 */
function mapServiceCategoryToMainCategory(serviceCategory) {
  if (!serviceCategory) return 'Others';

  const category = serviceCategory.toLowerCase().trim();

  // Direct matches
  if (category.includes('instagram')) return 'Instagram';
  if (category.includes('facebook')) return 'Facebook';
  if (category.includes('youtube') || category.includes('youtuber')) return 'Youtube';
  if (category.includes('twitter') || category.includes('x')) return 'Twitter';
  if (category.includes('spotify')) return 'Spotify';
  if (category.includes('tiktok') || category.includes('tik tok')) return 'TikTok';
  if (category.includes('telegram')) return 'Telegram';
  if (category.includes('linkedin')) return 'LinkedIn';
  if (category.includes('discord')) return 'Discord';
  if (category.includes('website') || category.includes('traffic') || category.includes('traffic')) return 'Website Traffic';

  return 'Others';
}

/**
 * Helper: Extract subcategory from service name
 * Groups similar services together
 */
function extractSubCategory(serviceName, mainCategory) {
  if (!serviceName) return mainCategory;

  const name = serviceName.toLowerCase();

  // Common subcategory patterns
  if (name.includes('like') || name.includes('👍')) return 'Likes';
  if (name.includes('follow') || name.includes('follower')) return 'Followers';
  if (name.includes('comment') || name.includes('💬')) return 'Comments';
  if (name.includes('share') || name.includes('sharing')) return 'Shares';
  if (name.includes('view') || name.includes('watch')) return 'Views';
  if (name.includes('subscriber') || name.includes('sub')) return 'Subscribers';
  if (name.includes('play') || name.includes('stream')) return 'Plays';
  if (name.includes('retweet') || name.includes('rt')) return 'Retweets';
  if (name.includes('impression')) return 'Impressions';
  if (name.includes('reach')) return 'Reach';
  if (name.includes('click')) return 'Clicks';
  if (name.includes('save')) return 'Saves';

  // Fallback: use first word or main category
  const parts = serviceName.split('-').map((p) => p.trim());
  return parts.length > 1 ? parts[0] : mainCategory;
}

