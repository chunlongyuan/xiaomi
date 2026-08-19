// 戳气球 —— 各色气球从底部飘上来，戳够 5 个胜利
import { el, rand } from '../ui/common.js';

const COLORS = ['🎈','🎈','🎈','🩷','💛','💚','💙','💜'];
const GOAL = 5;

export function playBalloon(ctx, onDone){
  const { root, audio } = ctx;
  let hits = 0;
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
    <div class="whack-tip">戳中飘起来的气球！</div>
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
    const isStar = Math.random() < 0.18;                // 18% 概率出金色奖励星
    const emoji = isStar ? '⭐' : COLORS[rand(0, COLORS.length-1)];
    const b = el('button','balloon-item' + (isStar?' star-bonus':''), emoji);
    b.style.left = (10 + Math.random()*80) + '%';
    const dur = 4200 - Math.min(hits * 200, 1400) + Math.random()*800;
    b.style.animationDuration = dur + 'ms';
    b.style.setProperty('--sway', ((Math.random()*40 - 20) | 0) + 'px');
    arena.appendChild(b);
    spawned.push(b);
    b.addEventListener('animationend', () => b.remove(), { once:true });
    b.addEventListener('click', () => pop(b, isStar));

    const nextIn = 700 - Math.min(hits*60, 400) + Math.random()*400;
    setTimeout(spawn, nextIn);
  }

  function pop(b, isStar){
    if(stopped || b.classList.contains('popped')) return;
    b.classList.add('popped');
    if(isStar){
      hits += 2;                                        // 星星值 2 分
      audio.fanfare();
      panel.querySelector('.whack-tip').textContent = '🌟 星星奖励 +2！';
      setTimeout(()=>{
        if(!stopped) panel.querySelector('.whack-tip').textContent = '戳中飘起来的气球！';
      }, 1200);
    } else {
      hits += 1;
      audio.pop(); audio.right();
    }
    if(hits > GOAL) hits = GOAL;
    renderProgress();
    panel.querySelector('.hit').textContent = String(hits);
    setTimeout(()=> b.remove(), 350);
    if(hits >= GOAL){
      stopped = true;
      audio.fanfare();
      panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
      spawned.forEach(x => { try{ x.remove(); }catch{} });
      setTimeout(()=> onDone(true), 700);
    }
  }

  // 启动
  setTimeout(spawn, 300);
}
