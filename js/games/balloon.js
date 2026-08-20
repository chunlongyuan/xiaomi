// 戳气球 —— 各色气球从底部飘上来，速度越来越快，戳够 5 个胜利
import { el, rand } from '../ui/common.js';
import { flashPenalty } from './_penalty.js';

const COLORS = ['🎈','🎈','🎈','🎈','🩷','💛','💚','💙','💜'];
const GOAL = 5;

export function playBalloon(ctx, onDone){
  const { root, audio } = ctx;
  let hits = 0;
  let missStreak = 0;
  let stopped = false;
  const spawned = [];

  const panel = el('div','balloon');
  panel.innerHTML = `
    <div class="reward-title">🎁 戳气球奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta">
        <span>已戳 <b class="hit">0</b> / <b>${GOAL}</b></span>
      </div>
    </div>
    <div class="balloon-arena"></div>
    <div class="whack-tip">戳中飘起来的气球！越到后面越快哦</div>
  `;
  const arena = panel.querySelector('.balloon-arena');
  const progressEl = panel.querySelector('.wh-progress');
  root.appendChild(panel);
  renderProgress();

  function renderProgress(){
    progressEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
      `<span class="wp ${i<hits?'on':''}">⭐</span>`
    ).join('');
  }

  function spawn(){
    if(stopped) return;
    const emoji = COLORS[rand(0, COLORS.length-1)];
    const b = el('button','balloon-item', emoji);
    b.style.left = (10 + Math.random()*80) + '%';
    // 上升越来越快：起始 4000ms，每命中 1 个减 500ms，最快约 1500ms
    const dur = Math.max(1500, 4000 - hits * 500) + Math.random()*400;
    b.style.animationDuration = dur + 'ms';
    b.style.setProperty('--sway', ((Math.random()*40 - 20) | 0) + 'px');
    arena.appendChild(b);
    spawned.push(b);
    b.addEventListener('animationend', () => {
      if(!b.classList.contains('popped') && !stopped){
        missStreak += 1;
        if(missStreak >= 2){
          missStreak = 0;
          if(hits > 0){
            hits -= 1;
            audio.wrong();
            panel.querySelector('.hit').textContent = String(hits);
            renderProgress();
            flashPenalty(panel, '-1');
          }
        }
      }
      b.remove();
    }, { once:true });
    b.addEventListener('click', () => { missStreak = 0; pop(b); });

    // 出球间隔也越来越紧
    const nextIn = Math.max(280, 800 - hits * 100) + Math.random()*250;
    setTimeout(spawn, nextIn);
  }

  function pop(b){
    if(stopped || b.classList.contains('popped')) return;
    b.classList.add('popped');
    hits += 1;
    audio.pop(); audio.right();
    if(hits > GOAL) hits = GOAL;
    panel.querySelector('.hit').textContent = String(hits);
    renderProgress();
    setTimeout(()=> b.remove(), 350);
    if(hits >= GOAL){
      stopped = true;
      audio.fanfare();
      panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
      spawned.forEach(x => { try{ x.remove(); }catch{} });
      setTimeout(()=> onDone(true), 700);
    }
  }

  setTimeout(spawn, 300);
}
