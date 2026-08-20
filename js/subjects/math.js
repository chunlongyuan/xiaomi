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
  const opWord = op === '+' ? '加' : '减';
  return {
    prompt:'',
    display:`<span>${a}</span><span class="op">${op}</span><span>${b}</span><span class="op">=</span><span class="qmark">?</span>`,
    choices: distractors(ans, spread).map(String),
    answer: String(ans),
    speak: `${a} ${opWord} ${b} 等于几？`,
    speakParts: [String(a), opWord, String(b), '等于几'],
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
    speakParts: [String(a), String(b), '哪个数字大'],
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
    speakParts: [`数一数，有几个${s.name}`],
    hint: `一共有 <b>${n}</b> 个 ${s.name}。可以一个一个点着数：1、2、3…`,
    kind: 'count',
  };
}

/* ---------- 思维训练题 ---------- */

// 找规律（等差数列，藏一个）
function patternQ(max){
  const maxD = Math.max(1, Math.min(5, Math.floor(max/5)));
  const d = rand(1, maxD);
  const start = rand(1, Math.max(1, max - 4*d));
  const seq = [start, start+d, start+2*d, start+3*d, start+4*d];
  const hideIdx = rand(1, 4);                     // 不藏第一项
  const answer = seq[hideIdx];
  const shown = seq.map((v,i) => i===hideIdx ? '<span class="qmark">?</span>' : `<span>${v}</span>`).join('<span class="op">,</span>');
  const opts = new Set([answer]);
  while(opts.size<4){ const dv = answer + rand(-d-1, d+1); if(dv>=1 && dv!==answer) opts.add(dv); }
  return {
    prompt:'找规律：？是几',
    display: `<div class="seq">${shown}</div>`,
    choices: shuffle([...opts]).map(String),
    answer: String(answer),
    speak: `找规律，${seq.map((v,i)=>i===hideIdx?'几':v).join('，')}`,
    hint: `每次加 <b>${d}</b>：${seq.join(' → ')}，所以 ？ 是 <b>${answer}</b>。`,
    kind: 'pattern',
  };
}

// 填空：a + ? = c 或 ? + b = c 或 a - ? = c
function fillQ(max){
  const form = rand(0, 2);
  let a, b, ans, c, disp;
  if(form === 0){          // a + ? = c
    a = rand(1, max-2);
    ans = rand(1, max - a);
    c = a + ans;
    disp = `<span>${a}</span><span class="op">+</span><span class="qmark">?</span><span class="op">=</span><span>${c}</span>`;
  } else if(form === 1){   // ? + b = c
    b = rand(1, max-2);
    ans = rand(1, max - b);
    c = ans + b;
    disp = `<span class="qmark">?</span><span class="op">+</span><span>${b}</span><span class="op">=</span><span>${c}</span>`;
  } else {                 // a - ? = c
    a = rand(3, max);
    c = rand(1, a-2);
    ans = a - c;
    disp = `<span>${a}</span><span class="op">−</span><span class="qmark">?</span><span class="op">=</span><span>${c}</span>`;
  }
  const opts = new Set([ans]);
  while(opts.size<4){ const dv = ans + rand(-3, 3); if(dv>=1 && dv!==ans) opts.add(dv); }
  return {
    prompt:'',
    display: disp,
    choices: shuffle([...opts]).map(String),
    answer: String(ans),
    speak: form===0 ? `${a} 加几等于 ${c}` : form===1 ? `几加 ${b} 等于 ${c}` : `${a} 减几等于 ${c}`,
    hint: form===0 ? `<b>${a} + ${ans} = ${c}</b>，所以 ？ 是 <b>${ans}</b>。`
          : form===1 ? `<b>${ans} + ${b} = ${c}</b>，所以 ？ 是 <b>${ans}</b>。`
          : `<b>${a} − ${ans} = ${c}</b>，所以 ？ 是 <b>${ans}</b>。`,
    kind: 'fill',
  };
}

// 应用题
const WORD_TEMPLATES = [
  (a,b)=>({q:`小明有 <b>${a}</b> 块糖，妈妈又给他 <b>${b}</b> 块。<br>一共有几块？`, ans:a+b, exp:`${a} + ${b} = ${a+b}`}),
  (a,b)=>({q:`树上有 <b>${a}</b> 只小鸟，飞走了 <b>${b}</b> 只。<br>还剩几只？`,     ans:a-b, exp:`${a} − ${b} = ${a-b}`}),
  (a,b)=>({q:`盘子里有 <b>${a}</b> 个苹果，爸爸又放上 <b>${b}</b> 个。<br>一共几个？`, ans:a+b, exp:`${a} + ${b} = ${a+b}`}),
  (a,b)=>({q:`小红有 <b>${a}</b> 支铅笔，送给同学 <b>${b}</b> 支。<br>还剩几支？`,   ans:a-b, exp:`${a} − ${b} = ${a-b}`}),
  (a,b)=>({q:`停车场里有 <b>${a}</b> 辆车，开走了 <b>${b}</b> 辆。<br>还有几辆？`,   ans:a-b, exp:`${a} − ${b} = ${a-b}`}),
  (a,b)=>({q:`鱼缸里有 <b>${a}</b> 条鱼，妈妈又买了 <b>${b}</b> 条。<br>一共几条？`, ans:a+b, exp:`${a} + ${b} = ${a+b}`}),
  (a,b)=>({q:`小猴子摘了 <b>${a}</b> 个桃子，吃掉了 <b>${b}</b> 个。<br>还剩几个？`, ans:a-b, exp:`${a} − ${b} = ${a-b}`}),
  (a,b)=>({q:`草地上有 <b>${a}</b> 朵花，小蜜蜂又飞来采 <b>${b}</b> 朵。<br>一共有几朵花？`, ans:a+b, exp:`${a} + ${b} = ${a+b}`}),
];
function wordQ(max){
  const t = WORD_TEMPLATES[rand(0, WORD_TEMPLATES.length-1)];
  const a = rand(3, max);
  const b = rand(1, a-1);
  const res = t(a, b);
  // 纯文字给数字读音
  const plain = String(res.q).replace(/<[^>]+>/g,'').replace(/\s+/g,'');
  const opts = new Set([res.ans]);
  while(opts.size<4){ const dv = res.ans + rand(-3, 3); if(dv>=0 && dv!==res.ans) opts.add(dv); }
  return {
    prompt: res.q,
    display: '',
    choices: shuffle([...opts]).map(String),
    answer: String(res.ans),
    speak: plain,
    hint: `<b>${res.exp}</b>`,
    kind: 'word',
  };
}

/* ---------- 学前核心题型 ---------- */

// 分与合：a = ? + b（培养数感，部编版一上单元核心）
function decomposeQ(max){
  const total = rand(3, max);
  const b = rand(1, total-1);
  const a = total - b;
  const opts = new Set([a]);
  while(opts.size<4){ const d = a + rand(-2, 2); if(d>=0 && d!==a) opts.add(d); }
  return {
    prompt: `<b>${total}</b> 可以分成 <b>${b}</b> 和几？`,
    display: `<div style="font-size:64px">${'🔵'.repeat(total)}<br><span style="opacity:.4">${'🔵'.repeat(b)}</span>${'❓'.repeat(a)}</div>`,
    choices: shuffle([...opts]).map(String),
    answer: String(a),
    speak: `${total} 可以分成 ${b} 和几？`,
    hint: `<b>${total} = ${b} + ${a}</b><br>把 ${total} 分成 ${b} 和 <b>${a}</b>。`,
    kind: 'decompose',
  };
}

// 相邻数：X 的前一个 / 后一个（数序）
function neighborQ(max){
  const kind = rand(0, 2);   // 0=前, 1=后, 2=两个之间
  const x = rand(2, max-1);
  let prompt, ans, display;
  if(kind === 0){
    ans = x - 1;
    display = `<div class="qbig"><span class="qmark">?</span> ${x}</div>`;
    prompt = `<b>${x}</b> 前面是几？`;
  } else if(kind === 1){
    ans = x + 1;
    display = `<div class="qbig">${x} <span class="qmark">?</span></div>`;
    prompt = `<b>${x}</b> 后面是几？`;
  } else {
    ans = x;
    display = `<div class="qbig">${x-1} <span class="qmark">?</span> ${x+1}</div>`;
    prompt = `中间是几？`;
  }
  const opts = new Set([ans]);
  while(opts.size<4){ const d = ans + rand(-2, 2); if(d>=0 && d!==ans) opts.add(d); }
  return {
    prompt,
    display,
    choices: shuffle([...opts]).map(String),
    answer: String(ans),
    speak: prompt.replace(/<[^>]+>/g,''),
    hint: kind===0 ? `${x} 的前一个是 <b>${ans}</b>（${x} − 1 = ${ans}）`
        : kind===1 ? `${x} 的后一个是 <b>${ans}</b>（${x} + 1 = ${ans}）`
        : `${x-1} 和 ${x+1} 中间是 <b>${ans}</b>`,
    kind: 'neighbor',
  };
}

// 序数：第几个是什么（区分基数和序数）
function ordinalQ(){
  const items = ['🍎','🍌','🍇','🍓','🍑','🥕','🍋','🥝'];
  const row = shuffle(items).slice(0, rand(4, 6));
  const pos = rand(1, row.length);
  const ans = row[pos-1];
  const others = row.filter(x=>x!==ans).slice(0, 3);
  const opts = shuffle([ans, ...others]);
  return {
    prompt: `<b>从左边数</b>，第 <b>${pos}</b> 个是什么？`,
    display: `<div style="font-size:56px;letter-spacing:14px">${row.join('')}</div>`,
    choices: opts.map(o => ({ label:o, value:o })),
    answer: ans,
    speak: `从左边数，第 ${pos} 个是什么`,
    hint: `一个一个数：1、2、…第 ${pos} 个是 <b>${ans}</b>`,
    kind: 'ordinal',
  };
}

/* ---------- 关卡组合 ---------- */

function qKey(q){
  return `${q.kind||''}|${q.prompt||''}|${q.display||''}|${q.answer||''}`;
}

export function makeMathLevel(n=5, level=20){
  const pool = [];
  if(level <= 5){
    // 5 以内（3-4 岁小班）：具象为主 + 序数 + 分与合入门
    pool.push(
      ()=>makeAdd(5), ()=>makeAdd(5),
      ()=>makeSub(5),
      countQ, countQ,
      ()=>compareQ(5), ()=>compareQ(5),
      ordinalQ,
      ()=>decomposeQ(5),
    );
  } else if(level <= 10){
    // 10 以内（中班）：加减 + 分与合 + 相邻数 + 序数
    pool.push(
      ()=>makeAdd(10), ()=>makeAdd(10),
      ()=>makeSub(10), ()=>makeSub(10),
      countQ,
      ()=>compareQ(10),
      ()=>decomposeQ(10),
      ()=>neighborQ(10),
      ()=>patternQ(10),
      ()=>fillQ(10),
      ()=>wordQ(10),
    );
  } else if(level <= 20){
    // 20 以内（大班）：凑十/破十主打 + 相邻数 + 应用题
    pool.push(
      ()=>makeAdd(20), ()=>makeAdd(20), ()=>makeAdd(20),
      ()=>makeSub(20), ()=>makeSub(20), ()=>makeSub(20),
      ()=>compareQ(20),
      ()=>neighborQ(20),
      ()=>patternQ(20),
      ()=>fillQ(20),
      ()=>wordQ(20),
    );
  } else if(level <= 50){
    pool.push(
      ()=>makeAdd(50), ()=>makeAdd(50), ()=>makeAdd(50),
      ()=>makeSub(50), ()=>makeSub(50), ()=>makeSub(50),
      ()=>neighborQ(50),
      ()=>patternQ(50),
      ()=>fillQ(50),
      ()=>wordQ(50),
    );
  } else {
    pool.push(
      ()=>makeAdd(100), ()=>makeAdd(100), ()=>makeAdd(100),
      ()=>makeSub(100), ()=>makeSub(100), ()=>makeSub(100),
      ()=>neighborQ(100),
      ()=>patternQ(100),
      ()=>fillQ(100),
      ()=>wordQ(100),
    );
  }
  const qs = [];
  const seen = new Set();
  const kindCount = {};                       // 每种题型最多出现 2 次，尽量多样
  let attempts = 0;
  while(qs.length < n && attempts < n * 40){
    const g = pool[rand(0, pool.length-1)];
    const q = g();
    const key = qKey(q);
    if(seen.has(key)){ attempts++; continue; }
    const k = q.kind || 'x';
    if((kindCount[k] || 0) >= 2 && attempts < n * 20){ attempts++; continue; }
    seen.add(key);
    kindCount[k] = (kindCount[k] || 0) + 1;
    qs.push(q);
    attempts++;
  }
  return qs;
}
