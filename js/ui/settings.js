// 设置页 —— 每个学科的分级、每个奖励游戏都能单独开关
import { el, topbar, escapeHtml } from './common.js';
import { store } from '../storage.js';
import { chineseTiers } from '../subjects/chinese.js';
import { englishTiers } from '../subjects/english.js';
import { REWARD_GAMES } from '../games/index.js';

export const MATH_TIERS = [
  { id:'5',   emoji:'🌱', name:'5 以内',   sub:'3-4 岁小班' },
  { id:'10',  emoji:'🌿', name:'10 以内',  sub:'4-5 岁中班' },
  { id:'20',  emoji:'🌳', name:'20 以内',  sub:'5-6 岁大班' },
  { id:'50',  emoji:'🌲', name:'50 以内',  sub:'幼小衔接' },
  { id:'100', emoji:'🎓', name:'100 以内', sub:'一年级' },
];

export function renderSettings(ctx){
  const { root, go, audio } = ctx;
  const p = store.current;
  if(!p){ go('profiles'); return; }

  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const wrap = el('div','level');
  root.appendChild(wrap);
  wrap.appendChild(el('div','reward-title', `⚙️ ${escapeHtml(p.name)} 的设置`));
  wrap.appendChild(el('div','tier-note','关掉的内容不会再出现在练习和奖励里'));

  section('🧮 数学分级', 'math',
    MATH_TIERS.map(t => ({ id:t.id, emoji:t.emoji, name:t.name, sub:t.sub })));

  section('📚 语文分级', 'chinese',
    chineseTiers().map(t => ({ id:t.id, emoji:t.emoji, name:t.name, sub:t.sub })));

  section('🔤 英语分级', 'english',
    englishTiers().map(t => ({ id:t.id, emoji:t.emoji, name:t.name, sub:t.sub })));

  section('🕹️ 奖励游戏', 'games',
    REWARD_GAMES.map(g => ({ id:g.id, emoji:g.emoji, name:g.title, sub:'' })));

  // 声音总开关
  const soundBox = el('div','set-section');
  soundBox.innerHTML = `<h3 class="set-h">🔊 声音</h3>`;
  soundBox.appendChild(toggleRow(
    { id:'sound', emoji: store.soundOn ? '🔊' : '🔇', name:'游戏音效和朗读', sub:'' },
    store.soundOn,
    (on)=>{ store.setSound(on); audio.tap(); }
  ));
  wrap.appendChild(soundBox);

  function section(title, group, items){
    if(!items.length) return;
    const box = el('div','set-section');
    box.innerHTML = `<h3 class="set-h">${title}</h3>`;
    const allIds = items.map(i => i.id);
    items.forEach(it => {
      const on = store.isEnabled(group, it.id);
      box.appendChild(toggleRow(it, on, (next, rowEl, sw)=>{
        // 不允许把一个分组全部关掉
        if(!next && store.enabledCount(group, allIds) <= 1){
          audio.wrong();
          rowEl.classList.add('shake-row');
          setTimeout(()=> rowEl.classList.remove('shake-row'), 400);
          sw.checked = true;
          return false;
        }
        store.setEnabled(group, it.id, next);
        audio.tap();
        return true;
      }));
    });
    wrap.appendChild(box);
  }

  function toggleRow(it, on, onChange){
    const row = el('label','set-row');
    row.innerHTML = `
      <span class="sr-emoji">${it.emoji}</span>
      <span class="sr-body">
        <span class="sr-name">${escapeHtml(it.name)}</span>
        ${it.sub ? `<span class="sr-sub">${escapeHtml(it.sub)}</span>` : ''}
      </span>
      <span class="switch"><input type="checkbox" ${on?'checked':''}><span class="knob"></span></span>
    `;
    const sw = row.querySelector('input');
    sw.addEventListener('change', ()=>{
      const ok = onChange(sw.checked, row, sw);
      if(ok === false) return;
      row.classList.toggle('off', !sw.checked);
    });
    row.classList.toggle('off', !on);
    return row;
  }
}
