// 语文题生成 —— 认字 / 拼音 / 看图选字
import { rand, shuffle, pick } from '../ui/common.js';

const DATA_URL = new URL('../../data/chinese.json', import.meta.url);
let DATA = null;
async function ensureData(){
  if(DATA) return DATA;
  const res = await fetch(DATA_URL);
  DATA = await res.json();
  return DATA;
}

// 图 → 选字 （显示 emoji，选正确的汉字）
function pickHanziByEmojiQ(hanzi){
  const target = hanzi[rand(0, hanzi.length-1)];
  const others = pick(hanzi.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:'哪个字表示这个？',
    display: `<div style="font-size:120px">${target.emoji}</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: '哪个字表示这个？',
  };
}

// 字 → 选图 （显示汉字，选正确的图）
function pickEmojiByHanziQ(hanzi){
  const target = hanzi[rand(0, hanzi.length-1)];
  const others = pick(hanzi.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:`这是什么？`,
    hanzi: target.char,
    pinyin: target.pinyin,
    choices: opts.map(o => ({ label:o.emoji, value:o.char })),
    answer: target.char,
    speak: `这个字：${target.char}，读作 ${target.pinyin}，找一找对应的图。`,
  };
}

// 拼音 → 选字
function pinyinQ(hanzi){
  const target = hanzi[rand(0, hanzi.length-1)];
  const others = pick(hanzi.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt:`请找 “${target.pinyin}”`,
    display:`<div style="font-size:56px;color:var(--blue-d);font-weight:900">${target.pinyin}</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: `请找出 ${target.pinyin}`,
  };
}

// 听音选字（无 display）
function listenQ(hanzi){
  const target = hanzi[rand(0, hanzi.length-1)];
  const others = pick(hanzi.filter(h=>h.char!==target.char), 3);
  const opts = shuffle([target, ...others]);
  return {
    prompt: '听一听，选出正确的字',
    display: `<div style="font-size:80px">🔊</div>`,
    choices: opts.map(o => ({ label:o.char, value:o.char })),
    answer: target.char,
    speak: `听好了：${target.char}。请选出 ${target.char}。`,
  };
}

// 同步版本 —— 需要先 preloadChinese()
let cache = null;
export async function preloadChinese(){
  cache = await ensureData();
  return cache;
}

// 关卡工厂（返回 Promise，level.js 会 await）
export function makeChineseLevel(n=5){
  // 因为 level.js 目前是同步，我们提供一个同步生成，让 preload 在 app 启动时做
  if(!cache){
    // fallback: 尝试同步 XHR 也不理想 —— 走异步 Promise 结构
    console.warn('中文题库尚未加载完成');
    return [];
  }
  const gens = [pickHanziByEmojiQ, pickEmojiByHanziQ, pinyinQ, listenQ];
  const qs = [];
  for(let i=0;i<n;i++){
    const g = gens[rand(0, gens.length-1)];
    qs.push(g(cache.hanzi));
  }
  return qs;
}
