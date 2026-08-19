#!/usr/bin/env python3
"""生成静态短语的 MP3 音频 —— 用 Microsoft Edge 免费神经 TTS。

用法（GitHub Actions 或本地）：
  pip install edge-tts
  python scripts/gen-audio.py

短语条目支持两种格式：
  1) 纯字符串："你好"           —— 用配置里默认 voice/rate/pitch
  2) 对象：{ "text":"cat", "voice":"en-US-JennyNeural", "rate":"-5%" }
     可覆盖 voice / rate / pitch

输出：
  audio/<sha1(text|voice|rate|pitch)[:16]>.mp3
  audio/manifest.json    ← {text: filename}
"""
import asyncio, hashlib, json, os, sys, time
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG  = json.load(open(os.path.join(ROOT, 'scripts', 'audio-phrases.json'), 'r', encoding='utf-8'))
OUT  = os.path.join(ROOT, 'audio')
os.makedirs(OUT, exist_ok=True)

DEF_VOICE = CFG['voice']
DEF_RATE  = CFG.get('rate', '-8%')
DEF_PITCH = CFG.get('pitch', '+0Hz')
CONCURRENCY = 8
sem = asyncio.Semaphore(CONCURRENCY)

def normalize(entry):
    """把字符串或对象归一化成 (text, voice, rate, pitch)。"""
    if isinstance(entry, str):
        return entry, DEF_VOICE, DEF_RATE, DEF_PITCH
    text = entry['text']
    return (text,
            entry.get('voice', DEF_VOICE),
            entry.get('rate',  DEF_RATE),
            entry.get('pitch', DEF_PITCH))

def fname_for(text, voice, rate, pitch):
    h = hashlib.sha1(f"{text}|{voice}|{rate}|{pitch}".encode('utf-8')).hexdigest()[:16]
    return f"{h}.mp3"

async def gen(text, voice, rate, pitch):
    fname = fname_for(text, voice, rate, pitch)
    fpath = os.path.join(OUT, fname)
    if os.path.exists(fpath) and os.path.getsize(fpath) > 200:
        return text, fname, 'cache'
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                await comm.save(fpath)
                if os.path.getsize(fpath) > 200:
                    return text, fname, 'new'
            except Exception as e:
                if attempt == 2:
                    print(f"  ✗ FAIL {text!r} ({voice}): {e}", file=sys.stderr)
                    return text, fname, 'fail'
                await asyncio.sleep(1.5 * (attempt + 1))

async def main():
    entries = list({normalize(e)[0]: normalize(e) for e in CFG['phrases']}.values())  # dedupe by text
    print(f"[gen-audio] default voice={DEF_VOICE} rate={DEF_RATE}")
    print(f"[gen-audio] {len(entries)} unique phrases → {OUT}")
    t0 = time.time()
    results = await asyncio.gather(*[gen(*e) for e in entries])
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
    if stats['fail'] > len(entries) * 0.5:
        print(f"[gen-audio] more than half failed, aborting", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
