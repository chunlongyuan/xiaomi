// 接水果 —— 篮子跟手指移动，接住 5 个水果通关
import { el, rand } from '../ui/common.js';
import { flashPenalty } from './_penalty.js';

const FRUITS = ['🍎','🍌','🍓','🍇','🍉','🍑','🍊','🥝','🍐','🥭'];
const GOAL = 5;

export function playCatch(ctx, onDone){
  const { root, audio } = ctx;
  let caught = 0;
  let missStreak = 0;
  let stopped = false;
  let basketX = 50;      // 篮子中心 x（%）
  let arenaRect = null;

  const panel = el('div','catch');
  panel.innerHTML = `
    <div class="reward-title">🎁 接水果奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta"><span>已接 <b class="hit">0</b> / <b>${GOAL}</b></span></div>
    </div>
    <div class="catch-arena">
      <div class="catch-basket">🧺</div>
    </div>
    <div class="whack-tip">按住并左右滑动移动篮子</div>
  `;
  const arena = panel.querySelector('.catch-arena');
  const basket = panel.querySelector('.catch-basket');
  const progEl = panel.querySelector('.wh-progress');
  root.appendChild(panel);
  renderProgress();

  function renderProgress(){
    progEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
      `<span class="wp ${i<caught?'on':''}">⭐</span>`
    ).join('');
  }
  basket.style.left = basketX + '%';

  // 滑动流畅性：pointer 事件 + rAF + 无 CSS transition，篮子严丝合缝跟手
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
  arena.addEventListener('pointermove', e => {
    if(e.buttons) moveTo(e.clientX);
  });
  arena.addEventListener('pointerup', e => { arena.releasePointerCapture?.(e.pointerId); });
  // 触屏 fallback（部分老 iOS）
  arena.addEventListener('touchstart', e => {
    arenaRect = arena.getBoundingClientRect();
    if(e.touches[0]) moveTo(e.touches[0].clientX);
  }, { passive:true });
  arena.addEventListener('touchmove', e => {
    if(e.touches[0]) moveTo(e.touches[0].clientX);
  }, { passive:true });
  // 窗口尺寸变化重算
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
    setTimeout(() => {
      if(stopped){ f.remove(); return; }
      const hit = Math.abs(startX - basketX) < 10;
      if(hit){
        missStreak = 0;
        caught += 1;
        audio.pop(); audio.right();
        if(caught > GOAL) caught = GOAL;
        panel.querySelector('.hit').textContent = String(caught);
        renderProgress();
        basket.classList.add('bounce');
        setTimeout(()=> basket.classList.remove('bounce'), 250);
        if(caught >= GOAL){
          stopped = true;
          audio.fanfare();
          panel.querySelector('.whack-tip').textContent = '🏆 完成任务！';
          [...arena.querySelectorAll('.catch-fruit')].forEach(x => x.remove());
          setTimeout(()=> onDone(true), 700);
          return;
        }
      } else {
        missStreak += 1;
        if(missStreak >= 2){
          missStreak = 0;
          if(caught > 0){
            caught -= 1;
            audio.wrong();
            panel.querySelector('.hit').textContent = String(caught);
            renderProgress();
            flashPenalty(panel, '-1');
          }
        }
      }
      f.remove();
    }, dur - 100);
    const nextIn = 900 - Math.min(caught*70, 500) + Math.random()*500;
    setTimeout(spawn, nextIn);
  }
  setTimeout(spawn, 400);
}
