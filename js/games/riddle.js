// 猜谜语小游戏
import { el, shuffle } from '../ui/common.js';

const URL_R = new URL('../../data/riddles.json', import.meta.url);
let RIDDLES = null;
async function load(){
  if(RIDDLES) return RIDDLES;
  RIDDLES = await (await fetch(URL_R)).json();
  return RIDDLES;
}

export async function playRiddle(ctx, onDone){
  const { root, audio } = ctx;
  const pool = await load();
  const r = pool[Math.floor(Math.random()*pool.length)];

  const panel = el('div', 'riddle');
  panel.innerHTML = `
    <div class="reward-title">🎁 猜谜语奖励</div>
    <div class="clue">🤔 ${r.clue}</div>
    <div class="tools"><button class="iconbtn">🔊</button></div>
    <div class="choices"></div>
  `;
  root.appendChild(panel);

  panel.querySelector('.iconbtn').addEventListener('click', ()=>{
    audio.tap(); audio.speak(r.clue);
  });
  setTimeout(()=> audio.speak(r.clue), 200);

  const choicesEl = panel.querySelector('.choices');
  shuffle(r.options).forEach(op => {
    const b = el('button','choice', op);
    b.addEventListener('click', ()=>{
      if(b.disabled) return;
      if(op === r.answer){
        b.classList.add('correct'); audio.fanfare();
        [...choicesEl.children].forEach(c=>c.disabled=true);
        setTimeout(()=> onDone(true), 900);
      } else {
        b.classList.add('wrong'); audio.wrong();
        b.disabled = true;
      }
    });
    choicesEl.appendChild(b);
  });
}
