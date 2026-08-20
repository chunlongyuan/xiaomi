// 戳气球 —— 气球越飘越快，戳够 5 个赢；戳到炸弹 💣 直接输
import { el, rand } from '../ui/common.js';
import { flashPenalty } from './_penalty.js';
import { showGameOver } from './_gameover.js';

const COLORS = ['🎈','🎈','🎈','🎈','🩷','💛','💚','💙','💜'];
const GOAL = 5;
const BOMB_RATE = 0.22;     // 22% 概率出炸弹

export function playBalloon(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div','balloon');
  root.appendChild(panel);
  start();

  function start(){
    let hits = 0;
    let missStreak = 0;
    let stopped = false;
    const timers = [];

    panel.innerHTML = `
      <div class="reward-title">🎁 戳气球奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>已戳 <b class="hit">0</b> / <b>${GOAL}</b></span>
          <span class="bomb-warn">⚠️ 别戳 💣 炸弹！</span>
        </div>
      </div>
      <div class="balloon-arena"></div>
      <div class="whack-tip">戳中气球，躲开炸弹！越到后面越快</div>
    `;
    const arena = panel.querySelector('.balloon-arena');
    const progressEl = panel.querySelector('.wh-progress');
    renderProgress();

    function renderProgress(){
      progressEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
        `<span class="wp ${i<hits?'on':''}">⭐</span>`
      ).join('');
    }
    function later(fn, ms){ const t = setTimeout(fn, ms); timers.push(t); return t; }
    function stopAll(){
      stopped = true;
      timers.forEach(clearTimeout);
      [...arena.children].forEach(x => x.remove());
    }

    function spawn(){
      if(stopped) return;
      const isBomb = Math.random() < BOMB_RATE;
      const emoji = isBomb ? '💣' : COLORS[rand(0, COLORS.length-1)];
      const b = el('button','balloon-item' + (isBomb?' bomb':''), emoji);
      b.style.left = (10 + Math.random()*80) + '%';
      const dur = Math.max(1500, 4000 - hits * 500) + Math.random()*400;
      b.style.animationDuration = dur + 'ms';
      b.style.setProperty('--sway', ((Math.random()*40 - 20) | 0) + 'px');
      arena.appendChild(b);

      b.addEventListener('animationend', () => {
        // 气球飘走没戳中才算漏；炸弹飘走是好事
        if(!isBomb && !b.classList.contains('popped') && !stopped){
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

      b.addEventListener('click', () => {
        if(stopped || b.classList.contains('popped')) return;
        if(isBomb){ boom(b); return; }
        missStreak = 0;
        pop(b);
      });

      const nextIn = Math.max(280, 800 - hits * 100) + Math.random()*250;
      later(spawn, nextIn);
    }

    function pop(b){
      b.classList.add('popped');
      hits += 1;
      audio.pop(); audio.right();
      if(hits > GOAL) hits = GOAL;
      panel.querySelector('.hit').textContent = String(hits);
      renderProgress();
      later(()=> b.remove(), 350);
      if(hits >= GOAL){
        stopAll();
        audio.fanfare();
        panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
        later(()=> onDone(true), 700);
      }
    }

    function boom(b){
      b.classList.add('exploded');
      audio.wrong();
      stopAll();
      panel.querySelector('.whack-tip').textContent = '💥 戳到炸弹了…';
      later(()=> {
        showGameOver(panel, {
          title:'💥 戳到炸弹啦！',
          desc:`这次戳中了 ${hits} 个气球，下次躲开炸弹试试～`,
          onRetry: start,
          onGiveUp: ()=> onDone(false),
        });
      }, 500);
    }

    later(spawn, 300);
  }
}
