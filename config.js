/**
 * @file config.js
 * @description Centralized runtime configuration for Folix - A FloppersBlop Product.
 *
 * This configuration object is exposed globally on `window.FOLIX_CONFIG`.
 * It provides site metadata, branding constants, vendor library file paths,
 * and rendering constraints used across both the viewer application (`index.html`)
 * and the informational pages (`about.html`, `faq.html`, etc.).
 *
 * Modifying values here updates UI headers, copyright notices, email links,
 * and PDF rendering limits without needing modifications to application logic.
 */

/**
 * @typedef {Object} FolixConfig
 * @property {string} name - Display name of the application.
 * @property {string} owner - Legal owner and product organization name.
 * @property {string} version - Semantic version identifier of the current release.
 * @property {string} email - Support and inquiry contact email address.
 * @property {string} year - Copyright year displayed in page footers.
 * @property {string} updated - Human-readable date of the last policy or content revision.
 * @property {string} workerSrc - Relative path to the Mozilla PDF.js web worker script.
 * @property {string} pdfLibSrc - Relative path to the pdf-lib bundle (loaded on-demand for PDF modifications).
 * @property {number} minScale - Minimum allowed zoom factor (0.25 = 25% scale).
 * @property {number} maxScale - Maximum allowed zoom factor (5.00 = 500% scale).
 * @property {number} maxDpr - Upper bound for window.devicePixelRatio when rasterizing canvas pages to cap GPU memory.
 */

/** @type {FolixConfig} */
window.FOLIX_CONFIG = {
  /** Display name of the application used in title bars and headers */
  name: 'Folix - A FloppersBlop Product',

  /** Parent brand / publisher organization */
  owner: 'FloppersBlop',

  /** Application semantic version */
  version: '1.3.0',

  /** Author and maintainer */
  author: 'Yash Arya',

  /** FloppersBlop brand and portfolio URLs */
  authorUrl: 'https://yash29xd.github.io/floppersblop/',
  portfolioUrl: 'https://yash29xd.github.io/floppersblop/',
  portfolioRepo: 'https://github.com/Yash29xd/floppersblop',
  githubUrl: 'https://github.com/Yash29xd/folix-modern',

  /** Contact email address used for bug reports and mailto links */
  email: '29aryash@gmail.com',

  /** Copyright publication year */
  year: '2026',

  /** Display date of the latest documentation / legal update */
  updated: '25 November 2026',

  /**
   * Path to the Mozilla PDF.js Web Worker script.
   * Offloads PDF parsing, glyph decoding, and stream decompression from the main UI thread.
   */
  workerSrc: 'lib/pdf.worker.min.js',

  /**
   * Path to the pdf-lib library bundle.
   * Loaded dynamically only when modifying, annotating, merging, or saving a PDF
   * to keep initial page load lightweight.
   */
  pdfLibSrc: 'lib/pdf-lib.min.js',

  /**
   * Path to the client-side PDF encryption engine.
   * Loaded dynamically when password protecting or encrypting documents.
   */
  pdfEncryptSrc: 'lib/pdf-encrypt.min.js',

  /**
   * Path to the Tesseract.js OCR library bundle.
   * Loaded dynamically only when running optical character recognition on scanned pages.
   */
  tesseractSrc: 'lib/tesseract.min.js',

  /**
   * Path to the Tesseract.js Web Worker script.
   */
  tesseractWorkerSrc: 'lib/tesseract-worker.min.js',

  /** Minimum zoom scale factor (25%) */
  minScale: 0.25,

  /** Maximum zoom scale factor (500%) */
  maxScale: 5,

  /**
   * Device Pixel Ratio (DPR) cap for canvas rasterization.
   * Clamped to 2 to prevent excessive GPU texture allocation on high-density mobile screens
   * while maintaining crisp typography and line art.
   */
  maxDpr: 2
};
