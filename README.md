# Bếp Nhà Muội — Tea & Bakery

Static website for **Bếp Nhà Muội** (An Nhơn, Việt Nam). Deployable free on GitHub Pages.

**Live target:** https://a17255.github.io/bepnhamuoi/

## Stack

Pure static — HTML + CSS + vanilla JS. No build step, no framework, no backend.

```
Bakery_web/
├── index.html            # Homepage
├── products.html         # Full catalog
├── .nojekyll             # Tells GitHub Pages to skip Jekyll
├── css/style.css         # All styling
├── js/app.js             # Product rendering, filter, search, order links
├── data/products.json    # EDIT HERE to add/remove/update products
└── assets/products/      # Product images (SVG placeholders — replace with real photos)
```

## Deploy to GitHub Pages

1. **Create repo** `bepnhamuoi` on your GitHub account (a17255).
2. Push these files to the repo root on `main` branch:
   ```bash
   cd "C:\Phap_data_to_new_laptop\Phap_20220427\101_CLAUDE\Bakery_web"
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/a17255/bepnhamuoi.git
   git push -u origin main
   ```
3. On GitHub → repo **Settings → Pages** → Source: `Deploy from branch` → Branch: `main` → Folder: `/ (root)` → Save.
4. Wait ~1 minute. Site live at **https://a17255.github.io/bepnhamuoi/**

## How to add / remove / update a product

1. Open `data/products.json`.
2. Add a new entry to the `products` array:
   ```json
   {
     "id": "p09",
     "name": "Bánh Mì Que",
     "category": "banh-nuong",
     "price": 15000,
     "image": "assets/products/banh-mi-que.jpg",
     "desc": "Bánh mì que giòn tan, nhân pate đậm đà.",
     "featured": false
   }
   ```
3. To mark as a homepage highlight, set `"featured": true` (top 4 featured items appear on homepage).
4. Drop the image file into `assets/products/` (JPG/PNG/WebP all fine, or SVG for vector).
5. Commit & push — GitHub Pages auto-updates in ~1 minute.

**Delete a product:** remove the entry from `products.json` and (optionally) delete its image file.

## How to replace the placeholder images with real photos

1. Take or save photos of your bakery items (any standard format — JPG, PNG, WebP).
2. Rename them descriptively (e.g. `banh-kem-dau.jpg`).
3. Drop them into `assets/products/`.
4. In `data/products.json`, change the `"image"` field for each product to point at the new file:
   ```
   "image": "assets/products/banh-kem-dau.jpg"
   ```
5. For best performance: resize to max ~1200px wide, compress (e.g. [tinypng.com](https://tinypng.com)).

## How to change shop info

All shop-wide info lives in the `"shop"` block at the top of `data/products.json`:

```json
"shop": {
  "name": "Bếp Nhà Muội",
  "tagline": "Tea & Bakery — An Nhơn",
  "address": "356 Ngô Gia Tự, An Nhơn, Việt Nam",
  "phone": "0933340232",
  "phoneDisplay": "0933 340 232",
  "zalo": "0933340232",
  "facebookId": "100063909225074",
  "facebookUrl": "https://www.facebook.com/profile.php?id=100063909225074"
}
```

Changes here propagate automatically to every page (header CTA, footer, contact section, floating action buttons, order links).

## Features

- ✅ Responsive design (mobile / tablet / desktop)
- ✅ Homepage: hero, about, featured products, live Facebook feed, contact
- ✅ Full catalog page: category filter, search box
- ✅ Order via Zalo — each product's "Đặt Zalo" button opens Zalo with a pre-filled message
- ✅ Floating action buttons (Zalo / Facebook / Call) always visible
- ✅ Facebook Page plugin embed — shows latest posts from your FB page automatically

## Local preview

Just open `index.html` in a browser. For the `fetch(products.json)` call to work locally, you need to serve over HTTP (file:// blocks fetch in most browsers):

```bash
# Python 3 (usually pre-installed)
python -m http.server 8000
# Then visit http://localhost:8000
```

Or use VS Code "Live Server" extension (right-click `index.html` → "Open with Live Server").

## Later upgrades (not in MVP)

- [ ] Replace placeholder SVGs with real product photos
- [ ] Add site favicon & logo (drop in FB avatar)
- [ ] Custom domain (e.g. `bepnhamuoi.com`) — GitHub Pages supports CNAME
- [ ] Shopping cart + checkout form (if Zalo ordering becomes insufficient)
- [ ] English language toggle
- [ ] Google Analytics / Meta Pixel
- [ ] Blog / news section

---

Built with ❤ for Bếp Nhà Muội.
