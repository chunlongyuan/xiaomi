// 通用"游戏结束"覆盖层
// 奖励游戏输了就是输了 —— 不给"再来一次"，只能继续（一次机会才有分量）
import { el } from '../ui/common.js';

export function showGameOver(panel, { title='😵 失败啦', desc='', onDone }){
  const ov = el('div','gameover-overlay');
  ov.innerHTML = `
    <div class="gameover-card">
      <div class="go-emoji">💥</div>
      <div class="go-title">${title}</div>
      ${desc ? `<div class="go-desc">${desc}</div>` : ''}
      <div class="go-actions">
        <button class="btn yellow" data-continue>继续 →</button>
      </div>
    </div>`;
  panel.appendChild(ov);
  requestAnimationFrame(()=> ov.classList.add('show'));
  ov.querySelector('[data-continue]').addEventListener('click', ()=>{ ov.remove(); onDone && onDone(); });
}

// 生命值显示（❤️❤️❤️）
export function renderLives(n, max=3){
  return Array(max).fill(0).map((_,i) =>
    `<span class="life ${i<n?'on':'off'}">${i<n?'❤️':'🖤'}</span>`
  ).join('');
}
