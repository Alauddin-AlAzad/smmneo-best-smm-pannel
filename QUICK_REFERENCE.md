# Quick Reference - Multi-Level Category Filtering

## 🎯 What Users See

### Step 1: Main Categories Appear
```
┌─────────────────────────────────────────────────┐
│ DashboardOrderPanel                             │
│                                                  │
│ 📁 Main Category                                │
│ ┌──────┬──────────┬─────────┬────────────────┐ │
│ │      │          │         │                │ │
│ │[Fbook]│[Insta]  │[YouTube]│[TikTok] ...   │ │
│ │ btn  │ btn     │ btn    │ btn              │ │
│ │      │          │         │                │ │
│ └──────┴──────────┴─────────┴────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Step 2: Click Facebook → Subcategories Dropdown Appears
```
┌─────────────────────────────────────────────────┐
│ DashboardOrderPanel                             │
│                                                  │
│ 📁 Main Category                                │
│ ┌──────────────────────────────────────────────┐│
│ │[Facebook]│[Insta] │[YouTube]│[TikTok] ...  ││ <- Highlighted
│ └──────────────────────────────────────────────┘│
│                                                  │
│ 🏷️ Subcategory                                 │
│ ┌──────────────────────────────────────────────┐│
│ │ -- Select Subcategory --                     ││
│ │ ▼ Likes                                      ││
│ │   Followers                                  ││
│ │   Comments                                   ││
│ │   Shares                                     ││
│ │   Page Likes                                 ││
│ │   ... more options                           ││
│ └──────────────────────────────────────────────┘│
│                                                  │
└─────────────────────────────────────────────────┘
```

### Step 3: Select Subcategory "Likes" → Services Dropdown Appears
```
┌─────────────────────────────────────────────────┐
│ DashboardOrderPanel                             │
│                                                  │
│ [Facebook] [Insta]... (main category selected) │
│                                                  │
│ Subcategory: [Likes ▼]  (subcategory selected) │
│                                                  │
│ ⚙️ Service                                      │
│ ┌──────────────────────────────────────────────┐│
│ │ -- Select Service --                         ││
│ │ ▼ 1001 ~ Facebook Likes ~ $5.50             ││
│ │   1002 ~ Likes Premium ~ $7.80              ││
│ │   1003 ~ Likes Fast ~ $6.20                 ││
│ │   1004 ~ Likes HQ ~ $9.99                   ││
│ │   ... more services                          ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ✅ Selected Service                             │
│ ┌──────────────────────────────────────────────┐│
│ │ [1001] – Facebook Likes ~ ≈ ৳302.25 per 1k ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Link: [_________________________]                │
│ Quantity: [1000]                               │
│ [Submit Order]                                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Step 4: Service Details Panel Updates
```
┌──────────────────────────────────────────────────────────┐
│ RIGHT PANEL - Service Details                            │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ [#1001]                                             │  │
│ │ 1001 ~ Facebook Likes ~ ≈ ৳302.25 per 1000         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                            │
│ Description:                                             │
│ Link: (user provided link)                              │
│ Start: 0-1 minute                                       │
│ Speed: 100-200 per day                                 │
│ Refill: Yes (refill enabled)                          │
│                                                            │
│ Important Notes:                                         │
│ • When service is high demand, speed may vary          │
│ • Avoid 2nd order until current completes             │
│ • Contact support for issues                          │
│ • Don't order private accounts                        │
│ • Cancellation available up to 90% completion         │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 📝 Code Examples

### Using the Hook
```javascript
import { useCategoryHierarchy } from '../hooks/useCategoryHierarchy.js';

function MyComponent() {
  const {
    mainCategories,           // ['Facebook', 'Instagram', 'YouTube', ...]
    subCategories,            // ['Likes', 'Followers', 'Comments', ...] or []
    filteredServices,         // [Service1, Service2, ...] or []
    selectedMainCategory,     // 'Facebook' or null
    selectedSubCategory,      // 'Likes' or null
    loading,                  // true or false
    handleSelectMainCategory,
    handleSelectSubCategory,
  } = useCategoryHierarchy();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Main Category Buttons */}
      {mainCategories.map(cat => (
        <button
          key={cat}
          onClick={() => handleSelectMainCategory(cat)}
          className={selectedMainCategory === cat ? 'active' : ''}
        >
          {cat}
        </button>
      ))}

      {/* Subcategory Dropdown */}
      {selectedMainCategory && (
        <select
          onChange={(e) => handleSelectSubCategory(e.target.value)}
          value={selectedSubCategory || ''}
        >
          <option>-- Select --</option>
          {subCategories.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      )}

      {/* Services List */}
      {selectedMainCategory && selectedSubCategory && (
        <ul>
          {filteredServices.map(service => (
            <li key={service.serviceId}>
              {service.serviceId} ~ {service.name} ~ ${service.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Component State
```javascript
// In DashboardOrderPanel
const {
  mainCategories,
  subCategories,
  filteredServices,
  selectedMainCategory,
  selectedSubCategory,
  loading,
  handleSelectMainCategory,
  handleSelectSubCategory,
} = useCategoryHierarchy();

const [selectedService, setSelectedService] = useState(null);
const [quantity, setQuantity] = useState("");
const [link, setLink] = useState("");
```

### JSX - Main Category Buttons
```jsx
<div>
  <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">
    📁 Main Category
  </label>
  {mainCategories.length > 0 ? (
    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
      {mainCategories.map((category) => (
        <button
          key={category}
          onClick={() => handleSelectMainCategory(category)}
          className={`px-3 py-2 rounded-md text-xs md:text-sm font-semibold transition text-center whitespace-nowrap overflow-hidden text-ellipsis ${
            selectedMainCategory === category
              ? "bg-violet-600 text-white border-2 border-violet-700"
              : "bg-slate-100 text-slate-700 border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  ) : (
    <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
      No categories available
    </div>
  )}
</div>
```

### JSX - Subcategory Dropdown
```jsx
{selectedMainCategory && (
  <div>
    <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">
      🏷️ Subcategory
    </label>
    {subCategories.length > 0 ? (
      <select
        value={selectedSubCategory || ""}
        onChange={(e) => handleSelectSubCategory(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      >
        <option value="">-- Select Subcategory --</option>
        {subCategories.map((subcat) => (
          <option key={subcat} value={subcat}>
            {subcat}
          </option>
        ))}
      </select>
    ) : (
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
        No subcategories available
      </div>
    )}
  </div>
)}
```

### JSX - Service Dropdown
```jsx
{selectedMainCategory && selectedSubCategory && (
  <div>
    <label className="mb-1 md:mb-1.5 block text-xs md:text-sm font-bold text-slate-800">
      ⚙️ Service
    </label>
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
            {service.serviceId} ~ {service.name} ~ ${service.price.toFixed(4)}
          </option>
        ))}
      </select>
    ) : (
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
        No services available
      </div>
    )}
  </div>
)}
```

---

## 🔄 Data Flow

```
┌──────────────────────────────┐
│  Backend API                 │
│  /api/provider/services      │
│                              │
│  [{                          │
│    service_id: 1001,         │
│    name: "Likes",            │
│    category: "Facebook",     │
│    rate: 5.50,               │
│    ...                       │
│  }, ...]                     │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│  useCategoryHierarchy Hook   │
│                              │
│  1. Fetch services           │
│  2. Normalize data           │
│  3. Build hierarchy          │
│  4. Extract categories       │
│  5. Extract subcategories    │
└──────────┬───────────────────┘
           │
           ↓
┌──────────────────────────────┐
│  State Variables             │
│                              │
│  mainCategories = [...]      │
│  allServices = [...]         │
│  selectedMainCategory = null │
│  selectedSubCategory = null  │
│  subCategories = []          │
│  filteredServices = []       │
└──────────┬───────────────────┘
           │
           ↓ (User selects Main Category)
           │
┌──────────────────────────────┐
│  State Updated               │
│                              │
│  selectedMainCategory =      │
│    "Facebook"                │
│  subCategories = [           │
│    "Likes", "Followers", ... │
│  ]                           │
└──────────┬───────────────────┘
           │
           ↓ (User selects Subcategory)
           │
┌──────────────────────────────┐
│  State Updated               │
│                              │
│  selectedSubCategory =       │
│    "Likes"                   │
│  filteredServices = [        │
│    Service1, Service2, ...   │
│  ]                           │
└──────────┬───────────────────┘
           │
           ↓ (User selects Service)
           │
┌──────────────────────────────┐
│  Component Updates           │
│                              │
│  selectedService =           │
│    Service1 (object)         │
│  Right panel displays        │
│  service details             │
└──────────────────────────────┘
```

---

## ✅ Features Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Dynamic Main Categories | ✅ | Fetched from API |
| Dynamic Subcategories | ✅ | Extracted from service names |
| Dynamic Services | ✅ | Filtered by category hierarchy |
| Service Selection | ✅ | Via dropdown menu |
| Service Details | ✅ | Auto-updates in right panel |
| Data Validation | ✅ | Handles missing/invalid data |
| Error Handling | ✅ | Shows error messages |
| Loading States | ✅ | Shows spinner while fetching |
| Responsive Design | ✅ | Mobile-friendly grid layout |
| CSS Preserved | ✅ | No breaking changes |

---

## 🚀 Getting Started

1. **Service loads** → Fetches all services from API
2. **Click main category** → Shows subcategories
3. **Select subcategory** → Shows services
4. **Pick a service** → Right panel updates
5. **Fill link + quantity** → Can submit order

---

## 📞 Common Issues & Solutions

### Problem: Categories don't appear
**Solution:** Check backend API is running and returning data
```bash
curl http://localhost:3000/api/provider/services?limit=10000
```

### Problem: Subcategories are wrong
**Solution:** Customize `extractSubCategory()` function in hook
```javascript
function extractSubCategory(serviceName, mainCategory) {
  // Your custom logic here
  if (serviceName.includes('Followers')) return 'Followers';
  if (serviceName.includes('Likes')) return 'Likes';
  return mainCategory;
}
```

### Problem: Services not showing
**Solution:** Check subcategory is selected and has matching services
```javascript
// In browser console
console.log({
  selectedMainCategory,
  selectedSubCategory,
  filteredServices,
});
```

---

**All implemented and ready to use! 🎉**
