// TTS + 音效
// 优先播放预生成的高质量 MP3（Microsoft Edge Neural 晓伊声）；
// 找不到才回落到浏览器 SpeechSynthesis
import { store } from './storage.js';

/* ---------- Web Audio ---------- */
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

/* ---------- 预生成 MP3 manifest ---------- */

const AUDIO_BASE = new URL('../audio/', import.meta.url);
const MANIFEST_URL = new URL('manifest.json', AUDIO_BASE);
let manifest = null;
let manifestPromise = null;
const clipCache = new Map();

function loadManifest(){
  if(manifest !== null) return Promise.resolve(manifest);
  if(manifestPromise) return manifestPromise;
  manifestPromise = fetch(MANIFEST_URL.toString(), { cache: 'force-cache' })
    .then(r => r.ok ? r.json() : {})
    .then(m => (manifest = m || {}))
    .catch(() => (manifest = {}));
  return manifestPromise;
}
loadManifest();

function getAudioFor(text){
  if(!manifest) return null;
  const key = String(text).trim();
  return manifest[key] || null;
}

function playFile(fname){
  return new Promise(resolve => {
    let a = clipCache.get(fname);
    if(!a){
      a = new Audio(new URL(fname, AUDIO_BASE).toString());
      a.preload = 'auto';
      clipCache.set(fname, a);
    } else {
      try{ a.pause(); a.currentTime = 0; }catch{}
    }
    a.onended = () => resolve();
    a.onerror = () => resolve();
    // iOS 要求在用户手势内触发，我们的 unlock 已处理
    Promise.resolve(a.play()).catch(() => resolve());
  });
}

/* ---------- SpeechSynthesis 回落 ---------- */

const ZH_VOICE_RANK = [
  /yu[-_ ]?shu/i, /瑜书/,
  /xiaoxiao/i, /晓晓/, /xiaoyi/i, /晓伊/, /yunxi/i, /云希/,
  /premium/i, /enhanced/i, /neural/i,
  /tingting/i, /ting[-_ ]?ting/i, /婷婷/,
  /sin[-_ ]?ji/i, /sinji/i,
];
const EN_VOICE_RANK = [
  /jenny/i, /aria/i, /guy/i, /ryan/i,    // MS Neural
  /samantha/i, /alex/i, /karen/i,        // Apple
  /google.*us.*english/i, /google.*english/i,
  /premium/i, /enhanced/i, /neural/i,
];
let zhCache = null, enCache = null;
function rank(v, ranks){
  const s = `${v.name} ${v.voiceURI||''}`;
  for(let i=0;i<ranks.length;i++){ if(ranks[i].test(s)) return i; }
  return 999;
}
function loadVoices(){
  try{
    const list = window.speechSynthesis.getVoices() || [];
    const zh = list.filter(v => /zh|chinese|中文/i.test(v.lang) || /zh|chinese|中文/i.test(v.name));
    const en = list.filter(v => /^en/i.test(v.lang) || /english/i.test(v.name));
    zh.sort((a,b) => rank(a, ZH_VOICE_RANK) - rank(b, ZH_VOICE_RANK) + (/zh[-_]CN/i.test(a.lang)?-50:0) - (/zh[-_]CN/i.test(b.lang)?-50:0));
    en.sort((a,b) => rank(a, EN_VOICE_RANK) - rank(b, EN_VOICE_RANK) + (/en[-_]US/i.test(a.lang)?-50:0) - (/en[-_]US/i.test(b.lang)?-50:0));
    zhCache = zh; enCache = en;
  }catch{}
}
function pickVoice(lang){
  if(!zhCache) loadVoices();
  if(lang && /^en/i.test(lang)) return (enCache || [])[0] || null;
  return (zhCache || [])[0] || null;
}
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = () => { zhCache = enCache = null; loadVoices(); };
  loadVoices();
}

function synth(text, lang){
  return new Promise(resolve => {
    if(!('speechSynthesis' in window)){ resolve(); return; }
    try{
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang || 'zh-CN';
      const v = pickVoice(u.lang); if(v) u.voice = v;
      // 英语稍慢一些让小朋友听清
      u.rate = /^en/i.test(u.lang) ? 0.92 : 1.05;
      u.pitch = 1.0; u.volume = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    }catch{ resolve(); }
  });
}

/* ---------- 对外 API ---------- */

let currentSpeakId = 0;
function cancelAllSpeech(){
  try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch{}
  clipCache.forEach(a => { try{ a.pause(); }catch{} });
}

async function speak(text, opts = {}){
  if(!store.soundOn) return;
  cancelAllSpeech();
  const id = ++currentSpeakId;
  await loadManifest();
  if(id !== currentSpeakId) return;
  const f = getAudioFor(text);
  if(f) return playFile(f);
  return synth(text, opts.lang);
}

// 按 part 顺播（数学题："5", "加", "3", "等于几"）
async function speakParts(parts, opts = {}){
  if(!store.soundOn) return;
  cancelAllSpeech();
  const id = ++currentSpeakId;
  await loadManifest();
  if(id !== currentSpeakId) return;
  for(const p of parts){
    if(id !== currentSpeakId) return;
    const key = String(p).trim();
    const f = getAudioFor(key);
    if(f){ await playFile(f); }
    else { await synth(key, opts.lang); }
  }
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
    // iOS 也需要 <audio> 元素在手势内 play 一次才不会被拦截
    try{
      const dummy = new Audio();
      dummy.src = 'data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      dummy.play().catch(()=>{});
    }catch{}
    beep({freq:1, dur:0.001, gain:0.0001});
  },
  speak,
  speakParts,
  stop: cancelAllSpeech,
  tap(){ beep({freq:520, dur:.06, type:'triangle', gain:.07}); },
  // 答对：欢快上行三连音 + 泛音，声音更饱满
  right(){
    beep({freq:660, dur:.16, type:'triangle', gain:.22});
    beep({freq:990, dur:.18, type:'triangle', gain:.22, when:.11});
    beep({freq:1320,dur:.26, type:'triangle', gain:.22, when:.24});
    // 叠一层方波泛音让"叮"更亮
    beep({freq:1320,dur:.10, type:'square',   gain:.06, when:.24});
    beep({freq:1980,dur:.10, type:'triangle', gain:.10, when:.30});
  },
  // 答错：低沉双下降"duh-duh"，比原来更明显
  wrong(){
    beep({freq:440, dur:.18, type:'square',   gain:.18, slideTo:280});
    beep({freq:280, dur:.22, type:'sawtooth', gain:.15, slideTo:160, when:.16});
  },
  fanfare(){
    const notes = [523, 659, 784, 1046, 1319];
    notes.forEach((f,i)=> beep({freq:f, dur:.2, type:'triangle', gain:.15, when:i*.12}));
  },
  pop(){ beep({freq:900, dur:.08, type:'square', gain:.08}); },
  bonk(){
    beep({freq:180, dur:.06, type:'square', gain:.18});
    beep({freq:90,  dur:.10, type:'square', gain:.14, when:.05});
  },
  // 调试用
  hasClipFor(text){ return !!getAudioFor(text); },
  currentVoiceName(lang){ return pickVoice(lang)?.name || ''; },
};
