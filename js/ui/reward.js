import { el, topbar, burst, confetti } from './common.js';
import { playRiddle } from '../games/riddle.js';
import { playMemory } from '../games/memory.js';

const STICKERS = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];

export function renderReward(ctx){
  const { root, params, store, audio, go } = ctx;

  root.appendChild(topbar(ctx, {
    back:()=> go('result', params),  // 跳过奖励回到结算
  }));

  const wrap = el('div');
  root.appendChild(wrap);

  const games = [playRiddle, playMemory];
  const chosen = games[Math.floor(Math.random()*games.length)];

  chosen({ ...ctx, root:wrap }, () => {
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
  });
}
