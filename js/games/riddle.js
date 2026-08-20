// 猜谜语 —— 连猜 5 个赢；猜错 3 次输
import { el, shuffle } from '../ui/common.js';
import { showGameOver, renderLives } from './_gameover.js';

const URL_R = new URL('../../data/riddles.json', import.meta.url);
const ROUNDS = 5;
const MAX_LIVES = 3;
let RIDDLES = null;
async function load(){
  if(RIDDLES) return RIDDLES;
  RIDDLES = await (await fetch(URL_R)).json();
  return RIDDLES;
}

export async function playRiddle(ctx, onDone){
  const { root, audio } = ctx;
  const pool = await load();
  const panel = el('div', 'riddle');
  root.appendChild(panel);
  start();

  function start(){
    const picks = shuffle(pool).slice(0, ROUNDS);
    let round = 0;
    let lives = MAX_LIVES;
    let stopped = false;

    panel.innerHTML = `
      <div class="reward-title">🎁 猜谜语奖励</div>
      <div class="whack-hud">
        <div class="wh-progress"></div>
        <div class="wh-meta">
          <span>第 <b class="round">1</b> 个 / 共 ${ROUNDS} 个</span>
          <span class="lives">${renderLives(lives, MAX_LIVES)}</span>
        </div>
      </div>
      <div class="clue"></div>
      <div class="tools"><button class="iconbtn" title="再读一遍">🔊</button></div>
      <div class="choices"></div>
    `;
    const clueEl = panel.querySelector('.clue');
    const choicesEl = panel.querySelector('.choices');
    const progEl = panel.querySelector('.wh-progress');
    const livesEl = panel.querySelector('.lives');

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
        // 统一翻牌卡
        const b = el('button','flipcard riddle-card', `
          <div class="fc-face fc-front">${op}</div>
          <div class="fc-face fc-back">${op === r.answer ? '✅' : '❌'}</div>
        `);
        b.addEventListener('click', ()=>{
          if(b.disabled || stopped || b.classList.contains('flipped')) return;
          audio.tap();
          if(op === r.answer){
            b.classList.add('flipped','fc-ok');
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
            b.classList.add('flipped','fc-bad');
            audio.wrong();
            b.disabled = true;
            lives -= 1;
            livesEl.innerHTML = renderLives(lives, MAX_LIVES);
            if(lives <= 0){
              stopped = true;
              [...choicesEl.children].forEach(c=>c.disabled=true);
              setTimeout(()=>{
                showGameOver(panel, {
                  title:'💔 猜错太多次啦',
                  desc:`猜对了 ${round} 个，再仔细听听谜面～`,
                  onDone: ()=> onDone(false),
                });
              }, 500);
            }
          }
        });
        choicesEl.appendChild(b);
      });
      setTimeout(()=> audio.speak(r.clue), 250);
    }
  }
}
