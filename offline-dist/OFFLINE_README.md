# Samsung Service Center - OFFLINE VERSION

This is the **fully offline version** of the Samsung Service Center Invoicing System.
It works **without any database, internet, or backend** - all data is stored in browser localStorage.

## Features (Offline)
- ✅ Admin Mode: Full access to all information
- ✅ User Mode: Only create, view, dashboard
- ✅ Login/Logout with role-based access
- ✅ All data stored in localStorage (invoices, customers, settings)
- ✅ Works without DATABASE_URL
- ✅ No internet required after first load
- ✅ PDF generation (server-side when using `npm run dev`, client print for static)

## Demo Credentials
- Admin: `admin / admin123` (full access)
- User: `user / user123` (create, view, dashboard only)

## How to Run Offline Version

### Option 1: Run with Node (Recommended - Full Features)
```bash
# No DATABASE_URL needed!
npm install
NEXT_PUBLIC_OFFLINE_MODE=true npm run dev
# or
NEXT_PUBLIC_OFFLINE_MODE=true npm run build
NEXT_PUBLIC_OFFLINE_MODE=true npm start
```
Open http://localhost:3000
Login page will show role selector.

### Option 2: Static Export (No Server Needed - Pure Offline)
```bash
# Build static version
NEXT_PUBLIC_OFFLINE_MODE=true npm run build
# The app will work with localStorage even without server
# For true static export, set in next.config.ts:
# output: 'export'
# Then:
# npx serve out
```

### Option 3: Direct Browser (Simplest)
1. Run `npm run dev` with `NEXT_PUBLIC_OFFLINE_MODE=true`
2. Open browser, login
3. The app auto-enables offline mode and saves flag `is_offline_version=true` in localStorage
4. Even if you close server, data remains in localStorage
5. For next time, it will use localStorage data

## Offline Storage Details
All data stored in localStorage keys:
- `offline_invoices` - All invoices
- `offline_customers` - Customers
- `offline_settings` - Settings
- `offline_next_invoice_id` - Auto-increment
- `auth_user` - Current user
- `is_offline_version` - Offline flag
- `offline_initialized` - Sample data flag

Sample data included:
- 1 sample invoice (EC260913001)
- 2 sample customers

## Export/Import Offline Data
In browser console:
```js
// Export
JSON.stringify(localStorage.getItem('offline_invoices'))

// Or use the built-in export in offlineStore
import { offlineStore } from '@/lib/offlineStore'
console.log(offlineStore.exportAllData())

// Import
offlineStore.importAllData({...})

// Clear
offlineStore.clearAllData()
```

## Differences from Online Version
| Feature | Online | Offline |
|---------|--------|---------|
| Database | PostgreSQL required | None, localStorage |
| Data Persistence | Server DB | Browser localStorage |
| Multi-device | Yes | No (per browser) |
| PDF | Server pdfkit | Browser print / mock |
| Setup | Needs DATABASE_URL | No setup |

## Building Offline Zip
```bash
./build-offline.sh
# Creates samsung-invoicing-offline.zip
```

## PWA Support
To make it installable offline PWA, add manifest.json and service worker (coming soon).

Enjoy offline invoicing! 🎉
