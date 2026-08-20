// 接水果 —— 接够 5 个赢；漏掉 3 个输
import { el, rand } from '../ui/common.js';
import { flashPenalty } from './_penalty.js';
import { showGameOver, renderLives } from './_gameover.js';

const FRUITS = ['🍎','🍌','🍓','🍇','🍉','🍑','🍊','🥝','🍐','🥭'];
const GOAL = 5;
const MAX_LIVES = 3;

export function playCatch(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div','catch');
  root.appendChild(panel);
  start();

  function start(){
    let caught = 0;
    let lives = MAX_LIVES;
    let stopped = false;
    let basketX = 50;
    let arenaRect = null;
    const timers = [];

    panel.innerHTML = `
      <div class="reward-title">🎁 接水果奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>已接 <b class="hit">0</b> / <b>${GOAL}</b></span>
          <span class="lives">${renderLives(lives, MAX_LIVES)}</span>
        </div>
      </div>
      <div class="catch-arena"><div class="catch-basket">🧺</div></div>
      <div class="whack-tip">按住并左右滑动接水果，漏掉 3 个就输了</div>
    `;
    const arena = panel.querySelector('.catch-arena');
    const basket = panel.querySelector('.catch-basket');
    const progEl = panel.querySelector('.wh-progress');
    const livesEl = panel.querySelector('.lives');
    renderProgress();
    basket.style.left = basketX + '%';

    function renderProgress(){
      progEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
        `<span class="wp ${i<caught?'on':''}">⭐</span>`
      ).join('');
    }
    function later(fn, ms){ const t = setTimeout(fn, ms); timers.push(t); return t; }
    function stopAll(){
      stopped = true;
      timers.forEach(clearTimeout);
      [...arena.querySelectorAll('.catch-fruit')].forEach(x => x.remove());
    }

    // 跟手滑动
    let rafPending = false, pendingX = null;
    function schedule(){
      if(rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        if(pendingX == null) return;
        basketX = pendingX; pendingX = null;
        basket.style.left = basketX + '%';
      });
    }
    function moveTo(clientX){
      if(!arenaRect) arenaRect = arena.getBoundingClientRect();
      pendingX = Math.min(95, Math.max(5, ((clientX - arenaRect.left) / arenaRect.width) * 100));
      schedule();
    }
    arena.addEventListener('pointerdown', e => {
      arenaRect = arena.getBoundingClientRect();
      arena.setPointerCapture?.(e.pointerId);
      moveTo(e.clientX);
    });
    arena.addEventListener('pointermove', e => { if(e.buttons) moveTo(e.clientX); });
    arena.addEventListener('pointerup', e => { arena.releasePointerCapture?.(e.pointerId); });
    arena.addEventListener('touchstart', e => {
      arenaRect = arena.getBoundingClientRect();
      if(e.touches[0]) moveTo(e.touches[0].clientX);
    }, { passive:true });
    arena.addEventListener('touchmove', e => {
      if(e.touches[0]) moveTo(e.touches[0].clientX);
    }, { passive:true });
    window.addEventListener('resize', () => { arenaRect = null; });

    function spawn(){
      if(stopped) return;
      const emoji = FRUITS[rand(0, FRUITS.length-1)];
      const startX = 10 + Math.random()*80;
      const f = el('div','catch-fruit', emoji);
      f.style.left = startX + '%';
      const dur = 3400 - Math.min(caught*180, 1200) + Math.random()*600;
      f.style.animationDuration = dur + 'ms';
      arena.appendChild(f);
      later(() => {
        if(stopped){ f.remove(); return; }
        const hit = Math.abs(startX - basketX) < 10;
        if(hit){
          caught += 1;
          audio.pop(); audio.right();
          if(caught > GOAL) caught = GOAL;
          panel.querySelector('.hit').textContent = String(caught);
          renderProgress();
          basket.classList.add('bounce');
          setTimeout(()=> basket.classList.remove('bounce'), 250);
          f.remove();
          if(caught >= GOAL){
            stopAll();
            audio.fanfare();
            panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
            later(()=> onDone(true), 700);
          }
        } else {
          lives -= 1;
          audio.wrong();
          livesEl.innerHTML = renderLives(lives, MAX_LIVES);
          flashPenalty(panel, '💔');
          f.remove();
          if(lives <= 0) return lose();
        }
      }, dur - 100);
      const nextIn = 900 - Math.min(caught*70, 500) + Math.random()*500;
      later(spawn, nextIn);
    }

    function lose(){
      stopAll();
      panel.querySelector('.whack-tip').textContent = '💔 漏掉太多啦…';
      setTimeout(()=>{
        showGameOver(panel, {
          title:'💔 水果掉光了',
          desc:`接住了 ${caught} 个，漏掉 ${MAX_LIVES} 个就结束咯`,
          onRetry: start,
          onGiveUp: ()=> onDone(false),
        });
      }, 400);
    }

    later(spawn, 400);
  }
}
