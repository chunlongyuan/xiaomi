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

/* ---------- 反义词 & 归类（部编版一年级重点题型）---------- */

// 反义词对（每对左侧字必须在字库里，右侧字可以是"字库外的常识字"）
const ANTONYMS = [
  ['大','小'], ['多','少'], ['上','下'], ['天','地'],
  ['早','晚'], ['白','黑'], ['前','后'], ['左','右'],
  ['来','去'], ['开','关'], ['爱','恨'], ['进','出'],
  ['长','短'], ['高','矮'], ['胖','瘦'], ['冷','热'],
  ['哭','笑'], ['问','答'], ['买','卖'], ['出','入'],
];

function antonymQ(hanziPool){
  // 只选左侧字在当前字库里的对
  const known = new Set(hanziPool.map(h => h.char));
  const pool = ANTONYMS.filter(p => known.has(p[0]));
  if(pool.length < 2) return null;
  const [q, a] = pool[rand(0, pool.length-1)];
  // 干扰项：从其他 antonym 对里挑
  const otherOptions = shuffle(pool.filter(p => p[0]!==q && p[1]!==a).map(p => p[1])).slice(0, 3);
  const opts = shuffle([a, ...otherOptions]);
  return {
    prompt: `"<b>${q}</b>" 的反义词是？`,
    display: `<div class="hanzi">${q}</div>`,
    choices: opts.map(o => ({ label:o, value:o })),
    answer: a,
    speak: `${q} 的反义词`,
    hint: `<b>${q} ↔ ${a}</b>，意思相反。`,
    kind: 'antonym',
    target: q + '-' + a,
  };
}

// 归类：从 4 个词里挑一个"不同类"的（比如动物/水果/交通中的异类）
const CATEGORIES = [
  { name:'水果', items:['🍎','🍌','🍇','🍓','🍑','🍊','🍉','🥝','🍐'] },
  { name:'动物', items:['🐶','🐱','🐰','🐷','🐮','🐴','🦁','🐘','🐒'] },
  { name:'交通工具', items:['🚗','🚌','🚂','✈️','🚢','🚁','🛴','🚲'] },
  { name:'食物', items:['🍔','🍕','🍞','🥚','🍚','🍜','🎂','🍦'] },
  { name:'颜色', items:['🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪'] },
  { name:'身体部位', items:['👀','👂','👄','🧠','🫀','🦶','✋','👃'] },
];

function classifyQ(){
  const cat = CATEGORIES[rand(0, CATEGORIES.length-1)];
  const others = CATEGORIES.filter(c => c.name !== cat.name);
  const sameSet = pick(cat.items, 3);
  const odd = pick(others[rand(0, others.length-1)].items, 1)[0];
  const opts = shuffle([odd, ...sameSet]);
  return {
    prompt: `哪一个<b>不是</b>${cat.name}？`,
    display: '',
    choices: opts.map(o => ({ label:o, value:o })),
    answer: odd,
    speak: `哪一个不是${cat.name}`,
    hint: `${sameSet.join('、')} 都是 <b>${cat.name}</b>，只有 ${odd} 不是。`,
    kind: 'classify',
    target: 'cls-' + odd,
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

  // 单字题 + 词组题 + 反义词 + 归类
  const gens = [
    { fn: pickHanziByEmojiQ,  pool: hanziPool, weight: 1 },
    { fn: pickEmojiByHanziQ,  pool: hanziPool, weight: 1 },
    { fn: pinyinQ,            pool: hanziPool, weight: 1 },
    { fn: listenQ,            pool: hanziPool, weight: 1 },
    { fn: wordToImageQ,       pool: wordPool,  weight: 2 },   // 词组题权重更高
    { fn: imageToWordQ,       pool: wordPool,  weight: 2 },
  ];
  // 反义词从 leaf 起有；归类从 tree 起有
  if(tier !== 'sprout'){
    gens.push({ fn: (pool, ex)=>antonymQ(hanziPool), pool: hanziPool, weight: 1 });
  }
  if(tier === 'tree' || tier === 'pine'){
    gens.push({ fn: (pool, ex)=>classifyQ(), pool: [1,2,3,4,5], weight: 1 });
  }
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
