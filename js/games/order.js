// 数字排队 —— 屏幕上随机分布 1-5 数字圆点，按顺序点击
import { el, rand, shuffle } from '../ui/common.js';

const ROUNDS = 3;         // 三轮通关
const N = 5;              // 每轮 5 个数字

export function playOrder(ctx, onDone){
  const { root, audio } = ctx;
  let round = 0;
  let stopped = false;

  const panel = el('div','order');
  panel.innerHTML = `
    <div class="reward-title">🎁 数字排队奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta">
        <span>第 <b class="round">1</b> 轮 / 共 ${ROUNDS} 轮</span>
      </div>
    </div>
    <div class="order-hint">按 <b>1 → 2 → 3 → 4 → 5</b> 顺序点</div>
    <div class="order-arena"></div>
  `;
  const arena = panel.querySelector('.order-arena');
  const progEl = panel.querySelector('.wh-progress');
  root.appendChild(panel);

  renderProgress();
  startRound();

  function renderProgress(){
    progEl.innerHTML = Array(ROUNDS).fill(0).map((_,i) =>
      `<span class="wp ${i<round?'on':''}">⭐</span>`
    ).join('');
  }

  function startRound(){
    if(stopped) return;
    panel.querySelector('.round').textContent = String(round+1);
    arena.innerHTML = '';

    // 生成 N 个数字，随机分布在 5x4 网格里，不重叠
    const cells = [];
    for(let r=0;r<4;r++) for(let c=0;c<5;c++) cells.push([r,c]);
    const chosen = shuffle(cells).slice(0, N);

    let expected = 1;
    chosen.forEach(([r,c], i) => {
      const num = i + 1;
      const dot = el('button','order-dot', String(num));
      dot.style.gridRow = (r+1);
      dot.style.gridColumn = (c+1);
      // 轻微随机偏移让排列更活泼
      dot.style.transform = `translate(${rand(-8,8)}px, ${rand(-8,8)}px)`;
      dot.dataset.num = String(num);
      dot.addEventListener('click', () => tap(dot, num));
      arena.appendChild(dot);
    });

    function tap(dot, num){
      if(dot.classList.contains('done')) return;
      if(num === expected){
        dot.classList.add('done');
        audio.pop();
        audio.speak(String(num));
        expected += 1;
        if(expected > N){
          // 本轮通关
          audio.right();
          round += 1;
          renderProgress();
          if(round >= ROUNDS){
            stopped = true;
            audio.fanfare();
            setTimeout(()=> onDone(true), 700);
          } else {
            setTimeout(startRound, 600);
          }
        }
      } else {
        // 错序 → 抖一下
        dot.classList.add('wrong');
        audio.wrong();
        setTimeout(()=> dot.classList.remove('wrong'), 300);
      }
    }
  }
}
