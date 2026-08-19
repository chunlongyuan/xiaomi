#!/usr/bin/env python3
"""生成静态短语的 MP3 音频 —— 用 Microsoft Edge 免费神经 TTS。

用法（GitHub Actions 或本地）：
  pip install edge-tts
  python scripts/gen-audio.py

输出：
  audio/<sha1(text|voice)[:16]>.mp3   ← 每个短语一个文件（重复 skip）
  audio/manifest.json                 ← {text: filename} 映射
"""
import asyncio, hashlib, json, os, sys, time
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG  = json.load(open(os.path.join(ROOT, 'scripts', 'audio-phrases.json'), 'r', encoding='utf-8'))
OUT  = os.path.join(ROOT, 'audio')
os.makedirs(OUT, exist_ok=True)

VOICE = CFG['voice']
RATE  = CFG.get('rate', '-8%')
PITCH = CFG.get('pitch', '+0Hz')
CONCURRENCY = 8

sem = asyncio.Semaphore(CONCURRENCY)

def fname_for(text):
    h = hashlib.sha1((text + '|' + VOICE + '|' + RATE + '|' + PITCH).encode('utf-8')).hexdigest()[:16]
    return f"{h}.mp3"

async def gen(text):
    fname = fname_for(text)
    fpath = os.path.join(OUT, fname)
    if os.path.exists(fpath) and os.path.getsize(fpath) > 200:
        return text, fname, 'cache'
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH)
                await comm.save(fpath)
                if os.path.getsize(fpath) > 200:
                    return text, fname, 'new'
            except Exception as e:
                if attempt == 2:
                    print(f"  ✗ FAIL {text!r}: {e}", file=sys.stderr)
                    return text, fname, 'fail'
                await asyncio.sleep(1.5 * (attempt + 1))

async def main():
    phrases = list(dict.fromkeys(CFG['phrases']))   # dedupe, keep order
    print(f"[gen-audio] voice={VOICE} rate={RATE} pitch={PITCH}")
    print(f"[gen-audio] {len(phrases)} unique phrases → {OUT}")
    t0 = time.time()
    results = await asyncio.gather(*[gen(t) for t in phrases])
    stats = {'cache':0, 'new':0, 'fail':0}
    manifest = {}
    for text, fname, status in results:
        stats[status] += 1
        if status != 'fail':
            manifest[text] = fname
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(f"[gen-audio] done in {time.time()-t0:.1f}s  cache={stats['cache']} new={stats['new']} fail={stats['fail']}")
    print(f"[gen-audio] wrote {os.path.join(OUT, 'manifest.json')}  ({len(manifest)} entries)")
    # 部分失败不阻断部署，运行时会 fallback 到 SpeechSynthesis
    if stats['fail'] > len(phrases) * 0.5:
        print(f"[gen-audio] more than half failed, aborting", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
