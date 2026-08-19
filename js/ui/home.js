import { el, topbar } from './common.js';

export function renderHome(ctx){
  const { root, go, store, audio } = ctx;

  root.appendChild(topbar(store));

  const hero = el('div', 'hero', `
    <div style="font-size:96px;line-height:1;filter:drop-shadow(0 12px 16px rgba(0,0,0,.2))">🦁🐻🐼</div>
    <h1>小米学习乐园</h1>
    <p class="sub">选一个乐园开始今天的探险吧！</p>
  `);
  root.appendChild(hero);

  const grid = el('div', 'grid');
  grid.appendChild(subjectCard('math',    '数学乐园', '🧮', '加减、数数、比大小'));
  grid.appendChild(subjectCard('chinese', '语文乐园', '📚', '认字、拼音、词语'));
  grid.appendChild(subjectCard('stickers','贴纸收集', '🌟', '看看你的宝藏收藏'));
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
      else go('level', { subject:id });
    });
    return c;
  }
}
