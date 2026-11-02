# -*- coding: utf-8 -*-
"""配乐：从 incompetech（Kevin MacLeod，CC BY 4.0，可商用，署名即可）挑现成曲，做叠旁白的 30 秒试听，选定后循环到片长。
  python bgm.py <工作目录> search [bpm_lo bpm_hi]          按「电子 / 明亮 / 有推进感」筛曲库，打印候选
  python bgm.py <工作目录> preview "Tech Live" "Voxel Revolution" ...   下载 → audio/bgm_candidates/NN_曲名.m4a（叠开场旁白，音量比例同成片）
  python bgm.py <工作目录> use "Voxel Revolution"            → audio/bgm.wav（不够长就首尾 2 秒交叉淡化循环），写进 plan.json 的 bgm
用户 11-02：lo-fi 太平、自己合成的电子乐也不够好，要「直接能用的背景音乐」；从 5 首里选了 Voxel Revolution。
署名写进 正文.txt 末尾：「配乐：Kevin MacLeod《曲名》，CC BY 4.0」，不放网址（账号规矩不引流站外）。
Pixabay 在云端被代理拦（403），incompetech 能直连。也可以用 tools/bgm_drive.py 自己合成（原创，无署名要求）。
"""
import json, re, subprocess, sys, urllib.parse, urllib.request
from pathlib import Path

P = Path(sys.argv[1]).resolve(); cmd = sys.argv[2]; args = sys.argv[3:]
cache = Path("/tmp/claude-0/incompetech"); cache.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0"}
def get(url, f):
    if not f.exists(): f.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read())
    return f
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]))
def mp3(title): return get("https://incompetech.com/music/royalty-free/mp3-royaltyfree/" + urllib.parse.quote(title + ".mp3"), cache / f"{title}.mp3")

if cmd == "search":
    lo, hi = (int(args[0]), int(args[1])) if len(args) >= 2 else (100, 135)
    d = json.loads(get("https://incompetech.com/music/royalty-free/pieces.json", cache / "pieces.json").read_text())
    rows = []
    for p in d:
        txt = " ".join((p.get(k) or "") for k in ("feel", "description", "instruments")).lower()
        try: bpm = int(p.get("bpm") or 0)
        except ValueError: bpm = 0
        h, m, s = map(int, p["length"].split(":"))
        if h * 3600 + m * 60 + s < 120 or not lo <= bpm <= hi or not re.search(r"synth|electr", txt): continue
        if re.search(r"dark|horror|scary|tense|ominous|sad|creepy|suspense", txt): continue
        score = sum(k in txt for k in ["bright", "uplifting", "driving", "tech", "upbeat", "energetic", "grooving", "bouncy", "interview", "modern"])
        rows.append((score, p["title"], bpm, p["length"], p.get("feel"), (p.get("description") or "")[:80]))
    for r in sorted(rows, reverse=True)[:30]: print(r)
elif cmd == "preview":
    out = P / "audio/bgm_candidates"; out.mkdir(parents=True, exist_ok=True)
    plan = json.loads((P / "plan.json").read_text(encoding="utf-8"))
    hook = next((plan["clips"][it[1]] for it in plan["plan"] if it[0] == "clip"), None)
    lead = sum(b - a for a, b in hook["segs"]) if hook and plan["plan"][0][0] == "clip" else 0
    nar = [it[1] for it in plan["plan"] if it[0] == "nar"][:4]
    voice = Path("/tmp/claude-0/bgm_voice.wav"); ins = []
    for k in nar: ins += ["-i", str(P / "narration" / f"{k}.wav")]
    fc = "".join(f"[{i}]" for i in range(len(nar))) + f"concat=n={len(nar)}:v=0:a=1,adelay={int(lead * 1000)}|{int(lead * 1000)},apad,atrim=0:30[v]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[v]", "-ar", "48000", str(voice)], check=True)
    gain = plan.get("bgm", {}).get("gain_db", -11.0)
    for i, t in enumerate(args, 1):
        f = out / f"{i:02d}_{re.sub(r'[^A-Za-z0-9]+', '_', t).strip('_')}.m4a"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(voice), "-i", str(mp3(t)), "-filter_complex",
            f"[0:a]aformat=channel_layouts=stereo,volume=1.8,asplit=2[vo][k];[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:30,volume={gain}dB,afade=t=out:st=27.5:d=2.5[m];"
            "[m][k]sidechaincompress=threshold=0.06:ratio=2.5:attack=40:release=400[mb];[vo][mb]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5[a]",
            "-map", "[a]", "-c:a", "aac", "-b:a", "192k", str(f)], check=True)
        print(f, f"（原曲 {dur(mp3(t)) / 60:.1f} 分钟）")
elif cmd == "use":
    t = args[0]; src = mp3(t); need = json.loads((P / "timeline.json").read_text())["dur"] + 3 if (P / "timeline.json").exists() else 300
    (P / "audio").mkdir(exist_ok=True)
    keep = P / "audio" / (re.sub(r"[^A-Za-z0-9]+", "_", t).strip("_") + "_KevinMacLeod_CCBY4.mp3"); keep.write_bytes(src.read_bytes())
    n = 1; L = dur(src)
    while L * n - 2 * (n - 1) < need: n += 1
    ins = sum((["-i", str(src)] for _ in range(n)), [])
    if n == 1: fc = "[0:a]aresample=48000[a]"
    else:
        fc, prev = [], "[0:a]"
        for i in range(1, n): fc.append(f"{prev}[{i}:a]acrossfade=d=2:c1=tri:c2=tri[x{i}]"); prev = f"[x{i}]"
        fc = ";".join(fc) + f";{prev}aresample=48000[a]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", fc, "-map", "[a]", str(P / "audio/bgm.wav")], check=True)
    plan = json.loads((P / "plan.json").read_text(encoding="utf-8"))
    plan["bgm"] = {**plan.get("bgm", {}), "file": "audio/bgm.wav", "title": t, "credit": f"配乐：Kevin MacLeod《{t}》，CC BY 4.0"}
    plan["bgm"].setdefault("gain_db", -11.0)
    (P / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"audio/bgm.wav {dur(P / 'audio/bgm.wav'):.1f}s（循环 {n} 次）；正文.txt 末尾加：{plan['bgm']['credit']}")
