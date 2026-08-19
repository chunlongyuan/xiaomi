# 预生成音频

这个目录里的 `*.mp3` 由 `scripts/gen-audio.py` 生成，使用 Microsoft Edge 神经声 TTS。

**不要手动编辑或提交这些 MP3 文件到仓库** —— 每次 GitHub Actions 部署时会自动生成，并作为 Pages artifact 的一部分上传。缓存策略见 `.github/workflows/pages.yml`。

要添加新短语：编辑 `scripts/audio-phrases.json` 的 `phrases` 数组，下次部署自动生成新音频。
