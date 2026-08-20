// 通用"游戏结束"覆盖层 —— 失败时显示，可以重来
import { el } from '../ui/common.js';

// onRetry: 重玩这一局；onGiveUp: 放弃（当作完成，继续流程）
export function showGameOver(panel, { title='😵 失败啦', desc='', onRetry, onGiveUp }){
  const ov = el('div','gameover-overlay');
  ov.innerHTML = `
    <div class="gameover-card">
      <div class="go-emoji">💥</div>
      <div class="go-title">${title}</div>
      ${desc ? `<div class="go-desc">${desc}</div>` : ''}
      <div class="go-actions">
        <button class="btn yellow" data-retry>🔄 再来一次</button>
        <button class="btn ghost"  data-skip>跳过</button>
      </div>
    </div>`;
  panel.appendChild(ov);
  requestAnimationFrame(()=> ov.classList.add('show'));
  ov.querySelector('[data-retry]').addEventListener('click', ()=>{ ov.remove(); onRetry && onRetry(); });
  ov.querySelector('[data-skip]').addEventListener('click',  ()=>{ ov.remove(); onGiveUp && onGiveUp(); });
}

// 生命值显示（❤️❤️❤️）
export function renderLives(n, max=3){
  return Array(max).fill(0).map((_,i) =>
    `<span class="life ${i<n?'on':'off'}">${i<n?'❤️':'🖤'}</span>`
  ).join('');
}
