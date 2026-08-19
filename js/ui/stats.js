// 我的记录
import { el, topbar, starsRow, escapeHtml } from './common.js';
import { store } from '../storage.js';

export function renderStats(ctx){
  const { root, go, audio } = ctx;
  const p = store.current;
  if(!p){ go('profiles'); return; }

  root.appendChild(topbar(ctx, { back:()=>go('home') }));

  const s = p.stats;
  const mTotal = s.math.correct + s.math.wrong;
  const cTotal = s.chinese.correct + s.chinese.wrong;
  const eTotal = (s.english?.correct||0) + (s.english?.wrong||0);
  const mAcc = mTotal ? Math.round(s.math.correct*100/mTotal) : 0;
  const cAcc = cTotal ? Math.round(s.chinese.correct*100/cTotal) : 0;
  const eAcc = eTotal ? Math.round((s.english?.correct||0)*100/eTotal) : 0;

  const wrap = el('div','level');
  root.appendChild(wrap);

  wrap.innerHTML = `
    <div class="reward-title">📊 ${escapeHtml(p.name)} 的学习记录</div>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-n">⭐ ${p.stars}</div><div class="kpi-l">总星星</div></div>
      <div class="kpi"><div class="kpi-n">🔥 ${p.streak}</div><div class="kpi-l">连续天数</div></div>
      <div class="kpi"><div class="kpi-n">🎯 ${p.levelsCompleted}</div><div class="kpi-l">完成关卡</div></div>
      <div class="kpi"><div class="kpi-n">🌟 ${p.stickers.length}</div><div class="kpi-l">贴纸</div></div>
    </div>

    <h3 class="stat-h">🧮 数学</h3>
    <div class="stat-row"><span>已做</span><b>${mTotal} 题</b></div>
    <div class="stat-row"><span>正确率</span><b>${mAcc}%</b></div>
    <div class="stat-bar"><div class="fill" style="width:${mAcc}%;background:linear-gradient(90deg,#7fd88a,#4fbf60)"></div></div>
    <div class="stat-sub">
      ${['5','10','20','50','100'].map(lv => {
        const b = (s.math.byLevel && s.math.byLevel[lv]) || {c:0,w:0}; const t=b.c+b.w;
        return `<div class="stat-mini"><b>${lv} 以内</b><span>${t?`${b.c}/${t}`:'—'}</span></div>`;
      }).join('')}
    </div>

    <h3 class="stat-h">📚 语文</h3>
    <div class="stat-row"><span>已做</span><b>${cTotal} 题</b></div>
    <div class="stat-row"><span>正确率</span><b>${cAcc}%</b></div>
    <div class="stat-bar"><div class="fill" style="width:${cAcc}%;background:linear-gradient(90deg,#ff9ec4,#e5548a)"></div></div>
    <div class="stat-sub">
      ${[['sprout','🌱 启蒙'],['leaf','🌿 入门'],['tree','🌳 拓展'],['pine','🌲 一年级']].map(([tid, label]) => {
        const b = (s.chinese.byTier && s.chinese.byTier[tid]) || {c:0,w:0}; const t=b.c+b.w;
        return `<div class="stat-mini"><b>${label}</b><span>${t?`${b.c}/${t}`:'—'}</span></div>`;
      }).join('')}
    </div>

    <h3 class="stat-h">🔤 英语</h3>
    <div class="stat-row"><span>已做</span><b>${eTotal} 题</b></div>
    <div class="stat-row"><span>正确率</span><b>${eAcc}%</b></div>
    <div class="stat-bar"><div class="fill" style="width:${eAcc}%;background:linear-gradient(90deg,#a0e7ff,#3ca4e8)"></div></div>
    <div class="stat-sub">
      ${[['letters','🅰️ 字母'],['words','🐱 单词'],['phrases','👋 短语']].map(([tid, label]) => {
        const b = ((s.english && s.english.byTier) && s.english.byTier[tid]) || {c:0,w:0}; const t=b.c+b.w;
        return `<div class="stat-mini"><b>${label}</b><span>${t?`${b.c}/${t}`:'—'}</span></div>`;
      }).join('')}
    </div>

    <h3 class="stat-h">🕘 最近 10 关</h3>
    <div class="session-list">
      ${p.sessions.slice(0,10).map(x => {
        const stars = x.correct, tot = x.total;
        const when = new Date(x.at);
        const wh = `${when.getMonth()+1}/${when.getDate()} ${String(when.getHours()).padStart(2,'0')}:${String(when.getMinutes()).padStart(2,'0')}`;
        const zhLbl = { sprout:'启蒙', leaf:'入门', tree:'拓展', pine:'一年级' }[x.level];
        const enLbl = { letters:'字母', words:'单词', phrases:'短语' }[x.level];
        const tierLbl = x.subject==='math'    ? (x.level ? x.level+' 以内' : '')
                      : x.subject==='english' ? (enLbl || '')
                      : (zhLbl || '');
        const subName = x.subject==='math' ? '数学' : x.subject==='english' ? '英语' : '语文';
        const sub = `${subName} ${tierLbl}`;
        return `<div class="session"><span class="s-lbl">${sub}</span><span class="s-sc">${starsRow(stars, tot)}</span><span class="s-tm">${wh}</span></div>`;
      }).join('') || '<div class="empty">还没有记录，快去玩一关吧！</div>'}
    </div>
  `;
}
