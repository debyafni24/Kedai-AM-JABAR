/* Kedai AM Jabar — PWA: service worker, tombol Install, tombol Bagikan, status offline */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);

  /* Domain resmi website (dipakai kalau halaman dibuka dari localhost / file lokal).
     Kalau domain Netlify-mu berbeda, ubah di sini SAJA. */
  const SITE_URL = 'https://kedai-am.netlify.app/';
  const SHARE_TITLE = 'Kedai AM Jabar';
  const SHARE_TEXT = 'Pesan di Kedai AM Jabar 🍽️';

  /* ---------- Service Worker ---------- */
  if('serviceWorker' in navigator){
    const secure = location.protocol === 'https:' || ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    if(secure) window.addEventListener('load', ()=>{
      navigator.serviceWorker.register('service-worker.js').catch(err=> console.warn('Service worker gagal didaftarkan:', err));
    });
  }

  /* ---------- Sheet (jendela kecil: bagikan & cara install iOS) ---------- */
  const sheetOverlay = $('sheetOverlay');
  let openedSheet = null;
  function openSheet(el){
    if(openedSheet) return;
    openedSheet = el;
    try{ history.pushState({ov:'sheet'}, ''); }catch(e){}
    el.classList.add('open'); sheetOverlay.classList.add('show'); el.setAttribute('aria-hidden','false');
    const f = el.querySelector('button, input, a'); if(f) f.focus();
  }
  function hideSheet(){
    if(!openedSheet) return;
    openedSheet.classList.remove('open'); sheetOverlay.classList.remove('show'); openedSheet.setAttribute('aria-hidden','true');
    openedSheet = null;
  }
  function closeSheet(){
    if(!openedSheet) return;
    if(history.state && history.state.ov === 'sheet') history.back(); else hideSheet();  // tombol Back Android menutup sheet
  }
  window.addEventListener('popstate', hideSheet);
  sheetOverlay.addEventListener('click', closeSheet);
  document.querySelectorAll('[data-close-sheet]').forEach(b=> b.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeSheet(); });

  /* ---------- Install ---------- */
  let deferred = null;
  const isStandalone = () => ['standalone','fullscreen','minimal-ui'].some(m => matchMedia('(display-mode: '+m+')').matches) || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let iosMode = isIOS && !isStandalone();   // iOS tidak punya prompt otomatis -> tampilkan panduan

  function dismissedRecently(){
    try{ const t = Number(localStorage.getItem('am_install_dismissed')); return t && (Date.now()-t) < 7*24*3600*1000; }catch(e){ return false; }
  }
  function refreshInstallUI(){
    const standalone = isStandalone();
    document.documentElement.classList.toggle('is-standalone', standalone);
    const can = !standalone && (deferred || iosMode);
    $('installCard').hidden = !(can && !dismissedRecently());
    $('installFootLi').hidden = !can;
    const label = deferred ? 'Install Aplikasi' : 'Cara Install';
    $('installBtn').textContent = label; $('installFoot').textContent = label;
  }
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferred = e; refreshInstallUI(); });
  window.addEventListener('appinstalled', ()=>{ deferred = null; iosMode = false; refreshInstallUI(); });
  try{ matchMedia('(display-mode: standalone)').addEventListener('change', refreshInstallUI); }catch(e){}

  async function triggerInstall(){
    if(deferred){
      const d = deferred; deferred = null; refreshInstallUI();
      d.prompt();
      try{ await d.userChoice; }catch(e){}
    } else if(iosMode){
      openSheet($('iosSheet'));
    }
  }
  $('installBtn').addEventListener('click', triggerInstall);
  $('installFoot').addEventListener('click', triggerInstall);
  $('installDismiss').addEventListener('click', ()=>{
    try{ localStorage.setItem('am_install_dismissed', String(Date.now())); }catch(e){}
    refreshInstallUI();
  });
  refreshInstallUI();

  /* ---------- Bagikan ---------- */
  function shareUrl(){
    const local = location.protocol === 'file:' || /^(localhost|127\.|192\.168\.|10\.|\[::1\])/.test(location.hostname);
    return local ? SITE_URL : new URL('./', location.href).href;   // alamat halaman utama tanpa ?query / #hash
  }
  async function copyText(text){
    try{ await navigator.clipboard.writeText(text); return true; }catch(e){}
    try{ const i = $('shareInput'); i.focus(); i.select(); i.setSelectionRange(0, 9999); return document.execCommand('copy'); }catch(e){ return false; }
  }
  function openShareSheet(url){
    const enc = encodeURIComponent, msg = SHARE_TEXT + '\n' + url;
    $('shareInput').value = url;
    $('shareWA').href = 'https://wa.me/?text=' + enc(msg);
    $('shareTG').href = 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(SHARE_TEXT);
    $('shareFB').href = 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url);
    $('shareMail').href = 'mailto:?subject=' + enc(SHARE_TITLE) + '&body=' + enc(msg);
    $('shareCopy').textContent = 'Salin Link';
    openSheet($('shareSheet'));
  }
  async function doShare(){
    const url = shareUrl();
    if(navigator.share){
      try{ await navigator.share({title: SHARE_TITLE, text: SHARE_TEXT, url}); return; }
      catch(err){ if(err && err.name === 'AbortError') return; }   // dibatalkan pengguna -> tidak perlu apa-apa
    }
    openShareSheet(url);   // Web Share API tidak ada / gagal -> pakai pilihan manual
  }
  $('shareBtn').addEventListener('click', doShare);
  $('shareFoot').addEventListener('click', doShare);
  let copyTimer;
  $('shareCopy').addEventListener('click', async ()=>{
    const ok = await copyText($('shareInput').value);
    $('shareCopy').textContent = ok ? 'Tersalin ✓' : 'Tekan lama lalu salin';
    clearTimeout(copyTimer); copyTimer = setTimeout(()=> $('shareCopy').textContent = 'Salin Link', 2500);
  });

  /* ---------- Status offline ---------- */
  const nb = document.createElement('div');
  nb.id = 'netBanner'; nb.setAttribute('role','status'); document.body.appendChild(nb);
  function netStatus(){
    if(!navigator.onLine){
      nb.textContent = 'Kamu sedang offline. Menu tetap bisa dilihat dan keranjang tersimpan; mengirim pesan ke WhatsApp butuh internet.';
      nb.className = 'show off';
    } else if(nb.classList.contains('off')){
      nb.textContent = 'Kembali online ✓';
      nb.className = 'show on';
      setTimeout(()=> nb.classList.remove('show'), 2500);
    }
  }
  window.addEventListener('online', netStatus); window.addEventListener('offline', netStatus);
  netStatus();
})();
