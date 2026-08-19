# 小米学习乐园 🦁

一个给 **4–6 岁小朋友** 的数学 / 语文练习网页。每关做完随机奖励一段适龄小游戏（猜谜语、记忆翻牌），并送贴纸收集。

## ✨ 特性

- **数学乐园**：10 以内加减 / 20 以内加法 / 比大小 / 数一数 / 认形状
- **语文乐园**：认字 / 拼音 / 看图选字 / 听音选字（30+ 一年级常用字）
- **奖励小游戏**：猜谜语、记忆翻牌，每关随机抽一个
- **激励系统**：星星、连续打卡、贴纸收藏册（22 枚可收集）
- **朗读题目**：Web Speech API 中文 TTS（点 🔊 再读一次）
- **音效**：Web Audio API 合成，无外部素材依赖
- **3D Q 版视觉**：糖果色渐变 + 大圆角 + 柔和阴影 + Emoji 立体表情
- **儿童友好交互**：大按钮、错三次自动放行、无扣分、无排行榜、无广告
- **纯静态**：无需构建，直接双击 `index.html` 或任意静态服务器即可运行

## 🚀 本地运行

方案一（推荐，需要一个静态服务器，避免 `file://` 无法 fetch JSON）：

```bash
cd xiaomi
python3 -m http.server 8080
# 打开 http://localhost:8080
```

或 Node：

```bash
npx serve .
```

## 📁 目录结构

```
xiaomi/
├─ index.html
├─ css/main.css              # 3D Q 版样式
├─ js/
│  ├─ app.js                 # 入口 + 简单路由
│  ├─ audio.js               # TTS + 合成音效
│  ├─ storage.js             # localStorage 存档
│  ├─ subjects/
│  │  ├─ math.js             # 数学题生成器
│  │  └─ chinese.js          # 语文题（读 data/chinese.json）
│  ├─ games/
│  │  ├─ riddle.js           # 猜谜语
│  │  └─ memory.js           # 记忆翻牌
│  └─ ui/
│     ├─ common.js           # 通用 DOM 工具
│     ├─ home.js             # 首页
│     ├─ level.js            # 通用关卡组件
│     ├─ reward.js           # 奖励小游戏页
│     ├─ result.js           # 结算页
│     └─ stickers.js         # 贴纸册
├─ data/
│  ├─ chinese.json           # 汉字 + 拼音 + 图
│  └─ riddles.json           # 谜语库
└─ README.md
```

## 🧩 扩展题库

- 加汉字：编辑 `data/chinese.json` 的 `hanzi` 数组
- 加谜语：编辑 `data/riddles.json`
- 加数学题型：在 `js/subjects/math.js` 的 `POOL` 中加一个题型函数
- 加奖励游戏：在 `js/games/` 下新建，然后在 `js/ui/reward.js` 的 `games` 数组里注册

## 🗺️ 路线图

- [x] **M1** 骨架 / 3D Q 版样式 / 路由 / TTS / 音效
- [x] **M2** 数学 + 语文关卡 + 猜谜语 + 记忆翻牌
- [ ] **M3** 更多小游戏（找不同、拼图、打地鼠·汉字版）
- [ ] **M4** 家长中心（PIN 保护）+ PWA + 学习报告

## 📄 License

MIT
