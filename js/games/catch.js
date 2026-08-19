// 接水果 —— 篮子跟着手指移动，接住 5 个水果
import { el, rand } from '../ui/common.js';

const FRUITS = ['🍎','🍌','🍓','🍇','🍉','🍑','🍊','🥝','🍐','🥭'];
const GOAL = 5;

export function playCatch(ctx, onDone){
  const { root, audio } = ctx;
  let caught = 0;
  let stopped = false;
  let basketX = 50;   // 篮子中心 x（%）

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
    <div class="whack-tip">点击/拖动移动篮子，接住掉下来的水果</div>
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

  function moveTo(clientX){
    const rect = arena.getBoundingClientRect();
    const x = Math.min(95, Math.max(5, ((clientX - rect.left) / rect.width) * 100));
    basketX = x;
    basket.style.left = x + '%';
  }
  arena.addEventListener('pointerdown', e => moveTo(e.clientX));
  arena.addEventListener('pointermove', e => { if(e.buttons) moveTo(e.clientX); });
  arena.addEventListener('touchmove',   e => { if(e.touches[0]) moveTo(e.touches[0].clientX); }, { passive:true });

  function spawn(){
    if(stopped) return;
    const emoji = FRUITS[rand(0, FRUITS.length-1)];
    const startX = 10 + Math.random()*80;
    const f = el('div','catch-fruit', emoji);
    f.style.left = startX + '%';
    // 下落时长（越到后面越快）
    const dur = 3400 - Math.min(caught*180, 1200) + Math.random()*600;
    f.style.animationDuration = dur + 'ms';
    arena.appendChild(f);
    // 到达底部时判断是否落入篮子
    setTimeout(() => {
      if(stopped) return;
      if(Math.abs(startX - basketX) < 10){
        // 命中
        caught += 1;
        audio.pop();
        audio.right();
        renderProgress();
        panel.querySelector('.hit').textContent = String(caught);
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
      }
      f.remove();
    }, dur - 100);
    const nextIn = 900 - Math.min(caught*70, 500) + Math.random()*500;
    setTimeout(spawn, nextIn);
  }
  setTimeout(spawn, 400);
}
