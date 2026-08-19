// 英语题生成器 —— 字母 / 单词 / 短语
import { rand, shuffle, pick } from '../ui/common.js';

const DATA_URL = new URL('../../data/english.json', import.meta.url);
let DATA = null;
async function ensureData(){
  if(DATA) return DATA;
  DATA = await (await fetch(DATA_URL)).json();
  return DATA;
}
let cache = null;
export async function preloadEnglish(){
  cache = await ensureData();
  return cache;
}
export function englishTiers(){ return cache ? cache.tiers.slice() : []; }

function pickIdx(arr, exclude){
  const avail = exclude && exclude.size ? arr.filter(x => !exclude.has(x)) : arr;
  return (avail.length ? avail : arr)[rand(0, (avail.length ? avail : arr).length-1)];
}

/* ---------- 字母题 ---------- */
function letterUpperToLowerQ(letters, exclude){
  const list = letters.map(l => l.upper);
  const target = pickIdx(list, exclude);
  const tObj = letters.find(l => l.upper === target);
  const others = pick(letters.filter(l => l.upper !== target), 3);
  const opts = shuffle([tObj, ...others]);
  return {
    prompt:'找到对应的小写字母',
    display:`<div class="letter-big">${target}</div>`,
    choices: opts.map(o => ({ label:o.lower, value:o.lower })),
    answer: tObj.lower,
    speak: target, lang:'en-US',
    kind:'letter-upper', target: target,
  };
}
function letterLowerToUpperQ(letters, exclude){
  const list = letters.map(l => l.upper);
  const target = pickIdx(list, exclude);
  const tObj = letters.find(l => l.upper === target);
  const others = pick(letters.filter(l => l.upper !== target), 3);
  const opts = shuffle([tObj, ...others]);
  return {
    prompt:'找到对应的大写字母',
    display:`<div class="letter-big letter-lower">${tObj.lower}</div>`,
    choices: opts.map(o => ({ label:o.upper, value:o.upper })),
    answer: target,
    speak: target, lang:'en-US',
    kind:'letter-lower', target: target,
  };
}
function letterListenQ(letters, exclude){
  const list = letters.map(l => l.upper);
  const target = pickIdx(list, exclude);
  const tObj = letters.find(l => l.upper === target);
  const others = pick(letters.filter(l => l.upper !== target), 3);
  const opts = shuffle([tObj, ...others]);
  return {
    prompt:'听一听，选出正确的字母',
    display:`<div style="font-size:80px">🔊</div>`,
    choices: opts.map(o => ({ label:o.upper, value:o.upper })),
    answer: target,
    speak: target, lang:'en-US',
    kind:'letter-listen', target: target,
  };
}

/* ---------- 单词 / 短语共用生成器 ---------- */

function wordToImageQ(pool, exclude){
  const target = pickIdx(pool, exclude);
  const others = pick(pool.filter(w => w !== target && w.emoji !== target.emoji), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:'这个词是什么意思？',
    display:`<div class="word-target word-en">${target.text}<div class="word-pinyin">${target.cn}</div></div>`,
    choices: opts.map(o => ({ label:o.emoji, value:o.text })),
    answer: target.text,
    speak: target.text, lang:'en-US',
    kind:'en-word-to-image', target: target.text,
  };
}
function imageToWordQ(pool, exclude){
  const target = pickIdx(pool, exclude);
  const others = pick(pool.filter(w => w !== target && w.emoji !== target.emoji), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:'这个图是什么英文？',
    display:`<div style="font-size:120px">${target.emoji}</div>`,
    choices: opts.map(o => ({ label:o.text, value:o.text })),
    answer: target.text,
    speak: '这个图是什么英文？',
    kind:'en-image-to-word', target: target.text,
  };
}
function listenWordQ(pool, exclude){
  const target = pickIdx(pool, exclude);
  const others = pick(pool.filter(w => w !== target && w.emoji !== target.emoji), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:'听一听，选出正确的词',
    display:`<div style="font-size:80px">🔊</div>`,
    choices: opts.map(o => ({ label:o.text, value:o.text })),
    answer: target.text,
    speak: target.text, lang:'en-US',
    kind:'en-listen', target: target.text,
  };
}

/* ---------- 关卡 ---------- */

export function makeEnglishLevel(n=5, tier='letters'){
  if(!cache){ console.warn('英语题库尚未加载'); return []; }

  let gens = [];
  if(tier === 'letters'){
    gens = [
      { fn: letterUpperToLowerQ, pool: cache.letters },
      { fn: letterLowerToUpperQ, pool: cache.letters },
      { fn: letterListenQ,       pool: cache.letters },
    ];
  } else if(tier === 'words'){
    gens = [
      { fn: wordToImageQ,  pool: cache.words },
      { fn: imageToWordQ,  pool: cache.words },
      { fn: listenWordQ,   pool: cache.words },
    ];
  } else {
    gens = [
      { fn: wordToImageQ,  pool: cache.phrases },
      { fn: imageToWordQ,  pool: cache.phrases },
      { fn: listenWordQ,   pool: cache.phrases },
    ];
  }

  const qs = [];
  const used = new Set();
  const kindCount = {};
  let attempts = 0;
  while(qs.length < n && attempts < n * 40){
    const g = gens[rand(0, gens.length-1)];
    if(!g.pool || g.pool.length < 4){ attempts++; continue; }
    const q = g.fn(g.pool, used);
    if(used.has(q.target)){ attempts++; continue; }
    const k = q.kind || 'x';
    if((kindCount[k] || 0) >= 2 && attempts < n * 20){ attempts++; continue; }
    used.add(q.target);
    kindCount[k] = (kindCount[k] || 0) + 1;
    qs.push(q);
    attempts++;
  }
  return qs;
}
