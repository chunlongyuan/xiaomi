// 找不同 —— 3x3 网格 8 个一样 + 1 个不一样，点出那个特殊的
import { el, rand, shuffle } from '../ui/common.js';

const CANDIDATES = [
  ['🐶','🐺'], ['🐱','🐯'], ['🐰','🐭'], ['🐻','🐼'],
  ['🦁','🐯'], ['🐸','🐢'], ['🐟','🐳'], ['🐦','🦆'],
  ['🍎','🍅'], ['🍌','🌽'], ['🌸','🌺'], ['⭐','✨'],
  ['🚗','🚕'], ['⚽','🏀'], ['☀️','🌙'], ['🎈','🎁'],
];
const ROUNDS = 5;

export function playSpot(ctx, onDone){
  const { root, audio } = ctx;
  let round = 0;
  let stopped = false;

  const panel = el('div','spot');
  panel.innerHTML = `
    <div class="reward-title">🎁 找不同奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta"><span>第 <b class="round">1</b> 关 / 共 ${ROUNDS} 关</span></div>
    </div>
    <div class="spot-hint">哪个图案跟别的<b>不一样</b>？</div>
    <div class="spot-grid"></div>
  `;
  const grid = panel.querySelector('.spot-grid');
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
    grid.innerHTML = '';
    const pair = CANDIDATES[rand(0, CANDIDATES.length-1)];
    const [same, diff] = Math.random()<0.5 ? pair : [pair[1], pair[0]];
    const diffIdx = rand(0, 8);
    for(let i=0;i<9;i++){
      const emoji = i===diffIdx ? diff : same;
      const cell = el('button','spot-cell', emoji);
      cell.addEventListener('click', () => tap(cell, i===diffIdx));
      grid.appendChild(cell);
    }
  }
  function tap(cell, correct){
    if(stopped) return;
    if(correct){
      cell.classList.add('correct');
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
      cell.classList.add('wrong');
      audio.wrong();
      setTimeout(()=> cell.classList.remove('wrong'), 300);
    }
  }
}
