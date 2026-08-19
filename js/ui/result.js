import { el, topbar, starsRow, confetti, burst } from './common.js';

export function renderResult(ctx){
  const { root, params, audio, go } = ctx;
  const stars = params.stars ?? 0;
  const total = params.total ?? 5;
  const sticker = params.sticker;
  const subject = params.subject || 'math';
  const level = params.level;
  const tier = params.tier;

  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const emoji = stars === total ? '🏆' : stars >= total*0.6 ? '🥳' : '💪';
  const words = stars === total ? '太厉害啦！全对！' : stars >= total*0.6 ? '真棒！继续加油！' : '这次不错，下次会更好！';

  const s = el('div','result', `
    <div class="big">${emoji}</div>
    <h2>${words}</h2>
    <div class="score-stars">${starsRow(stars, total)}</div>
    <p class="score-meta">
      本关获得 <b>${stars}</b> 颗小星星${sticker?`<br>还有一枚 <span style="font-size:32px">${sticker}</span> 贴纸`:''}
    </p>
    <div class="row">
      <button class="btn yellow" data-act="again">再来一关</button>
      <button class="btn blue" data-act="diff">换分级</button>
      <button class="btn green" data-act="switch">换个乐园</button>
      <button class="btn ghost" data-act="home">回首页</button>
    </div>
  `);
  root.appendChild(s);

  if(stars === total){ confetti(2200, 100); setTimeout(()=>burst('🏆'), 300); }
  audio.fanfare();

  s.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if(!b) return;
    audio.tap();
    const act = b.dataset.act;
    if(act==='again') go('level',{ subject, level, tier });
    else if(act==='diff') go('difficulty',{ subject });
    else if(act==='switch') go('difficulty',{ subject: subject==='math' ? 'chinese' : 'math' });
    else go('home');
  });
}
