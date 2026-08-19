// 记忆翻牌
import { el, shuffle } from '../ui/common.js';

const EMOJIS = ['🦁','🐼','🐰','🐸','🐧','🐝','🦄','🐳','🌈','🍎','🌟','🎈'];

export function playMemory(ctx, onDone){
  const { root, audio } = ctx;
  const pairs = shuffle(EMOJIS).slice(0, 6);       // 6 对 = 12 张 = 3x4
  const deck = shuffle([...pairs, ...pairs]);

  const panel = el('div', 'memory');
  panel.innerHTML = `
    <div class="reward-title">🎁 记忆翻牌奖励</div>
    <div class="mem-grid"></div>
  `;
  const grid = panel.querySelector('.mem-grid');
  grid.style.gridTemplateColumns = 'repeat(4, minmax(0,1fr))';
  root.appendChild(panel);

  let first = null;
  let lock = false;
  let matched = 0;

  deck.forEach(em => {
    const c = el('button','mem-card', `
      <div class="face back">?</div>
      <div class="face front">${em}</div>
    `);
    c.dataset.value = em;
    c.addEventListener('click', ()=>{
      if(lock || c.classList.contains('flipped') || c.classList.contains('matched')) return;
      audio.pop();
      c.classList.add('flipped');
      if(!first){ first = c; return; }
      if(first.dataset.value === c.dataset.value && first !== c){
        first.classList.add('matched'); c.classList.add('matched');
        audio.right();
        first = null; matched++;
        if(matched === pairs.length){
          audio.fanfare();
          setTimeout(()=> onDone(true), 700);
        }
      } else {
        lock = true;
        setTimeout(()=>{
          c.classList.remove('flipped');
          first.classList.remove('flipped');
          first = null; lock = false;
        }, 700);
      }
    });
    grid.appendChild(c);
  });
}
