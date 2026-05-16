# Multi-Level Category Filtering System - Implementation Guide

## 📋 Overview

The multi-level category filtering system provides a hierarchical organization of services with three levels:

1. **Main Categories** (e.g., Facebook, Instagram, YouTube, TikTok)
2. **Subcategories** (e.g., specific service types within a category)
3. **Services** (individual services with pricing and specifications)

This system is fully dynamic and fetches data from your Provider API.

---

## 🏗️ Architecture

### Files Created/Modified

```
smmneo-client/
├── app/
│   ├── hooks/
│   │   └── useCategoryHierarchy.js (NEW)
│   └── components/
│       └── DashboardOrderPanel.jsx (UPDATED)
```

### Component Structure

```
DashboardOrderPanel (uses useCategoryHierarchy hook)
├── Main Category Buttons (dynamic buttons)
├── Subcategory Dropdown (appears when main category selected)
├── Service Dropdown (appears when subcategory selected)
├── Link Input
├── Quantity Input
└── Service Details Panel
```

---

## 🎣 Hook: `useCategoryHierarchy`

### Location
`smmneo-client/app/hooks/useCategoryHierarchy.js`

### Purpose
Organizes services into a hierarchical structure and manages filtering state.

### API Contract

```javascript
const {
  // Data
  allServices,                    // Array of all services with normalized data
  mainCategories,                 // Array of main category names
  subCategories,                  // Array of subcategories for selected main category
  filteredServices,               // Services for selected main + subcategory
  selectedServices,               // Set of selected service IDs
  selectedServiceObjects,         // Array of selected service objects
  
  // State
  selectedMainCategory,           // Currently selected main category name
  selectedSubCategory,            // Currently selected subcategory name
  loading,                        // Boolean: loading state
  error,                          // String: error message if any
  
  // Methods
  handleSelectMainCategory,       // Function: select a main category
  handleSelectSubCategory,        // Function: select a subcategory
  toggleServiceSelection,         // Function: toggle service checkbox
  selectAllFiltered,              // Function: select all filtered services
  deselectAll,                    // Function: deselect all services
  fetchAllServices,               // Function: manually refresh services
  
  // Utilities
  isServiceSelected,              // Function: check if service is selected
  getSelectedCount,               // Function: get count of selected services
} = useCategoryHierarchy();
```

### Service Data Structure

Each service in the hierarchy has this structure:

```javascript
{
  serviceId: 1001,                // Unique identifier
  id: 1001,                       // Alternative ID field
  name: "Instagram Likes",        // Service name
  category: "Instagram",          // Main category
  price: 5.50,                    // Price (in USD)
  minQuantity: 100,               // Minimum order quantity
  maxQuantity: 10000,             // Maximum order quantity
  refill: true,                   // Refill support
  cancel: true,                   // Cancellation support
  dripFeed: false,                // Drip feed support
  description: "",                // Service description
  raw: { ... }                    // Original API response
}
```

---

## 🎨 Component: `DashboardOrderPanel`

### Location
`smmneo-client/app/components/DashboardOrderPanel.jsx`

### Updated Flow

1. **Load Services** - Component mounts, hook fetches all services from `/api/provider/services`

2. **Select Main Category** - User clicks a main category button
   - Updates `selectedMainCategory`
   - Clears `selectedSubCategory` and `selectedServices`
   - Populates `subCategories` dropdown

3. **Select Subcategory** - User selects from subcategory dropdown
   - Updates `selectedSubCategory`
   - Clears `selectedServices`
   - Populates services dropdown with matching services

4. **Select Service** - User selects from services dropdown
   - Updates `selectedService`
   - Service details panel updates automatically
   - Charge calculation updates

5. **Place Order** - User fills link & quantity and clicks submit
   - Validates inputs
   - Shows success toast
   - Resets form

### UI Elements Added

```jsx
{/* Main Category Buttons */}
<div className="grid grid-cols-2 gap-1.5 md:gap-2">
  {mainCategories.map((category) => (
    <button
      key={category}
      onClick={() => handleSelectMainCategory(category)}
      className={selectedMainCategory === category ? "active" : "inactive"}
    >
      {category}
    </button>
  ))}
</div>

{/* Subcategory Dropdown - Shows when main category selected */}
{selectedMainCategory && (
  <select
    value={selectedSubCategory || ""}
    onChange={(e) => handleSelectSubCategory(e.target.value)}
  >
    {subCategories.map((subcat) => (
      <option key={subcat} value={subcat}>{subcat}</option>
    ))}
  </select>
)}

{/* Service Dropdown - Shows when subcategory selected */}
{selectedMainCategory && selectedSubCategory && (
  <select
    value={selectedService?.serviceId || ""}
    onChange={(e) => {
      const service = filteredServices.find(...);
      setSelectedService(service);
    }}
  >
    {filteredServices.map((service) => (
      <option key={service.serviceId} value={service.serviceId}>
        {service.serviceId} ~ {service.name} ~ ${service.price.toFixed(4)}
      </option>
    ))}
  </select>
)}
```

---

## 📊 Data Flow Diagram

```
Backend API (/api/provider/services)
         ↓
useCategoryHierarchy Hook
    ├── allServices (fetched & normalized)
    ├── Build Hierarchy:
    │   MainCategory["Facebook"]
    │   ├── SubCategory["Likes"]
    │   │   ├── Service 1001
    │   │   ├── Service 1002
    │   │   └── ...
    │   ├── SubCategory["Followers"]
    │   │   └── ...
    │   └── ...
    │
    ├── handleSelectMainCategory("Facebook")
    │   └── subCategories = ["Likes", "Followers", "Comments", ...]
    │
    ├── handleSelectSubCategory("Likes")
    │   └── filteredServices = [Service 1001, Service 1002, ...]
    │
    └── DashboardOrderPanel (consumes above data)
         ├── Main Category Buttons
         ├── Subcategory Dropdown
         ├── Service Dropdown
         └── Service Details Panel
```

---

## 🚀 Usage Example

### Basic Implementation

```jsx
import { useCategoryHierarchy } from '../hooks/useCategoryHierarchy.js';

function MyComponent() {
  const {
    mainCategories,
    subCategories,
    filteredServices,
    selectedMainCategory,
    selectedSubCategory,
    handleSelectMainCategory,
    handleSelectSubCategory,
    loading,
  } = useCategoryHierarchy();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Step 1: Select Main Category */}
      {mainCategories.map((category) => (
        <button
          key={category}
          onClick={() => handleSelectMainCategory(category)}
          className={selectedMainCategory === category ? 'active' : ''}
        >
          {category}
        </button>
      ))}

      {/* Step 2: Select Subcategory (only if main category selected) */}
      {selectedMainCategory && (
        <select onChange={(e) => handleSelectSubCategory(e.target.value)}>
          <option>-- Select Subcategory --</option>
          {subCategories.map((subcat) => (
            <option key={subcat} value={subcat}>{subcat}</option>
          ))}
        </select>
      )}

      {/* Step 3: Display Services (only if subcategory selected) */}
      {selectedMainCategory && selectedSubCategory && (
        <div>
          {filteredServices.map((service) => (
            <div key={service.serviceId}>
              <h4>{service.name}</h4>
              <p>Price: ${service.price}</p>
              <p>Min: {service.minQuantity}, Max: {service.maxQuantity}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 State Management

### Hook State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `allServices` | Array | All services from API |
| `selectedMainCategory` | String | Currently selected category |
| `selectedSubCategory` | String | Currently selected subcategory |
| `selectedServices` | Set | IDs of selected services (for checkboxes) |
| `loading` | Boolean | Loading state |
| `error` | String | Error message if fetch fails |

### Component State Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `selectedService` | Object | Currently selected service for order |
| `quantity` | String | Order quantity |
| `link` | String | Link for the order |
| `activeTab` | String | Tab selection (new/mass) |

---

## 🛠️ Customization

### Extracting Subcategories

The hook uses `extractSubCategory()` function to derive subcategories from service names:

```javascript
function extractSubCategory(serviceName, mainCategory) {
  // Current: Uses first word of service name
  // E.g., "Instagram Likes - High Quality" → "Instagram"
  const parts = serviceName.split('-').map((p) => p.trim());
  return parts.length > 1 ? parts[0] : mainCategory;
}
```

To customize subcategory logic, edit this function in `useCategoryHierarchy.js`:

```javascript
function extractSubCategory(serviceName, mainCategory) {
  // Example: Use service type from API response
  // If your API returns `service.type`, use that instead
  if (serviceName.includes('Followers')) return 'Followers';
  if (serviceName.includes('Likes')) return 'Likes';
  if (serviceName.includes('Comments')) return 'Comments';
  return mainCategory;
}
```

### Filtering Services

To add additional filtering logic:

```javascript
const filteredServices = useMemo(() => {
  if (!selectedMainCategory || !selectedSubCategory) {
    return [];
  }

  let services = hierarchyData.hierarchy[selectedMainCategory]?.[selectedSubCategory] || [];
  
  // Add custom filters
  services = services.filter(s => s.refill === true); // Only refillable
  services = services.filter(s => s.price < 10); // Price limit
  
  return services;
}, [selectedMainCategory, selectedSubCategory, hierarchyData.hierarchy]);
```

---

## 📡 API Integration

### Backend Endpoint Required

```
GET /api/provider/services?limit=10000
```

### Expected Response Format

```json
{
  "success": true,
  "data": [
    {
      "service_id": 1001,
      "name": "Instagram Likes",
      "category": "Instagram",
      "rate": 5.50,
      "min": 100,
      "max": 10000,
      "refill": 1,
      "cancel": 1,
      "dripfeed": 0,
      "description": "Real Instagram Likes"
    },
    ...
  ]
}
```

### Service Field Mapping

The hook normalizes various field names:

| API Field | Hook Field | Fallback |
|-----------|-----------|----------|
| `service_id` or `serviceId` | `serviceId` | `id` or index |
| `name` or `title` | `name` | "Unknown Service" |
| `category` or `type` | `category` | "Other" |
| `rate` or `price` | `price` | 0 |
| `min` or `minQuantity` | `minQuantity` | 1 |
| `max` or `maxQuantity` | `maxQuantity` | 10000 |
| `refill` | `refill` | false |

---

## ⚡ Performance Optimization

### Memoization

The hook uses `useMemo` for expensive computations:
- Building hierarchy structure
- Filtering services by category
- Extracting subcategories

### Pagination

Current implementation fetches ALL services (10000 limit). For large datasets:

```javascript
// Modify fetchAllServices to use pagination
const response = await fetch(
  'http://localhost:3000/api/provider/services?page=1&limit=5000'
);
```

---

## 🐛 Troubleshooting

### Issue: Services not loading

1. Check backend is running on port 3000
2. Verify `/api/provider/services` endpoint exists
3. Check browser console for errors
4. Use React DevTools to inspect `loading` and `error` states

### Issue: Subcategories not appearing

1. Ensure services have `category` field in API response
2. Check `extractSubCategory()` logic is correct
3. Verify service names follow expected format

### Issue: Service selection not updating

1. Check `selectedService` state is being set
2. Verify `filteredServices` array has items
3. Look for console errors in browser DevTools

---

## 📚 Related Files

- `smmneo-client/app/hooks/useCategoryHierarchy.js` - Main hook
- `smmneo-client/app/components/DashboardOrderPanel.jsx` - Updated component
- `smmneo-server/routes/provider-proxy.js` - Backend proxy route

---

## ✅ Checklist for Implementation

- [x] Created `useCategoryHierarchy.js` hook
- [x] Updated `DashboardOrderPanel.jsx` component
- [x] Integrated Main Category button selection
- [x] Added Subcategory dropdown
- [x] Added Service dropdown
- [x] Maintained existing UI/CSS
- [x] Dynamic service details in right panel
- [x] Proper error handling
- [x] Loading states

---

## 🎯 Next Steps

1. **Test the flow** - Select main category → subcategory → service
2. **Verify data** - Check if services load from your API
3. **Customize subcategories** - Adjust `extractSubCategory()` if needed
4. **Add more features** - Search, favorites, filters, etc.

---

## 📞 Support

For issues or questions about the implementation:
1. Check the browser console for error messages
2. Verify API responses in Network tab
3. Review the `useCategoryHierarchy.js` hook documentation
4. Check service data structure matches expectations
