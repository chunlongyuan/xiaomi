// 打地鼠 —— 敲够 5 个胜利，无时间压力
import { el, rand } from '../ui/common.js';

const MOLES = ['🦁','🐼','🐰','🦄','🐸','🐵','🐨','🐯'];

export function playWhack(ctx, onDone){
  const { root, audio } = ctx;
  const GOAL = 5;
  let hits = 0;
  let currentIdx = -1;
  let currentEmoji = '';
  let lock = false;
  let stopped = false;

  const panel = el('div','memory'); // 复用底色
  panel.innerHTML = `
    <div class="reward-title">🎁 打地鼠奖励</div>
    <div class="whack-hud">敲够 <b>${GOAL}</b> 只就赢啦！  已敲 <b class="hit">0</b></div>
    <div class="whack-grid"></div>
  `;
  const grid = panel.querySelector('.whack-grid');
  root.appendChild(panel);

  const holes = [];
  for(let i=0;i<9;i++){
    const h = el('button','whack-hole', `<span class="mole"></span>`);
    h.addEventListener('click', ()=> hit(i));
    grid.appendChild(h);
    holes.push(h);
  }

  function show(){
    if(stopped) return;
    // 清掉旧的
    if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
    currentIdx = rand(0, 8);
    currentEmoji = MOLES[rand(0, MOLES.length-1)];
    holes[currentIdx].querySelector('.mole').textContent = currentEmoji;
    holes[currentIdx].classList.add('up');
    audio.pop();
    lock = false;
    // 1.1-1.6s 后自动收起（未打中）
    const dur = 1100 + Math.random()*500;
    setTimeout(next, dur);
  }
  function next(){
    if(stopped) return;
    if(currentIdx >= 0) holes[currentIdx].classList.remove('up');
    // 短暂停顿再冒出
    setTimeout(show, 250 + Math.random()*300);
  }
  function hit(i){
    if(stopped || lock) return;
    if(i !== currentIdx) { audio.wrong(); return; }
    lock = true;
    hits += 1;
    panel.querySelector('.hit').textContent = String(hits);
    holes[i].classList.remove('up');
    holes[i].classList.add('bonk');
    audio.right();
    setTimeout(()=> holes[i].classList.remove('bonk'), 300);
    if(hits >= GOAL){
      stopped = true;
      audio.fanfare();
      setTimeout(()=> onDone(true), 500);
    }
  }
  show();
}
