# Folix - A FloppersBlop Product

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-ES2022+-f7df1e.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25_Client--Side-brightgreen.svg)](#privacy--security-architecture)
[![OCR: On--Device Tesseract](https://img.shields.io/badge/OCR-On--Device_WASM-orange.svg)](#on-device-optical-character-recognition-ocr--searchable-pdf-export)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple.svg)](#progressive-web-app-pwa--os-integration)

> **A fast, lightweight, privacy-first, in-browser PDF reader, annotator, translator, and page editor.**  
> *Crafted by [Yash Arya](https://github.com/Yash29xd) &middot; A [FloppersBlop](https://yash29xd.github.io/floppersblop/) Project.*

[**Live Demo**](https://yash29xd.github.io/folix-modern/) &bull; [**FloppersBlop Portfolio**](https://yash29xd.github.io/floppersblop/) &bull; [**Report a Bug**](https://github.com/Yash29xd/folix-modern/issues)

---

## Table of Contents

1. [Introduction & Purpose](#1-introduction--purpose)
2. [What Folix Is and the Problem It Solves](#2-what-folix-is-and-the-problem-it-solves)
3. [Core Features Overview](#3-core-features-overview)
4. [Detailed Feature Deep-Dive](#4-detailed-feature-deep-dive)
   - [Virtual Scrolling & High-Efficiency Page Rendering](#virtual-scrolling--high-efficiency-page-rendering)
   - [On-Device Optical Character Recognition (OCR) & Searchable PDF Export](#on-device-optical-character-recognition-ocr--searchable-pdf-export)
   - [Vector Annotations & Drawing Studio](#vector-annotations--drawing-studio)
   - [Lossless PDF Flattening & Export (`pdf-lib`)](#lossless-pdf-flattening--export-pdf-lib)
   - [Interactive PDF Forms & Link Navigation](#interactive-pdf-forms--link-navigation)
   - [Spotlight Night Reading Mode](#spotlight-night-reading-mode)
   - [Full-Text Search with CSS Custom Highlight API](#full-text-search-with-css-custom-highlight-api)
   - [Text-to-Speech (TTS) Read Aloud Engine](#text-to-speech-tts-read-aloud-engine)
   - [Document Manipulation & Page Tools](#document-manipulation--page-tools)
   - [On-Device & Privacy-Conscious Translation](#on-device--privacy-conscious-translation)
   - [Adaptive Responsive Toolbar](#adaptive-responsive-toolbar)
   - [Progressive Web App (PWA) & OS Integration](#progressive-web-app-pwa--os-integration)
5. [Technology Stack](#5-technology-stack)
6. [Architecture & Project Structure](#6-architecture--project-structure)
7. [Installation & Getting Started](#7-installation--getting-started)
8. [Prerequisites & Dependencies](#8-prerequisites--dependencies)
9. [Development Environment Setup](#9-development-environment-setup)
10. [Commands & Scripts Reference](#10-commands--scripts-reference)
11. [Build & Production Deployment](#11-build--production-deployment)
12. [Usage Guide & Keyboard Shortcuts](#12-usage-guide--keyboard-shortcuts)
13. [Configuration & Customization (`config.js`)](#13-configuration--customization-configjs)
14. [Important Implementation Details](#14-important-implementation-details)
15. [About the Creator & FloppersBlop](#15-about-the-creator--floppersblop)
16. [Known Considerations](#16-known-considerations)
17. [Contribution Guidelines](#17-contribution-guidelines)
18. [Credits & License Information](#18-credits--license-information)

---

## 1. Introduction & Purpose

**Folix** is a standalone, client-side web application designed for viewing, annotating, manipulating, and translating PDF documents directly inside modern web browsers. Built from the ground up to operate without server dependencies, background tracking, or build-step overhead, Folix delivers the power of desktop PDF utilities inside a secure, sandboxed browser environment.

Folix embraces a **Neo-Brutalist / Maximalist** design aesthetic: stark high-contrast colors, bold structural typography, heavy borders, and tactile offset shadows, paired with an ultra-responsive, fluid layout optimized for both mobile devices and wide desktop monitors.

---

## 2. What Folix Is and the Problem It Solves

### The Problem with Modern PDF Viewers
1. **Privacy Concerns & Server Uploads**: Most free online PDF converters and editors require uploading confidential legal, financial, or medical documents to remote cloud servers where retention policies are opaque.
2. **Heavy Desktop Bloat**: Native PDF applications (e.g., Adobe Acrobat) often consume gigabytes of disk space, require paid subscriptions, run background telemetry daemons, and suffer from sluggish startup times.
3. **Browser Viewer Shortcomings**: Built-in browser PDF engines (Chromium PDFium, Safari PDF plugin) provide rudimentary viewing capabilities but lack robust annotation tools, multilingual translation, text-to-speech, page reorganization, and custom reading themes.

### The Folix Solution
Folix eliminates the trade-off between privacy, functionality, and performance:
- **100% Client-Side Processing**: Every byte of every document stays on your device. Files are read into browser memory via HTML5 File and Blob APIs and processed locally.
- **Zero Build Complexity**: Built entirely in pure vanilla JavaScript (ES2022+), semantic HTML5, and modern CSS3. No Node.js compilation, Webpack/Vite bundlers, or external package managers are needed to run or deploy it.
- **Complete Feature Suite**: Seamlessly combines lazy rendering, freehand vector inking, text highlighting, digital signatures, full-text search with context previews, page-level reordering/rotation/merging, TTS read-aloud, and on-device machine translation.
- **Offline First**: Through an integrated Service Worker and Web App Manifest, Folix installs as a progressive desktop/mobile app that opens in under a second even without an active internet connection.

---

## 3. Core Features Overview

| Feature Category | Capabilities |
| :--- | :--- |
| **Security & Privacy (v1.3)** | True client-side PDF redaction with irreversible vector and text eradication, on-device 128-bit password encryption with granular permissions (printing, copying, forms, assembly), and Document Properties inspector with one-click metadata & XMP stripping. |
| **Security & Privacy (v1.3)** | True client-side permanent redaction & sanitization (destroys underlying text tokens & font layers), 128-bit password encryption with granular permissions, and document properties inspector with one-click metadata stripping. |
| **Productivity & Views (v1.3)** | Fuzzy command palette (`Ctrl+K`), borderless presentation mode (`F5`) with glowing laser pointer cursor, area / snip OCR (crop-to-OCR), client-side PDF compression (100–200 DPI JPEG re-encoding), and annotations summary sidebar with Markdown (.md) export. |
| **Document Creation (v1.2)** | Create PDF from multi-image file pickers with visual page tools, or write formatted documents in full-window MS Word-style rich text studio (ribbon tabs, A4 pagination, tables, pictures, zoom, vector-crisp 2x PDF baking). |
| **Document Viewing** | Continuous vertical virtual scrolling, lazy canvas rendering, fit-to-width, fit-to-height, fit-to-content (smart margin trim), two-page spread, smooth pinch-to-zoom, and 90° page rotation. |
| **Optical Character Recognition (OCR)** | On-device Tesseract.js WebAssembly engine for scanned PDFs. Multilingual recognition (offline Italian & English bundled, plus Spanish, French, German, and more), searchable text extraction, invisible text layer injection, and searchable PDF export. |
| **Annotations Studio** | Pen (fine vector ink), Marker (semi-transparent highlighter), Text Highlight (selection-aware), Textbox (inline typography), Sticky Notes (collapsible badges), Digital Signatures (draw or cursive typing), and precision Eraser. |
| **Export & Persistence** | Lossless PDF export via `pdf-lib` embedding native vector paths and text, local annotation storage keyed to document cryptographic fingerprints, and system file sharing via the Web Share API. |
| **Document Navigation** | Real-time page thumbnails with lazy rendering, hierarchical document outline tree with collapsible nodes, and session restoration to the exact last-read page and zoom level. |
| **Interactive Elements** | Interactive AcroForm form filling (text fields, checkboxes, dropdowns), PDF internal bookmark jumping, and external hyperlink handling. |
| **Search & Discovery** | Full-text Unicode-normalized search (NFKD diacritic-insensitive), match counters, next/previous stepping, CSS Custom Highlight API painting, and dedicated "Find" sidebar tab with surrounding context snippets. |
| **Reading Modes** | Tri-theme system (Light, Sepia, Dark mode with canvas inversion), and Spotlight Night Reading mode (radial pointer-following illuminated circle with dimmed UI chrome). |
| **Speech & Audio** | Text-to-Speech (TTS) engine with automatic document language detection, sentence-boundary chunking, active sentence tracking highlights, reading speed control, and system voice selection. |
| **Page Manipulation** | Visual drag-and-drop page reordering, page rotation, deletion, page extraction, and merging pages from secondary PDF files into the active document. |
| **Translation Engine** | On-device machine translation via Chrome/Edge `window.Translator` AI API, fallback online translation via MyMemory API, live on-page translation overlays, and watermarked multi-page export to PDF, PNG (packaged in ZIP), or plain text (.txt). |
| **Platform & PWA** | Progressive Web App installability, native OS "Open with" file associations via File Handling API (`launchQueue`), and Android Share Target ingestion. |

---

## 4. Detailed Feature Deep-Dive

### Virtual Scrolling & High-Efficiency Page Rendering
Folix uses an asynchronous virtual rendering pipeline built on Mozilla's `pdf.js`:
- **Viewport Intersection Tracking**: An `IntersectionObserver` tracks which `.page` container elements are within the viewport margin (`700px 0px`). Only pages near the screen are scheduled for rasterization.
- **Strict Concurrency Capping**: Canvas rendering is serialized to at most **one** concurrent page render (`rActive < 1`). This eliminates UI thread starvation and ensures 60fps scrolling performance even on low-powered mobile chipsets.
- **Velocity-Aware Throttling**: The scroll listener tracks scroll velocity (`vel`). If rapid momentum scrolling is detected (`vel > 1800`), rendering is temporarily withheld until scrolling decelerates, preventing wasted CPU cycles on pages that fly past the screen.
- **Memory Eviction Budget**: To avoid mobile browser tab crashes from unbounded canvas memory, Folix tracks total allocated bitmap pixels. When canvas allocations exceed **70 Megapixels** (`KEEP_PX`) or **14 pages** (`KEEP_N`), rendered bitmaps furthest from the viewport are freed via `freePage()`.
- **Canvas Filter Baking**: For Dark and Sepia reading modes, CSS canvas filters (`invert`, `hue-rotate`, `sepia`) are baked directly into the 2D canvas pixel buffer in 600px vertical stripes using `ctx.drawImage()`. This allows the GPU to scroll static pre-filtered bitmaps without expensive real-time compositing shaders.

### On-Device Optical Character Recognition (OCR) & Searchable PDF Export
Scanned PDF documents often lack selectable text streams. Folix integrates a pure client-side WebAssembly build of **Tesseract.js** to transform scanned bitmaps into searchable text:
- **100% On-Device Web Worker Execution**: Recognition runs in a dedicated background Web Worker (`worker-bundle.js`), keeping the UI responsive. Scanned images are converted to grayscale and binarized in canvas buffers before running Tesseract.
- **Multilingual Support**: Bundled with offline-ready language models for Italian and English (`lib/ocr/lang/ita.js` and `eng.js`), with dynamic language selection for Spanish, French, German, Portuguese, Russian, Chinese, Japanese, and Arabic.
- **Searchable PDF Generation (`pdf-lib`)**: Users can download a **Searchable PDF** where recognized text words are embedded as an invisible text layer (`opacity: 0`) directly over the scanned page images at their precise physical bounding coordinates. The exported PDF can be searched (Ctrl+F) and text can be copied in Adobe Acrobat, Apple Preview, or any PDF viewer.
- **Interactive In-Viewer Search Injection**: Extracted OCR text can be injected directly into the live viewer's `.textLayer`, making previously unselectable scanned pages selectable, copyable, and searchable in real time.
- **OCR-to-Translation & Speech Integration**: Extracted text can be immediately transferred to the **Translate** tab with a single click, or read aloud using the built-in Text-to-Speech engine.

### Vector Annotations & Drawing Studio
- **Coordinate Space Inversion**: Annotations exist in native unrotated PDF coordinates. When drawing on a page rotated by 90°, 180°, or 270°, the coordinate mapper (`inv()` and `fwd()`) translates screen pointer coordinates into unrotated page dimensions.
- **Bezier Path Smoothing**: Raw pointer points are smoothed into clean SVG paths (`pathD()`) using quadratic Bezier curve midpoint averaging (`Q` commands).
- **Tool Palette**:
  - **Pen**: Solid vector ink path with customizable stroke weights (Thin 2px, Medium 4px, Thick 8px) and palette colors.
  - **Marker**: Broad, semi-transparent strokes (`fill-opacity: 0.35`) simulating felt-tip highlighters.
  - **Text Highlight**: Automatically converts arbitrary text selections into precise rectangular highlight regions aligned to font metrics.
  - **Text**: Creates inline editable text elements (`contentEditable`) styled in Helvetica.
  - **Note**: Collapsible yellow sticky note badges with multi-line message popouts.
  - **Sign**: Digital signature placement with interactive canvas dragging (`sgDrag()`).
  - **Eraser**: Click or tap any annotation to delete it from the vector display list.
- **Undo / Redo Stack**: Complete transactional history (`hist` and `redoS`) supporting undoing and redoing ink additions, text modifications, and deletions via keyboard (`Ctrl+Z` / `Ctrl+Y`) or toolbar buttons.

### Lossless PDF Flattening & Export (`pdf-lib`)
- **Lazy Library Loading**: The heavy PDF modification engine (`pdf-lib.min.js`, ~525KB) is **not** loaded during initial startup. It is fetched dynamically on demand only when the user clicks **Save PDF**, **Share**, or uses **Page Tools**.
- **Native PDF Point Mapping**: Screen coordinates are converted into 72 DPI PDF point coordinates using `viewport.convertToPdfPoint()`.
- **Content Stream Embedding**: Annotations are written directly into the PDF content stream:
  - Vector ink paths are converted to PDF SVG path operators.
  - Highlights are drawn as semi-transparent filled PDF rectangles.
  - Text and notes are embedded using native Helvetica standard font tables (`StandardFonts.Helvetica`).
  - Signatures are encoded as PNG image XObjects and placed with accurate aspect ratios.
- **Form Preservation**: Any interactive form data entered by the user is merged via `pdf.saveDocument()` before flattening.

### Interactive PDF Forms & Link Navigation
- **Form Fields (AcroForms)**: Interactive text fields, checkboxes, radio buttons, and select dropdowns are rendered into an `.annotationLayer` overlaid on the canvas. Values typed by the user persist during viewing and are saved into exported copies.
- **Internal Bookmarks & Destinations**: Links inside the PDF table of contents or cross-references resolve page indexes dynamically via `pdf.getDestination()` and scroll directly to target sections.
- **External Hyperlinks**: Clickable URLs open securely in new browser tabs with `rel="noopener noreferrer"`.

### Spotlight Night Reading Mode
- **Ambient Masking**: Darkens the reading viewport to deep black, cutting out a soft radial illuminated circle (`radial-gradient`) centered on the user's mouse cursor or touch point.
- **Dynamic Radius Adjustment**: Users can expand or shrink the spotlight circle using the `[` and `]` bracket keys or the floating controller bar.
- **Chrome Dimming**: The top header, toolbar, and sidebar automatically dim to 28% brightness when Spotlight is active, re-illuminating smoothly when hovered or focused.

### Full-Text Search with CSS Custom Highlight API
- **Unicode Diacritic Normalization**: Page text content is normalized using Unicode NFKD normalization (`fold()`), stripping combining diacritical marks. Searching `universita` successfully matches `università`.
- **Modern Highlight Painting**: Where supported (Chromium 105+, Safari 17.2+), Folix leverages the **CSS Custom Highlight API** (`CSS.highlights.set('fx-hit')` and `::highlight(fx-cur)`). This renders instantaneous, hardware-accelerated text highlights without polluting or breaking the underlying DOM text layer structure.
- **"Find" Sidebar Panel**: In addition to inline search navigation (`Ctrl+F`), the **Find** tab lists every search match across the document, displaying exact page numbers and 40-character contextual snippets.

### Text-to-Speech (TTS) Read Aloud Engine
- **Automatic Language Recognition**: When starting playback, Folix inspects the document text using a statistical stop-word frequency analyzer (`guessLang()`). It automatically matches Italian, English, Spanish, French, or German and selects a corresponding native speech synthesis voice.
- **Sentence-Boundary Segmentation**: Document text is split into distinct sentence chunks (`ttsSplit()`), capped at 240 characters to prevent Web Speech API engine timeouts.
- **Visual Sentence Following**: As each sentence is read, it is highlighted on screen (`::highlight(fx-say)`), and the document automatically turns pages when reaching the end of a sheet.

### Document Manipulation & Page Tools
The **Page Tools** modal (`E` shortcut) provides full multi-page visual document management:
- **Reordering**: Drag-and-drop page thumbnail cards to rearrange the document order.
- **Rotation**: Rotate individual pages in 90-degree increments.
- **Deletion & Restoration**: Mark unwanted pages for deletion with instant undo capability.
- **Page Extraction**: Select specific pages and download them as an independent PDF document.
- **Document Merging**: Click **Add pages from a PDF** to upload a secondary PDF; its pages appear as thumbnail cards that can be interleaved into the primary document.

### On-Device & Privacy-Conscious Translation
- **Layout Reconstruction**: Folix analyzes raw text coordinates from `pdf.js`, grouping individual text spans into lines and paragraphs (`pageBlocks()`) based on vertical baseline distance and horizontal proximity.
- **Dual-Engine Architecture**:
  1. **On-Device (Chrome / Edge Desktop)**: Uses the experimental browser-native `window.Translator` API. Translations execute entirely on the local device's neural models without transmitting text across the network.
  2. **Online Fallback (MyMemory API)**: When running on mobile browsers or unsupported desktop environments, Folix offers opt-in translation via the MyMemory translation service. Online requests are strictly gated behind explicit user consent (`#trono`).
- **Visual On-Page Overlay**: Toggle **Show translation on the pages** to view translated paragraphs positioned directly over the original text, complete with automatic font-size scaling.
- **Multi-Format Translation Export**:
  - **PDF**: Generates a clean, multi-page PDF document featuring translated text and a branded Folix header.
  - **PNG / ZIP**: Exports high-resolution image cards of translated pages. Multi-page translations are packaged into a standard `.zip` archive generated directly in browser memory using a pure JavaScript PKZIP/CRC32 compressor (`makeZip()`).
  - **Plain Text (.txt)**: Clean plain-text output organized by page numbers.

### Adaptive Responsive Toolbar
- **Dynamic DOM Overflow Detection**: The toolbar (`.bar`) monitors its own `scrollWidth` against `clientWidth`. When resized or viewed on narrow mobile screens, overflowing control groups (`ORDER: pin, pr, dl, share, g-tools, g-view, g-search, ann, g-zoom, sb, g-nav`) are cleanly migrated into a dropdown **MORE** sheet.
- **DOM Comment Placeholders**: Migrated elements leave invisible DOM comment markers (`<!-- -->`), enabling them to return to their exact original DOM positions when the viewport expands.
- **Auto-Hide Header**: Toggle the **PINNED / AUTO-HIDE** button to allow the top chrome to slide out of view during downward scrolling, maximizing available reading area on laptops and tablets.

### Progressive Web App (PWA) & OS Integration
- **Web App Manifest (`site.webmanifest`)**: Declares standalone window display, branded icons, and color schemes.
- **File Handling API (`launchQueue`)**: When installed as a desktop application on Windows, macOS, Linux, or ChromeOS, Folix registers as a system handler for `.pdf` files. Double-clicking a local PDF opens it directly inside the Folix standalone window.
- **Android Web Share Target**: Folix registers as a target for Android system share sheets. Sharing a PDF from WhatsApp, Google Drive, or local file managers directly launches Folix and displays the document.

---

## 5. Technology Stack

Folix is built with an uncompromising commitment to clean, native web standards:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FOLIX APPLICATION ARCHITECTURE                  │
└────────────────────────────────────────────────────────────────────────┘

 [ USER INTERFACE LAYER ]
 ├── Semantic HTML5 (App Shell, Modals, Forms, Navigation)
 ├── Modern CSS3 (Neo-Brutalism, Custom Properties, Responsive Grids)
 └── SVG Vector Graphic Sprites (35 Inline & Standalone Icons)

 [ RUNTIME ENGINE (app.js) ]
 ├── Document & Session Controller (State Machine, Event Routing)
 ├── Virtual Scroll & Rendering Pipeline (IntersectionObserver)
 ├── In-Memory Geometry & Transform Math (2D Affine Matrix, Bezier)
 ├── Translation & NLP Engine (Layout Segmentation, Language Guessing)
 ├── Speech Synthesis Controller (Web Speech API)
 └── ZIP Archiver (Pure JS PKZIP / CRC32 Binary Formatter)

 [ VENDOR CORE (lib/) ]
 ├── Mozilla PDF.js v3.x (Document Parsing, Web Worker Rasterization)
 └── pdf-lib v1.17.x (On-Demand Binary PDF Generation & Modification)

 [ BROWSER PERSISTENCE & OS INTEGRATION ]
 ├── Service Worker (CacheStorage, Offline Shell, Share Target Routing)
 ├── IndexedDB ("folix" DB: "recent" and "trans" Stores)
 ├── LocalStorage (Site Theme, Annotations, Reading Progress, Signatures)
 └── OS APIs (File Handling launchQueue, Web Share API, Clipboard API)
```

- **Frontend Core**: Vanilla JavaScript (ES2022+), Zero transpilation, Zero polyfills.
- **Rendering Engine**: Mozilla PDF.js (`lib/pdf.min.js`, `lib/pdf.worker.min.js`), Apache-2.0.
- **PDF Manipulation Engine**: `pdf-lib` (`lib/pdf-lib.min.js`), MIT License.
- **Typography**:
  - *Archivo Black* (Headings, Buttons, Badges) - SIL Open Font License 1.1.
  - *Space Mono* (Body text, UI labels, Code) - SIL Open Font License 1.1.
  - *Dancing Script* (Cursive Digital Signatures) - SIL Open Font License 1.1.
- **Offline & Storage**: W3C Service Worker API, Cache API, IndexedDB API, HTML5 LocalStorage.

---

## 6. Architecture & Project Structure

The project maintains an organized, flat structure designed to operate cleanly on static web hosts:

```
folix/
├── index.html                 # Main viewer application and PWA application shell
├── app.js                     # Central runtime logic, rendering engine, and UI controller
├── config.js                  # Central site settings, branding tokens, and zoom limits
├── styles.css                 # Master Neo-Brutalist stylesheet, themes, and animations
├── sw.js                      # Service Worker handling offline pre-caching and share routing
├── site.webmanifest           # PWA manifest declaring file associations and share targets
├── about.html                 # About Folix information page
├── faq.html                   # Frequently asked questions and usage tips
├── contact.html               # Feedback, support, and email contact page
├── privacy.html               # Privacy policy (100% on-device processing guarantee)
├── terms.html                 # Terms of use
├── disclaimer.html            # Legal disclaimer regarding PDF rendering and critical use
├── copyright.html             # Copyright notices for Folix, PDF.js, pdf-lib, and web fonts
├── assets/                    # Static image and font assets
│   ├── branding.png           # FloppersBlop parent brand graphic
│   ├── folix-lockup.png       # Primary Folix logo lockup (light theme)
│   ├── folix-lockup-dark.png  # Folix logo lockup (dark theme)
│   ├── icon.png               # High-resolution application master icon
│   ├── icon-192.png           # 192x192 PNG icon for mobile PWA home screens
│   ├── icon-512.png           # 512x512 PNG icon for splash screens
│   ├── icon-maskable-512.png  # 512x512 adaptive maskable icon for Android
│   ├── favicon-32.png         # Standard 32x32 browser tab favicon
│   ├── apple-touch-icon.png   # iOS home screen web clip icon
│   ├── filetype-*.png         # Windows / OS file association icons (32, 48, 64, 128, 256px)
│   ├── floppersblop-*.png     # Product pill branding badges
│   ├── fonts/                 # Self-hosted WOFF2 web fonts and licenses
│   │   ├── archivo-black-latin-400-normal.woff2
│   │   ├── space-mono-latin-400-normal.woff2
│   │   ├── space-mono-latin-700-normal.woff2
│   │   ├── dancing-script-latin-600-normal.woff2
│   │   ├── LICENSE-archivo-black.txt
│   │   ├── LICENSE-space-mono.txt
│   │   └── LICENSE-dancing-script.txt
│   └── icons/                 # 35 Clean SVG vector UI icons
│       ├── close.svg, contrast.svg, download.svg, eraser.svg, fit-height.svg, ...
└── lib/                       # Bundled third-party vendor libraries
    ├── pdf.min.js             # Mozilla PDF.js library bundle
    ├── pdf.worker.min.js      # Mozilla PDF.js off-thread rendering web worker
    ├── pdf-lib.min.js         # Andrew Dillon's pdf-lib document manipulation library
    ├── LICENSE-pdfjs.txt      # Apache-2.0 License
    └── LICENSE-pdf-lib.txt    # MIT License
```

---

## 7. Installation & Getting Started

Because Folix has **no compilation step and zero npm dependencies**, installation is as simple as downloading or cloning the repository and serving the files over HTTP.

### Option A: Direct Download / Local Use
1. Download or clone this repository to your local computer.
2. Launch any static local HTTP server (see [Development Environment Setup](#9-development-environment-setup)).
3. Navigate to `http://localhost:8000` in your web browser.

### Option B: Install as a Progressive Web App (PWA)
1. Open Folix in a supported browser (Chrome, Edge, Brave, Safari).
2. On desktop: Click the **Install app** button on the home screen, or click the install icon in the browser address bar.
3. On iOS: Tap the **Share** button in Safari and choose **Add to Home Screen**.
4. Folix will open in its own standalone window without browser address bars or navigation buttons.

---

## 8. Prerequisites & Dependencies

### Runtime Prerequisites
- Any modern web browser supporting ES2020+, Canvas 2D, and Web Workers:
  - **Google Chrome** / **Microsoft Edge** / **Chromium**: Version 105+ (full feature support including on-device AI translation, File Handling API, and CSS Custom Highlight API).
  - **Mozilla Firefox**: Version 110+.
  - **Apple Safari**: Version 16.4+ (macOS and iOS).

### External Dependencies
Folix bundles **100% of its runtime dependencies** inside the `lib/` and `assets/fonts/` directories.
- **Zero CDN Requests**: No Google Fonts, external CDNs, or third-party trackers are contacted.
- **Zero Package Manager Requirements**: No `npm`, `yarn`, or `pnpm` installations are needed.

---

## 9. Development Environment Setup

Because Folix registers a Service Worker and utilizes Web Workers, the application should be served over an HTTP/HTTPS protocol (the `file://` protocol restricts Service Worker registration and Web Worker cross-origin messaging).

### Quick-Start with Python (Pre-installed on macOS/Linux/Windows)
```bash
# Navigate to the project directory
cd folix

# Launch Python's built-in HTTP server
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

### Quick-Start with Node.js
If you have Node.js installed, you can use any zero-config static server:
```bash
# Using npx serve
npx serve folix

# Or using http-server
npx http-server folix -p 8000
```

---

## 10. Commands & Scripts Reference

Since Folix is a native vanilla web project, testing and syntax validation can be performed using native tools:

| Command | Purpose |
| :--- | :--- |
| `python -m http.server 8000` | Starts a lightweight local development web server on port 8000. |
| `node --check app.js` | Runs the Node.js syntax analyzer on `app.js` to ensure zero syntax errors. |
| `node --check config.js` | Validates syntax of the configuration file. |
| `node --check sw.js` | Validates syntax of the Service Worker script. |
| `npx serve .` | Alternative zero-configuration static file server using Node.js. |

---

## 11. Build & Production Deployment

Folix requires **no build step**. Deploying to production simply involves copying the files to any web host supporting HTTPS.

### Deploying to GitHub Pages
1. Push the repository to GitHub.
2. In your repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Select the `main` branch and specify the `/ (root)` folder (or the subfolder containing `index.html`).
5. Click **Save**. GitHub Pages will provision an HTTPS URL within minutes.

### Deploying to Netlify, Vercel, or Cloudflare Pages
- **Build Command**: *(Leave empty)*
- **Publish Directory**: `.` (or `folix` if deploying from a parent repository)
- HTTPS is automatically configured, enabling full Service Worker offline caching.

---

## 12. Usage Guide & Keyboard Shortcuts

### Working with Documents
- **Opening a File**: Click **OPEN** in the toolbar, press the keyboard shortcut, drag and drop a PDF anywhere onto the window, or use the URL parameter `?file=https://example.com/doc.pdf`.
- **Navigating Pages**: Use the Previous/Next buttons, type a page number in the page input, scroll continuously with mouse/trackpad, or click thumbnails in the Pages sidebar tab.
- **Annotating**: Click **NOTES** in the top bar to open the annotation tray. Select the Pen, Marker, Highlight, Text, Note, or Sign tool. Choose stroke colors and widths. Click **SAVE PDF** to download a permanent copy containing your annotations.
- **Reordering & Editing Pages**: Click the **Page Tools** icon (`E`). Drag thumbnails to reorder pages, rotate pages with the rotate button, mark pages for deletion, or click **Add pages from a PDF** to combine multiple documents. Click **Apply to this document** or **Save a copy**.

### Complete Keyboard Shortcuts Reference

Press `?` at any time while viewing a document to display the shortcuts dialog:

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / Next Page | Step through document pages. |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / Last Page | Jump directly to page 1 or the final page. |
| <kbd>Ctrl</kbd> + <kbd>F</kbd> | Search | Focuses search input and highlights matches. |
| <kbd>Ctrl</kbd> + <kbd>+</kbd> / <kbd>−</kbd> | Zoom In / Out | Increase or decrease rendering scale by 20%. |
| <kbd>W</kbd> | Fit Width | Scales document to match window width. |
| <kbd>H</kbd> | Fit Height | Scales document to match visible window height. |
| <kbd>C</kbd> | Fit Content | Smart-crops margins to focus on content. |
| <kbd>R</kbd> | Rotate | Rotates the document clockwise by 90°. |
| <kbd>T</kbd> | Change Theme | Cycles through Light, Sepia, and Dark color schemes. |
| <kbd>2</kbd> | Two-Page Spread | Toggles two-page side-by-side reading layout. |
| <kbd>S</kbd> | Sidebar | Toggles the Pages / Outline / Search sidebar. |
| <kbd>A</kbd> | Annotations | Opens or closes the drawing and annotation tool tray. |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo | Reverts the last drawing or annotation change. |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo | Re-applies the last reverted annotation change. |
| <kbd>V</kbd> | Read Aloud | Starts or stops Text-to-Speech audio reading. |
| <kbd>X</kbd> | Translate | Opens the translation sidebar tab. |
| <kbd>E</kbd> | Page Tools | Opens the drag-and-drop page editor dialog. |
| <kbd>L</kbd> | Spotlight Mode | Toggles dark spotlight night reading focus. |
| <kbd>[</kbd> / <kbd>]</kbd> | Spotlight Size | Decreases or increases spotlight circle diameter. |
| <kbd>G</kbd> | Go to Page | Focuses the page number input field. |
| <kbd>Esc</kbd> | Close / Dismiss | Closes open dialogs, toolbars, or popup sheets. |
| <kbd>?</kbd> | Help | Opens the keyboard shortcuts cheat sheet. |

---

## 13. Configuration & Customization (`config.js`)

All site-wide metadata, owner information, and rendering limits are isolated inside `config.js`. You do not need to touch `app.js` or HTML files to rebrand or customize the application.

```javascript
window.FOLIX_CONFIG = {
  /** Application display name shown in page headers and titles */
  name: 'Folix - A FloppersBlop Product',

  /** Legal publisher or parent brand name */
  owner: 'FloppersBlop',

  /** Semantic version string */
  version: '0.1.0',

  /** Contact email address used in mailto: links and support forms */
  email: '29aryash@gmail.com',

  /** Copyright publication year */
  year: '2026',

  /** Last content/policy revision date string */
  updated: '5 November 2026',

  /** Path to Mozilla PDF.js web worker script */
  workerSrc: 'lib/pdf.worker.min.js',

  /** Path to pdf-lib bundle (loaded dynamically on save) */
  pdfLibSrc: 'lib/pdf-lib.min.js',

  /** Minimum permitted zoom factor (0.25 = 25%) */
  minScale: 0.25,

  /** Maximum permitted zoom factor (5.0 = 500%) */
  maxScale: 5,

  /** Canvas Device Pixel Ratio (DPR) cap to protect GPU memory */
  maxDpr: 2
};
```

---

## 14. Important Implementation Details

### 1. Document Fingerprint Hashing
Folix uses Mozilla PDF.js internal document fingerprints (`pdf.fingerprints[0]`) rather than file names to store annotations, last-read page numbers, and translation caches. If you rename a file on your disk (e.g. `document.pdf` to `document_copy.pdf`), Folix still recognizes the document and restores your notes and bookmarks seamlessly.

### 2. Italian-Aware Natural Language Heuristics
Folix includes dedicated NLP optimizations for Italian texts:
- **Stop-word scoring** (`guessLang()`): Evaluates relative word frequencies across Italian, English, Spanish, French, and German.
- **Apostrophe Elision Handling**: Accurately strips and indexes Italian contractions (`l'`, `dell'`, `nell'`, `all'`, `dall'`, `sull'`, `quell'`) so that clicking **Dictionary** looks up the root lemma rather than the attached article.
- **Dictionary Integration**: Words selected in Italian documents offer direct one-click lookup on *WordReference (Italian-to-English)*.

### 3. Pure-JavaScript In-Memory ZIP Generation (`makeZip()`)
When exporting multi-page translations as PNGs, Folix bundles the images into a single standard `.zip` file without loading heavy compression libraries. It implements the standard PKZIP binary structure (`0x04034b50` local headers, `0x02014b50` central directory records, and `0x06054b50` end of central directory) along with a native table-driven CRC32 calculation (`crc32()`).

---

## 15. About the Creator & FloppersBlop

**Folix** is created and maintained by **Yash Arya** as an open-source initiative of **FloppersBlop**.

> *"A one-person creative technology project. Ideas that flop, get fixed, and sometimes ship."*

- **Creator:** Yash Arya ([@Yash29xd](https://github.com/Yash29xd))
- **Live Portfolio:** [yash29xd.github.io/floppersblop](https://yash29xd.github.io/floppersblop/)
- **Portfolio Source:** [github.com/Yash29xd/floppersblop](https://github.com/Yash29xd/floppersblop)
- **LinkedIn:** [linkedin.com/in/yash29xd](https://www.linkedin.com/in/yash29xd/)
- **Contact Email:** [29aryash@gmail.com](mailto:29aryash@gmail.com)

---

## 16. Known Considerations

- **Password-Protected PDFs**: Encrypted PDFs can be unlocked and viewed smoothly. However, generating flattened copies with new annotations or modifying pages in encrypted files is disabled because third-party decryption keys cannot be re-applied to new PDF output streams without the master owner certificate.
- **MyMemory Online Translation Quotas**: The fallback online translator (MyMemory) enforces a free daily IP quota (~50,000 characters). For unlimited translation of long documents, Chromium-based browsers with the on-device `window.Translator` AI engine are recommended.

---

## 17. Contribution Guidelines

Contributions that enhance documentation, improve accessibility, or refine performance without altering core architecture are welcome.

1. **Strict Preservation of Client-Side Principles**: No server-side dependencies or telemetry may be introduced.
2. **Zero Build Step**: All scripts must remain native ES2022+ executable directly by browsers without transpilation.
3. **Verify Integrity**: Always verify syntax before submitting changes:
   ```bash
   node --check app.js
   node --check config.js
   node --check sw.js
   ```
4. **Follow Formatting & Code Style**: Maintain existing naming conventions, JSDoc comment structures, and CSS design tokens.

---

## 18. Credits & License Information

### License
Folix is licensed under the **[MIT License](LICENSE)** &copy; 2026 **Yash Arya** ([FloppersBlop](https://yash29xd.github.io/floppersblop/)).

### Third-Party Open Source Software
- **Mozilla PDF.js**: Copyright &copy; Mozilla and contributors. Licensed under the [Apache License, Version 2.0](lib/LICENSE-pdfjs.txt).
- **pdf-lib**: Copyright &copy; 2019 Andrew Dillon. Licensed under the [MIT License](lib/LICENSE-pdf-lib.txt).
- **Tesseract.js & Tesseract OCR**: Copyright &copy; Jerome Wu, Naptha, and Google Inc. Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- **Archivo Black**: Copyright &copy; 2012 The Archivo Black Project Authors. Licensed under the [SIL Open Font License, Version 1.1](assets/fonts/LICENSE-archivo-black.txt).
- **Space Mono**: Copyright &copy; 2016 Google Inc. Licensed under the [SIL Open Font License, Version 1.1](assets/fonts/LICENSE-space-mono.txt).
- **Dancing Script**: Copyright &copy; 2011 The Dancing Script Project Authors. Licensed under the [SIL Open Font License, Version 1.1](assets/fonts/LICENSE-dancing-script.txt).
