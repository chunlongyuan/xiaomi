import { el, topbar } from './common.js';
import { store } from '../storage.js';

const ALL = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];

export function renderStickers(ctx){
  const { root, go, audio } = ctx;
  root.appendChild(topbar(ctx, { back:()=>go('home') }));

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
}
