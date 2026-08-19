// 数学题生成器 —— 分难度 + 凑十法/破十法/拆分法讲解
import { rand, shuffle } from '../ui/common.js';

const SHAPES = [
  { name:'圆形', emoji:'🔴' },
  { name:'方块', emoji:'🟦' },
  { name:'三角形', emoji:'🔺' },
  { name:'星星', emoji:'⭐' },
  { name:'心形', emoji:'❤️' },
];

/* ---------- 讲解 ---------- */

function addHint(a, b, ans){
  // 一位数 + 一位数，和 ≤ 10
  if(a<=9 && b<=9 && a+b<=10){
    return `<b>${a}</b> + <b>${b}</b> = <b>${ans}</b><br><span class="muted">数一数就好啦～</span>`;
  }
  // 一位数 + 一位数，和 > 10 → 凑十法
  if(a<=9 && b<=9){
    const bigger = a >= b ? a : b;
    const smaller = a >= b ? b : a;
    const need = 10 - bigger;
    const rest = smaller - need;
    return `<b>凑十法</b>：先把 <b>${bigger}</b> 凑成 10。
      从 ${smaller} 里拿出 <b>${need}</b> 给 ${bigger}，还剩 <b>${rest}</b>。<br>
      <span class="calc">${a} + ${b} = 10 + ${rest} = <b>${ans}</b></span>`;
  }
  // 多位数 → 拆分十位和个位
  const aT = Math.floor(a/10)*10, aO = a%10;
  const bT = Math.floor(b/10)*10, bO = b%10;
  return `<b>拆分法</b>：把每个数拆成十位和个位分别加。<br>
    <span class="calc">
      十位: ${aT} + ${bT} = ${aT+bT}<br>
      个位: ${aO} + ${bO} = ${aO+bO}<br>
      合起来: <b>${ans}</b>
    </span>`;
}

function subHint(a, b, ans){
  if(a<=10){
    return `<b>${a}</b> − <b>${b}</b> = <b>${ans}</b><br><span class="muted">数一数就好啦～</span>`;
  }
  const aO = a%10, aT = Math.floor(a/10)*10;
  // 两位数 − 一位数
  if(b<=9){
    if(b <= aO){
      return `<b>${a}</b> − <b>${b}</b> = <b>${ans}</b><br><span class="muted">个位 ${aO} 够减 ${b}，个位相减就好。</span>`;
    }
    // 破十法（适合 11-20 之间）
    if(a<=20){
      const fromTen = 10 - b;
      return `<b>破十法</b>：${a} = 10 + ${aO}。
        先算 10 − ${b} = <b>${fromTen}</b>，再加上 ${aO}。<br>
        <span class="calc">${a} − ${b} = ${fromTen} + ${aO} = <b>${ans}</b></span>`;
    }
  }
  // 两位数 − 两位数
  const bO = b%10, bT = Math.floor(b/10)*10;
  if(aO >= bO){
    return `<b>拆分法</b>：<br>
      <span class="calc">
        十位: ${aT} − ${bT} = ${aT-bT}<br>
        个位: ${aO} − ${bO} = ${aO-bO}<br>
        合起来: <b>${ans}</b>
      </span>`;
  }
  // 退位减法
  return `<b>退位减法</b>：个位 ${aO} 不够减 ${bO}，
    向十位借 1（个位变成 ${aO+10}），十位就少 1（变成 ${aT-10}）。<br>
    <span class="calc">
      个位: ${aO+10} − ${bO} = ${aO+10-bO}<br>
      十位: ${aT-10} − ${bT} = ${aT-10-bT}<br>
      合起来: <b>${ans}</b>
    </span>`;
}

/* ---------- 干扰项 ---------- */

function distractors(ans, spread=3, count=4){
  const set = new Set([ans]);
  let attempts = 0;
  while(set.size < count && attempts < 30){
    const d = ans + rand(-spread, spread);
    if(d>=0 && d!==ans) set.add(d);
    attempts++;
  }
  while(set.size < count){ set.add(ans + set.size); }
  return shuffle([...set]);
}

/* ---------- 题型 ---------- */

function makeAdd(max){
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
  const spread = Math.max(3, Math.min(15, Math.ceil(ans*0.15)));
  return {
    prompt:'',
    display:`<span>${a}</span><span class="op">${op}</span><span>${b}</span><span class="op">=</span><span class="qmark">?</span>`,
    choices: distractors(ans, spread).map(String),
    answer: String(ans),
    speak: `${a} ${op==='+'?'加':'减'} ${b} 等于几？`,
    hint: hintFn(a, b, ans),
    kind: 'arith',
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
    speak: `${a} 和 ${b}，哪个大？`,
    hint: `<b>${bigger}</b> 大！数字越大表示数量越多。`,
    kind: 'compare',
  };
}

function countQ(){
  const s = SHAPES[rand(0, SHAPES.length-1)];
  const n = rand(2, 6);                  // 最多 6 个，确保屏幕能显示完整、易数
  const emojis = s.emoji.repeat(n);
  const opts = new Set([n]);
  while(opts.size<4){ const d = n + rand(-2,2); if(d>=1 && d!==n) opts.add(d); }
  return {
    prompt:`数一数，有几个 ${s.name}？`,
    display:`<div class="qbig">${emojis}</div>`,
    choices: shuffle([...opts]).map(String),
    answer: String(n),
    speak:`数一数，有几个${s.name}？`,
    hint: `一共有 <b>${n}</b> 个 ${s.name}。可以一个一个点着数：1、2、3…`,
    kind: 'count',
  };
}

/* ---------- 关卡组合 ---------- */

export function makeMathLevel(n=5, level=20){
  const qs = [];
  const pool = [];
  if(level <= 10){
    // 10 以内：加、减为主，配少量数一数、比大小；无形状
    pool.push(
      ()=>makeAdd(10), ()=>makeAdd(10), ()=>makeAdd(10),
      ()=>makeSub(10), ()=>makeSub(10),
      countQ,
      ()=>compareQ(10),
    );
  } else if(level <= 20){
    pool.push(
      ()=>makeAdd(20), ()=>makeAdd(20), ()=>makeAdd(20),
      ()=>makeSub(20), ()=>makeSub(20), ()=>makeSub(20),
      ()=>compareQ(20),
    );
  } else if(level <= 50){
    // 50 / 100 纯算术，不再混入比大小/数数
    pool.push(
      ()=>makeAdd(50), ()=>makeAdd(50), ()=>makeAdd(50),
      ()=>makeSub(50), ()=>makeSub(50), ()=>makeSub(50),
    );
  } else {
    pool.push(
      ()=>makeAdd(100), ()=>makeAdd(100), ()=>makeAdd(100),
      ()=>makeSub(100), ()=>makeSub(100), ()=>makeSub(100),
    );
  }
  for(let i=0;i<n;i++){
    const g = pool[rand(0, pool.length-1)];
    qs.push(g());
  }
  return qs;
}
