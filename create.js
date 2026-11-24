/**
 * @file create.js
 * @description Dedicated Creator Module for Folix - A FloppersBlop Product v1.2.
 *
 * Capabilities:
 * 1. Create PDF Chooser Dialog (From Images vs From Text)
 * 2. Multi-image to PDF Compilation Studio (using Page Tools & pdf-lib)
 * 3. MS Word-Style Document Studio (A4 pages, Ribbon tabs, rich text formatting,
 *    tables, images, zoom, stats, high-fidelity PDF export, direct viewer integration)
 */

(function(){
  'use strict';

  const $ = id => document.getElementById(id);

  function getFolix(){
    return window.Folix || {
      $: id => document.getElementById(id),
      modal: dlg => { if(dlg && typeof dlg.showModal === 'function') dlg.showModal(); },
      msg: txt => console.log('[Folix]', txt),
      downloadAny: (data, name, mime) => {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      },
      openData: async () => {},
      ensurePdfLib: async () => {
        if(window.PDFLib) return window.PDFLib;
        return new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'lib/pdf-lib.min.js';
          s.onload = () => res(window.PDFLib);
          s.onerror = rej;
          document.head.appendChild(s);
        });
      },
      ptOpenFromImages: () => {}
    };
  }

  // ============================================================================
  // 1. CREATE PDF CHOOSER DIALOG
  // ============================================================================

  function openDialog(){
    const dlg = $('created');
    if(!dlg) return;
    const f = getFolix();
    f.modal(dlg);
  }

  function closeDialog(){
    const dlg = $('created');
    if(dlg && dlg.open) dlg.close();
  }

  // ============================================================================
  // 2. MS WORD-STYLE DOCUMENT STUDIO
  // ============================================================================

  let wordZoom = 1.0;

  function openWordStudio(){
    const modalEl = $('word-modal');
    if(!modalEl) return;
    closeDialog();
    const f = getFolix();
    f.modal(modalEl);
    updatePageNumbers();
    updateWordStats();
    const first = modalEl.querySelector('.word-page-content');
    if(first) first.focus();
  }

  function closeWordStudio(){
    const modalEl = $('word-modal');
    if(modalEl && modalEl.open) modalEl.close();
  }

  function updatePageNumbers(){
    const container = $('word-pages-container');
    if(!container) return;
    const pages = container.querySelectorAll('.word-page');
    const total = pages.length;
    pages.forEach((pg, idx) => {
      pg.dataset.page = String(idx + 1);
      const hdr = pg.querySelector('.word-header-page');
      if(hdr) hdr.textContent = `Page ${idx + 1}`;
      const ftr = pg.querySelector('.word-page-num');
      if(ftr) ftr.textContent = String(idx + 1);
    });
    if($('word-stat-pages')) $('word-stat-pages').textContent = `Page 1 of ${total}`;
  }

  function updateWordStats(){
    const container = $('word-pages-container');
    if(!container) return;
    let fullText = '';
    container.querySelectorAll('.word-page-content').forEach(c => {
      fullText += ' ' + (c.innerText || c.textContent || '');
    });
    const words = fullText.trim().split(/\s+/).filter(Boolean).length;
    const chars = fullText.replace(/\s/g, '').length;
    if($('word-stat-words')) $('word-stat-words').textContent = `${words} word${words === 1 ? '' : 's'}`;
    if($('word-stat-chars')) $('word-stat-chars').textContent = `${chars} character${chars === 1 ? '' : 's'}`;
  }

  function addWordPage(){
    const container = $('word-pages-container');
    if(!container) return;
    const curPages = container.querySelectorAll('.word-page');
    const newIdx = curPages.length + 1;
    const isLand = $('word-layout-orient')?.value === 'landscape';
    const docTitle = ($('word-doc-title')?.value || '').trim() || 'Document 1';

    const newPage = document.createElement('div');
    newPage.className = 'word-page' + (isLand ? ' landscape' : '');
    newPage.dataset.page = String(newIdx);
    newPage.innerHTML = `
      <div class="word-page-header">
        <span class="word-header-doc">${docTitle}</span>
        <span class="word-header-page">Page ${newIdx}</span>
      </div>
      <div class="word-page-content" contenteditable="true" spellcheck="true" placeholder="Continue typing on page ${newIdx}...">
        <p><br></p>
      </div>
      <div class="word-page-footer">
        <span>Folix - A FloppersBlop Product</span>
        <span class="word-page-num">${newIdx}</span>
      </div>
    `;
    container.appendChild(newPage);
    updatePageNumbers();
    updateWordStats();
    const pc = newPage.querySelector('.word-page-content');
    if(pc) pc.focus();
    newPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteWordPage(){
    const container = $('word-pages-container');
    if(!container) return;
    const curPages = container.querySelectorAll('.word-page');
    const f = getFolix();
    if(curPages.length <= 1) {
      f.msg('Cannot delete the only page');
      return;
    }
    curPages[curPages.length - 1].remove();
    updatePageNumbers();
    updateWordStats();
  }

  async function renderWordPageToCanvas(pageEl, isLandscape = false){
    const contentEl = pageEl.querySelector('.word-page-content');
    const headerEl = pageEl.querySelector('.word-page-header');
    const footerEl = pageEl.querySelector('.word-page-footer');

    const targetW = isLandscape ? 1123 : 794;
    const targetH = isLandscape ? 794 : 1123;
    const scale = 2; // 2x DPR for crisp vector-like rasterization

    const cv = document.createElement('canvas');
    cv.width = targetW * scale;
    cv.height = targetH * scale;
    const ctx = cv.getContext('2d', { alpha: false });
    ctx.scale(scale, scale);

    // White A4 sheet background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    const pageRect = pageEl.getBoundingClientRect();
    const scaleRatioX = targetW / Math.max(1, pageRect.width);
    const scaleRatioY = targetH / Math.max(1, pageRect.height);

    // Draw Header
    if(headerEl){
      const hRect = headerEl.getBoundingClientRect();
      const hy = (hRect.top - pageRect.top) * scaleRatioY;
      const hx1 = (hRect.left - pageRect.left) * scaleRatioX;
      const hx2 = (hRect.right - pageRect.left) * scaleRatioX;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.textBaseline = 'top';
      const leftText = headerEl.querySelector('.word-header-doc')?.textContent || '';
      const rightText = headerEl.querySelector('.word-header-page')?.textContent || '';
      ctx.textAlign = 'left';
      ctx.fillText(leftText, hx1, hy);
      ctx.textAlign = 'right';
      ctx.fillText(rightText, hx2, hy);
    }

    // Draw Footer
    if(footerEl){
      const fRect = footerEl.getBoundingClientRect();
      const fy = (fRect.top - pageRect.top) * scaleRatioY;
      const fx1 = (fRect.left - pageRect.left) * scaleRatioX;
      const fx2 = (fRect.right - pageRect.left) * scaleRatioX;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#888888';
      ctx.textBaseline = 'top';
      const leftText = footerEl.firstElementChild?.textContent || 'Folix - A FloppersBlop Product';
      const rightText = footerEl.querySelector('.word-page-num')?.textContent || '';
      ctx.textAlign = 'left';
      ctx.fillText(leftText, fx1, fy);
      ctx.textAlign = 'right';
      ctx.fillText(rightText, fx2, fy);
    }

    // Recursive layout painter for content
    function paintNode(node){
      if(node.nodeType === Node.ELEMENT_NODE){
        const style = window.getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const x = (rect.left - pageRect.left) * scaleRatioX;
        const y = (rect.top - pageRect.top) * scaleRatioY;
        const w = rect.width * scaleRatioX;
        const h = rect.height * scaleRatioY;

        const bg = style.backgroundColor;
        if(bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && node !== pageEl && node !== contentEl){
          ctx.fillStyle = bg;
          ctx.fillRect(x, y, w, h);
        }

        if(node.tagName === 'TH' || node.tagName === 'TD' || node.tagName === 'TABLE'){
          ctx.strokeStyle = style.borderColor || '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, w, h);
        } else if(node.tagName === 'BLOCKQUOTE'){
          ctx.fillStyle = '#e8600a';
          ctx.fillRect(x, y, 4 * scaleRatioX, h);
        }

        if(node.tagName === 'HR'){
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, y + h / 2);
          ctx.lineTo(x + w, y + h / 2);
          ctx.stroke();
        }

        if(node.tagName === 'IMG' && node.complete && node.naturalWidth){
          try { ctx.drawImage(node, x, y, w, h); } catch(e){}
        }

        if(node.tagName === 'LI'){
          const parentList = node.parentElement;
          ctx.fillStyle = style.color || '#1a1a2e';
          if(parentList && parentList.tagName === 'OL'){
            const idx = Array.from(parentList.children).indexOf(node) + 1;
            ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillText(`${idx}.`, x - 8, y);
          } else {
            ctx.beginPath();
            ctx.arc(x - 12, y + 8, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for(let child of node.childNodes){
          paintNode(child);
        }
      } else if(node.nodeType === Node.TEXT_NODE){
        const text = node.textContent;
        if(!text || !text.trim()) return;

        const parent = node.parentElement;
        if(!parent) return;
        const style = window.getComputedStyle(parent);
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        ctx.fillStyle = style.color || '#1a1a2e';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const range = document.createRange();
        const words = text.split(/(\s+)/);
        let curOffset = 0;

        for(let segment of words){
          if(!segment) continue;
          const segLen = segment.length;
          if(segment.trim().length > 0){
            range.setStart(node, curOffset);
            range.setEnd(node, curOffset + segLen);
            const r = range.getBoundingClientRect();
            const rx = (r.left - pageRect.left) * scaleRatioX;
            const ry = (r.top - pageRect.top) * scaleRatioY;
            const rw = r.width * scaleRatioX;
            const rh = r.height * scaleRatioY;

            const bg = style.backgroundColor;
            if(bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && parent !== pageEl && parent !== contentEl){
              ctx.fillStyle = bg;
              ctx.fillRect(rx, ry, rw, rh);
              ctx.fillStyle = style.color || '#1a1a2e';
            }

            ctx.fillText(segment, rx, ry);

            const td = style.textDecorationLine || style.textDecoration;
            if(td && td.includes('underline')){
              ctx.strokeStyle = style.color || '#1a1a2e';
              ctx.lineWidth = Math.max(1, parseFloat(style.fontSize) / 14);
              ctx.beginPath();
              ctx.moveTo(rx, ry + rh - 2);
              ctx.lineTo(rx + rw, ry + rh - 2);
              ctx.stroke();
            }
            if(td && (td.includes('line-through') || td.includes('strike'))){
              ctx.strokeStyle = style.color || '#1a1a2e';
              ctx.lineWidth = Math.max(1, parseFloat(style.fontSize) / 14);
              ctx.beginPath();
              ctx.moveTo(rx, ry + rh / 2);
              ctx.lineTo(rx + rw, ry + rh / 2);
              ctx.stroke();
            }
          }
          curOffset += segLen;
        }
      }
    }

    paintNode(contentEl);
    return cv;
  }

  async function exportWordToPdf(openInViewer = false){
    const modalEl = $('word-modal');
    if(!modalEl) return;
    const pages = Array.from(modalEl.querySelectorAll('.word-page'));
    const f = getFolix();
    if(!pages.length) return f.msg('Document has no pages');

    const titleInput = $('word-doc-title');
    const docTitle = (titleInput && titleInput.value.trim()) || 'Document 1';
    const isLandscape = $('word-layout-orient')?.value === 'landscape';

    f.msg('Preparing PDF document…');
    const expBtn = $('word-btn-export');
    const openBtn = $('word-btn-open-viewer');
    if(expBtn) expBtn.disabled = true;
    if(openBtn) openBtn.disabled = true;

    try {
      await f.ensurePdfLib();
      const { PDFDocument } = window.PDFLib;
      const doc = await PDFDocument.create();
      doc.setTitle(docTitle);
      doc.setCreator('Folix - A FloppersBlop Product');
      doc.setProducer('Folix - A FloppersBlop Product');

      const pageWidth = isLandscape ? 841.89 : 595.28;
      const pageHeight = isLandscape ? 595.28 : 841.89;

      for(let i = 0; i < pages.length; i++){
        const pageEl = pages[i];
        const cv = await renderWordPageToCanvas(pageEl, isLandscape);
        const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const embedded = await doc.embedPng(bytes);

        const pg = doc.addPage([pageWidth, pageHeight]);
        pg.drawImage(embedded, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
      }

      const pdfBytes = await doc.save();
      if(openInViewer){
        modalEl.close();
        if(typeof f.openData === 'function'){
          await f.openData(new Uint8Array(pdfBytes), docTitle + '.pdf');
          f.msg('Document compiled and opened in Folix viewer!');
        } else {
          f.downloadAny(pdfBytes, docTitle + '.pdf', 'application/pdf');
          f.msg('PDF document downloaded successfully!');
        }
      } else {
        f.downloadAny(pdfBytes, docTitle + '.pdf', 'application/pdf');
        f.msg('PDF document downloaded successfully!');
      }
    } catch(err){
      console.error('Word export error:', err);
      f.msg('Could not export PDF: ' + (err.message || 'Unknown error'));
    } finally {
      if(expBtn) expBtn.disabled = false;
      if(openBtn) openBtn.disabled = false;
    }
  }

  // ============================================================================
  // 3. INITIALIZATION & BINDINGS
  // ============================================================================

  function initWordStudio(){
    const modalEl = $('word-modal');
    if(!modalEl) return;

    if($('word-btn-close')) $('word-btn-close').onclick = () => modalEl.close();
    if($('word-btn-export')) $('word-btn-export').onclick = () => exportWordToPdf(false);
    if($('word-btn-open-viewer')) $('word-btn-open-viewer').onclick = () => exportWordToPdf(true);
    if($('word-btn-print')) $('word-btn-print').onclick = () => window.print();

    // Tab switching
    modalEl.querySelectorAll('.word-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        modalEl.querySelectorAll('.word-tab').forEach(b => b.classList.remove('active'));
        modalEl.querySelectorAll('.word-ribbon-panel').forEach(p => p.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetPanel = $('word-tab-' + tabBtn.dataset.tab);
        if(targetPanel) targetPanel.classList.add('active');
      };
    });

    // Formatting commands
    modalEl.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
        updateWordStats();
      };
    });

    // Font controls
    if($('word-font-family')){
      $('word-font-family').onchange = e => {
        document.execCommand('fontName', false, e.target.value);
      };
    }
    if($('word-font-size')){
      $('word-font-size').onchange = e => {
        document.execCommand('fontSize', false, e.target.value);
      };
    }
    if($('word-font-color')){
      $('word-font-color').oninput = e => {
        document.execCommand('foreColor', false, e.target.value);
        const lbl = modalEl.querySelector('.word-color-lbl');
        if(lbl) lbl.style.borderBottomColor = e.target.value;
      };
    }
    if($('word-bg-color')){
      $('word-bg-color').oninput = e => {
        document.execCommand('hiliteColor', false, e.target.value);
      };
    }

    // Styles chips (Normal, Heading 1, 2, 3)
    modalEl.querySelectorAll('[data-style]').forEach(chip => {
      chip.onclick = e => {
        e.preventDefault();
        const tag = chip.dataset.style;
        document.execCommand('formatBlock', false, '<' + tag + '>');
      };
    });

    // Insert Image
    if($('word-insert-img')){
      $('word-insert-img').onchange = e => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          document.execCommand('insertImage', false, ev.target.result);
          updateWordStats();
        };
        reader.readAsDataURL(file);
      };
    }

    // Insert Table
    if($('word-insert-tbl')){
      $('word-insert-tbl').onclick = () => {
        const rows = parseInt(prompt('Enter number of rows:', '3') || '0', 10);
        const cols = parseInt(prompt('Enter number of columns:', '3') || '0', 10);
        if(!rows || !cols || rows < 1 || cols < 1) return;
        let html = '<table style="width:100%;border-collapse:collapse;margin:14px 0;"><thead><tr>';
        for(let c = 0; c < cols; c++) html += `<th style="border:1px solid #cbd5e1;padding:8px 12px;background:#f1f5f9;">Header ${c + 1}</th>`;
        html += '</tr></thead><tbody>';
        for(let r = 0; r < rows - 1; r++){
          html += '<tr>';
          for(let c = 0; c < cols; c++) html += `<td style="border:1px solid #cbd5e1;padding:8px 12px;">Cell</td>`;
          html += '</tr>';
        }
        html += '</tbody></table><p><br></p>';
        document.execCommand('insertHTML', false, html);
        updateWordStats();
      };
    }

    // Insert Horizontal Rule & Link
    if($('word-insert-hr')){
      $('word-insert-hr').onclick = () => document.execCommand('insertHorizontalRule', false, null);
    }
    if($('word-insert-link')){
      $('word-insert-link').onclick = () => {
        const url = prompt('Enter URL:', 'https://');
        if(url) document.execCommand('createLink', false, url);
      };
    }

    // Layout controls (Orientation & Margins)
    if($('word-layout-orient')){
      $('word-layout-orient').onchange = e => {
        const isLand = e.target.value === 'landscape';
        modalEl.querySelectorAll('.word-page').forEach(pg => {
          if(isLand) pg.classList.add('landscape');
          else pg.classList.remove('landscape');
        });
      };
    }
    if($('word-layout-margins')){
      $('word-layout-margins').onchange = e => {
        const val = e.target.value;
        let pad = '24px 54px 32px';
        if(val === 'narrow') pad = '16px 28px 20px';
        else if(val === 'wide') pad = '32px 80px 40px';
        modalEl.querySelectorAll('.word-page-content').forEach(c => c.style.padding = pad);
      };
    }

    // Page action buttons
    if($('word-add-page-btn')) $('word-add-page-btn').onclick = addWordPage;
    if($('word-insert-break')) $('word-insert-break').onclick = addWordPage;
    if($('word-del-page-btn')) $('word-del-page-btn').onclick = deleteWordPage;

    // Real-time word statistics listener
    if($('word-pages-container')){
      $('word-pages-container').addEventListener('input', () => updateWordStats());
    }

    // Zoom controls
    if($('word-zoom-in')){
      $('word-zoom-in').onclick = () => {
        wordZoom = Math.min(1.5, Math.round((wordZoom + 0.1) * 10) / 10);
        $('word-zoom-lbl').textContent = Math.round(wordZoom * 100) + '%';
        $('word-pages-container').style.transform = `scale(${wordZoom})`;
        $('word-pages-container').style.transformOrigin = 'top center';
      };
    }
    if($('word-zoom-out')){
      $('word-zoom-out').onclick = () => {
        wordZoom = Math.max(0.6, Math.round((wordZoom - 0.1) * 10) / 10);
        $('word-zoom-lbl').textContent = Math.round(wordZoom * 100) + '%';
        $('word-pages-container').style.transform = `scale(${wordZoom})`;
        $('word-pages-container').style.transformOrigin = 'top center';
      };
    }

    // Title sync
    if($('word-doc-title')){
      $('word-doc-title').addEventListener('input', e => {
        const val = e.target.value.trim() || 'Document 1';
        modalEl.querySelectorAll('.word-header-doc').forEach(h => h.textContent = val);
      });
    }
  }

  function initCreatePdfActions(){
    // Hero & Navbar trigger
    if($('btn-create-pdf')) $('btn-create-pdf').onclick = openDialog;
    if($('createx')) $('createx').onclick = closeDialog;

    // Option 1: From Images
    if($('opt-create-img')) $('opt-create-img').onclick = () => {
      closeDialog();
      if($('create-img-input')) $('create-img-input').click();
    };

    // Option 2: From Text (Word Studio)
    if($('opt-create-doc')) $('opt-create-doc').onclick = () => {
      closeDialog();
      openWordStudio();
    };

    // Multi-image file input change
    if($('create-img-input')){
      $('create-img-input').onchange = async e => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if(!files.length) return;
        const f = getFolix();
        if(typeof f.ptOpenFromImages === 'function'){
          f.ptOpenFromImages(files);
        }
      };
    }
  }

  function init(){
    initCreatePdfActions();
    initWordStudio();
  }

  // Export module to global scope
  window.FolixCreate = {
    init,
    openDialog,
    closeDialog,
    openWordStudio,
    closeWordStudio,
    exportWordToPdf
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
