// 猜谜语 —— 连猜 5 个
import { el, shuffle } from '../ui/common.js';

const URL_R = new URL('../../data/riddles.json', import.meta.url);
const ROUNDS = 5;
let RIDDLES = null;
async function load(){
  if(RIDDLES) return RIDDLES;
  RIDDLES = await (await fetch(URL_R)).json();
  return RIDDLES;
}

export async function playRiddle(ctx, onDone){
  const { root, audio } = ctx;
  const pool = await load();
  const picks = shuffle(pool).slice(0, ROUNDS);   // 5 个不重复的谜语
  let round = 0;
  let stopped = false;

  const panel = el('div', 'riddle');
  panel.innerHTML = `
    <div class="reward-title">🎁 猜谜语奖励</div>
    <div class="whack-hud">
      <div class="wh-progress"></div>
      <div class="wh-meta"><span>第 <b class="round">1</b> 个 / 共 ${ROUNDS} 个</span></div>
    </div>
    <div class="clue"></div>
    <div class="tools"><button class="iconbtn" title="再读一遍">🔊</button></div>
    <div class="choices"></div>
  `;
  const clueEl = panel.querySelector('.clue');
  const choicesEl = panel.querySelector('.choices');
  const progEl = panel.querySelector('.wh-progress');
  root.appendChild(panel);

  panel.querySelector('.iconbtn').addEventListener('click', ()=>{
    audio.tap();
    audio.speak(picks[round]?.clue || '');
  });

  renderProgress();
  showRound();

  function renderProgress(){
    progEl.innerHTML = Array(ROUNDS).fill(0).map((_,i) =>
      `<span class="wp ${i<round?'on':''}">⭐</span>`
    ).join('');
  }

  function showRound(){
    if(stopped) return;
    const r = picks[round];
    panel.querySelector('.round').textContent = String(round+1);
    clueEl.textContent = `🤔 ${r.clue}`;
    choicesEl.innerHTML = '';
    shuffle(r.options).forEach(op => {
      const b = el('button','choice', op);
      b.addEventListener('click', ()=>{
        if(b.disabled || stopped) return;
        audio.tap();
        if(op === r.answer){
          b.classList.add('correct');
          audio.right();
          [...choicesEl.children].forEach(c=>c.disabled=true);
          round += 1;
          renderProgress();
          if(round >= ROUNDS){
            stopped = true;
            audio.fanfare();
            setTimeout(()=> onDone(true), 800);
          } else {
            setTimeout(showRound, 800);
          }
        } else {
          b.classList.add('wrong');
          audio.wrong();
          b.disabled = true;
        }
      });
      choicesEl.appendChild(b);
    });
    setTimeout(()=> audio.speak(r.clue), 250);
  }
}
