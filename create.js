/**
 * @file create.js
 * @description Dedicated Creator Module for Folix - A FloppersBlop Product v1.3.
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

  function openWordStudio(initialTitle){
    const modalEl = $('word-modal');
    if(!modalEl) return;
    closeDialog();
    const titleEl = $('word-doc-title');
    if(initialTitle && titleEl){
      titleEl.value = initialTitle;
      modalEl.querySelectorAll('.word-header-doc').forEach(h => h.textContent = initialTitle);
    }
    const f = getFolix();
    f.modal(modalEl);
    const docTitle = (titleEl && titleEl.value.trim()) || 'Document 1';
    document.title = `${docTitle} – Word Studio – Folix`;
    if(typeof f.syncRoute === 'function') f.syncRoute('word-studio', docTitle, { push: true });
    updatePageNumbers();
    updateWordStats();
    const first = modalEl.querySelector('.word-page-content');
    if(first) first.focus();
  }

  function closeWordStudio(){
    const modalEl = $('word-modal');
    if(modalEl && modalEl.open) modalEl.close();
  }

  function updatePageNumbers(activePageEl){
    const container = $('word-pages-container');
    if(!container) return;
    const pages = Array.from(container.querySelectorAll('.word-page'));
    const total = pages.length;
    let activeIdx = 1;
    pages.forEach((pg, idx) => {
      pg.dataset.page = String(idx + 1);
      const hdr = pg.querySelector('.word-header-page');
      if(hdr) hdr.textContent = `Page ${idx + 1} of ${total}`;
      const ftr = pg.querySelector('.word-page-num');
      if(ftr) ftr.textContent = String(idx + 1);
      if(activePageEl && pg === activePageEl) activeIdx = idx + 1;
    });
    if($('word-stat-pages')) $('word-stat-pages').textContent = `Page ${activeIdx} of ${total}`;
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

  function createWordPageElement(newIdx){
    const isLand = $('word-layout-orient')?.value === 'landscape';
    const docTitle = ($('word-doc-title')?.value || '').trim() || 'Document 1';
    const padVal = $('word-layout-margins')?.value || 'normal';
    let pad = '24px 54px 32px';
    if(padVal === 'narrow') pad = '16px 28px 20px';
    else if(padVal === 'wide') pad = '32px 80px 40px';

    const newPage = document.createElement('div');
    newPage.className = 'word-page' + (isLand ? ' landscape' : '');
    newPage.dataset.page = String(newIdx);
    newPage.innerHTML = `
      <div class="word-page-header">
        <span class="word-header-doc">${docTitle}</span>
        <span class="word-header-page">Page ${newIdx}</span>
      </div>
      <div class="word-page-content" contenteditable="true" spellcheck="true" style="padding:${pad}" placeholder="Continue typing on page ${newIdx}...">
        <p><br></p>
      </div>
      <div class="word-page-footer">
        <span>Folix - A FloppersBlop Product</span>
        <span class="word-page-num">${newIdx}</span>
      </div>
    `;
    return newPage;
  }

  function isPageContentEmpty(pc){
    if(!pc) return true;
    const hasMedia = !!pc.querySelector('img, table, hr');
    if(hasMedia) return false;
    return !(pc.textContent || '').replace(/\u200B/g, '').trim();
  }

  function splitOverflowingBlock(pc, nextPc){
    const block = pc.firstElementChild;
    if(!block || !/^(P|DIV|BLOCKQUOTE)$/i.test(block.tagName)) return false;
    const text = block.textContent || '';
    const words = text.split(/(\s+)/);
    if(words.length < 3) return false;

    let lo = 1, hi = words.length - 1, best = 0;
    const origText = block.textContent;
    while(lo <= hi){
      const mid = (lo + hi) >> 1;
      block.textContent = words.slice(0, mid).join('');
      if(pc.scrollHeight <= pc.clientHeight + 2){
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if(best <= 0 || best >= words.length){
      block.textContent = origText;
      return false;
    }
    block.textContent = words.slice(0, best).join('').replace(/\s+$/, '');
    const restText = words.slice(best).join('').replace(/^\s+/, '');
    if(restText){
      const cont = document.createElement(block.tagName.toLowerCase());
      cont.textContent = restText;
      if(nextPc.firstElementChild && isPageContentEmpty(nextPc)){
        nextPc.innerHTML = '';
      }
      nextPc.insertBefore(cont, nextPc.firstChild);
    }
    return true;
  }

  let isPaginating = false;
  function paginateWordPages(){
    if(isPaginating) return;
    const container = $('word-pages-container');
    if(!container) return;
    isPaginating = true;

    try {
      const sel = window.getSelection();
      const anchorNode = sel && sel.rangeCount ? sel.anchorNode : null;
      const anchorOffset = sel && sel.rangeCount ? sel.anchorOffset : 0;
      const activePcBefore = anchorNode && (anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode)?.closest?.('.word-page-content');
      let movedCursorTarget = null;

      // 1. Forward overflow distribution across sequential A4 pages
      for(let i = 0; i < container.children.length; i++){
        const page = container.children[i];
        const pc = page.querySelector('.word-page-content');
        if(!pc || !pc.clientHeight) continue;

        let guard = 0;
        while(pc.scrollHeight > pc.clientHeight + 2 && pc.children.length > 0 && guard++ < 500){
          let nextPage = container.children[i + 1];
          if(!nextPage){
            nextPage = createWordPageElement(container.children.length + 1);
            container.appendChild(nextPage);
          }
          const nextPc = nextPage.querySelector('.word-page-content');
          if(!nextPc) break;

          if(pc.children.length === 1){
            if(!splitOverflowingBlock(pc, nextPc)) break;
            if(activePcBefore === pc) movedCursorTarget = nextPc;
            break;
          }

          const lastEl = pc.lastElementChild;
          if(!lastEl) break;
          const hadCursor = anchorNode && lastEl.contains(anchorNode);
          if(isPageContentEmpty(nextPc)){
            nextPc.innerHTML = '';
          }
          nextPc.insertBefore(lastEl, nextPc.firstChild);
          if(hadCursor){
            movedCursorTarget = lastEl;
          }
        }
      }

      // 2. Backward merging on delete/backspace (respect explicit manual page breaks)
      for(let i = 0; i < container.children.length - 1; i++){
        const nextPage = container.children[i + 1];
        if(nextPage.dataset.manualBreak === '1') continue;
        const pc = container.children[i].querySelector('.word-page-content');
        const nextPc = nextPage.querySelector('.word-page-content');
        if(!pc || !nextPc || !pc.clientHeight) continue;

        let guard = 0;
        while(nextPc.firstElementChild && guard++ < 200){
          const cand = nextPc.firstElementChild;
          if(isPageContentEmpty(nextPc) && nextPc.children.length === 1) break;
          const hadCursor = anchorNode && cand.contains(anchorNode);
          pc.appendChild(cand);
          if(pc.scrollHeight <= pc.clientHeight + 2){
            if(hadCursor) movedCursorTarget = cand;
          } else {
            nextPc.insertBefore(cand, nextPc.firstChild);
            break;
          }
        }
      }

      // 3. Prune empty trailing pages (keep at least 1 page and respect manual page breaks)
      while(container.children.length > 1){
        const lastPage = container.lastElementChild;
        if(lastPage.dataset.manualBreak === '1') break;
        const lastPc = lastPage?.querySelector('.word-page-content');
        if(isPageContentEmpty(lastPc)){
          const hadCursor = anchorNode && lastPage.contains(anchorNode);
          lastPage.remove();
          if(hadCursor){
            const prevPc = container.lastElementChild?.querySelector('.word-page-content');
            if(prevPc) movedCursorTarget = prevPc;
          }
        } else {
          break;
        }
      }

      // Restore cursor if it crossed a page boundary
      if(movedCursorTarget && sel){
        const targetPc = movedCursorTarget.classList?.contains('word-page-content')
          ? movedCursorTarget
          : movedCursorTarget.closest?.('.word-page-content');
        if(targetPc){
          targetPc.focus({ preventScroll: true });
          const r = document.createRange();
          if(anchorNode && movedCursorTarget.contains(anchorNode)){
            try {
              r.setStart(anchorNode, Math.min(anchorOffset, anchorNode.length || 0));
              r.collapse(true);
            } catch(e) {
              r.selectNodeContents(movedCursorTarget);
              r.collapse(false);
            }
          } else {
            r.selectNodeContents(movedCursorTarget);
            r.collapse(false);
          }
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }

      const activeEl = document.activeElement?.closest?.('.word-page');
      updatePageNumbers(activeEl);
      updateWordStats();
    } finally {
      isPaginating = false;
    }
  }

  function addWordPage(){
    const container = $('word-pages-container');
    if(!container) return;
    const curPages = container.querySelectorAll('.word-page');
    const newIdx = curPages.length + 1;
    const newPage = createWordPageElement(newIdx);
    container.appendChild(newPage);
    updatePageNumbers(newPage);
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
        if(node.classList && (node.classList.contains('word-img-del') || node.classList.contains('word-img-resizer'))) return;
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
          f.msg('Document compiled and opened in Folix - A FloppersBlop Product!');
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
    if($('word-nav-viewer')) $('word-nav-viewer').onclick = () => modalEl.close();
    modalEl.addEventListener('close', () => {
      const f = getFolix();
      if(typeof f.restoreIdleRoute === 'function') f.restoreIdleRoute({ push: false });
    });
    if($('word-btn-export')) $('word-btn-export').onclick = () => exportWordToPdf(false);
    if($('word-btn-open-viewer')) $('word-btn-open-viewer').onclick = () => exportWordToPdf(true);
    if($('word-btn-print')) $('word-btn-print').onclick = () => window.print();

    // Word Studio Theme Switcher dropdown
    const wThemeBtn = $('word-theme-btn');
    const wThemePop = $('word-theme-pop');
    const wThemeClose = $('word-theme-pop-close');
    if (wThemeBtn && wThemePop) {
      wThemeBtn.onclick = e => {
        e.stopPropagation();
        const isHidden = wThemePop.classList.contains('hide');
        wThemePop.classList.toggle('hide', !isHidden);
        wThemeBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      };
      if (wThemeClose) {
        wThemeClose.onclick = e => {
          e.stopPropagation();
          wThemePop.classList.add('hide');
          wThemeBtn.setAttribute('aria-expanded', 'false');
        };
      }
      wThemePop.querySelectorAll('.theme-opt').forEach(opt => {
        opt.addEventListener('click', () => {
          wThemePop.classList.add('hide');
          wThemeBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', e => {
        if (!wThemePop.classList.contains('hide') && !wThemePop.contains(e.target) && e.target !== wThemeBtn) {
          wThemePop.classList.add('hide');
          wThemeBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

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

    // ========================================================================
    // SELECTION-ACCURATE FORMATTING ENGINE & RIBBON STATE SYNC
    // ========================================================================
    let savedWordRange = null;
    const pagesContainer = $('word-pages-container');

    const FONT_SIZE_MAP = {
      '1': '10pt', '2': '11pt', '3': '12pt', '4': '14pt',
      '5': '18pt', '6': '24pt', '7': '32pt'
    };
    const STATE_CMDS = [
      'bold', 'italic', 'underline', 'strikeThrough',
      'subscript', 'superscript', 'insertUnorderedList', 'insertOrderedList',
      'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'
    ];
    const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE', 'PRE', 'DIV']);

    function getClosestPageContent(node) {
      if (!node) return null;
      const el = node.nodeType === 3 ? node.parentElement : node;
      return el && el.closest ? el.closest('.word-page-content') : null;
    }

    function saveWordSelection() {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (getClosestPageContent(range.commonAncestorContainer)) {
        savedWordRange = range.cloneRange();
      }
    }

    function restoreWordSelection() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && getClosestPageContent(sel.getRangeAt(0).commonAncestorContainer)) {
        return sel.getRangeAt(0);
      }
      if (savedWordRange) {
        const pc = getClosestPageContent(savedWordRange.commonAncestorContainer);
        if (pc && document.body.contains(pc)) {
          pc.focus({ preventScroll: true });
          sel.removeAllRanges();
          sel.addRange(savedWordRange);
          return savedWordRange;
        }
      }
      const firstPc = pagesContainer && pagesContainer.querySelector('.word-page-content');
      if (firstPc) {
        firstPc.focus({ preventScroll: true });
        const r = document.createRange();
        r.selectNodeContents(firstPc);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        savedWordRange = r.cloneRange();
        return r;
      }
      return null;
    }

    function updateRibbonActiveState() {
      const sel = window.getSelection();
      const inEditor = sel && sel.rangeCount && getClosestPageContent(sel.getRangeAt(0).commonAncestorContainer);
      if (!inEditor) return;

      modalEl.querySelectorAll('[data-cmd]').forEach(btn => {
        const cmd = btn.dataset.cmd;
        if (!STATE_CMDS.includes(cmd)) return;
        let active = false;
        try { active = document.queryCommandState(cmd); } catch (e) {}
        btn.classList.toggle('active', !!active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      const anchor = sel.anchorNode;
      const pc = getClosestPageContent(anchor);
      let blockEl = anchor && (anchor.nodeType === 3 ? anchor.parentElement : anchor);
      while (blockEl && blockEl !== pc && !BLOCK_TAGS.has(blockEl.tagName)) {
        blockEl = blockEl.parentElement;
      }
      const activeTag = (blockEl && blockEl !== pc) ? blockEl.tagName.toLowerCase() : 'p';
      modalEl.querySelectorAll('[data-style]').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.style === activeTag);
      });
    }

    function applyInlineStyle(cssProp, cssVal, fallbackCmd, fallbackVal) {
      const range = restoreWordSelection();
      if (!range) return;
      const sel = window.getSelection();

      if (range.collapsed) {
        if (fallbackCmd) {
          try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
          document.execCommand(fallbackCmd, false, fallbackVal);
          saveWordSelection();
          updateRibbonActiveState();
        }
        return;
      }

      const span = document.createElement('span');
      span.style[cssProp] = cssVal;
      const frag = range.extractContents();
      frag.querySelectorAll('span').forEach(s => {
        s.style[cssProp] = '';
        if (!s.getAttribute('style')) s.removeAttribute('style');
      });
      span.appendChild(frag);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(newRange);
      savedWordRange = newRange.cloneRange();
      updateRibbonActiveState();
      updateWordStats();
    }

    function applyBlockStyle(tag) {
      const range = restoreWordSelection();
      if (!range) return;
      const pc = getClosestPageContent(range.commonAncestorContainer);
      if (!pc) return;

      let block = range.commonAncestorContainer;
      if (block.nodeType === 3) block = block.parentElement;
      while (block && block !== pc && !BLOCK_TAGS.has(block.tagName)) {
        block = block.parentElement;
      }

      const sel = window.getSelection();

      // If selection is collapsed or spans multiple blocks, safely convert block(s) without touching .word-page-content
      if (range.collapsed || !block || block === pc) {
        if (!block || block === pc) {
          const newEl = document.createElement(tag);
          if (!range.collapsed) {
            newEl.appendChild(range.extractContents());
          } else {
            newEl.innerHTML = '<br>';
          }
          range.insertNode(newEl);
          const r = document.createRange();
          r.selectNodeContents(newEl);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        } else {
          const newEl = document.createElement(tag);
          while (block.firstChild) newEl.appendChild(block.firstChild);
          block.replaceWith(newEl);
          const r = document.createRange();
          r.selectNodeContents(newEl);
          r.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r);
        }
        saveWordSelection();
        updateRibbonActiveState();
        updateWordStats();
        return;
      }

      // Non-collapsed selection within a single block: split cleanly so unselected text stays untouched
      const preRange = document.createRange();
      preRange.selectNodeContents(block);
      preRange.setEnd(range.startContainer, range.startOffset);
      const hasBefore = preRange.toString().length > 0;

      const postRange = document.createRange();
      postRange.selectNodeContents(block);
      postRange.setStart(range.endContainer, range.endOffset);
      const hasAfter = postRange.toString().length > 0;

      if (!hasBefore && !hasAfter) {
        const newEl = document.createElement(tag);
        while (block.firstChild) newEl.appendChild(block.firstChild);
        block.replaceWith(newEl);
        const r = document.createRange();
        r.selectNodeContents(newEl);
        sel.removeAllRanges();
        sel.addRange(r);
      } else {
        const frag = document.createDocumentFragment();
        const origTag = block.tagName.toLowerCase();
        if (hasBefore) {
          const beforeEl = document.createElement(origTag);
          beforeEl.appendChild(preRange.cloneContents());
          if (beforeEl.textContent.length > 0) frag.appendChild(beforeEl);
        }
        const targetEl = document.createElement(tag);
        targetEl.appendChild(range.cloneContents());
        frag.appendChild(targetEl);
        if (hasAfter) {
          const afterEl = document.createElement(origTag);
          afterEl.appendChild(postRange.cloneContents());
          if (afterEl.textContent.length > 0) frag.appendChild(afterEl);
        }
        block.replaceWith(frag);
        const r = document.createRange();
        r.selectNodeContents(targetEl);
        sel.removeAllRanges();
        sel.addRange(r);
      }
      saveWordSelection();
      updateRibbonActiveState();
      updateWordStats();
    }

    if (pagesContainer) {
      pagesContainer.addEventListener('keyup', () => { saveWordSelection(); updateRibbonActiveState(); });
      pagesContainer.addEventListener('mouseup', () => { saveWordSelection(); updateRibbonActiveState(); });
    }
    document.addEventListener('selectionchange', () => {
      if (!modalEl.open) return;
      saveWordSelection();
      updateRibbonActiveState();
    });

    // Prevent focus loss on ribbon button clicks so active text selection is preserved
    modalEl.querySelectorAll('.word-tool-btn, .word-style-chip, .word-tab, .word-tool-btn-labeled').forEach(btn => {
      btn.addEventListener('mousedown', e => e.preventDefault());
    });

    // Formatting commands
    modalEl.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.onclick = e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        restoreWordSelection();
        document.execCommand(cmd, false, null);
        saveWordSelection();
        updateRibbonActiveState();
        updateWordStats();
      };
    });

    // Font controls (selection-accurate CSS wrapping)
    if($('word-font-family')){
      $('word-font-family').onchange = e => {
        applyInlineStyle('fontFamily', e.target.value, 'fontName', e.target.value);
      };
    }
    if($('word-font-size')){
      $('word-font-size').onchange = e => {
        const pt = FONT_SIZE_MAP[e.target.value] || '12pt';
        applyInlineStyle('fontSize', pt, 'fontSize', e.target.value);
      };
    }
    if($('word-font-color')){
      $('word-font-color').oninput = e => {
        applyInlineStyle('color', e.target.value, 'foreColor', e.target.value);
        const lbl = modalEl.querySelector('.word-color-lbl');
        if(lbl) lbl.style.borderBottomColor = e.target.value;
      };
    }
    if($('word-bg-color')){
      $('word-bg-color').oninput = e => {
        applyInlineStyle('backgroundColor', e.target.value, 'hiliteColor', e.target.value);
      };
    }

    // Styles chips (Normal, Heading 1, 2, 3, Quote, Code)
    modalEl.querySelectorAll('[data-style]').forEach(chip => {
      chip.onclick = e => {
        e.preventDefault();
        applyBlockStyle(chip.dataset.style);
      };
    });

    // Insert Image (File upload + Drag-and-Drop + Resizable Wrapper)
    function attachImageWrapHandlers(wrap) {
      if (!wrap || wrap._bound) return;
      wrap._bound = true;
      const img = wrap.querySelector('img');
      const resizer = wrap.querySelector('.word-img-resizer');
      const delBtn = wrap.querySelector('.word-img-del');

      if (delBtn) {
        delBtn.onclick = e => {
          e.preventDefault();
          e.stopPropagation();
          wrap.remove();
          updateWordStats();
          paginateWordPages();
        };
      }
      if (resizer && img) {
        resizer.onmousedown = e => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startW = img.getBoundingClientRect().width || 240;
          const onMove = ev => {
            const nextW = Math.max(48, Math.min(680, startW + (ev.clientX - startX)));
            img.style.width = nextW + 'px';
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            paginateWordPages();
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        };
      }
    }

    function insertWordImage(dataUrl) {
      const range = restoreWordSelection();
      if (!range) return;
      const wrap = document.createElement('span');
      wrap.className = 'word-img-wrap';
      wrap.contentEditable = 'false';

      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'Inserted image';
      img.style.width = '320px';

      const resizer = document.createElement('span');
      resizer.className = 'word-img-resizer';
      resizer.title = 'Drag to resize';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'word-img-del';
      delBtn.title = 'Remove image';
      delBtn.innerHTML = '&times;';

      wrap.appendChild(img);
      wrap.appendChild(resizer);
      wrap.appendChild(delBtn);
      attachImageWrapHandlers(wrap);

      range.deleteContents();
      range.insertNode(wrap);
      const sel = window.getSelection();
      const afterR = document.createRange();
      afterR.setStartAfter(wrap);
      afterR.collapse(true);
      sel.removeAllRanges();
      sel.addRange(afterR);
      saveWordSelection();
      updateWordStats();
      img.onload = () => paginateWordPages();
    }

    if($('word-insert-img')){
      $('word-insert-img').onchange = e => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => insertWordImage(ev.target.result);
        reader.readAsDataURL(file);
      };
    }

    if (pagesContainer) {
      pagesContainer.addEventListener('dragover', e => {
        if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
          e.preventDefault();
        }
      });
      pagesContainer.addEventListener('drop', e => {
        const files = e.dataTransfer?.files;
        if (!files || !files.length) return;
        const imgFile = Array.from(files).find(f => /^image\/(png|jpe?g|webp)$/i.test(f.type));
        if (!imgFile) return;
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = ev => insertWordImage(ev.target.result);
        reader.readAsDataURL(imgFile);
      });
    }

    // Insert Table (Non-blocking Modal Dialog)
    const tblDlg = $('word-tbl-dialog');
    const closeTblDlg = () => { if (tblDlg) tblDlg.classList.add('hide'); };
    if($('word-insert-tbl') && tblDlg){
      $('word-insert-tbl').onclick = () => {
        saveWordSelection();
        tblDlg.classList.remove('hide');
        if ($('word-tbl-rows')) $('word-tbl-rows').focus();
      };
      if ($('word-tbl-cancel')) $('word-tbl-cancel').onclick = closeTblDlg;
      if ($('word-tbl-cancel-x')) $('word-tbl-cancel-x').onclick = closeTblDlg;
      if ($('word-tbl-confirm')) {
        $('word-tbl-confirm').onclick = () => {
          const rows = Math.max(1, Math.min(20, parseInt($('word-tbl-rows')?.value || '3', 10) || 3));
          const cols = Math.max(1, Math.min(10, parseInt($('word-tbl-cols')?.value || '3', 10) || 3));
          const hasHdr = $('word-tbl-hdr')?.checked !== false;
          closeTblDlg();

          const range = restoreWordSelection();
          if (!range) return;

          const tbl = document.createElement('table');
          tbl.className = 'word-table';
          tbl.style.cssText = 'width:100%;border-collapse:collapse;margin:14px 0;';
          if (hasHdr) {
            const thead = document.createElement('thead');
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
              const th = document.createElement('th');
              th.style.cssText = 'border:1px solid #cbd5e1;padding:8px 12px;background:#f1f5f9;';
              th.textContent = `Header ${c + 1}`;
              tr.appendChild(th);
            }
            thead.appendChild(tr);
            tbl.appendChild(thead);
          }
          const tbody = document.createElement('tbody');
          const bodyRows = hasHdr ? Math.max(1, rows - 1) : rows;
          for (let r = 0; r < bodyRows; r++) {
            const tr = document.createElement('tr');
            for (let c = 0; c < cols; c++) {
              const td = document.createElement('td');
              td.style.cssText = 'border:1px solid #cbd5e1;padding:8px 12px;';
              td.textContent = 'Cell';
              tr.appendChild(td);
            }
            tbody.appendChild(tr);
          }
          tbl.appendChild(tbody);

          const spacer = document.createElement('p');
          spacer.innerHTML = '<br>';

          range.deleteContents();
          range.insertNode(spacer);
          range.insertNode(tbl);

          const firstCell = tbl.querySelector('th, td');
          if (firstCell) {
            const sel = window.getSelection();
            const r = document.createRange();
            r.selectNodeContents(firstCell);
            sel.removeAllRanges();
            sel.addRange(r);
            saveWordSelection();
          }
          updateWordStats();
          paginateWordPages();
        };
      }
    }

    // Tab navigation inside tables
    if (pagesContainer) {
      pagesContainer.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        const sel = window.getSelection();
        const cell = sel && sel.anchorNode && (sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode)?.closest?.('td, th');
        if (!cell) return;
        const tbl = cell.closest('table');
        if (!tbl) return;
        e.preventDefault();
        const cells = Array.from(tbl.querySelectorAll('th, td'));
        const idx = cells.indexOf(cell);
        const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
        if (nextIdx >= 0 && nextIdx < cells.length) {
          const r = document.createRange();
          r.selectNodeContents(cells[nextIdx]);
          sel.removeAllRanges();
          sel.addRange(r);
          saveWordSelection();
        }
      });
    }

    // Insert Horizontal Rule
    if($('word-insert-hr')){
      $('word-insert-hr').onclick = () => {
        restoreWordSelection();
        document.execCommand('insertHorizontalRule', false, null);
        saveWordSelection();
        paginateWordPages();
      };
    }

    // Insert Link (Non-blocking Modal Dialog)
    const linkDlg = $('word-link-dialog');
    const closeLinkDlg = () => { if (linkDlg) linkDlg.classList.add('hide'); };
    if($('word-insert-link') && linkDlg){
      $('word-insert-link').onclick = () => {
        saveWordSelection();
        const selText = savedWordRange ? savedWordRange.toString().trim() : '';
        if ($('word-link-text')) $('word-link-text').value = selText;
        if ($('word-link-url')) $('word-link-url').value = 'https://';
        linkDlg.classList.remove('hide');
        if ($('word-link-text') && !selText) $('word-link-text').focus();
        else if ($('word-link-url')) $('word-link-url').focus();
      };
      if ($('word-link-cancel')) $('word-link-cancel').onclick = closeLinkDlg;
      if ($('word-link-cancel-x')) $('word-link-cancel-x').onclick = closeLinkDlg;
      if ($('word-link-confirm')) {
        $('word-link-confirm').onclick = () => {
          const rawUrl = ($('word-link-url')?.value || '').trim();
          const dispText = ($('word-link-text')?.value || '').trim() || rawUrl;
          if (!rawUrl) return;
          const safeUrl = /^(https?:|mailto:|tel:)/i.test(rawUrl) ? rawUrl : 'https://' + rawUrl;
          closeLinkDlg();

          const range = restoreWordSelection();
          if (!range) return;

          const a = document.createElement('a');
          a.href = safeUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.className = 'word-link';
          a.textContent = dispText;

          range.deleteContents();
          range.insertNode(a);

          const sel = window.getSelection();
          const afterR = document.createRange();
          afterR.setStartAfter(a);
          afterR.collapse(true);
          sel.removeAllRanges();
          sel.addRange(afterR);
          saveWordSelection();
          updateWordStats();
          paginateWordPages();
        };
      }
    }

    // True Page Break: split content at exact cursor position into a new page immediately after current page
    function insertTruePageBreak() {
      const range = restoreWordSelection();
      if (!range || !pagesContainer) return;
      const pc = getClosestPageContent(range.endContainer);
      const curPage = pc?.closest?.('.word-page');
      if (!pc || !curPage) return;

      const splitRange = document.createRange();
      splitRange.setStart(range.endContainer, range.endOffset);
      splitRange.setEnd(pc, pc.childNodes.length);
      const trailingFrag = splitRange.extractContents();

      if (isPageContentEmpty(pc)) {
        pc.innerHTML = '<p><br></p>';
      }

      const newPage = createWordPageElement(1);
      newPage.dataset.manualBreak = '1';
      const newPc = newPage.querySelector('.word-page-content');
      if (newPc) {
        newPc.innerHTML = '';
        newPc.appendChild(trailingFrag);
        // Clean up leading empty wrapper element if caret was at end of previous block
        while (newPc.firstElementChild && !newPc.firstElementChild.textContent.trim() && !newPc.firstElementChild.querySelector('img,table,hr') && newPc.children.length > 1) {
          newPc.firstElementChild.remove();
        }
        if (isPageContentEmpty(newPc)) {
          newPc.innerHTML = '<p><br></p>';
        }
      }

      curPage.after(newPage);
      updatePageNumbers(newPage);
      updateWordStats();

      if (newPc) {
        newPc.focus({ preventScroll: true });
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(newPc);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        saveWordSelection();
      }
      newPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      paginateWordPages();
    }

    // Layout controls (Orientation & Margins)
    if($('word-layout-orient')){
      $('word-layout-orient').onchange = e => {
        const isLand = e.target.value === 'landscape';
        modalEl.querySelectorAll('.word-page').forEach(pg => {
          if(isLand) pg.classList.add('landscape');
          else pg.classList.remove('landscape');
        });
        paginateWordPages();
      };
    }
    if($('word-layout-margins')){
      $('word-layout-margins').onchange = e => {
        const val = e.target.value;
        let pad = '24px 54px 32px';
        if(val === 'narrow') pad = '16px 28px 20px';
        else if(val === 'wide') pad = '32px 80px 40px';
        modalEl.querySelectorAll('.word-page-content').forEach(c => c.style.padding = pad);
        paginateWordPages();
      };
    }

    // Page action buttons
    if($('word-add-page-btn')) $('word-add-page-btn').onclick = addWordPage;
    if($('word-insert-break')) $('word-insert-break').onclick = insertTruePageBreak;
    if($('word-del-page-btn')) $('word-del-page-btn').onclick = deleteWordPage;

    // Real-time auto-pagination, paste distribution, and word statistics
    if($('word-pages-container')){
      const pcWrap = $('word-pages-container');
      let pageRaf = 0;
      const schedulePaginate = () => {
        cancelAnimationFrame(pageRaf);
        pageRaf = requestAnimationFrame(() => paginateWordPages());
      };

      pcWrap.addEventListener('input', () => {
        updateWordStats();
        schedulePaginate();
      });

      pcWrap.addEventListener('focusin', e => {
        const pg = e.target.closest?.('.word-page');
        if(pg) updatePageNumbers(pg);
      });

      pcWrap.addEventListener('paste', e => {
        const pc = e.target.closest?.('.word-page-content');
        if(!pc) return;
        const text = e.clipboardData?.getData('text/plain');
        if(text && text.includes('\n')){
          e.preventDefault();
          const lines = text.replace(/\r\n/g, '\n').split('\n');
          const frag = document.createDocumentFragment();
          lines.forEach(line => {
            const p = document.createElement('p');
            if(line.trim()) p.textContent = line;
            else p.innerHTML = '<br>';
            frag.appendChild(p);
          });
          const sel = window.getSelection();
          if(sel && sel.rangeCount){
            const r = sel.getRangeAt(0);
            r.deleteContents();
            r.insertNode(frag);
            r.collapse(false);
          } else {
            pc.appendChild(frag);
          }
          updateWordStats();
          paginateWordPages();
        } else {
          setTimeout(() => { updateWordStats(); paginateWordPages(); }, 0);
        }
      });

      pcWrap.addEventListener('keydown', e => {
        if(e.key !== 'Backspace') return;
        const pc = e.target.closest?.('.word-page-content');
        const pg = pc?.closest?.('.word-page');
        if(!pc || !pg || !pg.previousElementSibling) return;
        const sel = window.getSelection();
        if(!sel || !sel.isCollapsed || !sel.rangeCount) return;
        const r = sel.getRangeAt(0);
        const testR = document.createRange();
        testR.selectNodeContents(pc);
        testR.setEnd(r.startContainer, r.startOffset);
        if(testR.toString().length === 0){
          e.preventDefault();
          delete pg.dataset.manualBreak;
          const prevPc = pg.previousElementSibling.querySelector('.word-page-content');
          if(prevPc){
            prevPc.focus({ preventScroll: true });
            const endR = document.createRange();
            endR.selectNodeContents(prevPc);
            endR.collapse(false);
            sel.removeAllRanges();
            sel.addRange(endR);
            paginateWordPages();
          }
        }
      });
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
        if(modalEl.open){
          document.title = `${val} – Word Studio – Folix`;
          const f = getFolix();
          if(typeof f.syncRoute === 'function') f.syncRoute('word-studio', val, { push: false });
        }
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
