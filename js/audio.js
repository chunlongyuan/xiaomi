// TTS + 音效
// 优化：优先选增强版/云端 zh 声音；节奏 / 音调 更接近小朋友说话；短句和停顿更自然
import { store } from './storage.js';

let ac = null;
let unlocked = false;

function ensureAC(){
  if(!ac){
    const C = window.AudioContext || window.webkitAudioContext;
    if(C){ try{ ac = new C(); }catch{} }
  }
  return ac;
}
function tryResume(){
  const a = ensureAC(); if(!a) return;
  if(a.state === 'suspended'){ try{ a.resume(); }catch{} }
}

function beep({freq=600, dur=0.12, type='sine', gain=0.15, when=0, slideTo=null}={}){
  if(!store.soundOn) return;
  tryResume();
  const a = ac; if(!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if(slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0+dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  osc.connect(g); g.connect(a.destination);
  osc.start(t0); osc.stop(t0+dur+0.02);
}

/* ---------- 语音选择：优先最自然的中文声音 ---------- */
// 排名依据：iOS/macOS 上 Enhanced/Premium/Yu-shu/Tingting-Enhanced 最自然；
// Windows 上 Xiaoxiao / Xiaoyi / Yunxi 最自然（Neural）；Chrome cloud 声音也不错。

const VOICE_RANK = [
  /yu[-_ ]?shu/i, /瑜书/,
  /xiaoxiao/i, /晓晓/, /xiaoyi/i, /晓伊/, /yunxi/i, /云希/,
  /premium/i, /enhanced/i, /neural/i,
  /tingting/i, /ting[-_ ]?ting/i, /婷婷/,
  /sin[-_ ]?ji/i, /sinji/i,
  /google.*中文|google.*chinese/i,
];
let voiceCache = null;
function loadVoices(){
  try{
    const list = window.speechSynthesis.getVoices() || [];
    // 先只留中文
    const zh = list.filter(v => /zh|chinese|中文/i.test(v.lang) || /zh|chinese/i.test(v.name));
    // 打分（分数越低越靠前）
    zh.sort((a,b) => rank(a) - rank(b));
    voiceCache = zh;
    return zh;
  }catch{ return []; }
}
function rank(v){
  const s = `${v.name} ${v.voiceURI||''}`;
  for(let i=0;i<VOICE_RANK.length;i++){
    if(VOICE_RANK[i].test(s)) return i;
  }
  // zh-CN 优先于 zh-TW / zh-HK
  if(/zh[-_]CN/i.test(v.lang)) return 100;
  if(/zh/i.test(v.lang)) return 200;
  return 999;
}
function pickVoice(){
  const list = voiceCache || loadVoices();
  return list[0] || null;
}
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = () => { voiceCache = null; loadVoices(); };
  loadVoices();
}

/* ---------- 说话 ---------- */
// 加短逗号 / 停顿让机器感变弱；数字之间加空格提高清晰度
function humanize(text){
  let t = String(text);
  // 常见搭配加短停顿（用中文逗号触发 TTS 自然停顿）
  t = t.replace(/([0-9]+)\s*(加|减|加上|减去)\s*([0-9]+)/g, '$1 $2 $3');
  t = t.replace(/等于几/g, '，等于几');
  t = t.replace(/哪个/g, '哪，个');   // "哪个" TTS 有时读得太快
  return t;
}

function speak(text, opts={}){
  if(!store.soundOn) return;
  if(!('speechSynthesis' in window)) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(humanize(text));
    u.lang  = opts.lang  || 'zh-CN';
    const v = pickVoice(); if(v) u.voice = v;
    u.rate  = opts.rate  ?? 0.88;   // 稍慢一点更清楚
    u.pitch = opts.pitch ?? 1.0;    // 用自然音高，不再刻意抬高（原来的 1.15 反而机器感重）
    u.volume= opts.volume ?? 1;
    window.speechSynthesis.speak(u);
  }catch{}
}

export const audio = {
  unlock(){
    tryResume();
    if(unlocked) return;
    unlocked = true;
    try{
      if('speechSynthesis' in window){
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0.001; u.lang = 'zh-CN';
        window.speechSynthesis.speak(u);
        loadVoices();
      }
    }catch{}
    beep({freq:1, dur:0.001, gain:0.0001});
  },
  speak,
  stop(){ try{ window.speechSynthesis.cancel(); }catch{} },
  tap(){ beep({freq:520, dur:.06, type:'triangle', gain:.06}); },
  right(){
    beep({freq:660, dur:.12, type:'triangle', gain:.15});
    beep({freq:990, dur:.16, type:'triangle', gain:.15, when:.1});
    beep({freq:1320,dur:.22, type:'triangle', gain:.15, when:.22});
  },
  wrong(){ beep({freq:300, dur:.18, type:'sawtooth', gain:.08, slideTo:180}); },
  fanfare(){
    const notes = [523, 659, 784, 1046, 1319];
    notes.forEach((f,i)=> beep({freq:f, dur:.2, type:'triangle', gain:.15, when:i*.12}));
  },
  pop(){ beep({freq:900, dur:.08, type:'square', gain:.08}); },
  bonk(){
    beep({freq:180, dur:.06, type:'square', gain:.18});
    beep({freq:90,  dur:.10, type:'square', gain:.14, when:.05});
  },
  // 列出可用中文声音（供设置页用）
  listChineseVoices(){ return (voiceCache || loadVoices()).slice(); },
  currentVoiceName(){ return pickVoice()?.name || ''; },
};
