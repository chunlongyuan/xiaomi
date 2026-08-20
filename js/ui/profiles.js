// 小朋友档案 —— 切换 / 新建 / 编辑名字和头像 / 删除
import { el, topbar, escapeHtml } from './common.js';
import { store } from '../storage.js';

// 扩展到 40+ 头像
const AVATARS = [
  '🦁','🐼','🐯','🦊','🐰','🐨','🐸','🐵','🐧','🐙',
  '🦄','🐳','🐝','🐢','🦉','🐶','🐱','🐷','🐻','🐭',
  '🐮','🐔','🐥','🦆','🦅','🐴','🐺','🐹','🐗','🦌',
  '🐩','🐈','🦋','🐞','🦔','🦒','🐘','🦏','🐫','🐊',
  '🦖','🦕','🦎','🦩','🦚',
];

export function renderProfiles(ctx){
  const { root, go, audio, params } = ctx;
  const force = params?.forceCreate && !store.hasProfile;

  root.appendChild(topbar(ctx, {
    back: force ? null : () => go('home'),
    showStars:false,
  }));

  const wrap = el('div', 'level');
  root.appendChild(wrap);
  wrap.appendChild(el('div','reward-title', '👨‍👩‍👧 谁在玩？'));

  const list = el('div','profile-list');
  wrap.appendChild(list);
  renderList();

  function renderList(){
    list.innerHTML = '';
    store.profiles.forEach(p => {
      const active = store.current && store.current.id === p.id;
      const row = el('div', 'profile-row' + (active?' active':''), `
        <div class="pr-av">${p.avatar}</div>
        <div class="pr-body">
          <div class="pr-name">${escapeHtml(p.name)}</div>
          <div class="pr-meta">⭐ ${p.stars} · 🔥 ${p.streak} · 🎯 ${p.levelsCompleted} 关</div>
        </div>
        <div class="pr-actions">
          <button class="tb-btn round" title="编辑" data-act="edit">✏️</button>
          <button class="tb-btn round" title="删除" data-act="del">🗑️</button>
        </div>
      `);
      row.addEventListener('click', e => {
        if(e.target.closest('[data-act]')) return;
        audio.tap();
        store.switchProfile(p.id);
        go('home');
      });
      row.querySelector('[data-act="edit"]').addEventListener('click', e => {
        e.stopPropagation();
        audio.tap();
        openEditor(p);
      });
      row.querySelector('[data-act="del"]').addEventListener('click', e => {
        e.stopPropagation();
        if(confirm(`删除 "${p.name}" 的档案？记录会全部消失。`)){
          store.deleteProfile(p.id);
          renderList();
        }
      });
      list.appendChild(row);
    });

    // 新建区
    const form = el('div','profile-new');
    form.innerHTML = `
      <div class="reward-title" style="font-size:22px;margin-top:14px">➕ 新建小朋友</div>
      <input class="txt" placeholder="名字（如：小明）" maxlength="10" />
      <div class="avatars"></div>
      <button class="btn yellow" data-act="add">开始 →</button>
    `;
    list.appendChild(form);
    const av = form.querySelector('.avatars');
    let picked = AVATARS[0];
    AVATARS.forEach(em => {
      const b = el('button','av-btn' + (em===picked?' on':''), em);
      b.addEventListener('click', ()=>{
        picked = em;
        [...av.children].forEach(c=>c.classList.remove('on'));
        b.classList.add('on');
        audio.tap();
      });
      av.appendChild(b);
    });
    form.querySelector('[data-act="add"]').addEventListener('click', ()=>{
      const name = form.querySelector('.txt').value.trim() || '小朋友';
      audio.unlock();
      audio.fanfare();
      audio.speak('你好，我们开始玩吧！');
      const p = store.createProfile(name, picked);
      store.tickDailyStreak();
      setTimeout(()=> go('home'), 400);
    });
  }

  function openEditor(p){
    const overlay = el('div','hint-overlay');
    let picked = p.avatar;
    overlay.innerHTML = `
      <div class="hint-card">
        <div class="ht">✏️ 修改档案</div>
        <div class="hb" style="text-align:left">
          <div style="margin-bottom:8px;font-weight:800">名字</div>
          <input class="txt edit-name" value="${escapeHtml(p.name)}" maxlength="10" />
          <div style="margin:14px 0 8px;font-weight:800">头像（选一个）</div>
          <div class="avatars edit-avatars"></div>
        </div>
        <div class="card-actions">
          <button class="btn ghost" data-cancel>取消</button>
          <button class="btn yellow" data-save>✓ 保存</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const av = overlay.querySelector('.edit-avatars');
    AVATARS.forEach(em => {
      const b = el('button','av-btn' + (em===picked?' on':''), em);
      b.addEventListener('click', ()=>{
        picked = em;
        [...av.children].forEach(c=>c.classList.remove('on'));
        b.classList.add('on');
        audio.tap();
      });
      av.appendChild(b);
    });
    const close = ()=> overlay.remove();
    overlay.querySelector('[data-cancel]').addEventListener('click', ()=>{ audio.tap(); close(); });
    overlay.querySelector('[data-save]').addEventListener('click', ()=>{
      const name = overlay.querySelector('.edit-name').value.trim() || p.name;
      audio.tap();
      store.renameProfile(p.id, name, picked);
      close();
      renderList();
    });
  }
}
