// 游戏厅 —— 三击头像进入，随便玩任意小游戏（不需要先做题）
import { el, topbar, burst, confetti } from './common.js';
import { REWARD_GAMES, gameById } from '../games/index.js';

export function renderArcade(ctx){
  const { root, go, audio, params, store } = ctx;
  const gameId = params?.game;

  root.appendChild(topbar(ctx, {
    back: () => go(gameId ? 'arcade' : 'home'),
  }));

  const wrap = el('div');
  root.appendChild(wrap);

  if(!gameId){
    showMenu();
  } else {
    const g = gameById(gameId);
    if(!g){ showMenu(); return; }
    playGame(g);
  }

  function showMenu(){
    wrap.innerHTML = '';
    const panel = el('div','level');
    panel.appendChild(el('div','reward-title','🕹️ 游戏厅'));
    panel.appendChild(el('div','pick-sub','想玩哪个就玩哪个，随便玩！'));

    const grid = el('div','reward-picker');
    REWARD_GAMES.filter(g => store.isEnabled('games', g.id)).forEach(g => {
      const card = el('button','reward-card', `
        <div class="rc-emoji">${g.emoji}</div>
        <div class="rc-title">${g.title}</div>
      `);
      card.addEventListener('click', ()=>{ audio.tap(); go('arcade', { game: g.id }); });
      grid.appendChild(card);
    });
    panel.appendChild(grid);

    const row = el('div','skip-row');
    const back = el('button','btn ghost small','回首页');
    back.addEventListener('click', ()=>{ audio.tap(); go('home'); });
    row.appendChild(back);
    panel.appendChild(row);

    wrap.appendChild(panel);
  }

  function playGame(g){
    wrap.innerHTML = '';
    g.play({ ...ctx, root: wrap }, (won) => {
      if(won === false){
        // 没通关就跳过 —— 回游戏厅菜单，不发贴纸
        go('arcade');
        return;
      }
      burst('🎉'); confetti(1800, 80);
      audio.fanfare();
      // 游戏厅里通关也送贴纸（但不计入做题统计）
      const st = ['🦁','🐼','🐯','🦊','🐨','🐸','🦄','🐢','🐙','🦉','🐳','🐝','🌈','🌟','🎈','🍭','🚀','🌸','🍩','🍕','🎨','⚽'];
      const pick = st[Math.floor(Math.random()*st.length)];
      const isNew = store.earnSticker(pick);
      if(isNew){
        const banner = el('div','earned', `<span class="em">${pick}</span>获得新贴纸！`);
        document.body.appendChild(banner);
        setTimeout(()=> banner.remove(), 1800);
      }
      // 显示"再玩一次 / 换一个"
      setTimeout(()=>{
        const done = el('div','result', `
          <div class="big">🏆</div>
          <h2>通关啦！</h2>
          ${isNew ? `<p class="score-meta">获得一枚 <span style="font-size:32px">${pick}</span> 贴纸</p>` : ''}
          <div class="row">
            <button class="btn yellow" data-act="again">再玩一次</button>
            <button class="btn blue"   data-act="menu">换一个游戏</button>
            <button class="btn ghost"  data-act="home">回首页</button>
          </div>
        `);
        wrap.innerHTML = '';
        wrap.appendChild(done);
        done.addEventListener('click', e => {
          const b = e.target.closest('[data-act]'); if(!b) return;
          audio.tap();
          const act = b.dataset.act;
          if(act === 'again') go('arcade', { game: g.id });
          else if(act === 'menu') go('arcade');
          else go('home');
        });
      }, 1500);
    });
  }
}
