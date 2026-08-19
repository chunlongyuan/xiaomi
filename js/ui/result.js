// 结算页
import { el, topbar } from './common.js';

export function renderResult(ctx){
  const { root, params, store, audio, go } = ctx;
  const stars = params.stars ?? 0;
  const total = params.total ?? 5;
  const sticker = params.sticker;
  const subject = params.subject || 'math';

  root.appendChild(topbar(store));

  const emoji = stars === total ? '🏆' : stars >= total*0.6 ? '🥳' : '💪';
  const words = stars === total ? '太厉害啦！全对！' : stars >= total*0.6 ? '真棒！继续加油！' : '这次不错，下次会更好！';

  const s = el('div','result', `
    <div class="big">${emoji}</div>
    <h2>${words}</h2>
    <div class="stars">${
      Array(total).fill(0).map((_,i)=> i<stars?'<span class="g">⭐</span>':'<span class="o">☆</span>').join('')
    }</div>
    <p style="color:var(--ink-soft);font-weight:700;margin:10px 0 0">
      本关获得 <b>${stars}</b> 颗小星星${sticker?`，还有一枚 <span style="font-size:28px">${sticker}</span> 贴纸`:''}
    </p>
    <div class="row">
      <button class="btn yellow" data-act="again">再来一关</button>
      <button class="btn blue"   data-act="switch">换个乐园</button>
      <button class="btn ghost"  data-act="home">回首页</button>
    </div>
  `);
  root.appendChild(s);

  audio.fanfare();

  s.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if(!b) return;
    audio.tap();
    const act = b.dataset.act;
    if(act==='again') go('level',{ subject });
    else if(act==='switch') go('level',{ subject: subject==='math' ? 'chinese' : 'math' });
    else go('home');
  });
}
