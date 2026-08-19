// 通用关卡组件 —— 数学 / 语文共用
import { el, topbar, toast } from './common.js';
import { makeMathLevel } from '../subjects/math.js';
import { makeChineseLevel } from '../subjects/chinese.js';

export function renderLevel(ctx){
  const { root, params, go, store, audio } = ctx;
  const subject = params.subject || 'math';

  const qs = subject === 'math' ? makeMathLevel(5) : makeChineseLevel(5);
  let idx = 0;
  const results = [];         // 每题：'right' | 'wrong'
  let attempts = 0;           // 本题错误次数

  root.appendChild(topbar(store));

  const panel = el('div', 'level');
  root.appendChild(panel);

  render();

  function render(){
    panel.innerHTML = '';
    // 进度点
    const p = el('div','progress');
    qs.forEach((_,i)=>{
      const dot = el('span', 'dot' + (
        i<idx ? ' ' + (results[i] || 'done')
        : i===idx ? ' current'
        : ''
      ));
      p.appendChild(dot);
    });
    panel.appendChild(p);

    if(idx >= qs.length){
      // 完成 → 去奖励
      const stars = results.filter(r=>r==='right').length;
      store.addStars(stars);
      store.finishLevel();
      go('reward', { subject, stars, total: qs.length });
      return;
    }

    const q = qs[idx];

    // 题面
    const question = el('div', 'question');
    if(q.hanzi){
      // 语文题：显示大字 + 拼音 + 提示
      question.innerHTML = `
        ${q.prompt ? `<div class="prompt">${q.prompt}</div>` : ''}
        ${q.hanzi ? `<div class="hanzi">${q.hanzi}</div>` : ''}
        ${q.pinyin ? `<div class="pinyin">${q.pinyin}</div>` : ''}
      `;
    } else {
      question.innerHTML = `
        ${q.prompt ? `<div class="prompt">${q.prompt}</div>` : ''}
        ${q.display || ''}
      `;
    }
    panel.appendChild(question);

    // 工具条：朗读题目
    const tools = el('div', 'tools');
    const speakBtn = el('button','iconbtn','🔊');
    speakBtn.title = '再读一次';
    speakBtn.addEventListener('click', ()=>{ audio.tap(); speakQuestion(q); });
    tools.appendChild(speakBtn);
    panel.appendChild(tools);

    // 选项
    const choices = el('div','choices');
    q.choices.forEach(c => {
      const label = typeof c === 'string' ? c : c.label;
      const value = typeof c === 'string' ? c : c.value;
      const b = el('button','choice');
      b.innerHTML = typeof c === 'string' ? label
        : `<div>${label}</div><div class="cap">${value}</div>`;
      b.addEventListener('click', ()=> answer(b, value, q));
      choices.appendChild(b);
    });
    panel.appendChild(choices);

    // 自动读题
    setTimeout(()=> speakQuestion(q), 200);
  }

  function speakQuestion(q){
    audio.speak(q.speak || q.prompt || '');
  }

  function answer(btn, value, q){
    if(btn.disabled) return;
    if(String(value) === String(q.answer)){
      btn.classList.add('correct');
      audio.right();
      btn.disabled = true;
      // 禁用其他
      [...btn.parentNode.children].forEach(c=>c.disabled = true);
      results[idx] = 'right';
      setTimeout(()=>{ idx++; attempts = 0; render(); }, 750);
    } else {
      btn.classList.add('wrong');
      audio.wrong();
      btn.disabled = true;
      attempts++;
      if(attempts >= 3){
        toast('正确答案是 ' + (typeof q.answer==='string'? q.answer : q.answer), 1600);
        // 展示正确答案
        [...btn.parentNode.children].forEach(c => {
          c.disabled = true;
          const v = c.querySelector('.cap')?.textContent || c.textContent;
          if(String(v).trim() === String(q.answer).trim()) c.classList.add('correct');
        });
        results[idx] = 'wrong';
        setTimeout(()=>{ idx++; attempts = 0; render(); }, 1500);
      } else {
        toast('再想想～', 900);
        setTimeout(()=> btn.classList.remove('wrong'), 500);
      }
    }
  }
}
