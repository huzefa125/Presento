# InstitutionAdmin Component Structure

This directory contains the refactored InstitutionAdmin component, split into a professional modular structure.

## Folder Structure

```
InstitutionAdmin/
├── InstitutionAdmin.jsx          # Main component (orchestrator)
├── components/
│   ├── Sidebar.jsx               # Sidebar navigation component
│   ├── TopNav.jsx                # Top navigation bar component
│   └── modals/
│       ├── AddUserModal.jsx      # Add user modal
│       ├── PaymentModal.jsx      # Payment modal for additional users
│       ├── BulkImportModal.jsx   # Bulk import modal
│       ├── ReportsModal.jsx      # Reports generation modal
│       ├── ApiKeyModal.jsx       # API key creation modal
│       └── WebhookModal.jsx      # Webhook creation modal
├── hooks/
│   ├── useInstitutionAdmin.js    # Main authentication & stats hook
│   └── useInstitutionAdminData.js # Data management hook (users, presentations, etc.)
├── tabs/
│   ├── Dashboard.jsx             # Dashboard tab (implemented)
│   ├── Users.jsx                 # Users tab (placeholder - needs implementation)
│   ├── Presentations.jsx         # Presentations tab (placeholder - needs implementation)
│   ├── Analytics.jsx             # Analytics tab (placeholder - needs implementation)
│   ├── Subscription.jsx          # Subscription tab (placeholder - needs implementation)
│   ├── Branding.jsx              # Branding tab (placeholder - needs implementation)
│   ├── AuditLogs.jsx             # Audit Logs tab (placeholder - needs implementation)
│   ├── APIManagement.jsx         # API Management tab (placeholder - needs implementation)
│   ├── Settings.jsx              # Settings tab (placeholder - needs implementation)
│   ├── HelpCenter.jsx            # Help Center tab (placeholder - needs implementation)
│   └── index.js                  # Tab exports
└── README.md                     # This file
```

## Implementation Status

### ✅ Completed
- Main component structure
- Sidebar navigation
- Top navigation
- Modal components
- Custom hooks (useInstitutionAdmin, useInstitutionAdminData)
- Dashboard tab
- Route updated in App.jsx

### ⚠️ Needs Implementation
The following tab components are currently placeholders and need to be fully implemented by extracting code from the original `InstitutionAdmin.jsx` file:

1. **Users.jsx** - Extract from lines ~1458-1640
2. **Presentations.jsx** - Extract from lines ~1642-1786
3. **Analytics.jsx** - Extract from lines ~1788-1958
4. **Subscription.jsx** - Extract from lines ~1960-2207
5. **Branding.jsx** - Extract from lines ~2209-2298
6. **AuditLogs.jsx** - Extract from lines ~2300-2384
7. **APIManagement.jsx** - Extract from lines ~2616-2742
8. **Settings.jsx** - Extract from lines ~2386-2614
9. **HelpCenter.jsx** - Extract from lines ~2744-2793

## How to Complete Implementation

1. For each tab component, copy the relevant JSX from the original file
2. Extract the necessary props from the component signature
3. Ensure all imports are correct
4. Test each tab individually

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Components can be reused or tested independently
3. **Scalability**: Easy to add new tabs or features
4. **Readability**: Much easier to navigate and understand
5. **Performance**: Can implement code splitting per tab if needed

## Usage

The main component is imported in `App.jsx`:
```jsx
import InstitutionAdmin from './components/InstitutionAdmin/InstitutionAdmin';
```

The route remains the same:
```jsx
<Route path="/institution-admin" element={<InstitutionAdmin />} />
```

