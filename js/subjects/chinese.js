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

// 按分级筛选可用字库；不指定或"all"时用全库
function hanziByTier(tier){
  if(!cache) return [];
  if(!tier || tier === 'all') return cache.hanzi;
  // 允许答题范围略宽：本级 + 上一级作为干扰项池
  const order = ['basic', 'middle', 'advanced'];
  const idx = order.indexOf(tier);
  const allowed = idx >= 0 ? new Set(order.slice(0, idx+1)) : new Set([tier]);
  const list = cache.hanzi.filter(h => allowed.has(h.tier));
  return list.length ? list : cache.hanzi;
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
    speak: `这个字：${target.char}，读作 ${target.pinyin}，找一找对应的图。`,
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
    speak: `请找出 ${target.pinyin}`,
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
    speak: `听好了：${target.char}。请选出 ${target.char}。`,
    kind: 'listen',
    target: target.char,
  };
}

export function makeChineseLevel(n=5, tier='basic'){
  if(!cache){
    console.warn('中文题库尚未加载完成');
    return [];
  }
  const pool = hanziByTier(tier);
  const gens = [pickHanziByEmojiQ, pickEmojiByHanziQ, pinyinQ, listenQ];
  const qs = [];
  const usedChars = new Set();
  const kindCount = {};
  let attempts = 0;
  while(qs.length < n && attempts < n * 40){
    const g = gens[rand(0, gens.length-1)];
    const q = g(pool, usedChars);
    if(usedChars.has(q.target)){ attempts++; continue; }
    const k = q.kind || 'x';
    if((kindCount[k] || 0) >= 2 && attempts < n * 20){ attempts++; continue; }
    usedChars.add(q.target);
    kindCount[k] = (kindCount[k] || 0) + 1;
    qs.push(q);
    attempts++;
  }
  return qs;
}
