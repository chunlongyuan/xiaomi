// 小米学习乐园 —— 主入口
import { renderHome } from './ui/home.js';
import { renderLevel } from './ui/level.js';
import { renderResult } from './ui/result.js';
import { renderReward } from './ui/reward.js';
import { renderStickers } from './ui/stickers.js';
import { renderProfiles } from './ui/profiles.js';
import { renderDifficulty } from './ui/difficulty.js';
import { renderStats } from './ui/stats.js';
import { store } from './storage.js';
import { audio } from './audio.js';
import { preloadChinese } from './subjects/chinese.js';

const routes = {
  home:       ctx => renderHome(ctx),
  profiles:   ctx => renderProfiles(ctx),
  difficulty: ctx => renderDifficulty(ctx),
  level:      ctx => renderLevel(ctx),
  reward:     ctx => renderReward(ctx),
  result:     ctx => renderResult(ctx),
  stickers:   ctx => renderStickers(ctx),
  stats:      ctx => renderStats(ctx),
};

const state = { name:'home', params:{} };

export function go(name, params={}){
  state.name = name; state.params = params;
  mount();
}

function mount(){
  const root = document.getElementById('app');
  root.innerHTML = '';
  const fn = routes[state.name] || routes.home;
  const ctx = { root, params: state.params, go, store, audio };
  fn(ctx);
  window.scrollTo({top:0, behavior:'instant'});
}

// iOS 音频 unlock：每次点击/触摸都尝试一次 resume（iOS 会周期性挂起 AudioContext）
function bindUnlock(){
  const cb = () => audio.unlock();
  ['pointerdown','touchstart','click'].forEach(ev =>
    document.addEventListener(ev, cb, { passive:true, capture:true })
  );
  // 页面重回前台时也 resume
  document.addEventListener('visibilitychange', () => {
    if(!document.hidden) audio.unlock();
  });
}
bindUnlock();

// Boot
if(store.hasProfile) store.tickDailyStreak();
preloadChinese().finally(() => go(store.hasProfile ? 'home' : 'profiles'));
