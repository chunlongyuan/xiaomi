// 通用关卡组件
import { el, topbar, toast, burst, confetti } from './common.js';
import { makeMathLevel } from '../subjects/math.js';
import { makeChineseLevel } from '../subjects/chinese.js';
import { makeEnglishLevel } from '../subjects/english.js';
import { speechAvailable, listenOnce, matchSpoken } from '../speech.js';

export function renderLevel(ctx){
  const { root, params, go, store, audio } = ctx;
  const subject = params.subject || 'math';
  const level = params.level || null;
  const tier = params.tier || 'basic';

  const qs =
    subject === 'math'    ? makeMathLevel(5, level || 20) :
    subject === 'english' ? makeEnglishLevel(5, tier || 'letters') :
                            makeChineseLevel(5, tier || 'sprout');

  let idx = 0;
  const results = [];
  let attempts = 0;

  root.appendChild(topbar(ctx, {
    back: () => go('difficulty', { subject }),
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
    const zhTierName = { sprout:'🌱 启蒙', leaf:'🌿 认字入门', tree:'🌳 拓展识字', pine:'🌲 幼小衔接' }[tier];
    const enTierName = { letters:'🅰️ 字母', words:'🐱 单词', phrases:'👋 短语' }[tier];
    const subtitle = el('div','level-sub',
      subject==='math'    ? `🧮 ${level||'?'} 以内` :
      subject==='english' ? `🔤 ${enTierName||''}` :
                            `📚 ${zhTierName||''}`);
    panel.appendChild(subtitle);

    if(idx >= qs.length){
      const correct = results.filter(r=>r==='right').length;
      store.addStars(correct);
      store.finishLevel(subject, subject==='math' ? level : tier, correct, qs.length);
      go('reward', { subject, level, tier, stars: correct, total: qs.length });
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
    // 英语题加"我来读"麦克风按钮
    if(subject === 'english' && speechAvailable && (tier === 'words' || tier === 'phrases')){
      const micBtn = el('button','iconbtn mic-btn','🎤');
      micBtn.title = '按住我来读';
      micBtn.addEventListener('click', ()=> tryPronunciation(micBtn, q));
      tools.appendChild(micBtn);
    }
    panel.appendChild(tools);

    // 选项
    const choices = el('div','choices');
    q.choices.forEach(c => {
      const label = typeof c === 'string' ? c : c.label;
      const value = typeof c === 'string' ? c : c.value;
      const b = el('button','choice');
      b.innerHTML = typeof c === 'string' ? label
        : `<div>${label}</div>${label !== value ? `<div class="cap">${value}</div>` : ''}`;
      b.dataset.value = value;
      b.addEventListener('click', ()=>{ audio.tap(); answer(b, value, q); });
      choices.appendChild(b);
    });
    panel.appendChild(choices);

    setTimeout(()=> speakQuestion(q), 200);
  }

  async function tryPronunciation(btn, q){
    if(btn.classList.contains('listening')) return;
    audio.tap();
    audio.stop();                       // 别让 TTS 干扰识别
    btn.classList.add('listening');
    btn.textContent = '👂';
    // 目标就是答案本身（英语单词/短语）
    const target = q.answer;
    let alts = [];
    try {
      alts = await listenOnce({ lang:'en-US', timeout: 5000 });
    } catch(e) {
      showTip(`听不清呢～ (${e.message==='not-allowed'?'请允许麦克风':'再试一次'})`, 1500);
    }
    btn.classList.remove('listening');
    btn.textContent = '🎤';
    if(!alts || !alts.length) return;
    const heard = alts[0].transcript;
    const ok = alts.some(a => matchSpoken(a.transcript, target));
    if(ok){
      // 直接判为答对
      const correctBtn = [...document.querySelectorAll('.choice')].find(c =>
        String(c.dataset.value).trim() === String(target).trim()
      );
      if(correctBtn) answer(correctBtn, target, q);
      else {
        // 后备：手动触发正确特效
        audio.right(); burst('🎉'); confetti(1000, 40);
        setTimeout(()=> { idx++; attempts=0; render(); }, 900);
      }
      showTip(`👍 你说的是 "${heard}"`, 1600);
    } else {
      showTip(`听到你说 "${heard}"，再试一次读 "${target}"`, 2000);
    }
  }
  function showTip(text, ms){
    const t = el('div','pron-tip', text);
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 10);
    setTimeout(()=> { t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, ms);
  }

  function speakQuestion(q){
    if(q.speakParts && q.speakParts.length){
      audio.speakParts(q.speakParts, { lang: q.lang });
    } else {
      audio.speak(q.speak || q.prompt || '', { lang: q.lang });
    }
  }

  function showHint(q, onClose){
    if(!q.hint) return;
    const overlay = el('div','hint-overlay');
    overlay.innerHTML = `
      <div class="hint-card">
        <div class="ht">💡 小提示</div>
        <div class="hb">${q.hint}</div>
        <button class="btn yellow" data-close>知道啦</button>
      </div>`;
    document.body.appendChild(overlay);
    let done = false;
    const close = ()=> {
      if(done) return;
      done = true;
      overlay.remove();
      if(onClose) onClose();
    };
    // 只允许"知道啦"按钮关闭（不再点背景关闭，避免误触）
    overlay.querySelector('[data-close]').addEventListener('click', ()=>{ audio.tap(); close(); });
  }

  function answer(btn, value, q){
    if(btn.disabled) return;
    if(String(value) === String(q.answer)){
      btn.classList.add('correct');
      audio.right();
      [...btn.parentNode.children].forEach(c=>c.disabled = true);
      results[idx] = 'right';
      // 大特效（不再弹夸奖 toast，只保留 emoji burst + 撒花 + 音效）
      burst(pickCelebration());
      confetti(1000, 40);
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
          // 提示弹窗停留，直到点 "知道啦" 才关闭并进入下一题
          showHint(q, ()=>{ idx++; attempts = 0; render(); });
        } else {
          toast('正确答案是 ' + q.answer, 1500);
          setTimeout(()=>{ idx++; attempts = 0; render(); }, 1500);
        }
      } else {
        // 不再弹 "再想想" toast，红色抖动 + 错误音效已经是清晰反馈
        setTimeout(()=> btn.classList.remove('wrong'), 500);
      }
    }
  }
}

function pickCelebration(){
  const arr = ['🎉','⭐','🌟','🎊','🏆','💯','👏','🥳','✨','🚀'];
  return arr[Math.floor(Math.random()*arr.length)];
}
