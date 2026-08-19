// 数学难度选择：10 / 20 / 50 / 100
import { el, topbar } from './common.js';
import { store } from '../storage.js';

const LEVELS = [
  { n:10,  title:'10 以内', sub:'加减法 · 入门', color:'green'  },
  { n:20,  title:'20 以内', sub:'加减法 · 进阶', color:'blue'   },
  { n:50,  title:'50 以内', sub:'加减法 · 挑战', color:'yellow' },
  { n:100, title:'100 以内',sub:'加减法 · 高手', color:'orange' },
];

export function renderDifficulty(ctx){
  const { root, go, audio } = ctx;
  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const wrap = el('div','level');
  root.appendChild(wrap);
  wrap.appendChild(el('div','reward-title','🧮 选一个难度'));

  const s = store.stats?.math;

  const grid = el('div','diff-grid');
  wrap.appendChild(grid);
  LEVELS.forEach(L => {
    const st = s?.byLevel?.[L.n] || {c:0,w:0};
    const total = st.c + st.w;
    const acc = total ? Math.round(st.c*100/total) : null;
    const card = el('button', `btn ${L.color} diff-btn`, `
      <div class="dn">${L.title}</div>
      <div class="ds">${L.sub}</div>
      <div class="da">${acc==null?'还没玩过':`已做 ${total} 题 · 正确率 ${acc}%`}</div>
    `);
    card.addEventListener('click', ()=>{ audio.tap(); go('level', { subject:'math', level:L.n }); });
    grid.appendChild(card);
  });
}
