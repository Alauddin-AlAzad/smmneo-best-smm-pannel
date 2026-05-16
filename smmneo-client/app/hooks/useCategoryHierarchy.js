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
  const [categorySummary, setCategorySummary] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Fetch only category summary or the selected category services from backend proxy
  const fetchAllServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedCategory === 'Everything') {
        const [catsResp, subsResp] = await Promise.all([
          fetch('http://localhost:3000/api/provider/categories'),
          fetch('http://localhost:3000/api/provider/subcategories'),
        ]);

        if (!catsResp.ok) throw new Error(`Failed to fetch categories: ${catsResp.statusText}`);
        if (!subsResp.ok) throw new Error(`Failed to fetch subcategories: ${subsResp.statusText}`);

        const cats = await catsResp.json();
        const subs = await subsResp.json();

        if (!cats.success || !Array.isArray(cats.data)) {
          throw new Error(cats.error || 'Invalid category summary format');
        }
        if (!subs.success || !Array.isArray(subs.data)) {
          throw new Error(subs.error || 'Invalid subcategory summary format');
        }

        setCategorySummary(cats.data);
        setAllSubCategories(subs.data);
        setAllServices([]);
        return;
      }

      const response = await fetch(`http://localhost:3000/api/provider/services?limit=10000&category=${encodeURIComponent(selectedCategory)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Invalid response format');
      }

      const servicesList = Array.isArray(data.data) ? data.data : Object.values(data.data);

      // Normalize service data structure
      const normalizedServices = servicesList.map((service, index) => {
        const serviceId = normalizeServiceId(service, index);
        const name = service.name || service.title || 'Unknown Service';
        const rawCategory = service.category || service.type || 'Others';
        const price = parseFloat(service.rate || service.price || 0);
        const minOrder = parseInt(service.min || service.minQuantity || 1);
        const maxOrder = parseInt(service.max || service.maxQuantity || 10000);
        const refill = service.refill === 1 || service.refill === true || service.refill === 'true';
        const category = mapServiceCategoryToMainCategory(rawCategory);

        return {
          serviceId,
          id: serviceId,
          name,
          category,
          rawCategory,
          subCategory: extractSubCategory(rawCategory, category, name),
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
      setCategorySummary([]);
      console.log(`✅ Loaded ${normalizedServices.length} services`);
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError(err.message || 'Failed to fetch services');
      setAllServices([]);
      setCategorySummary([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

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
      return [];
    }
    
    return allServices.filter((service) => 
      service.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allServices, selectedCategory]);

  const totalServicesCount = allServices.length;
  const currentCategoryCount = categoryServices.length;

  // Get unique subcategories for selected category
  const subCategories = useMemo(() => {
    const subs = new Set();
    categoryServices.forEach((service) => {
      const subCat = service.subCategory || extractSubCategory(service.rawCategory, service.category, service.name);
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
      const subCat = service.subCategory || extractSubCategory(service.rawCategory, service.category, service.name);
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
    categorySummary,
    allSubCategories,
    totalServicesCount,
    currentCategoryCount,
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

  const raw = String(serviceCategory).toLowerCase().trim();

  const platforms = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'Youtube',
    youtuber: 'Youtube',
    twitter: 'Twitter',
    'x-twitter': 'Twitter',
    spotify: 'Spotify',
    tiktok: 'TikTok',
    'tik tok': 'TikTok',
    telegram: 'Telegram',
    linkedin: 'LinkedIn',
    discord: 'Discord',
    website: 'Website Traffic',
    traffic: 'Website Traffic',
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Split by common separators and prefer the most specific segment (last segment)
  const parts = raw.split(/[\/|,;–—\-]/).map((s) => s.trim()).filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    for (const key in platforms) {
      const re = new RegExp('\\b' + escapeRegExp(key) + '\\b');
      if (re.test(part)) return platforms[key];
    }
  }

  // Fallback: search the whole string in priority order
  const priority = ['instagram','facebook','youtube','twitter','spotify','tiktok','telegram','linkedin','discord','website','traffic'];
  for (const key of priority) {
    const re = new RegExp('\\b' + escapeRegExp(key) + '\\b');
    if (re.test(raw)) return platforms[key];
  }

  return 'Others';
}

function normalizeServiceId(service, fallbackIndex) {
  const candidate = service?.service ?? service?.service_id ?? service?.serviceId ?? service?.id;
  if (candidate !== undefined && candidate !== null && `${candidate}`.trim() !== '') {
    return candidate;
  }

  return fallbackIndex;
}

/**
 * Helper: Extract subcategory from service name
 * Extracts the main service type (e.g., "Post Likes", "Story Views", "Post Reaction")
 */
function extractSubCategory(serviceCategory, mainCategory, serviceName) {
  const rawCategory = (serviceCategory || '').trim();
  const normalizedMain = (mainCategory || '').trim();

  if (rawCategory) {
    if (!normalizedMain || rawCategory.toLowerCase() !== normalizedMain.toLowerCase()) {
      return rawCategory;
    }
  }

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

