# KRYTY (قِراءَتي) — Local Asset System & Pinterest Replacement Guide

Welcome to the **KRYTY** centralized visual asset system!

All visual assets in the application are referenced through a **single centralized registry** located at:
`src/lib/assets.ts`

---

## 📁 Directory Structure

```
public/assets/
├── images/
│   ├── hero/
│   │   └── hero-algeria-main.jpg (or .svg/.png)
│   ├── landmarks/
│   │   ├── hero-algiers-casbah.jpg
│   │   ├── hero-constantine.jpg
│   │   └── hero-djurdjura.jpg
│   ├── teachers/
│   │   ├── teacher-math-01.jpg
│   │   ├── teacher-physics-01.jpg
│   │   └── default-teacher-avatar.jpg
│   ├── students/
│   │   └── student-learning-01.jpg
│   ├── institutions/
│   │   └── institution-school-01.jpg
│   └── education/
│       ├── education-classroom-01.jpg
│       └── bac-prep-cover.jpg
│
└── videos/
    └── hero/
        └── hero-kryty-intro.mp4
```

---

## 📌 How to Replace Assets (Pinterest Workflow)

You do **NOT** need to edit any React or TypeScript components to swap visual assets.

### Option A: Direct File Replacement (Recommended)
1. Download your chosen image from Pinterest or local storage.
2. Save it inside the appropriate `public/assets/images/...` subfolder using the **exact same filename** (e.g. `public/assets/images/hero/hero-algeria-main.jpg`).
3. Refresh your browser — the entire application updates automatically.

### Option B: Registry Update (`src/lib/assets.ts`)
1. Add your new image file to `public/assets/images/...` under any new name.
2. Open `src/lib/assets.ts`.
3. Update the corresponding key path in `KRYTY_ASSETS`:
   ```typescript
   export const KRYTY_ASSETS = {
     hero: {
       mainImage: '/assets/images/hero/your-new-pinterest-image.jpg',
     },
   };
   ```

---

## 📐 Recommended Asset Specifications

| Asset File | Intended Location | Purpose | Recommended Aspect Ratio / Specs |
| :--- | :--- | :--- | :--- |
| `hero-algeria-main.jpg` | Homepage Hero | Primary Algerian educational hero banner | `16:9` or Wide Landscape (1920x1080) |
| `hero-kryty-intro.mp4` | Homepage Hero Video | Optional background intro video | `16:9` MP4, H.264, muted |
| `hero-algiers-casbah.jpg` | Landmark Showcase | Casbah / Algiers educational motif | `4:3` or `16:9` (1200x800) |
| `hero-constantine.jpg` | Landmark Showcase | Constantine bridges motif | `4:3` or `16:9` (1200x800) |
| `teacher-math-01.jpg` | Teacher Profiles | Professor profile card avatar | `1:1` Square or `4:5` Portrait (600x600) |
| `bac-prep-cover.jpg` | Product Marketplace | Digital book / BAC course cover | `3:4` Book Cover (600x800) |

---

## 🇩🇿 Brand Identity & Bilingual Support
* **English Product Name:** `KRYTY`
* **Arabic Product Name:** `قِراءَتي`
* **Languages Supported:** Arabic (العربية), French (Français), English (English).
