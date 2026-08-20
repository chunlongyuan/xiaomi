// 打地鼠 —— 敲够目标数赢；敲错 3 次输
import { el, rand } from '../ui/common.js';
import { flashPenalty } from './_penalty.js';
import { showGameOver, renderLives } from './_gameover.js';

const MOLES = ['🦁','🐼','🐰','🦄','🐸','🐵','🐨','🐯','🐧','🦊','🐶','🐱','🐔','🐮'];
const CHEERS = ['打中啦！','太棒了！','厉害！','真准！','好眼力！'];
const MAX_LIVES = 3;

export function playWhack(ctx, onDone){
  const { root, audio } = ctx;
  let GOAL = 5;
  const panel = el('div','memory');
  root.appendChild(panel);
  start();

  function start(){
    let hits = 0;
    let lives = MAX_LIVES;
    let currentIdx = -1;
    let stopped = false;
    let timer = null;

    panel.innerHTML = `
      <div class="reward-title">🎁 打地鼠奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>已敲 <b class="hit">0</b> / <b class="goal">${GOAL}</b></span>
          <span class="lives">${renderLives(lives, MAX_LIVES)}</span>
          <span class="wh-diff">
            <button class="chip${GOAL===3?' on':''}" data-goal="3">容易 3</button>
            <button class="chip${GOAL===5?' on':''}" data-goal="5">一般 5</button>
            <button class="chip${GOAL===8?' on':''}" data-goal="8">挑战 8</button>
          </span>
        </div>
      </div>
      <div class="whack-grid"></div>
      <div class="whack-tip">看到小动物冒出来，赶快点它！敲空 3 次就输了</div>
    `;
    const grid = panel.querySelector('.whack-grid');
    const progressEl = panel.querySelector('.wh-progress');
    const livesEl = panel.querySelector('.lives');

    panel.querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', () => {
        audio.tap();
        GOAL = parseInt(b.dataset.goal, 10);
        clearTimeout(timer);
        stopped = true;
        start();
      });
    });

    const holes = [];
    for(let i=0;i<9;i++){
      const h = el('button','whack-hole', `<span class="mole"></span><span class="pt"></span>`);
      h.addEventListener('click', ()=> hit(i));
      grid.appendChild(h);
      holes.push(h);
    }
    renderProgress();

    function renderProgress(){
      progressEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
        `<span class="wp ${i<hits?'on':''}">⭐</span>`
      ).join('');
    }

    function show(){
      if(stopped) return;
      if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
      let next;
      do { next = rand(0, 8); } while(next === currentIdx && Math.random() > 0.15);
      currentIdx = next;
      const emoji = MOLES[rand(0, MOLES.length-1)];
      holes[currentIdx].querySelector('.mole').textContent = emoji;
      holes[currentIdx].classList.remove('bonk');
      holes[currentIdx].classList.add('up');
      audio.pop();
      const base = 1400 - Math.min(hits * 70, 500);
      timer = setTimeout(hide, base + Math.random() * 300);
    }
    function hide(){
      if(stopped) return;
      if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
      timer = setTimeout(show, 150 + Math.random()*200);
    }

    function hit(i){
      if(stopped) return;
      if(i !== currentIdx || !holes[i].classList.contains('up')){
        // 敲空 —— 扣一条命
        holes[i].classList.add('miss');
        setTimeout(()=> holes[i].classList.remove('miss'), 240);
        audio.wrong();
        lives -= 1;
        livesEl.innerHTML = renderLives(lives, MAX_LIVES);
        flashPenalty(panel, '💔');
        if(lives <= 0) return lose();
        return;
      }
      clearTimeout(timer);
      hits += 1;
      holes[i].classList.remove('up');
      const pt = holes[i].querySelector('.pt');
      pt.textContent = '+1 ⭐';
      pt.classList.add('show');
      setTimeout(()=> pt.classList.remove('show'), 700);
      holes[i].classList.add('bonk');
      audio.bonk();
      setTimeout(()=> audio.right(), 60);
      if(hits === 1 || hits === GOAL || Math.random() < 0.35){
        audio.speak(CHEERS[rand(0, CHEERS.length-1)]);
      }
      panel.querySelector('.hit').textContent = String(hits);
      renderProgress();

      if(hits >= GOAL){
        stopped = true;
        audio.fanfare();
        panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
        setTimeout(()=> onDone(true), 700);
      } else {
        timer = setTimeout(show, 280);
      }
    }

    function lose(){
      stopped = true;
      clearTimeout(timer);
      holes.forEach(h => h.classList.remove('up'));
      panel.querySelector('.whack-tip').textContent = '💔 没有生命值啦…';
      setTimeout(()=>{
        showGameOver(panel, {
          title:'💔 生命值用完了',
          desc:`敲中了 ${hits} 只，敲空 ${MAX_LIVES} 次就结束咯`,
          onDone: ()=> onDone(false),
        });
      }, 400);
    }

    timer = setTimeout(show, 400);
  }
}
