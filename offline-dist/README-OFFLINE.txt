SAMSUNG SERVICE CENTER - OFFLINE VERSION
=========================================

QUICK START (No Database Needed):
1. npm install
2. NEXT_PUBLIC_OFFLINE_MODE=true npm run dev
3. Open http://localhost:3000
4. Login: admin/admin123 (full) or user/user123 (limited)

OFFLINE FEATURES:
- Admin: Full access to all information
- User: Only create, view, dashboard
- All data in localStorage
- Works without internet after first load
- No DATABASE_URL required

For static export (no server):
- Set output: 'export' in next.config.ts
- NEXT_PUBLIC_OFFLINE_MODE=true npm run build
- npx serve out

See OFFLINE_README.md for details
