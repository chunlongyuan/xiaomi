// 贴纸册
import { el, topbar } from './common.js';

const ALL = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];

export function renderStickers(ctx){
  const { root, store, go, audio } = ctx;
  root.appendChild(topbar(store));

  const owned = new Set(store.stickers);
  const h = el('div','hero', `
    <h1>贴纸收藏册</h1>
    <p class="sub">已收集 <b>${owned.size}</b> / ${ALL.length} 枚</p>
  `);
  root.appendChild(h);

  const wall = el('div','stickers-wall');
  ALL.forEach(em => {
    const s = el('div','sticker' + (owned.has(em)?' owned':''), em);
    wall.appendChild(s);
  });
  root.appendChild(wall);

  const row = el('div','result',`
    <div class="row" style="margin-top:8px">
      <button class="btn yellow" data-act="home">回首页</button>
    </div>
  `);
  row.style.background='transparent';row.style.boxShadow='none';row.style.padding='16px 0 0';
  row.addEventListener('click', e=>{
    const b = e.target.closest('[data-act]'); if(!b) return;
    audio.tap(); go('home');
  });
  root.appendChild(row);
}
