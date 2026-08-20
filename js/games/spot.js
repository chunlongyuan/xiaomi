// 找不同 —— 5 关全过赢；点错 3 次输
import { el, rand } from '../ui/common.js';
import { showGameOver, renderLives } from './_gameover.js';

const CANDIDATES = [
  ['🐶','🐺'], ['🐱','🐯'], ['🐰','🐭'], ['🐻','🐼'],
  ['🦁','🐯'], ['🐸','🐢'], ['🐟','🐳'], ['🐦','🦆'],
  ['🍎','🍅'], ['🍌','🌽'], ['🌸','🌺'], ['⭐','✨'],
  ['🚗','🚕'], ['⚽','🏀'], ['☀️','🌙'], ['🎈','🎁'],
];
const ROUNDS = 5;
const MAX_LIVES = 3;

export function playSpot(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div','spot');
  root.appendChild(panel);
  start();

  function start(){
    let round = 0;
    let lives = MAX_LIVES;
    let stopped = false;

    panel.innerHTML = `
      <div class="reward-title">🎁 找不同奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>第 <b class="round">1</b> 关 / 共 ${ROUNDS} 关</span>
          <span class="lives">${renderLives(lives, MAX_LIVES)}</span>
        </div>
      </div>
      <div class="spot-hint">哪个图案跟别的<b>不一样</b>？点错 3 次就输了</div>
      <div class="spot-grid"></div>
    `;
    const grid = panel.querySelector('.spot-grid');
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
      grid.innerHTML = '';
      const pair = CANDIDATES[rand(0, CANDIDATES.length-1)];
      const [same, diff] = Math.random()<0.5 ? pair : [pair[1], pair[0]];
      const diffIdx = rand(0, 8);
      for(let i=0;i<9;i++){
        const em = i===diffIdx ? diff : same;
        // 统一翻牌卡：点中翻面显示 ✓ / ✗
        const cell = el('button','flipcard spot-cell', `
          <div class="fc-face fc-front">${em}</div>
          <div class="fc-face fc-back">${i===diffIdx ? '✅' : '❌'}</div>
        `);
        cell.addEventListener('click', () => tap(cell, i===diffIdx));
        grid.appendChild(cell);
      }
    }
    function tap(cell, correct){
      if(stopped || cell.classList.contains('flipped')) return;
      audio.tap();
      if(correct){
        cell.classList.add('flipped','fc-ok');
        audio.right();
        round += 1;
        renderProgress();
        if(round >= ROUNDS){
          stopped = true;
          audio.fanfare();
          setTimeout(()=> onDone(true), 700);
        } else {
          setTimeout(startRound, 700);
        }
      } else {
        cell.classList.add('flipped','fc-bad');
        audio.wrong();
        lives -= 1;
        livesEl.innerHTML = renderLives(lives, MAX_LIVES);
        // 翻回正面让孩子继续找
        setTimeout(()=> cell.classList.remove('flipped','fc-bad'), 800);
        if(lives <= 0){
          stopped = true;
          setTimeout(()=>{
            showGameOver(panel, {
              title:'💔 找错太多次啦',
              desc:`过了 ${round} 关，再仔细看看试试～`,
              onDone: ()=> onDone(false),
            });
          }, 400);
        }
      }
    }
  }
}
