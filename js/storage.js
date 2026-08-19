// 多小朋友档案 + 统计
const KEY = 'xiaomi-save-v2';
const OLD = 'xiaomi-save-v1';

function todayStr(){ const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function yesterdayStr(){ const d = new Date(); d.setDate(d.getDate()-1); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

function newProfile(name, avatar){
  return {
    id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    name: name || '小朋友',
    avatar: avatar || '🦁',
    createdAt: Date.now(),
    stars: 0,
    streak: 0,
    lastPlayDate: null,
    stickers: [],
    levelsCompleted: 0,
    soundOn: true,
    stats: {
      math:    { correct:0, wrong:0, byLevel:{ 10:{c:0,w:0}, 20:{c:0,w:0}, 50:{c:0,w:0}, 100:{c:0,w:0} } },
      chinese: { correct:0, wrong:0 },
    },
    sessions: [],
  };
}

const DEFAULTS = () => ({ activeProfileId:null, profiles:[] });

function load(){ try{ const r = localStorage.getItem(KEY); if(!r) return DEFAULTS(); return { ...DEFAULTS(), ...JSON.parse(r) }; }catch{ return DEFAULTS(); } }
function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch{} }

let data = load();

// 从 v1 迁移
(function migrate(){
  if(data.profiles.length) return;
  try{
    const raw = localStorage.getItem(OLD);
    if(!raw) return;
    const old = JSON.parse(raw);
    const p = newProfile('小朋友', '🦁');
    p.stars = old.stars || 0;
    p.stickers = old.stickers || [];
    p.streak = old.streak || 0;
    p.lastPlayDate = old.lastPlayDate || null;
    p.levelsCompleted = old.levelsCompleted || 0;
    data.profiles.push(p);
    data.activeProfileId = p.id;
    persist();
  }catch{}
})();

function cur(){ return data.profiles.find(p => p.id === data.activeProfileId) || null; }

export const store = {
  get profiles(){ return data.profiles.slice(); },
  get current(){ return cur(); },
  get hasProfile(){ return !!cur(); },
  get stars(){ return cur()?.stars || 0; },
  get streak(){ return cur()?.streak || 0; },
  get stickers(){ return cur()?.stickers.slice() || []; },
  get sessions(){ return cur()?.sessions.slice() || []; },
  get stats(){ return cur()?.stats || null; },
  get soundOn(){ const p=cur(); return p ? p.soundOn !== false : true; },

  createProfile(name, avatar){
    const p = newProfile(name, avatar);
    data.profiles.push(p);
    data.activeProfileId = p.id;
    persist();
    return p;
  },
  switchProfile(id){
    if(data.profiles.some(p=>p.id===id)){
      data.activeProfileId = id;
      persist();
    }
  },
  renameProfile(id, name, avatar){
    const p = data.profiles.find(x=>x.id===id); if(!p) return;
    if(name) p.name = name;
    if(avatar) p.avatar = avatar;
    persist();
  },
  deleteProfile(id){
    data.profiles = data.profiles.filter(p=>p.id!==id);
    if(data.activeProfileId === id) data.activeProfileId = data.profiles[0]?.id || null;
    persist();
  },
  addStars(n){ const p=cur(); if(!p) return; p.stars += n; persist(); },
  finishLevel(subject, level, correct, total){
    const p = cur(); if(!p) return;
    p.levelsCompleted += 1;
    p.sessions.unshift({ at: Date.now(), subject, level: level||null, correct, total });
    if(p.sessions.length > 30) p.sessions.length = 30;
    const s = p.stats[subject];
    if(s){
      s.correct += correct;
      s.wrong += (total - correct);
      if(subject==='math' && level && s.byLevel[level]){
        s.byLevel[level].c += correct;
        s.byLevel[level].w += (total - correct);
      }
    }
    persist();
  },
  earnSticker(em){
    const p = cur(); if(!p) return false;
    if(!p.stickers.includes(em)){ p.stickers.push(em); persist(); return true; }
    return false;
  },
  tickDailyStreak(){
    const p = cur(); if(!p) return;
    const t = todayStr();
    if(p.lastPlayDate === t) return;
    if(p.lastPlayDate === yesterdayStr()) p.streak += 1; else p.streak = 1;
    p.lastPlayDate = t;
    persist();
  },
  setSound(on){ const p=cur(); if(!p) return; p.soundOn = !!on; persist(); },
};
