const WA_NUMBER = "6289648404791";
function waLink(msg){ return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); }
/* Link WhatsApp umum (tanya-tanya, tidak memakai nomor pelanggan) */
document.getElementById('wa-cta').href = waLink("Halo Kedai A'M, saya mau tanya-tanya dulu ya.");
document.getElementById('wa-foot').href = waLink("Halo Kedai A'M, saya mau tanya-tanya.");
document.querySelectorAll('.menu-card').forEach(card=>{ if(card.querySelector('.bs-ribbon')) card.classList.add('is-bs'); });
document.getElementById('year').textContent = new Date().getFullYear();

/* Navbar scroll state */
const nav = document.getElementById('navbar');
window.addEventListener('scroll', ()=>{ nav.classList.toggle('scrolled', window.scrollY > 30); }, {passive:true});

/* Mobile menu */
const burger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', ()=>{
  const open = burger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{ burger.classList.remove('open'); mobileMenu.classList.remove('open'); }));

/* Active nav indicator */
const sections = ['menu','signature','testimoni','faq'].map(id=>document.getElementById(id));
const navA = document.querySelectorAll('.nav-links a');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navA.forEach(a=> a.classList.toggle('active', a.getAttribute('href') === '#'+e.target.id));
    }
  });
}, {rootMargin:'-45% 0px -45% 0px'});
sections.forEach(s=> s && io.observe(s));

/* Reveal on scroll */
const revealIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('revealed'); revealIo.unobserve(e.target); } });
},{threshold:.15});
document.querySelectorAll('.reveal, .menu-card').forEach(el=> revealIo.observe(el));

/* Animated counters */
const counters = document.querySelectorAll('[data-count]');
const countIo = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el = e.target, target = +el.dataset.count, prefix = el.dataset.prefix || '';
      let cur = 0; const step = Math.max(1, Math.ceil(target/40));
      const t = setInterval(()=>{ cur += step; if(cur>=target){cur=target; clearInterval(t);} el.textContent = prefix + cur; }, 30);
      countIo.unobserve(el);
    }
  });
},{threshold:.5});
counters.forEach(c=> countIo.observe(c));

/* Tabs */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>{b.classList.remove('active'); b.setAttribute('aria-selected','false');});
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    document.querySelectorAll('#panel-'+btn.dataset.tab+' .menu-card').forEach((c,i)=>{
      c.classList.remove('revealed');
      setTimeout(()=>c.classList.add('revealed'), i*60);
    });
  });
});

/* FAQ accordion */
document.querySelectorAll('.faq-item').forEach(item=>{
  const q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
  if(item.classList.contains('open')) a.style.maxHeight = a.scrollHeight+'px';
  q.addEventListener('click', ()=>{
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>{ i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight=null; });
    if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight+'px'; }
  });
});

/* Testimonial carousel */
const tSlides = document.getElementById('tSlides');
const slideCount = tSlides.children.length;
const tNav = document.getElementById('tNav');
let tIndex = 0;
for(let i=0;i<slideCount;i++){
  const dot = document.createElement('button');
  dot.className = 't-dot'+(i===0?' active':'');
  dot.setAttribute('aria-label','Testimoni '+(i+1));
  dot.addEventListener('click', ()=> goTo(i));
  tNav.appendChild(dot);
}
function goTo(i){
  tIndex = (i+slideCount)%slideCount;
  tSlides.style.transform = `translateX(-${tIndex*100}%)`;
  document.querySelectorAll('.t-dot').forEach((d,idx)=> d.classList.toggle('active', idx===tIndex));
}
document.getElementById('tNext').addEventListener('click', ()=>goTo(tIndex+1));
document.getElementById('tPrev').addEventListener('click', ()=>goTo(tIndex-1));
let tAuto = setInterval(()=>goTo(tIndex+1), 5000);
document.querySelector('.carousel').addEventListener('mouseenter', ()=>clearInterval(tAuto));
document.querySelector('.carousel').addEventListener('mouseleave', ()=> tAuto = setInterval(()=>goTo(tIndex+1), 5000));

/* Back to top */
const backtop = document.getElementById('backtop');
window.addEventListener('scroll', ()=>{ backtop.classList.toggle('show', window.scrollY > 500); }, {passive:true});
backtop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));


/* ================= KERANJANG ================= */
const $ = id => document.getElementById(id);
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
const MIN_ANTAR = 3;

/* Katalog diambil dari markup (data-id, data-name, data-price) */
const CATALOG = {};
document.querySelectorAll('[data-item]').forEach(el=>{
  const im = el.querySelector('img');
  CATALOG[el.dataset.id] = { name: el.dataset.name, price: Number(el.dataset.price), img: el.dataset.img || (im ? im.getAttribute('src') : '') };
  const ctl = el.querySelector('.ctl');
  ctl.innerHTML = '<button type="button" class="btn-add" data-act="add">+ Tambah</button>'
    + '<div class="stepper" hidden><button type="button" data-act="dec">−</button><span class="q">0</span><button type="button" data-act="inc">+</button></div>';
  ctl.querySelector('[data-act="add"]').setAttribute('aria-label','Tambah '+el.dataset.name+' ke keranjang');
  ctl.querySelector('[data-act="dec"]').setAttribute('aria-label','Kurangi '+el.dataset.name);
  ctl.querySelector('[data-act="inc"]').setAttribute('aria-label','Tambah '+el.dataset.name);
});

/* Keranjang tersimpan di browser: { id: jumlah } */
let cart = {};
try{
  const raw = JSON.parse(localStorage.getItem('am_cart') || '{}');
  Object.keys(raw).forEach(id=>{ const q = parseInt(raw[id],10); if(CATALOG[id] && q>0) cart[id] = Math.min(q,99); });
}catch(e){}
function saveCart(){ try{ localStorage.setItem('am_cart', JSON.stringify(cart)); }catch(e){} }
function totals(){
  let items=0, sum=0;
  for(const id in cart){ items += cart[id]; sum += cart[id]*CATALOG[id].price; }
  return {items, sum};
}
function setQty(id,q){
  q = Math.max(0, Math.min(99, q));
  if(q===0) delete cart[id]; else cart[id] = q;
  saveCart(); render();
}

/* Nomor pelanggan: 1,2,3,... reset otomatis tiap jam 00:00 (waktu WIB) */
function todayWIB(){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}
function nextCustomerNumber(){
  const today = todayWIB();
  let q = {d:today, n:0};
  try{
    const s = JSON.parse(localStorage.getItem('am_queue') || 'null');
    if(s && s.d===today && Number.isInteger(s.n)) q = s;
  }catch(e){}
  q.n += 1;
  try{ localStorage.setItem('am_queue', JSON.stringify(q)); }catch(e){}
  return q.n;
}

/* Toast nomor pelanggan */
const toast = $('orderToast'); let toastTimer;
function showToast(text){
  $('orderToastId').textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 7000);
}

/* Form checkout */
const custName = $('custName'), custAddr = $('custAddress'), custNote = $('custNote');
try{ custName.value = localStorage.getItem('am_name') || ''; }catch(e){}
let method = null;
function areaValue(){ return document.querySelector('input[name="area"]:checked').value; }
function validate(){
  const {items} = totals();
  if(items===0) return {ok:false, msg:''};
  if(!custName.value.trim()) return {ok:false, msg:'Isi nama kamu dulu ya.'};
  if(!method) return {ok:false, msg:'Pilih diantar atau ambil sendiri.'};
  if(method==='antar'){
    if(items < MIN_ANTAR) return {ok:false, msg:'Pengantaran minimal '+MIN_ANTAR+' item — tambah '+(MIN_ANTAR-items)+' item lagi, atau pilih Ambil sendiri.'};
    if(!custAddr.value.trim()) return {ok:false, msg:'Isi alamat pengantaran dulu ya.'};
  }
  return {ok:true, msg:''};
}
function updateForm(){
  const v = validate();
  $('checkoutBtn').disabled = !v.ok;
  $('cartHint').textContent = v.msg;
}
document.querySelectorAll('input[name="method"]').forEach(r=> r.addEventListener('change', ()=>{
  method = r.value; $('deliveryBox').hidden = (method!=='antar'); updateForm();
}));
[custName, custAddr].forEach(i=> i.addEventListener('input', updateForm));

/* Render semua tampilan keranjang */
function render(){
  const {items, sum} = totals();
  document.querySelectorAll('[data-item]').forEach(el=>{
    const q = cart[el.dataset.id] || 0;
    el.querySelector('.btn-add').hidden = q>0;
    const st = el.querySelector('.stepper'); st.hidden = q===0; st.querySelector('.q').textContent = q;
  });
  $('navCount').textContent = items; $('navCount').hidden = items===0;
  $('barLabel').textContent = items+' item · '+rp(sum);
  $('cartBar').classList.toggle('show', items>0);
  document.body.classList.toggle('has-cart', items>0);

  $('cartEmpty').hidden = items>0; $('cartContent').hidden = items===0; $('cartFoot').hidden = items===0;
  const list = $('cartList');
  const a = document.activeElement; let keep = null;
  if(a && list.contains(a) && a.dataset.act) keep = {id:a.closest('li').dataset.cartId, act:a.dataset.act};
  list.textContent = '';
  Object.keys(cart).forEach(id=>{
    const c = CATALOG[id], q = cart[id];
    const li = document.createElement('li'); li.dataset.cartId = id;
    li.innerHTML = '<img class="ci-img" alt="" width="48" height="48"><div class="ci-info"><span class="ci-name"></span><span class="ci-price"></span></div>'
      + '<div class="stepper stepper-sm"><button type="button" data-act="dec">−</button><span class="q"></span><button type="button" data-act="inc">+</button></div>';
    li.querySelector('img').src = c.img;
    li.querySelector('.ci-name').textContent = c.name;
    li.querySelector('.ci-price').textContent = rp(c.price)+' × '+q+' = '+rp(c.price*q);
    li.querySelector('.q').textContent = q;
    li.querySelector('[data-act="dec"]').setAttribute('aria-label','Kurangi '+c.name);
    li.querySelector('[data-act="inc"]').setAttribute('aria-label','Tambah '+c.name);
    list.appendChild(li);
  });
  if(keep){ const b = list.querySelector('li[data-cart-id="'+keep.id+'"] [data-act="'+keep.act+'"]'); if(b) b.focus(); }
  $('cartTotal').textContent = rp(sum);
  updateForm();
}

/* Tambah / kurang (kartu menu, varian Mie Jebew, dan isi keranjang) */
document.addEventListener('click', e=>{
  const btn = e.target.closest('[data-act]'); if(!btn) return;
  const host = btn.closest('[data-item],[data-cart-id]'); if(!host) return;
  const id = host.dataset.id || host.dataset.cartId;
  const cur = cart[id] || 0;
  if(btn.dataset.act==='add' || btn.dataset.act==='inc') setQty(id, cur+1);
  else if(btn.dataset.act==='dec') setQty(id, cur-1);
});

/* Buka / tutup keranjang */
const drawer = $('cartDrawer'), overlay = $('cartOverlay');
function openCart(){
  if(drawer.classList.contains('open')) return;
  burger.classList.remove('open'); mobileMenu.classList.remove('open');
  try{ history.pushState({ov:'cart'}, ''); }catch(e){}   // supaya tombol Back (Android) menutup keranjang
  drawer.classList.add('open'); overlay.classList.add('show'); drawer.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden'; $('cartClose').focus();
}
function hideCart(){
  drawer.classList.remove('open'); overlay.classList.remove('show'); drawer.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function closeCart(){
  if(!drawer.classList.contains('open')) return;
  if(history.state && history.state.ov==='cart') history.back(); else hideCart();
}
window.addEventListener('popstate', hideCart);
['navCart','mobileCart','cartBar'].forEach(id=> $(id).addEventListener('click', openCart));
document.querySelectorAll('.open-cart').forEach(b=> b.addEventListener('click', openCart));
$('cartClose').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);
$('cartToMenu').addEventListener('click', ()=>{ closeCart(); setTimeout(()=> document.getElementById('menu').scrollIntoView({behavior:'smooth'}), 150); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeCart(); });

/* ================= NOTA PESANAN (gambar PNG, bisa diunduh) ================= */
const NOTA_W = 640;
function notaFmtDate(iso){
  const d = new Date(iso);
  const tgl = new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'long',year:'numeric'}).format(d);
  const jam = new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(':','.');
  return tgl + ', ' + jam + ' WIB';
}
function notaFileName(o){
  const d = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date(o.at)).replace(/-/g,'');
  return 'nota-kedai-am-pelanggan-' + o.no + '-' + d + (o.done ? '-selesai' : '') + '.png';
}
/* Bungkus teks ke beberapa baris sesuai lebar (kata yang terlalu panjang dipotong per huruf) */
function notaWrap(ctx, text, maxW){
  const lines = []; let cur = '';
  String(text).split(/\s+/).filter(Boolean).forEach(word=>{
    while(ctx.measureText(word).width > maxW){
      let k = word.length; while(k > 1 && ctx.measureText(word.slice(0,k)).width > maxW) k--;
      if(cur){ lines.push(cur); cur = ''; }
      lines.push(word.slice(0,k)); word = word.slice(k);
    }
    const t = cur ? cur + ' ' + word : word;
    if(!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = word; }
  });
  if(cur) lines.push(cur);
  return lines.length ? lines : [''];
}
/* Menggambar nota. draw=false hanya menghitung tinggi. Mengembalikan tinggi total. */
function notaPaint(ctx, o, logo, draw){
  const W = NOTA_W, P = 40, SANS = '"Plus Jakarta Sans", system-ui, sans-serif', DISP = '"Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif';
  const INK = '#241A16', SOFT = '#5B4A42', CHILI = '#C6311F', MUSTARD = '#F2A93B';
  const put = (t, x, y, font, color, align)=>{ ctx.font = font; if(!draw) return; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.fillText(t, x, y); };
  const dash = y=>{ if(!draw) return; ctx.strokeStyle = '#CDBBA4'; ctx.lineWidth = 2; ctx.setLineDash([8,6]); ctx.beginPath(); ctx.moveTo(P,y); ctx.lineTo(W-P,y); ctx.stroke(); ctx.setLineDash([]); };

  if(draw){
    ctx.fillStyle = '#FFFCF7'; ctx.fillRect(0, 0, W, 4000);
    ctx.fillStyle = '#1D1210'; ctx.fillRect(0, 0, W, 150);
    if(logo){ ctx.save(); ctx.beginPath(); ctx.arc(P+36, 75, 36, 0, Math.PI*2); ctx.clip(); ctx.drawImage(logo, P, 39, 72, 72); ctx.restore(); }
  }
  put("Kedai A'M", P+90, 76, '700 34px ' + DISP, MUSTARD);
  put('NOTA PESANAN', P+90, 106, '700 15px ' + SANS, '#E9DCC9');
  put('NOMOR PELANGGAN', W-P, 62, '700 12px ' + SANS, '#CBB9A3', 'right');
  put(String(o.no), W-P, 112, '700 50px ' + DISP, MUSTARD, 'right');

  let y = 150 + 42;
  const COL = P + 132, VAL_W = W - P - COL;
  const row = (label, value, strong)=>{
    put(label, P, y, '600 17px ' + SANS, SOFT);
    ctx.font = (strong ? '700 ' : '600 ') + '19px ' + SANS;
    notaWrap(ctx, value, VAL_W).forEach((ln, i)=>{ put(ln, COL, y + i*27, (strong ? '700 ' : '600 ') + '19px ' + SANS, INK); if(i) y += 0; });
    y += notaWrap(ctx, value, VAL_W).length * 27 + 6;
  };
  row('Tanggal', notaFmtDate(o.at));
  row('Atas nama', o.nama, true);
  row('Metode', o.metode === 'antar' ? 'Diantar' : 'Ambil sendiri');
  if(o.metode === 'antar'){
    row('Wilayah', o.area === 'in' ? 'Kampung Tahu Cibuntu' : 'Di luar Kampung Tahu Cibuntu');
    row('Alamat', o.alamat);
  }

  y += 8; dash(y); y += 38;
  put('PESANAN', P, y, '700 14px ' + SANS, SOFT); y += 14;

  const NAME_W = W - 2*P - 170;
  o.items.forEach(it=>{
    y += 30;
    ctx.font = '700 21px ' + SANS;
    const lines = notaWrap(ctx, it.name, NAME_W);
    lines.forEach((ln, i)=> put(ln, P, y + i*28, '700 21px ' + SANS, INK));
    put(rp(it.price * it.qty), W-P, y, '700 21px ' + SANS, INK, 'right');
    y += (lines.length - 1) * 28 + 26;
    put(it.qty + ' x ' + rp(it.price), P, y, '500 17px ' + SANS, SOFT);
    y += 10;
  });

  y += 14; dash(y); y += 36;
  put('Subtotal (' + o.count + ' item)', P, y, '600 18px ' + SANS, SOFT);
  put(rp(o.total), W-P, y, '600 18px ' + SANS, INK, 'right');
  if(o.metode === 'antar'){
    y += 32;
    put('Ongkir', P, y, '600 18px ' + SANS, SOFT);
    put(o.area === 'in' ? 'Gratis' : 'Dikonfirmasi admin', W-P, y, '600 18px ' + SANS, INK, 'right');
  }
  y += 52;
  put('TOTAL', P, y, '700 22px ' + SANS, INK);
  put(rp(o.total), W-P, y + 2, '700 42px ' + DISP, CHILI, 'right');
  y += 22;

  if(o.catatan){
    y += 18; dash(y); y += 36;
    put('Catatan', P, y, '700 14px ' + SANS, SOFT); y += 6;
    ctx.font = '500 18px ' + SANS;
    notaWrap(ctx, o.catatan, W - 2*P).forEach(ln=>{ y += 27; put(ln, P, y, '500 18px ' + SANS, INK); });
    y += 4;
  }

  /* Konfirmasi pelanggan */
  y += 22; dash(y); y += 36;
  put('KONFIRMASI PELANGGAN', P, y, '700 14px ' + SANS, SOFT);
  const T = y;
  y += 18 + (o.done ? 26 : 0);   // baris khusus untuk stempel saat sudah selesai
  const GREEN = '#3F5E2A', bx = P, by = y, bs = 30;
  if(draw){
    ctx.lineWidth = 3; ctx.strokeStyle = o.done ? GREEN : INK; ctx.fillStyle = o.done ? GREEN : '#FFFCF7';
    ctx.beginPath(); ctx.rect(bx, by, bs, bs); ctx.fill(); ctx.stroke();
    if(o.done){ ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx+7, by+16); ctx.lineTo(bx+13, by+23); ctx.lineTo(bx+24, by+8); ctx.stroke(); ctx.lineCap = 'butt'; }
  }
  put('Pesanan sudah saya terima dan selesai', bx+bs+16, by+23, '600 19px ' + SANS, INK);
  y = by + bs + 30;
  if(o.done && o.doneAt){
    put('Dikonfirmasi pelanggan: ' + notaFmtDate(o.doneAt), bx+bs+16, y - 2, '700 16px ' + SANS, GREEN);
    if(draw){ ctx.save(); ctx.translate(W-P-80, T+4); ctx.rotate(-0.12);
      ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.beginPath(); ctx.rect(-65, -22, 130, 44); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(-60, -17, 120, 34); ctx.stroke();
      ctx.font = '800 26px ' + DISP; ctx.fillStyle = GREEN; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SELESAI', 0, 2);
      ctx.restore(); ctx.textBaseline = 'alphabetic'; }
  } else {
    put('Status: menunggu konfirmasi pelanggan', bx+bs+16, y - 2, '500 16px ' + SANS, SOFT);
  }

  y += 22; dash(y); y += 42;
  put("Terima kasih sudah pesan di Kedai A'M!", W/2, y, '700 20px ' + DISP, INK, 'center');
  ctx.font = '500 14px ' + SANS;
  notaWrap(ctx, 'Nota ini dibuat otomatis dari pesananmu. Pembayaran dan ongkir (jika ada) dikonfirmasi admin lewat WhatsApp.', W - 2*P - 40)
    .forEach((ln, i)=> put(ln, W/2, y + 28 + i*21, '500 14px ' + SANS, SOFT, 'center'));
  y += 28 + 2*21 + 34;
  return Math.ceil(y);
}
async function notaRender(o){
  try{ await Promise.all(['700 30px "Bricolage Grotesque"','700 20px "Plus Jakarta Sans"','600 20px "Plus Jakarta Sans"','500 20px "Plus Jakarta Sans"'].map(f=> document.fonts.load(f))); }catch(e){}
  const logo = await new Promise(res=>{ const im = new Image(); im.onload = ()=> res(im); im.onerror = ()=> res(null); im.src = 'img/logo.png'; });
  const make = lg => new Promise((resolve, reject)=>{
    const H = notaPaint(document.createElement('canvas').getContext('2d'), o, lg, false);
    const S = 2, cv = document.createElement('canvas'); cv.width = NOTA_W*S; cv.height = H*S;
    const ctx = cv.getContext('2d'); ctx.scale(S, S);
    notaPaint(ctx, o, lg, true);
    try{ cv.toBlob(b=> b ? resolve(b) : reject(new Error('toBlob kosong')), 'image/png'); }catch(e){ reject(e); }
  });
  try{ return await make(logo); }catch(e){ return await make(null); }   // kalau logo membuat canvas "tainted", ulangi tanpa logo
}

const notaSheet = $('notaSheet'), notaOverlay = $('sheetOverlay');
let notaOpen = false, notaUrl = null, notaBlob = null, notaOrder = null;
function openNota(){
  if(notaOpen) return; notaOpen = true;
  try{ history.pushState({ov:'nota'}, ''); }catch(e){}
  notaSheet.classList.add('open'); notaOverlay.classList.add('show'); notaSheet.setAttribute('aria-hidden','false');
  notaSheet.scrollTop = 0; $('notaDownload').focus();
}
function hideNota(){
  if(!notaOpen) return; notaOpen = false;
  notaSheet.classList.remove('open'); notaOverlay.classList.remove('show'); notaSheet.setAttribute('aria-hidden','true');
}
function closeNota(){
  if(!notaOpen) return;
  if(history.state && history.state.ov === 'nota') history.back(); else hideNota();
}
window.addEventListener('popstate', hideNota);
notaOverlay.addEventListener('click', closeNota);
notaSheet.querySelectorAll('[data-close-nota]').forEach(b=> b.addEventListener('click', closeNota));
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeNota(); });

async function showNota(o){
  try{
    notaBlob = await notaRender(o); notaOrder = o;
    if(notaUrl) URL.revokeObjectURL(notaUrl);
    notaUrl = URL.createObjectURL(notaBlob);
    $('notaImg').src = notaUrl;
    syncNotaConfirm(o);
    let canShare = false;
    try{ canShare = !!(navigator.canShare && navigator.canShare({files:[new File([notaBlob], notaFileName(o), {type:'image/png'})]})); }catch(e){}
    $('notaShare').hidden = !canShare;
    openNota(); return true;
  }catch(e){ console.warn('Nota gagal dibuat:', e); return false; }
}
function syncNotaConfirm(o){
  const done = !!(o && o.done);
  $('notaConfirm').hidden = done; $('notaDoneMsg').hidden = !done;
  $('notaCheck').checked = false; $('notaDone').disabled = true;
  if(done) $('notaDoneMsg').textContent = '✅ Pesanan selesai. Dikonfirmasi pelanggan pada ' + notaFmtDate(o.doneAt);
}
$('notaCheck').addEventListener('change', ()=>{ $('notaDone').disabled = !$('notaCheck').checked; });
$('notaDone').addEventListener('click', async ()=>{
  if(!notaOrder || notaOrder.done) return;
  const btn = $('notaDone'); btn.disabled = true;
  const o = Object.assign({}, notaOrder, {done:true, doneAt:new Date().toISOString()});
  try{
    const blob = await notaRender(o);
    notaOrder = o; notaBlob = blob;
    if(notaUrl) URL.revokeObjectURL(notaUrl);
    notaUrl = URL.createObjectURL(blob); $('notaImg').src = notaUrl;
    try{ localStorage.setItem('am_last_order', JSON.stringify(o)); }catch(e){}
    syncNotaConfirm(o);
    $('notaDoneMsg').scrollIntoView({block:'nearest'});
  }catch(e){ console.warn('Konfirmasi gagal:', e); btn.disabled = false; }
});
$('notaDownload').addEventListener('click', ()=>{
  if(!notaUrl || !notaOrder) return;
  const a = document.createElement('a'); a.href = notaUrl; a.download = notaFileName(notaOrder);
  document.body.appendChild(a); a.click(); a.remove();
});
$('notaShare').addEventListener('click', ()=>{
  if(!notaBlob || !notaOrder) return;
  const f = new File([notaBlob], notaFileName(notaOrder), {type:'image/png'});
  navigator.share({files:[f], title:"Nota Kedai A'M"}).catch(()=>{});
});
/* Nota terakhir disimpan di browser, bisa dibuka lagi dari keranjang yang kosong */
function loadLastOrder(){
  try{
    const o = JSON.parse(localStorage.getItem('am_last_order') || 'null');
    if(o && Array.isArray(o.items) && o.items.length && Number.isInteger(o.no) && o.at) return o;
  }catch(e){}
  return null;
}
function refreshNotaLast(){ $('notaLast').hidden = !loadLastOrder(); }
$('notaLast').addEventListener('click', ()=>{
  const o = loadLastOrder(); if(!o) return;
  closeCart(); setTimeout(()=> showNota(o), 450);
});
refreshNotaLast();

/* Checkout -> WhatsApp */
$('checkoutBtn').addEventListener('click', ()=>{
  const v = validate(); if(!v.ok){ $('cartHint').textContent = v.msg; return; }
  if(!navigator.onLine){ $('cartHint').textContent = 'Kamu sedang offline. Pesananmu aman di keranjang — kirim lagi setelah internet tersambung.'; return; }
  const {items, sum} = totals();
  const nomor = nextCustomerNumber();
  const nama = custName.value.trim();
  try{ localStorage.setItem('am_name', nama); }catch(e){}

  const lines = Object.keys(cart).map((id,i)=> (i+1)+'. '+CATALOG[id].name+' x'+cart[id]+' = '+rp(CATALOG[id].price*cart[id]));
  let msg = "Halo Kedai A'M, saya mau pesan ya.\n\n"
    + '*Pelanggan '+nomor+'*\n'
    + 'Atas nama: '+nama+'\n\n'
    + '*Daftar pesanan:*\n'+lines.join('\n')+'\n\n'
    + '*Total: '+rp(sum)+'* ('+items+' item)\n\n';
  if(method==='antar'){
    msg += 'Metode: Diantar\n'
      + (areaValue()==='in' ? 'Wilayah: Kampung Tahu Cibuntu (gratis ongkir)\n' : 'Wilayah: di luar Kampung Tahu Cibuntu (ongkir dikonfirmasi admin)\n')
      + 'Alamat: '+custAddr.value.trim()+'\n';
  } else {
    msg += 'Metode: Ambil sendiri\n';
  }
  if(custNote.value.trim()) msg += 'Catatan: '+custNote.value.trim()+'\n';

  const order = {no:nomor, nama, at:new Date().toISOString(),
    items:Object.keys(cart).map(id=>({name:CATALOG[id].name, qty:cart[id], price:CATALOG[id].price})),
    count:items, total:sum, metode:method, area:(method==='antar' ? areaValue() : null),
    alamat:(method==='antar' ? custAddr.value.trim() : ''), catatan:custNote.value.trim()};

  const url = waLink(msg.trim());
  const w = window.open(url, '_blank');
  if(!w) window.location.href = url;

  cart = {}; saveCart();
  custAddr.value = ''; custNote.value = '';
  method = null; document.querySelectorAll('input[name="method"]').forEach(r=> r.checked = false);
  $('deliveryBox').hidden = true;
  closeCart(); render();
  try{ localStorage.setItem('am_last_order', JSON.stringify(order)); }catch(e){}
  refreshNotaLast();
  setTimeout(async ()=>{ if(!(await showNota(order))) showToast('Pelanggan '+nomor); }, 450);
});

/* ================= PENCARIAN MENU ================= */
(function(){
  const menuSec = document.getElementById('menu');
  const input = document.getElementById('menuSearch');
  const clearBtn = document.getElementById('menuSearchClear');
  const info = document.getElementById('menuSearchInfo');
  const empty = document.getElementById('menuEmpty');
  const panels = Array.from(document.querySelectorAll('.tab-panel'));

  /* Normalisasi: huruf kecil, tanpa aksen, tanda baca jadi spasi ("Bola-Bola" == "bola bola") */
  const norm = t => String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  /* Teks yang dicari per kartu: nama + keterangan + kata kunci + nama kategorinya */
  const cards = [];
  panels.forEach(p=>{
    p.querySelectorAll('.menu-card').forEach(card=>{
      const name = card.dataset.name || (card.querySelector('.name')||{}).textContent || '';
      const mini = (card.querySelector('.order-mini')||{}).textContent || '';
      cards.push({ card, panel:p, hay: norm([name, mini, card.dataset.keywords||'', p.dataset.label||''].join(' ')) });
    });
  });

  function run(){
    const raw = input.value;
    const q = norm(raw);
    clearBtn.hidden = raw.length === 0;

    if(!q){
      menuSec.classList.remove('searching');
      cards.forEach(c=> c.card.classList.remove('is-hidden'));
      panels.forEach(p=> p.classList.remove('no-match'));
      info.hidden = true; empty.hidden = true;
      /* kembali ke tampilan tab: pastikan hanya panel tab aktif yang terlihat */
      return;
    }

    menuSec.classList.add('searching');
    const words = q.split(' ');
    let total = 0;
    cards.forEach(c=>{
      const hit = words.every(w=> c.hay.includes(w));
      c.card.classList.toggle('is-hidden', !hit);
      if(hit){ total++; c.card.classList.add('revealed'); }   // kartu di tab tersembunyi belum pernah "muncul"
    });
    panels.forEach(p=> p.classList.toggle('no-match', !p.querySelector('.menu-card:not(.is-hidden)')));

    info.hidden = false;
    info.textContent = total ? (total + ' menu ditemukan untuk "' + raw.trim() + '"') : '';
    info.hidden = total === 0;
    empty.hidden = total !== 0;
    if(!total){
      document.getElementById('menuEmptyQ').textContent = '"' + raw.trim() + '"';
      document.getElementById('menuEmptyWA').href = waLink("Halo Kedai A'M, apakah ada menu " + raw.trim() + "?");
    }
  }

  input.addEventListener('input', run);
  input.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ e.preventDefault(); input.blur(); }          // tutup keyboard HP, hasil tetap tampil
    if(e.key === 'Escape' && input.value){ e.stopPropagation(); input.value=''; run(); }
  });
  clearBtn.addEventListener('click', ()=>{ input.value=''; run(); input.focus(); });

  /* Tombol cari di navbar -> geser ke kolom pencarian lalu fokus */
  document.getElementById('navSearch').addEventListener('click', ()=>{
    burger.classList.remove('open'); mobileMenu.classList.remove('open');
    menuSec.scrollIntoView({behavior:'smooth'});
    setTimeout(()=> input.focus({preventScroll:true}), 450);
  });

  run();
})();

render();
