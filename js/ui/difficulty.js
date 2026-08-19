// 难度/分级选择 —— 数学 & 语文共用
import { el, topbar } from './common.js';
import { store } from '../storage.js';
import { chineseTiers } from '../subjects/chinese.js';

// 数学分级（阶梯 + 学龄段建议）
const MATH_TIERS = [
  { level:10,  emoji:'🌱', title:'10 以内', sub:'加减入门 · 幼儿园中班',       color:'green'  },
  { level:20,  emoji:'🌿', title:'20 以内', sub:'凑十/破十 · 幼儿园大班',      color:'blue'   },
  { level:50,  emoji:'🌳', title:'50 以内', sub:'两位数运算 · 幼小衔接',       color:'yellow' },
  { level:100, emoji:'🌲', title:'100 以内',sub:'退位减法 · 一年级',           color:'orange' },
];

export function renderDifficulty(ctx){
  const { root, go, audio, params } = ctx;
  const subject = params?.subject || 'math';

  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const wrap = el('div','level');
  root.appendChild(wrap);

  if(subject === 'math'){
    wrap.appendChild(el('div','reward-title','🧮 选一个数学分级'));
    const s = store.stats?.math;
    const grid = el('div','diff-grid');
    wrap.appendChild(grid);
    MATH_TIERS.forEach(t => {
      const st = s?.byLevel?.[t.level] || {c:0,w:0};
      const total = st.c + st.w;
      const acc = total ? Math.round(st.c*100/total) : null;
      const card = el('button', `btn ${t.color} diff-btn`, `
        <div class="dt-emoji">${t.emoji}</div>
        <div class="dn">${t.title}</div>
        <div class="ds">${t.sub}</div>
        <div class="da">${acc==null?'还没玩过':`已做 ${total} 题 · 正确率 ${acc}%`}</div>
      `);
      card.addEventListener('click', ()=>{ audio.tap(); go('level', { subject:'math', level:t.level }); });
      grid.appendChild(card);
    });
  } else {
    wrap.appendChild(el('div','reward-title','📚 选一个语文分级'));
    const s = store.stats?.chinese;
    const tiers = chineseTiers();
    const grid = el('div','diff-grid');
    wrap.appendChild(grid);
    tiers.forEach(t => {
      const st = s?.byTier?.[t.id] || {c:0,w:0};
      const total = st.c + st.w;
      const acc = total ? Math.round(st.c*100/total) : null;
      const card = el('button', `btn ${t.color} diff-btn`, `
        <div class="dt-emoji">${t.emoji}</div>
        <div class="dn">${t.name}</div>
        <div class="ds">${t.sub}</div>
        <div class="da">${acc==null?'还没玩过':`已做 ${total} 题 · 正确率 ${acc}%`}</div>
      `);
      card.addEventListener('click', ()=>{ audio.tap(); go('level', { subject:'chinese', tier:t.id }); });
      grid.appendChild(card);
    });
  }
}
