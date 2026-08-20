// 记忆翻牌 —— 配对全部完成赢；翻错 8 次输
import { el, shuffle } from '../ui/common.js';
import { showGameOver } from './_gameover.js';

const EMOJIS = ['🦁','🐼','🐰','🐸','🐧','🐝','🦄','🐳','🌈','🍎','🌟','🎈'];
const MAX_MISS = 8;

export function playMemory(ctx, onDone){
  const { root, audio } = ctx;
  const panel = el('div', 'memory');
  root.appendChild(panel);
  start();

  function start(){
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
    grid.style.gridTemplateColumns = 'repeat(4, minmax(0,1fr))';

    deck.forEach(em => {
      const c = el('button','mem-card', `
        <div class="face back">?</div>
        <div class="face front">${em}</div>
      `);
      c.dataset.value = em;
      c.addEventListener('click', ()=>{
        if(stopped || lock || c.classList.contains('flipped') || c.classList.contains('matched')) return;
        audio.pop();
        c.classList.add('flipped');
        if(!first){ first = c; return; }
        if(first.dataset.value === c.dataset.value && first !== c){
          first.classList.add('matched'); c.classList.add('matched');
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
          panel.querySelector('.chances').textContent = String(Math.max(0, MAX_MISS - misses));
          setTimeout(()=>{
            c.classList.remove('flipped');
            first.classList.remove('flipped');
            first = null; lock = false;
            if(misses >= MAX_MISS && !stopped){
              stopped = true;
              panel.querySelector('.whack-tip').textContent = '💔 机会用完了…';
              setTimeout(()=>{
                showGameOver(panel, {
                  title:'💔 翻错太多次啦',
                  desc:`配对成功 ${matched} 对，多记记牌的位置～`,
                  onRetry: start,
                  onGiveUp: ()=> onDone(false),
                });
              }, 400);
            }
          }, 700);
        }
      });
      grid.appendChild(c);
    });
  }
}
