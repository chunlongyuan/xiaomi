import { el, topbar, starsRow } from './common.js';
import { store } from '../storage.js';

export function renderHome(ctx){
  const { root, go, audio } = ctx;

  // 没档案 → 强制去建一个
  if(!store.hasProfile){
    go('profiles', { forceCreate:true });
    return;
  }

  root.appendChild(topbar(ctx, { showStars:true }));

  const p = store.current;
  const nextMilestone = Math.ceil((p.stars+1)/10)*10;

  const hero = el('div', 'hero', `
    <div class="hero-avatar">${p.avatar}</div>
    <h1>你好，${escapeHtml(p.name)}！</h1>
    <p class="sub">今天想学什么呢？</p>
    <div class="star-track">
      <div class="star-track-label">
        <span>⭐ ${p.stars} 颗</span>
        <span class="tiny">下一个目标 ${nextMilestone}</span>
      </div>
      <div class="star-bar"><div class="fill" style="width:${Math.min(100, (p.stars % 10) * 10)}%"></div></div>
      <div class="stars-mini">${starsRow(p.stars % 10, 10)}</div>
    </div>
  `);
  root.appendChild(hero);

  const grid = el('div', 'grid');
  grid.appendChild(subjectCard('math',     '数学乐园', '🧮', '🌱 中班 · 🌿 大班 · 🌳 学前 · 🌲 一年级'));
  grid.appendChild(subjectCard('chinese',  '语文乐园', '📚', '🌱 基础 · 🌿 进阶 · 🌳 挑战'));
  grid.appendChild(subjectCard('stickers', '贴纸收集', '🌟', `已收集 ${p.stickers.length} 枚`));
  grid.appendChild(subjectCard('stats',    '我的记录', '📊', `${p.levelsCompleted} 关 · 🔥${p.streak}`));
  root.appendChild(grid);

  function subjectCard(id, title, emoji, desc){
    const c = el('div', `card ${id}`, `
      <div class="emoji">${emoji}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    `);
    c.addEventListener('click', () => {
      audio.tap();
      if(id === 'stickers') go('stickers');
      else if(id === 'stats') go('stats');
      else go('difficulty', { subject: id });   // 数学、语文都进分级页
    });
    return c;
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
