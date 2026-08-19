// 奖励小游戏注册中心
import { playRiddle }  from './riddle.js';
import { playMemory }  from './memory.js';
import { playWhack }   from './whack.js';
import { playBalloon } from './balloon.js';
import { playOrder }   from './order.js';

export const REWARD_GAMES = [
  { id:'riddle',  title:'猜谜语',   emoji:'🤔', play: playRiddle  },
  { id:'memory',  title:'记忆翻牌', emoji:'🧠', play: playMemory  },
  { id:'whack',   title:'打地鼠',   emoji:'🔨', play: playWhack   },
  { id:'balloon', title:'戳气球',   emoji:'🎈', play: playBalloon },
  { id:'order',   title:'数字排队', emoji:'🔢', play: playOrder   },
];

export function gameById(id){ return REWARD_GAMES.find(g => g.id === id); }
