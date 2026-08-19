// 通用 DOM 工具
export function el(tag, cls, html){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(html !== undefined) n.innerHTML = html;
  return n;
}

export function topbar(store){
  const bar = el('div', 'topbar', `
    <div class="brand"><span class="logo">🦁</span>小米学习</div>
    <div>
      <span class="stars-pill"><span class="s">⭐</span><span>${store.stars}</span></span>
      ${store.streak>0 ? `<span class="streak-pill">🔥 连续 ${store.streak} 天</span>` : ''}
    </div>
  `);
  return bar;
}

export function toast(text, ms=1400){
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

export function confetti(ms=1800){
  const wrap = el('div', 'confetti');
  document.body.appendChild(wrap);
  const colors = ['#ff7aa7','#ffd35a','#7fd88a','#6dc9ff','#b18cff','#ff9a55'];
  const N = 80;
  for(let i=0;i<N;i++){
    const c = el('i');
    c.style.background = colors[i%colors.length];
    c.style.left = Math.random()*100 + 'vw';
    c.style.animationDuration = (1.6 + Math.random()*1.4) + 's';
    c.style.animationDelay = (Math.random()*.3) + 's';
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    wrap.appendChild(c);
  }
  setTimeout(()=>wrap.remove(), ms+300);
}

export function burst(emoji='🎉'){
  const wrap = el('div', 'burst', `<div class="big">${emoji}</div>`);
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 900);
}

export function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

export function pick(arr, n){
  return shuffle(arr).slice(0, n);
}

export function rand(lo, hi){
  return Math.floor(Math.random()*(hi-lo+1))+lo;
}
