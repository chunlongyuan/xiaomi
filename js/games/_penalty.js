// 通用惩罚提示 —— 屏幕短暂闪一个 "-1" 红字
import { el } from '../ui/common.js';

export function flashPenalty(panel, label='-1'){
  const f = el('div', 'penalty-flash', label);
  panel.appendChild(f);
  setTimeout(()=> f.classList.add('show'), 10);
  setTimeout(()=>{ f.classList.remove('show'); setTimeout(()=>f.remove(), 300); }, 600);
}
