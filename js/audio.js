// TTS + 音效，含 iOS 首次点击 unlock 和静音开关
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

// 挑一个中文声音（iOS 有 Ting-Ting / Sinji 等；桌面 Chrome 有 zh-CN 声）
let zhVoice = null;
function pickVoice(){
  if(zhVoice) return zhVoice;
  try{
    const list = window.speechSynthesis.getVoices();
    zhVoice = list.find(v => /zh[-_]CN/i.test(v.lang))
           || list.find(v => /zh/i.test(v.lang))
           || null;
  }catch{}
  return zhVoice;
}
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = () => { zhVoice = null; pickVoice(); };
}

function speak(text, opts={}){
  if(!store.soundOn) return;
  if(!('speechSynthesis' in window)) return;
  try{
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang  = opts.lang  || 'zh-CN';
    const v = pickVoice(); if(v) u.voice = v;
    u.rate  = opts.rate  ?? 0.92;
    u.pitch = opts.pitch ?? 1.1;
    u.volume= opts.volume?? 1;
    window.speechSynthesis.speak(u);
  }catch{}
}

export const audio = {
  // 每次用户手势都调，尝试 resume；首次也做无声 TTS 唤醒
  unlock(){
    tryResume();
    if(unlocked) return;
    unlocked = true;
    try{
      if('speechSynthesis' in window){
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0.001; u.lang = 'zh-CN';
        window.speechSynthesis.speak(u);
        pickVoice();
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
};
