// 奖励页 —— 让小朋友自己挑一个小游戏
import { el, topbar, burst, confetti } from './common.js';
import { REWARD_GAMES, gameById } from '../games/index.js';

const STICKERS = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];

export function renderReward(ctx){
  const { root, params, store, audio, go } = ctx;

  root.appendChild(topbar(ctx, {
    back:()=> go('result', params),
  }));

  const wrap = el('div');
  root.appendChild(wrap);

  showPicker();

  function showPicker(){
    wrap.innerHTML = '';
    const last = store.lastReward;
    const panel = el('div','level');
    panel.appendChild(el('div','reward-title','🎁 挑一个奖励游戏！'));
    panel.appendChild(el('div','pick-sub','答完题奖励一小段，玩什么你说了算～'));

    const grid = el('div','reward-picker');
    const games = REWARD_GAMES.filter(g => store.isEnabled('games', g.id));
    games.forEach(g => {
      const card = el('button','reward-card' + (last===g.id?' last':''), `
        <div class="rc-emoji">${g.emoji}</div>
        <div class="rc-title">${g.title}</div>
        ${last===g.id?'<div class="rc-last">上次玩的</div>':''}
      `);
      card.addEventListener('click', ()=>{ audio.tap(); playGame(g); });
      grid.appendChild(card);
    });
    // 随机
    const randomCard = el('button','reward-card random', `
      <div class="rc-emoji">🎲</div>
      <div class="rc-title">随机来一个</div>
    `);
    randomCard.addEventListener('click', ()=>{
      audio.tap();
      const g = games[Math.floor(Math.random()*games.length)];
      playGame(g);
    });
    grid.appendChild(randomCard);
    panel.appendChild(grid);

    // 跳过
    const skipRow = el('div','skip-row');
    const skip = el('button','btn ghost small', '不玩了，直接看结果');
    skip.addEventListener('click', ()=>{ audio.tap(); go('result', params); });
    skipRow.appendChild(skip);
    panel.appendChild(skipRow);

    wrap.appendChild(panel);
  }

  function playGame(g){
    store.setLastReward(g.id);
    wrap.innerHTML = '';
    g.play({ ...ctx, root:wrap }, (won) => {
      if(won === false){
        // 游戏没通关 —— 不发贴纸，直接回结算页
        go('result', { ...params });
        return;
      }
      onWon();
    });
  }

  function onWon(){
    const st = STICKERS[Math.floor(Math.random()*STICKERS.length)];
    const isNew = store.earnSticker(st);
    burst('🎉'); confetti(1800, 80);
    if(isNew){
      const banner = el('div','earned', `<span class="em">${st}</span>获得新贴纸！`);
      document.body.appendChild(banner);
      setTimeout(()=> banner.remove(), 1800);
    }
    audio.fanfare();
    setTimeout(()=> go('result', { ...params, sticker: st }), 1600);
  }
}
