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
 * @param {string} selectedCategory - The selected category (passed from parent)
 * Structure: Category -> SubCategory -> Services
 */
export function useCategoryHierarchy(selectedCategory = "Everything") {
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

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

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubCategory(null);
  }, [selectedCategory]);

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

  // Handle subcategory selection
  const handleSelectSubCategory = useCallback((subCategory) => {
    setSelectedSubCategory(subCategory);
  }, []);

  return {
    // Predefined categories
    predefinedCategories: PREDEFINED_CATEGORIES,
    
    // Data
    allServices,
    categoryServices,
    subCategories,
    filteredServices,

    // State
    selectedCategory,
    selectedSubCategory,
    loading,
    error,

    // Methods
    handleSelectSubCategory,
    fetchAllServices,
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
 * Extracts the main service type (e.g., "Post Likes", "Story Views", "Post Reaction")
 */
function extractSubCategory(serviceName, mainCategory) {
  if (!serviceName) return mainCategory;

  // Remove the main category prefix if it exists
  let name = serviceName;
  const categoryPrefix = mainCategory + ' ';
  if (name.toLowerCase().startsWith(categoryPrefix.toLowerCase())) {
    name = name.substring(categoryPrefix.length);
  }

  // Extract the main type before "~" or "–" separators
  // This captures patterns like "Post Likes", "Post Reaction", "Story Views"
  const parts = name.split(/[~–-]/);
  let mainType = parts[0].trim();

  // Remove trailing emojis and extra info for cleaner display
  mainType = mainType.replace(/[\s]*[👍😍😡❤️💖🤗😮😂😭💬👀✨🎉]/g, '').trim();

  // If we got a good type, return it
  if (mainType && mainType.length > 2) {
    return mainType;
  }

  // Fallback to common patterns if mainType extraction failed
  const nameLower = serviceName.toLowerCase();
  if (nameLower.includes('like') || nameLower.includes('👍')) return 'Likes';
  if (nameLower.includes('follow') || nameLower.includes('follower')) return 'Followers';
  if (nameLower.includes('comment') || nameLower.includes('💬')) return 'Comments';
  if (nameLower.includes('share') || nameLower.includes('sharing')) return 'Shares';
  if (nameLower.includes('view') || nameLower.includes('watch')) return 'Views';
  if (nameLower.includes('subscriber') || nameLower.includes('sub')) return 'Subscribers';
  if (nameLower.includes('play') || nameLower.includes('stream')) return 'Plays';
  if (nameLower.includes('reaction')) return 'Reactions';
  if (nameLower.includes('retweet') || nameLower.includes('rt')) return 'Retweets';
  if (nameLower.includes('impression')) return 'Impressions';
  if (nameLower.includes('reach')) return 'Reach';
  if (nameLower.includes('click')) return 'Clicks';
  if (nameLower.includes('save')) return 'Saves';

  return mainCategory;
}

