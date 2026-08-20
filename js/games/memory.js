// 记忆翻牌 —— 配对全部完成赢；翻错 8 次输
import { el, shuffle } from '../ui/common.js';
import { showGameOver } from './_gameover.js';

const EMOJIS = ['🦁','🐼','🐰','🐸','🐧','🐝','🦄','🐳','🌈','🍎','🌟','🎈'];
const MAX_MISS = 8;

export function playMemory(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div', 'memory');
  root.appendChild(panel);

  const pairs = shuffle(EMOJIS).slice(0, 6);       // 6 对 = 12 张 = 3x4
  const deck = shuffle([...pairs, ...pairs]);
  let first = null, lock = false, matched = 0;
  let misses = 0, stopped = false;

  panel.innerHTML = `
    <div class="reward-title">🎁 记忆翻牌奖励</div>
    <div class="whack-hud">
      <div class="wh-meta" style="justify-content:center;gap:16px">
        <span>已配对 <b class="pairs">0</b> / ${pairs.length}</span>
        <span>剩余机会 <b class="chances">${MAX_MISS}</b></span>
      </div>
    </div>
    <div class="mem-grid"></div>
    <div class="whack-tip">翻错 ${MAX_MISS} 次就输了，记住位置哦</div>
  `;
  const grid = panel.querySelector('.mem-grid');

  deck.forEach(em => {
    // 统一翻牌卡：背面朝上（未翻开），点了翻到正面露出图案
    const c = el('button','flipcard mem-card flipped', `
      <div class="fc-face fc-front">${em}</div>
      <div class="fc-face fc-back">?</div>
    `);
    c.dataset.value = em;
    c.addEventListener('click', ()=>{
      if(stopped || lock || !c.classList.contains('flipped') || c.classList.contains('matched')) return;
      audio.tap();
      audio.pop();
      c.classList.remove('flipped');     // 翻开露出正面
      if(!first){ first = c; return; }
      if(first.dataset.value === c.dataset.value && first !== c){
        first.classList.add('matched','fc-ok');
        c.classList.add('matched','fc-ok');
        audio.right();
        first = null; matched++;
        panel.querySelector('.pairs').textContent = String(matched);
        if(matched === pairs.length){
          stopped = true;
          audio.fanfare();
          panel.querySelector('.whack-tip').textContent = '🏆 全部配对成功！';
          setTimeout(()=> onDone(true), 700);
        }
      } else {
        lock = true;
        misses += 1;
        audio.wrong();
        c.classList.add('fc-bad'); first.classList.add('fc-bad');
        panel.querySelector('.chances').textContent = String(Math.max(0, MAX_MISS - misses));
        setTimeout(()=>{
          c.classList.remove('fc-bad'); first.classList.remove('fc-bad');
          c.classList.add('flipped'); first.classList.add('flipped');   // 翻回背面
          first = null; lock = false;
          if(misses >= MAX_MISS && !stopped){
            stopped = true;
            panel.querySelector('.whack-tip').textContent = '💔 机会用完了…';
            setTimeout(()=>{
              showGameOver(panel, {
                title:'💔 翻错太多次啦',
                desc:`配对成功 ${matched} 对，多记记牌的位置～`,
                onDone: ()=> onDone(false),
              });
            }, 400);
          }
        }, 800);
      }
    });
    grid.appendChild(c);
  });
}
