// 分级选择 —— 数学 & 语文
// 分级参考：教育部《3-6岁儿童学习与发展指南》+ 部编版一年级上册
import { el, topbar } from './common.js';
import { store } from '../storage.js';
import { chineseTiers } from '../subjects/chinese.js';

// 数学 5 档：从小班到一年级
const MATH_TIERS = [
  { level:5,   emoji:'🌱', title:'5 以内',  sub:'数数+比大小 · 3-4 岁小班',    ref:'3-6 岁指南 · 小班', color:'green'  },
  { level:10,  emoji:'🌿', title:'10 以内', sub:'加减入门 · 4-5 岁中班',        ref:'3-6 岁指南 · 中班', color:'blue'   },
  { level:20,  emoji:'🌳', title:'20 以内', sub:'凑十/破十法 · 5-6 岁大班',     ref:'3-6 岁指南 · 大班', color:'yellow' },
  { level:50,  emoji:'🌲', title:'50 以内', sub:'两位数加减 · 幼小衔接',        ref:'幼小衔接',          color:'orange' },
  { level:100, emoji:'🎓', title:'100 以内',sub:'进位/退位加减 · 一年级',       ref:'部编版一年级',     color:'pink'   },
];

export function renderDifficulty(ctx){
  const { root, go, audio, params } = ctx;
  const subject = params?.subject || 'math';

  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const wrap = el('div','level');
  root.appendChild(wrap);

  if(subject === 'math'){
    wrap.appendChild(el('div','reward-title','🧮 选一个数学分级'));
    wrap.appendChild(el('div','tier-note','参考《3-6岁儿童学习与发展指南》教育部'));
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
    wrap.appendChild(el('div','tier-note','参考《3-6岁儿童学习与发展指南》+ 部编版一年级上册识字表'));
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
