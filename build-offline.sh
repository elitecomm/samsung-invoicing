#!/bin/bash
set -e

echo "🔨 Building OFFLINE VERSION..."

# Clean
rm -rf offline-dist samsung-invoicing-offline.zip
mkdir -p offline-dist

# Copy source files excluding node_modules and .next
echo "📦 Copying files..."
# Use cp and exclude via find
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.next/*" \
  -not -path "./.git/*" \
  -not -path "./offline-dist/*" \
  -not -name "*.log" \
  -not -name "samsung-invoicing-offline.zip" \
  -not -name "samsung-invoicing.zip" \
  -not -name "*.pdf" \
  | while read file; do
    dir=$(dirname "$file")
    mkdir -p "offline-dist/$dir"
    cp "$file" "offline-dist/$file" 2>/dev/null || true
  done

# Also copy directories structure
cp -r src offline-dist/ 2>/dev/null || true
cp package.json offline-dist/
cp next.config.ts offline-dist/
cp tsconfig.json offline-dist/
cp postcss.config.mjs offline-dist/
cp drizzle.config.json offline-dist/ 2>/dev/null || true
cp OFFLINE_README.md offline-dist/ 2>/dev/null || true

# Create offline env file
cat > offline-dist/.env.offline << 'EOL'
NEXT_PUBLIC_OFFLINE_MODE=true
# No DATABASE_URL needed for offline version
EOL

# Create offline README
cat > offline-dist/README-OFFLINE.txt << 'EOL'
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
EOL

# Create zip using python (since zip may not be available with rsync)
echo "📦 Creating zip..."
cd /home/user/samsung-invoicing
python3 -c "
import zipfile, os
zip_path = 'samsung-invoicing-offline.zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('offline-dist'):
        # Skip node_modules and .next
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', '.git']]
        for file in files:
            if file.endswith('.log') or file == 'samsung-invoicing-offline.zip':
                continue
            full_path = os.path.join(root, file)
            arcname = os.path.join('samsung-invoicing-offline', os.path.relpath(full_path, 'offline-dist'))
            z.write(full_path, arcname)
print('Zip created')
"
ls -lh samsung-invoicing-offline.zip
echo ""
echo "✅ Offline version ready: samsung-invoicing-offline.zip"
echo "To run offline:"
echo "  unzip samsung-invoicing-offline.zip"
echo "  cd samsung-invoicing-offline"
echo "  npm install"
echo "  NEXT_PUBLIC_OFFLINE_MODE=true npm run dev"
