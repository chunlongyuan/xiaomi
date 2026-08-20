// 通用 DOM 工具 + topbar
import { store } from '../storage.js';

// 跨页面保留的连点状态（每次 go() 都会重建 topbar，所以状态要放模块级）
const tapState = { count: 0, last: 0 };

export function el(tag, cls, html){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(html !== undefined) n.innerHTML = html;
  return n;
}

// 紧凑 topbar：左档案/中标题(可选)/右星星+声音
// 参数 opts: { back:()=>go(...), title, showStars:true }
export function topbar(ctx, opts={}){
  const { go, audio } = ctx;
  const p = store.current;
  const stars = store.stars;
  const streak = store.streak;
  const soundOn = store.soundOn;

  const bar = el('div', 'topbar');

  // 左边
  const left = el('div', 'tb-left');
  if(opts.back){
    const back = el('button','tb-btn back', '← 返回');
    back.addEventListener('click', ()=>{ audio.tap(); opts.back(); });
    left.appendChild(back);
  }
  if(p){
    const chip = el('button','profile-chip', `<span class="av">${p.avatar}</span><span class="nm">${escapeHtml(p.name)}</span>`);
    chip.title = '切换小朋友（连点三下进游戏厅）';
    // 单击立刻去档案页；若在 800ms 内累计点到 3 下，直接跳游戏厅
    chip.addEventListener('click', ()=>{
      audio.tap();
      const now = Date.now();
      if(now - (tapState.last || 0) > 800) tapState.count = 0;
      tapState.last = now;
      tapState.count += 1;
      if(tapState.count >= 3){
        tapState.count = 0;
        audio.fanfare();
        go('arcade');
      } else {
        go('profiles');    // 单击不再等待，立即响应
      }
    });
    left.appendChild(chip);
  }
  bar.appendChild(left);

  // 右边
  const right = el('div','tb-right');
  const sound = el('button','tb-btn round', soundOn?'🔊':'🔇');
  sound.title = soundOn ? '点一下静音' : '点一下开声音';
  sound.addEventListener('click', ()=>{
    store.setSound(!store.soundOn);
    audio.tap();
    sound.textContent = store.soundOn ? '🔊' : '🔇';
  });
  right.appendChild(sound);

  if(opts.showStars !== false && p){
    const s = el('div','stars-pill', `<span class="s">⭐</span><b>${stars}</b>`);
    right.appendChild(s);
    if(streak>0){
      const k = el('div','streak-pill', `🔥${streak}`);
      right.appendChild(k);
    }
  }
  bar.appendChild(right);
  return bar;
}

// 展示 5 星条：n 亮 out of total
export function starsRow(n, total=5){
  return `<span class="stars">${
    Array(total).fill(0).map((_,i)=> i<n?'<span class="g">⭐</span>':'<span class="o">☆</span>').join('')
  }</span>`;
}

export function toast(text, ms=1400){
  const t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

export function confetti(ms=1600, count=60){
  const wrap = el('div', 'confetti');
  document.body.appendChild(wrap);
  const colors = ['#ff7aa7','#ffd35a','#7fd88a','#6dc9ff','#b18cff','#ff9a55'];
  for(let i=0;i<count;i++){
    const c = el('i');
    c.style.background = colors[i%colors.length];
    c.style.left = Math.random()*100 + 'vw';
    c.style.animationDuration = (1.4 + Math.random()*1.4) + 's';
    c.style.animationDelay = (Math.random()*.2) + 's';
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    wrap.appendChild(c);
  }
  setTimeout(()=>wrap.remove(), ms+400);
}

export function burst(emoji='🎉'){
  const wrap = el('div', 'burst', `<div class="big">${emoji}</div>`);
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 900);
}

const PRAISE = ['太棒了！','答对啦！','真聪明！','厉害！','了不起！','你真棒！','太厉害了！'];
export function praise(){ return PRAISE[Math.floor(Math.random()*PRAISE.length)]; }

export function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
export function pick(arr, n){ return shuffle(arr).slice(0, n); }
export function rand(lo, hi){ return Math.floor(Math.random()*(hi-lo+1))+lo; }

export function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
