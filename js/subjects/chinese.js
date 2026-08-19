// 语文题生成 —— 认字 / 拼音 / 看图选字，按分级筛选
import { rand, shuffle, pick } from '../ui/common.js';

const DATA_URL = new URL('../../data/chinese.json', import.meta.url);
let DATA = null;

async function ensureData(){
  if(DATA) return DATA;
  const res = await fetch(DATA_URL);
  DATA = await res.json();
  return DATA;
}

let cache = null;
export async function preloadChinese(){
  cache = await ensureData();
  return cache;
}
export function chineseTiers(){
  return cache ? cache.tiers.slice() : [];
}
export function chineseStatsByTier(){
  if(!cache) return {};
  const m = {};
  cache.tiers.forEach(t => {
    m[t.id] = { total: cache.hanzi.filter(h => h.tier === t.id).length };
  });
  return m;
}

// 按分级筛选字库
function hanziByTier(tier){
  if(!cache) return [];
  if(!tier || tier === 'all') return cache.hanzi;
  const order = cache.tiers.map(t => t.id);
  const idx = order.indexOf(tier);
  const allowed = idx >= 0 ? new Set(order.slice(0, idx+1)) : new Set([tier]);
  const list = cache.hanzi.filter(h => allowed.has(h.tier));
  return list.length >= 4 ? list : cache.hanzi;
}
// 按分级筛选词库
function wordsByTier(tier){
  if(!cache || !cache.words) return [];
  if(!tier || tier === 'all') return cache.words;
  const order = cache.tiers.map(t => t.id);
  const idx = order.indexOf(tier);
  const allowed = idx >= 0 ? new Set(order.slice(0, idx+1)) : new Set([tier]);
  const list = cache.words.filter(w => allowed.has(w.tier));
  return list.length >= 4 ? list : cache.words;
}

function pickTarget(pool, exclude){
  const available = exclude && exclude.size ? pool.filter(h => !exclude.has(h.char)) : pool;
  return (available.length ? available : pool)[rand(0, (available.length ? available : pool).length-1)];
}

function pickHanziByEmojiQ(pool, exclude){
  const target = pickTarget(pool, exclude);
  const others = pick(pool.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:'哪个字表示这个？',
    display: `<div style="font-size:120px">${target.emoji}</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: '哪个字表示这个？',
    kind: 'hanzi-by-emoji',
    target: target.char,
  };
}
function pickEmojiByHanziQ(pool, exclude){
  const target = pickTarget(pool, exclude);
  const others = pick(pool.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:`这是什么？`,
    hanzi: target.char,
    pinyin: target.pinyin,
    choices: opts.map(o => ({ label:o.emoji, value:o.char })),
    answer: target.char,
    speak: target.char,                          // 只念字，不念拼音
    kind: 'emoji-by-hanzi',
    target: target.char,
  };
}
function pinyinQ(pool, exclude){
  const target = pickTarget(pool, exclude);
  const others = pick(pool.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:`请找 “${target.pinyin}”`,
    display:`<div style="font-size:56px;color:var(--blue-d);font-weight:900">${target.pinyin}</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: target.char,                          // 念对应汉字（发音正是那个拼音）
    kind: 'pinyin',
    target: target.char,
  };
}
function listenQ(pool, exclude){
  const target = pickTarget(pool, exclude);
  const others = pick(pool.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt: '听一听，选出正确的字',
    display: `<div style="font-size:80px">🔊</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: target.char,                          // 只念一遍字，不念拼音
    kind: 'listen',
    target: target.char,
  };
}

/* ---------- 词组题（随文识字）---------- */

function pickWord(pool, excludeTexts){
  const avail = excludeTexts && excludeTexts.size ? pool.filter(w => !excludeTexts.has(w.text)) : pool;
  return (avail.length ? avail : pool)[rand(0, (avail.length ? avail : pool).length-1)];
}

// 看词选图
function wordToImageQ(pool, excludeTexts){
  const target = pickWord(pool, excludeTexts);
  const others = pick(pool.filter(w=>w.emoji !== target.emoji && w.text !== target.text), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt: '这个词是什么意思？',
    display: `<div class="word-target">${target.text}<div class="word-pinyin">${target.pinyin}</div></div>`,
    choices: opts.map(o => ({ label:o.emoji, value:o.text })),
    answer: target.text,
    speak: target.text,
    kind: 'word-to-image',
    target: target.text,
  };
}

// 看图选词
function imageToWordQ(pool, excludeTexts){
  const target = pickWord(pool, excludeTexts);
  const others = pick(pool.filter(w=>w.emoji !== target.emoji && w.text !== target.text), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt: '这个图是什么词？',
    display: `<div style="font-size:120px">${target.emoji}</div>`,
    choices: opts.map(o => ({ label:o.text, value:o.text })),
    answer: target.text,
    speak: '这个图是什么词？',
    kind: 'image-to-word',
    target: target.text,
  };
}

export function makeChineseLevel(n=5, tier='sprout'){
  if(!cache){
    console.warn('中文题库尚未加载完成');
    return [];
  }
  const hanziPool = hanziByTier(tier);
  const wordPool  = wordsByTier(tier);

  // 单字题（认字）+ 词组题（随文识字）—— 词组题权重更高
  const gens = [
    { fn: pickHanziByEmojiQ,  pool: hanziPool, weight: 1 },
    { fn: pickEmojiByHanziQ,  pool: hanziPool, weight: 1 },
    { fn: pinyinQ,            pool: hanziPool, weight: 1 },
    { fn: listenQ,            pool: hanziPool, weight: 1 },
    { fn: wordToImageQ,       pool: wordPool,  weight: 2 },   // 词组题权重更高
    { fn: imageToWordQ,       pool: wordPool,  weight: 2 },
  ];
  // 展开权重
  const weightedGens = gens.flatMap(g => Array(g.weight).fill(g));

  const qs = [];
  const usedTargets = new Set();
  const kindCount = {};
  let attempts = 0;
  while(qs.length < n && attempts < n * 40){
    const g = weightedGens[rand(0, weightedGens.length-1)];
    if(!g.pool || g.pool.length < 4){ attempts++; continue; }
    const q = g.fn(g.pool, usedTargets);
    if(usedTargets.has(q.target)){ attempts++; continue; }
    const k = q.kind || 'x';
    if((kindCount[k] || 0) >= 2 && attempts < n * 20){ attempts++; continue; }
    usedTargets.add(q.target);
    kindCount[k] = (kindCount[k] || 0) + 1;
    qs.push(q);
    attempts++;
  }
  return qs;
}
