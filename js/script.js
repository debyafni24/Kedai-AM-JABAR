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

  const url = waLink(msg.trim());
  const w = window.open(url, '_blank');
  if(!w) window.location.href = url;

  cart = {}; saveCart();
  custAddr.value = ''; custNote.value = '';
  method = null; document.querySelectorAll('input[name="method"]').forEach(r=> r.checked = false);
  $('deliveryBox').hidden = true;
  closeCart(); render(); showToast('Pelanggan '+nomor);
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
