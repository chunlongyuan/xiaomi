// 数字排队 —— 3 轮全过赢；点错顺序 3 次输
import { el, rand, shuffle } from '../ui/common.js';
import { showGameOver, renderLives } from './_gameover.js';

const ROUNDS = 3;
const N = 5;
const MAX_LIVES = 3;

export function playOrder(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div','order');
  root.appendChild(panel);
  start();

  function start(){
    let round = 0;
    let lives = MAX_LIVES;
    let stopped = false;

    panel.innerHTML = `
      <div class="reward-title">🎁 数字排队奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>第 <b class="round">1</b> 轮 / 共 ${ROUNDS} 轮</span>
          <span class="lives">${renderLives(lives, MAX_LIVES)}</span>
        </div>
      </div>
      <div class="order-hint">按 <b>1 → 2 → 3 → 4 → 5</b> 顺序点，点错 3 次就输了</div>
      <div class="order-arena"></div>
    `;
    const arena = panel.querySelector('.order-arena');
    const progEl = panel.querySelector('.wh-progress');
    const livesEl = panel.querySelector('.lives');
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
      const cells = [];
      for(let r=0;r<4;r++) for(let c=0;c<5;c++) cells.push([r,c]);
      const chosen = shuffle(cells).slice(0, N);
      let expected = 1;

      chosen.forEach(([r,c], i) => {
        const num = i + 1;
        const dot = el('button','order-dot', String(num));
        dot.style.gridRow = (r+1);
        dot.style.gridColumn = (c+1);
        dot.style.transform = `translate(${rand(-8,8)}px, ${rand(-8,8)}px)`;
        dot.dataset.num = String(num);
        dot.addEventListener('click', () => tap(dot, num));
        arena.appendChild(dot);
      });

      function tap(dot, num){
        if(stopped || dot.classList.contains('done')) return;
        if(num === expected){
          dot.classList.add('done');
          audio.pop();
          audio.speak(String(num));
          expected += 1;
          if(expected > N){
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
          dot.classList.add('wrong');
          audio.wrong();
          lives -= 1;
          livesEl.innerHTML = renderLives(lives, MAX_LIVES);
          setTimeout(()=> dot.classList.remove('wrong'), 300);
          if(lives <= 0){
            stopped = true;
            setTimeout(()=>{
              showGameOver(panel, {
                title:'💔 顺序点错太多次',
                desc:`过了 ${round} 轮，记得从 1 开始一个一个点哦`,
                onRetry: start,
                onGiveUp: ()=> onDone(false),
              });
            }, 400);
          }
        }
      }
    }
  }
}
