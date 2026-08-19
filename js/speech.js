// 语音识别封装 —— 使用浏览器原生 SpeechRecognition
// iOS Safari 15+、Chrome、Edge 支持
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const speechAvailable = !!SR;

export function listenOnce({ lang = 'en-US', timeout = 5000 } = {}){
  return new Promise((resolve, reject) => {
    if(!SR){ reject(new Error('no-support')); return; }
    let done = false;
    const finish = (r, e) => {
      if(done) return; done = true;
      try{ rec.stop(); }catch{}
      clearTimeout(t);
      if(e) reject(e); else resolve(r);
    };
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.continuous = false;
    rec.onresult = e => {
      const alts = [];
      for(let i=0;i<e.results.length;i++){
        const r = e.results[i];
        for(let j=0;j<r.length;j++){
          alts.push({ transcript: r[j].transcript, confidence: r[j].confidence });
        }
      }
      finish(alts);
    };
    rec.onerror = e => finish(null, new Error(e.error || 'sr-error'));
    rec.onend   = () => finish([]);
    const t = setTimeout(() => finish(null, new Error('timeout')), timeout);
    try{ rec.start(); }
    catch(err){ finish(null, err); }
  });
}

// 简单模糊匹配：忽略大小写/标点/多余空格；接受包含关系
export function matchSpoken(spoken, target){
  const norm = s => String(s).toLowerCase().replace(/[.,!?'"“”‘’·。，！？]/g,'').replace(/\s+/g,' ').trim();
  const t = norm(target);
  return norm(spoken).split(/\s+/).some(w => w === t)
      || norm(spoken).includes(t)
      || t.includes(norm(spoken));
}
