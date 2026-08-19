// 数学题生成器 —— 分难度 + 凑十法/破十法讲解
import { rand, shuffle, pick } from '../ui/common.js';

const SHAPES = [
  { name:'圆形', emoji:'🔴' },
  { name:'方块', emoji:'🟦' },
  { name:'三角形', emoji:'🔺' },
  { name:'星星', emoji:'⭐' },
  { name:'心形', emoji:'❤️' },
];

// ---- 讲解生成 ----

// 凑十法：a + b 且 a+b>10 时，把 b 拆成 (10-a) 和剩下
function addHint(a, b, ans){
  if(a+b <= 10){
    return `<b>${a}</b> + <b>${b}</b> = <b>${ans}</b><br><span class="muted">数一数就好啦～</span>`;
  }
  // 凑十法
  const need = 10 - a;
  const rest = b - need;
  return `<b>凑十法</b>：
    先把 <b>${a}</b> 凑成 10，
    从 ${b} 里拿出 <b>${need}</b> 给 ${a}，
    还剩 <b>${rest}</b>。<br>
    <span class="calc">${a} + ${b} = ${a} + <u>${need}</u> + ${rest} = 10 + ${rest} = <b>${ans}</b></span>`;
}
// 破十法：a - b 且 a>10 且 b>个位 时，把 a 拆成 10 和个位，从 10 里减 b
function subHint(a, b, ans){
  if(a <= 10){
    return `<b>${a}</b> − <b>${b}</b> = <b>${ans}</b><br><span class="muted">数一数就好啦～</span>`;
  }
  const ones = a % 10;
  if(b <= ones){
    return `<b>${a}</b> − <b>${b}</b> = <b>${ans}</b><br><span class="muted">个位够减，直接算个位。</span>`;
  }
  // 破十法
  const fromTen = 10 - b;
  return `<b>破十法</b>：
    <b>${a}</b> 拆成 10 和 <b>${ones}</b>，
    先算 10 − ${b} = <b>${fromTen}</b>，
    再加上 ${ones}。<br>
    <span class="calc">${a} − ${b} = 10 − ${b} + ${ones} = ${fromTen} + ${ones} = <b>${ans}</b></span>`;
}

function distractors(ans, spread=3, count=4){
  const set = new Set([ans]);
  let attempts = 0;
  while(set.size < count && attempts < 20){
    const d = ans + rand(-spread, spread);
    if(d>=0 && d!==ans) set.add(d);
    attempts++;
  }
  while(set.size < count){ set.add(ans + set.size); }
  return shuffle([...set]);
}

function makeAdd(max){
  // 保证 a+b <= max 且都 >=1
  const a = rand(1, max-1);
  const b = rand(1, max - a);
  return finalize(a, '+', b, a+b, addHint);
}
function makeSub(max){
  const a = rand(2, max);
  const b = rand(1, a-1);
  return finalize(a, '−', b, a-b, subHint);
}
function finalize(a, op, b, ans, hintFn){
  return {
    prompt:'',
    display:`<span>${a}</span><span class="op">${op}</span><span>${b}</span><span class="op">=</span><span class="qmark">?</span>`,
    choices: distractors(ans, Math.max(3, Math.ceil(ans*0.15))).map(String),
    answer: String(ans),
    speak: `${a} ${op==='+'?'加':'减'} ${b} 等于几？`,
    hint: hintFn(a, b, ans),
  };
}

function compareQ(max){
  let a = rand(1, max), b = rand(1, max);
  while(a===b) b = rand(1, max);
  const bigger = a > b ? a : b;
  return {
    prompt:'哪个数字大？',
    display:`<span>${a}</span><span class="op">和</span><span>${b}</span>`,
    choices: shuffle([a,b]).map(String),
    answer: String(bigger),
    speak: `${a} 和 ${b} 哪个大？`,
    hint: `<b>${bigger}</b> 大！<br>数字越大表示数量越多。`,
  };
}
function countQ(){
  const s = SHAPES[rand(0, SHAPES.length-1)];
  const n = rand(2, 9);
  const emojis = s.emoji.repeat(n);
  const opts = new Set([n]);
  while(opts.size<4){ const d = n + rand(-2,2); if(d>=1 && d!==n) opts.add(d); }
  return {
    prompt:`数一数，有几个 ${s.name}？`,
    display:`<div class="qbig">${emojis}</div>`,
    choices: shuffle([...opts]).map(String),
    answer: String(n),
    speak:`数一数，有几个${s.name}？`,
    hint: `一共有 <b>${n}</b> 个 ${s.name}。可以一个一个数：1、2、3…`,
  };
}
function shapeQ(){
  const s = SHAPES[rand(0, SHAPES.length-1)];
  const others = SHAPES.filter(x=>x.name!==s.name);
  const distract = pick(others, 3);
  const opts = shuffle([s, ...distract]);
  return {
    prompt:`哪个是 ${s.name}？`,
    display:``,
    choices: opts.map(o => ({ label:o.emoji, value:o.name })),
    answer: s.name,
    speak:`哪个是${s.name}？`,
    hint: `${s.emoji} 是 <b>${s.name}</b>。`,
  };
}

export function makeMathLevel(n=5, level=20){
  const qs = [];
  const pool = [];
  if(level <= 10){
    pool.push(()=>makeAdd(10), ()=>makeAdd(10), ()=>makeSub(10), countQ, shapeQ, ()=>compareQ(10));
  } else if(level <= 20){
    pool.push(()=>makeAdd(20), ()=>makeAdd(20), ()=>makeSub(20), ()=>makeSub(20), ()=>compareQ(20));
  } else if(level <= 50){
    pool.push(()=>makeAdd(50), ()=>makeAdd(50), ()=>makeSub(50), ()=>makeSub(50), ()=>compareQ(50));
  } else {
    pool.push(()=>makeAdd(100), ()=>makeAdd(100), ()=>makeSub(100), ()=>makeSub(100), ()=>compareQ(100));
  }
  for(let i=0;i<n;i++){
    const g = pool[rand(0, pool.length-1)];
    qs.push(g());
  }
  return qs;
}
