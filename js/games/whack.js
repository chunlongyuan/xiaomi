// 打地鼠 v2 —— 幼儿友好
// - 动物随机（不再单调）
// - 停留时间足够长（1.8-2.4s），孩子来得及点
// - 命中时：地鼠变星星、屏幕短暂震一下、语音夸一句
// - 目标显示为 5 颗星条，视觉直观
// - 未命中不惩罚（不减分、不失败）
// - 3 次难度可选：容易(3只) / 一般(5只) / 挑战(8只)

import { el, rand } from '../ui/common.js';

const MOLES = ['🦁','🐼','🐰','🦄','🐸','🐵','🐨','🐯','🐧','🦊','🐶','🐱','🐔','🐮'];
const CHEERS = ['打中啦！','太棒了！','厉害！','真准！','好眼力！'];

export function playWhack(ctx, onDone){
  const { root, audio } = ctx;
  let GOAL = 5;
  let hits = 0;
  let currentIdx = -1;
  let stopped = false;
  let timer = null;

  const panel = el('div','memory');
  panel.innerHTML = `
    <div class="reward-title">🎁 打地鼠奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta">
        <span>已敲 <b class="hit">0</b> / <b class="goal">5</b></span>
        <span class="wh-diff">
          <button class="chip on" data-goal="3">容易 3</button>
          <button class="chip"    data-goal="5">一般 5</button>
          <button class="chip"    data-goal="8">挑战 8</button>
        </span>
      </div>
    </div>
    <div class="whack-grid"></div>
    <div class="whack-tip">看到小动物冒出来，赶快点它！</div>
  `;
  const grid = panel.querySelector('.whack-grid');
  const progressEl = panel.querySelector('.wh-progress');
  root.appendChild(panel);

  // 难度选择（可切换，切换后重置）
  panel.querySelectorAll('.chip').forEach(b => {
    b.addEventListener('click', () => {
      [...panel.querySelectorAll('.chip')].forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      GOAL = parseInt(b.dataset.goal, 10);
      hits = 0;
      panel.querySelector('.hit').textContent = '0';
      panel.querySelector('.goal').textContent = String(GOAL);
      renderProgress();
      audio.tap();
    });
  });
  renderProgress();

  // 9 个洞
  const holes = [];
  for(let i=0;i<9;i++){
    const h = el('button','whack-hole', `<span class="mole"></span><span class="pt"></span>`);
    h.addEventListener('click', ()=> hit(i));
    grid.appendChild(h);
    holes.push(h);
  }

  function renderProgress(){
    progressEl.innerHTML = Array(GOAL).fill(0).map((_,i) =>
      `<span class="wp ${i<hits?'on':''}">⭐</span>`
    ).join('');
  }

  function show(){
    if(stopped) return;
    if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
    // 找一个和上次不同的洞
    let next;
    do { next = rand(0, 8); } while(next === currentIdx && Math.random() > 0.15);
    currentIdx = next;
    const emoji = MOLES[rand(0, MOLES.length-1)];
    holes[currentIdx].querySelector('.mole').textContent = emoji;
    holes[currentIdx].classList.remove('bonk');
    holes[currentIdx].classList.add('up');
    audio.pop();
    // 停留时间加长；hits 越多越快一点点
    const base = 2200 - Math.min(hits * 80, 400);
    const dur = base + Math.random() * 400;
    timer = setTimeout(next2, dur);
  }
  function next2(){
    if(stopped) return;
    if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
    timer = setTimeout(show, 260 + Math.random()*260);
  }
  function hit(i){
    if(stopped) return;
    if(i !== currentIdx || !holes[i].classList.contains('up')){
      // 未命中：小提示、不扣分
      holes[i].classList.add('miss');
      setTimeout(()=> holes[i].classList.remove('miss'), 240);
      audio.tap();
      return;
    }
    // 命中！
    clearTimeout(timer);
    hits += 1;
    holes[i].classList.remove('up');
    // 展示 "+1" 飘字 + 星星特效
    const pt = holes[i].querySelector('.pt');
    pt.textContent = '+1 ⭐';
    pt.classList.add('show');
    setTimeout(()=> pt.classList.remove('show'), 700);
    holes[i].classList.add('bonk');
    audio.bonk();
    setTimeout(()=> audio.right(), 60);
    // 小夸奖（不太频繁）
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
      // 稍作停顿再出下一只
      timer = setTimeout(show, 500);
    }
  }
  // 启动
  timer = setTimeout(show, 400);
}
