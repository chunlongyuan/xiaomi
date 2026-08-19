// 简单的 localStorage 存档 —— 星星 / 打卡 / 贴纸
const KEY = 'xiaomi-save-v1';

const defaults = () => ({
  stars: 0,
  streak: 0,
  lastPlayDate: null,
  stickers: [],           // 已收集的贴纸 emoji
  levelsCompleted: 0,
});

function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  }catch{ return defaults(); }
}
function save(data){
  try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch{}
}

let data = load();

function todayStr(){
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function yesterdayStr(){
  const d = new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

export const store = {
  get all(){ return { ...data }; },
  get stars(){ return data.stars; },
  get streak(){ return data.streak; },
  get stickers(){ return [...data.stickers]; },

  addStars(n){
    data.stars += n; save(data);
  },
  finishLevel(){
    data.levelsCompleted += 1;
    save(data);
    return data.levelsCompleted;
  },
  earnSticker(emoji){
    if(!data.stickers.includes(emoji)){
      data.stickers.push(emoji);
      save(data);
      return true; // 新贴纸
    }
    return false;
  },
  tickDailyStreak(){
    const t = todayStr();
    if(data.lastPlayDate === t) return;           // 今天已经计过
    if(data.lastPlayDate === yesterdayStr()){
      data.streak += 1;
    } else {
      data.streak = 1;
    }
    data.lastPlayDate = t;
    save(data);
  },
  reset(){
    data = defaults(); save(data);
  }
};
