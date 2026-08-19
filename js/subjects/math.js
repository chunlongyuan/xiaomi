// 数学题生成器 —— 学龄前 4-6 岁
// 每题结构 { prompt, display:[…], choices:[…], answer, speak }
import { rand, shuffle, pick } from '../ui/common.js';

const SHAPES = [
  { name:'圆形', emoji:'🔴' },
  { name:'方块', emoji:'🟦' },
  { name:'三角形', emoji:'🔺' },
  { name:'星星', emoji:'⭐' },
  { name:'心形', emoji:'❤️' },
];

function addQ(){
  const a = rand(1, 9), b = rand(1, 10 - a);   // 和≤10
  return finalizeMath(a, '+', b, a+b);
}
function subQ(){
  const a = rand(2, 10), b = rand(1, a-1);
  return finalizeMath(a, '−', b, a-b);
}
function bigAddQ(){
  const a = rand(5, 15), b = rand(1, 20 - a);
  return finalizeMath(a, '+', b, a+b);
}
function compareQ(){
  let a = rand(1, 20), b = rand(1, 20);
  while(a === b) b = rand(1, 20);
  const bigger = a > b ? a : b;
  const choices = shuffle([a, b, rand(1,20)]);
  return {
    prompt:'哪个数字大？',
    display:`<span>${a}</span><span class="op">和</span><span>${b}</span>`,
    choices: choices.map(String),
    answer: String(bigger),
    speak: `${a} 和 ${b} 哪个大？`,
  };
}
function countQ(){
  const s = SHAPES[rand(0, SHAPES.length-1)];
  const n = rand(2, 8);
  const emojis = s.emoji.repeat(n);
  const choices = shuffle([n, n-1, n+1, Math.max(1,n-2)].filter((v,i,arr)=>arr.indexOf(v)===i).slice(0,4));
  if(!choices.includes(n)) choices[0] = n;
  return {
    prompt:`数一数，有几个 ${s.name}？`,
    display:`<div style="font-size:56px;letter-spacing:6px">${emojis}</div>`,
    choices: shuffle(choices).map(String),
    answer: String(n),
    speak:`数一数，有几个${s.name}？`,
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
  };
}

function finalizeMath(a, op, b, ans){
  const distract = new Set([ans]);
  while(distract.size < 4){
    const d = ans + rand(-3, 3);
    if(d>=0 && d!==ans) distract.add(d);
  }
  return {
    prompt:'',
    display:`<span>${a}</span><span class="op">${op}</span><span>${b}</span><span class="op">=</span><span class="qmark">?</span>`,
    choices: shuffle([...distract]).map(String),
    answer: String(ans),
    speak: `${a} ${op==='+'?'加':'减'} ${b} 等于几？`,
  };
}

const POOL = [addQ, addQ, subQ, subQ, bigAddQ, compareQ, countQ, shapeQ];

export function makeMathLevel(n=5){
  const qs = [];
  for(let i=0;i<n;i++){
    const gen = POOL[rand(0, POOL.length-1)];
    qs.push(gen());
  }
  return qs;
}
