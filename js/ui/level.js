// 通用关卡组件
import { el, topbar, toast, burst, confetti, praise } from './common.js';
import { makeMathLevel } from '../subjects/math.js';
import { makeChineseLevel } from '../subjects/chinese.js';

export function renderLevel(ctx){
  const { root, params, go, store, audio } = ctx;
  const subject = params.subject || 'math';
  const level = params.level || null;

  const qs = subject === 'math'
    ? makeMathLevel(5, level || 20)
    : makeChineseLevel(5);

  let idx = 0;
  const results = [];
  let attempts = 0;

  root.appendChild(topbar(ctx, {
    back: () => go(subject==='math' ? 'difficulty' : 'home', subject==='math'?{subject:'math'}:{}),
  }));

  const panel = el('div', 'level');
  root.appendChild(panel);

  render();

  function render(){
    panel.innerHTML = '';

    // 进度点
    const p = el('div','progress');
    qs.forEach((_,i)=>{
      const cls = i<idx ? (results[i]||'done') : (i===idx ? 'current' : '');
      p.appendChild(el('span', 'dot' + (cls?' '+cls:'')));
    });
    panel.appendChild(p);

    // 副标题
    const subtitle = el('div','level-sub', subject==='math' ? `🧮 ${level||'?'} 以内` : '📚 语文');
    panel.appendChild(subtitle);

    if(idx >= qs.length){
      const correct = results.filter(r=>r==='right').length;
      store.addStars(correct);
      store.finishLevel(subject, level, correct, qs.length);
      go('reward', { subject, level, stars: correct, total: qs.length });
      return;
    }

    const q = qs[idx];

    const question = el('div', 'question');
    if(q.hanzi){
      question.innerHTML = `
        ${q.prompt ? `<div class="prompt">${q.prompt}</div>` : ''}
        <div class="hanzi">${q.hanzi}</div>
        ${q.pinyin ? `<div class="pinyin">${q.pinyin}</div>` : ''}
      `;
    } else {
      question.innerHTML = `
        ${q.prompt ? `<div class="prompt">${q.prompt}</div>` : ''}
        ${q.display || ''}
      `;
    }
    panel.appendChild(question);

    // 工具条
    const tools = el('div', 'tools');
    const speakBtn = el('button','iconbtn','🔊');
    speakBtn.title = '再读一次';
    speakBtn.addEventListener('click', ()=>{ audio.tap(); audio.unlock(); speakQuestion(q); });
    tools.appendChild(speakBtn);
    if(q.hint){
      const hintBtn = el('button','iconbtn','💡');
      hintBtn.title = '看看提示';
      hintBtn.addEventListener('click', ()=>{ audio.tap(); showHint(q); });
      tools.appendChild(hintBtn);
    }
    panel.appendChild(tools);

    // 选项
    const choices = el('div','choices');
    q.choices.forEach(c => {
      const label = typeof c === 'string' ? c : c.label;
      const value = typeof c === 'string' ? c : c.value;
      const b = el('button','choice');
      b.innerHTML = typeof c === 'string' ? label
        : `<div>${label}</div><div class="cap">${value}</div>`;
      b.dataset.value = value;
      b.addEventListener('click', ()=> answer(b, value, q));
      choices.appendChild(b);
    });
    panel.appendChild(choices);

    setTimeout(()=> speakQuestion(q), 200);
  }

  function speakQuestion(q){
    if(q.speakParts && q.speakParts.length){
      audio.speakParts(q.speakParts);
    } else {
      audio.speak(q.speak || q.prompt || '');
    }
  }

  function showHint(q){
    if(!q.hint) return;
    const overlay = el('div','hint-overlay');
    overlay.innerHTML = `
      <div class="hint-card">
        <div class="ht">💡 小提示</div>
        <div class="hb">${q.hint}</div>
        <button class="btn yellow" data-close>知道啦</button>
      </div>`;
    document.body.appendChild(overlay);
    const close = ()=> overlay.remove();
    overlay.querySelector('[data-close]').addEventListener('click', ()=>{ audio.tap(); close(); });
    overlay.addEventListener('click', e => { if(e.target===overlay) close(); });
  }

  function answer(btn, value, q){
    if(btn.disabled) return;
    if(String(value) === String(q.answer)){
      btn.classList.add('correct');
      audio.right();
      [...btn.parentNode.children].forEach(c=>c.disabled = true);
      results[idx] = 'right';
      // 大特效
      burst(pickCelebration());
      confetti(1000, 40);
      toast(praise(), 900);
      // 数一数的题需要多留一会儿，方便孩子核对
      const wait = q.kind === 'count' ? 1400 : 900;
      setTimeout(()=>{ idx++; attempts = 0; render(); }, wait);
    } else {
      btn.classList.add('wrong');
      audio.wrong();
      btn.disabled = true;
      attempts++;
      if(attempts >= 3){
        // 展示正确 + 讲解
        [...btn.parentNode.children].forEach(c => {
          c.disabled = true;
          if(String(c.dataset.value).trim() === String(q.answer).trim()) c.classList.add('correct');
        });
        results[idx] = 'wrong';
        if(q.hint){
          showHint(q);
          setTimeout(()=>{ document.querySelector('.hint-overlay')?.remove(); idx++; attempts=0; render(); }, 3500);
        } else {
          toast('正确答案是 ' + q.answer, 1500);
          setTimeout(()=>{ idx++; attempts = 0; render(); }, 1500);
        }
      } else {
        toast('再想想～', 900);
        setTimeout(()=> btn.classList.remove('wrong'), 500);
      }
    }
  }
}

function pickCelebration(){
  const arr = ['🎉','⭐','🌟','🎊','🏆','💯','👏','🥳','✨','🚀'];
  return arr[Math.floor(Math.random()*arr.length)];
}
