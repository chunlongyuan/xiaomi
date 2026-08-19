// 奖励页 —— 随机抽一个小游戏，玩完进入结算
import { el, topbar, burst, confetti } from './common.js';
import { playRiddle } from '../games/riddle.js';
import { playMemory } from '../games/memory.js';

const STICKERS = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];

export function renderReward(ctx){
  const { root, params, store, audio, go } = ctx;

  root.appendChild(topbar(store));

  const wrap = el('div');
  root.appendChild(wrap);

  const games = [playRiddle, playMemory];
  const chosen = games[Math.floor(Math.random()*games.length)];

  chosen({ ...ctx, root:wrap }, () => {
    // 奖励贴纸
    const st = STICKERS[Math.floor(Math.random()*STICKERS.length)];
    const isNew = store.earnSticker(st);
    burst('🎉'); confetti();
    if(isNew){
      const banner = el('div','earned', `<span class="em">${st}</span>获得新贴纸！`);
      document.body.appendChild(banner);
      setTimeout(()=> banner.remove(), 1800);
    }
    audio.fanfare();
    setTimeout(()=> go('result', { ...params, sticker: st }), 1500);
  });
}
