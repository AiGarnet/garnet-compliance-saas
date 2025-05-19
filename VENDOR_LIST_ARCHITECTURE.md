# Vendor Dashboard List UI Architecture

This document outlines the architecture of the refactored Vendor Dashboard List UI component, including its capabilities, component structure, and interactions.

## 🎯 Core Features

### 1. Sorting
- Implemented sorting on the "Name" column (A-Z, Z-A)
- Implemented sorting on "Status" based on logical flow: `Questionnaire Pending` → `In Review` → `Approved`
- Added visual indicators and ARIA attributes for accessibility

### 2. Filtering
- Added filter pills to filter vendors by status
- Implemented real-time filtering without page reload
- Ensured proper focus management and keyboard navigation

### 3. Searching
- Added case-insensitive fuzzy search by vendor name
- Included clear button to reset search
- Associated input with a label for screen readers

### 4. State Handling
- Implemented loading state with spinner
- Added empty state with custom messaging when no vendors are present
- Created error state with retry option for failed API requests

### 5. Responsive Design
- Implemented table view for desktop (≥768px)
- Created mobile card view with stacked layout for smaller screens (<768px)
- Ensured proper spacing and typography across all device sizes

### 6. Accessibility
- Added ARIA attributes for sortable columns (`aria-sort`)
- Used semantic HTML with proper roles
- Ensured keyboard navigation with visible focus states
- Added screen reader announcements with `aria-live` regions

## 🧩 Component Structure

### Main Components
- `VendorList`: The primary container component that manages state and renders the list
- `StatusBadge`: Displays the vendor status with appropriate color coding
- `SearchBar`: Reusable component for the search input
- `FilterPills`: Reusable component for status filtering

### Utility & Helper Files
- `utils.ts`: Contains utility functions for sorting, filtering, and searching

## 🔄 Data Flow

1. **Initial Data Loading**
   - Dashboard page fetches vendor data
   - Loading state is displayed during fetch
   - On success, data is passed to `VendorList`
   - On error, error state is displayed with retry option

2. **User Interactions**
   - **Sorting**: When column headers are clicked, sorting state is updated
   - **Filtering**: When filter pills are clicked, filter state is updated
   - **Searching**: As user types, search term state is updated
   - All state changes trigger re-render with filtered/sorted data

3. **Data Processing Pipeline**
   ```
   Input Vendors → Status Filter → Search Filter → Sort → Display
   ```

## 🛠️ Technical Implementation

### State Management
- Local React state using `useState` hooks
- Memoized data processing with `useMemo` for performance
- Controlled components for form elements

### Styling
- Tailwind CSS for utility-based styling
- Responsive breakpoints at 768px
- Consistent 8px spacing system
- WCAG AA contrast colors for all states

### Testing
- Unit tests for sorting, filtering, and searching functionality
- Component-level tests for all state renders (loading, error, empty)
- Accessibility tests for keyboard navigation

## 🚀 Future Enhancements

- Implement server-side pagination for large datasets
- Add virtualization with react-window for extremely large lists
- Implement advanced filtering options
- Add export functionality
- Enable multi-column sorting

## 📝 Usage Example

```jsx
// Basic usage
<VendorList vendors={vendorData} />

// With loading state
<VendorList vendors={[]} isLoading={true} />

// With error state
<VendorList 
  vendors={[]} 
  error="Failed to load vendors" 
  onRetry={fetchVendors} 
/>
``` 