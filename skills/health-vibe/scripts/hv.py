#!/usr/bin/env python3
"""health-vibe 工具：找重拍、查字幕、压中英字幕、安全区预览、查违禁词。

  python3 hv.py drop  音乐.mp3                       找「换气 + 重拍」候选，定 T
  python3 hv.py check 字幕.json                      查字幕长度、时长、宽度、锚词踩点、结尾问题、免责声明、违禁词
  python3 hv.py burn  字幕.json --video 画面.mp4 --out 成片.mp4 [--audio 音乐.mp3]
  python3 hv.py preview 成片.mp4 --times 0.5,T-0.2,T,... --out 预览.jpg [--subs 字幕.json]
  python3 hv.py zone  画面.mp4                       压字幕前查：画面里的图形有没有进字幕带（竖屏版 subzone_gate）
  python3 hv.py lint  发布文案.md                    查发布文案里的违禁词

字幕.json：
{
  "T": 17.0,
  "lines": [
    {"start": 0.4, "end": 3.6, "cn": "你每天都在睡，为什么还是累？", "en": "You sleep every night. So why so tired?"},
    {"start": 17.0, "end": 20.0, "type": "anchor", "cn": "对表", "en": "Reset the clock", "sci": "昼夜节律 · Circadian rhythm", "sci_at": 17.6},
      # 锚词默认由动画画在世界里的物上（"draw": "scene"），burn 不压它，只查踩点；要脚本压就写 "draw": "burn"
    ...
  ]
}
"""
import argparse, glob, json, os, re, subprocess, sys, tempfile

W, H = 1080, 1920
# 抖音 + TikTok 安全区取并集：上 12%、下 25%、右 15%、左 5%
SAFE = dict(left=int(W * .05), right=int(W * .85), top=int(H * .12), bottom=int(H * .75))
SAFE_W = SAFE['right'] - SAFE['left']
CX = (SAFE['left'] + SAFE['right']) // 2
SUB_CN_Y, SUB_EN_Y = 1215, 1300          # 字幕块中心，在纵向 55%～72% 之间
ANC_CN_Y, ANC_EN_Y, ANC_SCI_Y = 790, 950, 1030   # 锚词，在 35%～55% 之间
CN_SIZE, EN_SIZE = 60, 42
CN_MAX, EN_MAX_WORDS = 14, 8           # 60px 黑体 14 字约 840px，刚好放进 864px 安全宽

BANNED_CN = ['治疗', '治愈', '根治', '疗效', '药到病除', '排毒', '抗癌', '防癌', '逆转', '最好', '最佳', '第一', '唯一',
             '100%', '百分百', '包治', '神药', '偏方', '永不', '彻底告别']
BANNED_EN = ['cure', 'cures', 'cured', 'treat', 'treats', 'treatment', 'heal', 'heals', 'detox', 'miracle',
             'guaranteed', 'best', '#1', '100%', 'prevent cancer', 'fights cancer', 'reverse']
DISCLAIMER_CN, DISCLAIMER_EN = '不构成医疗建议', 'not medical advice'

CN_FONTS = [os.environ.get('HV_FONT_CN', ''),
            '/usr/share/fonts/**/NotoSansCJK*-Medium.ttc', '/usr/share/fonts/**/NotoSansCJK*.ttc',
            '/usr/share/fonts/**/NotoSansSC*.otf', '/usr/share/fonts/**/SourceHanSans*.ttc',
            '/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/**/wqy-zenhei.ttc']
EN_FONTS = [os.environ.get('HV_FONT_EN', ''),
            '/usr/share/fonts/**/Inter-Medium.otf', '/usr/share/fonts/**/Inter-Regular.otf',
            '/System/Library/Fonts/Helvetica.ttc', '/usr/share/fonts/**/DejaVuSans.ttf']


def find_font(cands):
    for pat in cands:
        if not pat:
            continue
        hits = sorted(glob.glob(pat, recursive=True))
        if hits:
            return hits[0]
    sys.exit('找不到字体，设环境变量 HV_FONT_CN / HV_FONT_EN 指定')


def font_info(path, size):
    from PIL import ImageFont
    f = ImageFont.truetype(path, size)
    return f, f.getname()[0]


def text_w(font, s):
    return font.getbbox(s)[2] - font.getbbox(s)[0] if s else 0


def load(path):
    with open(path, encoding='utf-8') as fh:
        spec = json.load(fh)
    spec['lines'] = sorted(spec['lines'], key=lambda l: l['start'])
    return spec


def banned_hits(text):
    hits = [w for w in BANNED_CN if w in text]
    low = text.lower()
    hits += [w for w in BANNED_EN if re.search(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', low)]
    return hits


# ---------------------------------------------------------------- drop
def cmd_drop(a):
    import numpy as np
    sr = 22050
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.audio, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    hop = int(sr * 0.02)
    n = len(x) // hop
    rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    dur = len(x) / sr
    t = np.arange(n) * 0.02
    flux = np.maximum(np.diff(db, prepend=db[0]), 0)
    cands = []
    for i in range(int(a.min_t / 0.02), n - 10):
        # 重拍：这一帧能量猛涨，且之后 0.5s 的平均能量明显高于之前 0.5s
        if flux[i] < 6:
            continue
        pre = db[max(0, i - 25):i]
        post = db[i:i + 25]
        if len(pre) < 10:
            continue
        ctx = db[max(0, i - 150):max(1, i - 25)]           # 之前 3 秒的音量作参照
        dip = np.median(ctx) - pre.min() if len(ctx) else 0  # 换气：重拍前音量掉了多少
        jump = post.mean() - pre.mean()
        score = flux[i] + jump + 0.8 * max(dip, 0)
        cands.append((score, t[i], dip, jump))
    cands.sort(reverse=True)
    picked = []
    for c in cands:
        if all(abs(c[1] - p[1]) > 1.0 for p in picked):
            picked.append(c)
        if len(picked) == 5:
            break
    picked.sort(key=lambda c: c[1])
    # BPM：onset 包络自相关，取 70～180 BPM 里最强的周期
    env = flux - flux.mean()
    ac = np.correlate(env, env, mode='full')[len(env) - 1:]
    lags = np.arange(len(ac)) * 0.02
    ok = (lags >= 60 / 180) & (lags <= 60 / 70)
    bpm = 60 / lags[ok][np.argmax(ac[ok])] if ok.any() else None
    print(f'音频时长 {dur:.2f}s（只看 {a.min_t:.0f}s 以后）。候选重拍，按时间排：')
    for s, tt, dip, jump in picked:
        print(f'  T={tt:6.2f}s  分数 {s:5.1f}  前面换气深 {dip:4.1f}dB  落下后抬升 {jump:4.1f}dB')
    if bpm:
        bar = 4 * 60 / bpm
        print(f'估计 BPM ≈ {bpm:.0f}（一拍 {60 / bpm:.3f}s，一小节约 {bar:.2f}s）。快推、砸入、字幕切换都落在拍点上，'
              f'以 T 为零点往前后推：T±n×{60 / bpm:.3f}s。估不准就用耳朵数，按实测改。')
    if picked:
        first = min((c for c in picked if c[2] >= 6), key=lambda c: c[1], default=max(picked))
        print(f'建议 T = {first[1]:.2f}s（最早一个前面有明显换气的；没有就取分数最高的）。'
              f'渲染后用 preview 看 T-0.2 / T / T+0.1 三帧再确认，必要时耳朵听一遍。')


# ---------------------------------------------------------------- check
def cmd_check(a):
    spec = load(a.subs)
    T = spec.get('T')
    fcn, _ = font_info(find_font(CN_FONTS), CN_SIZE)
    fen, _ = font_info(find_font(EN_FONTS), EN_SIZE)
    errs, warns = [], []
    subs = [l for l in spec['lines'] if l.get('type', 'sub') == 'sub']
    anchors = [l for l in spec['lines'] if l.get('type') == 'anchor']
    for i, l in enumerate(spec['lines']):
        tag = f"#{i + 1} {l['start']:.2f}s「{l.get('cn', '')}」"
        cn, en = l.get('cn', '').strip(), l.get('en', '').strip()
        if not cn or not en:
            errs.append(f'{tag} 中英要成对，缺一行')
        for w in banned_hits(cn + ' ' + en + ' ' + l.get('sci', '')):
            errs.append(f'{tag} 违禁词「{w}」')
        if l.get('type') == 'anchor':
            continue
        if len(re.sub(r'\s', '', cn)) > CN_MAX:
            errs.append(f'{tag} 中文超过 {CN_MAX} 字')
        if len(en.split()) > EN_MAX_WORDS:
            errs.append(f'{tag} 英文 {len(en.split())} 个词，超过 {EN_MAX_WORDS}')
        if text_w(fcn, cn) > SAFE_W:
            errs.append(f'{tag} 中文宽 {text_w(fcn, cn)}px，出了安全区（{SAFE_W}px）')
        if text_w(fen, en) > SAFE_W:
            errs.append(f'{tag} 英文宽 {text_w(fen, en)}px，出了安全区（{SAFE_W}px）')
        d = l['end'] - l['start']
        if d < 2.5 or d > 6:
            warns.append(f'{tag} 停留 {d:.1f}s，建议 3～5s')
    for p, q in zip(subs, subs[1:]):
        if q['start'] < p['end'] - 1e-3:
            errs.append(f"字幕重叠：{p['start']:.2f}s 那句和 {q['start']:.2f}s 那句")
    if not 15 <= len(subs) <= 32:
        warns.append(f'字幕 {len(subs)} 句，建议 18～28 句')
    if T is None:
        errs.append('没写 T（用 hv.py drop 测）')
    if not anchors:
        errs.append('没有 type=anchor 的锚词行')
    elif T is not None and abs(anchors[0]['start'] - T) > 1 / 15:
        errs.append(f"第一个锚词在 {anchors[0]['start']:.2f}s，不在 T={T:.2f}s（误差要在 2 帧内）")
    if len(anchors) > 2:
        errs.append('锚词爆点最多两次')
    if T is not None:
        before = [l for l in subs if l['end'] <= T + 1e-3]
        if before and not re.search(r'[—…]$', before[-1]['cn'].strip()):
            warns.append('T 前最后一句字幕没停在半句（用破折号「——」吊住）')
    content = [l for l in subs if DISCLAIMER_CN not in l['cn']]
    if content:
        last = content[-1]
        if not re.search(r'[？?]$', last['cn'].strip()) or not last['en'].strip().endswith('?'):
            errs.append('结尾最后一句（免责声明之前）不是问句，要抛一个人人能答的问题')
        elif last['end'] - last['start'] < 3:
            errs.append('结尾问题停留不到 3 秒')
    if not any(DISCLAIMER_CN in l['cn'] and DISCLAIMER_EN in l['en'].lower() for l in spec['lines']):
        errs.append(f'缺片尾免责声明（中文含「{DISCLAIMER_CN}」，英文含「{DISCLAIMER_EN}」）')
    for e in errs:
        print('✗', e)
    for w in warns:
        print('⚠', w)
    print(f'{len(errs)} 个红灯，{len(warns)} 个黄灯。' + ('红灯清掉再压字幕。' if errs else '可以压字幕。'))
    return 1 if errs else 0


# ---------------------------------------------------------------- burn
def ass_time(s):
    s = max(0, s)
    h, m = int(s // 3600), int(s % 3600 // 60)
    return f'{h}:{m:02d}:{s % 60:05.2f}'


def ass_text(s):
    return s.replace('\\', '').replace('{', '（').replace('}', '）').replace('\n', ' ')


def build_ass(spec, style):
    cn_path, en_path = find_font(CN_FONTS), find_font(EN_FONTS)
    _, cn_name = font_info(cn_path, CN_SIZE)
    _, en_name = font_info(en_path, EN_SIZE)
    ink = style.get('ink', '&H00202428')      # ASS 颜色是 &HAABBGGRR
    glow = style.get('glow', '&H40E8F0F4')
    hdr = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CN,{cn_name},{CN_SIZE},{ink},{ink},{glow},&H00000000,-1,0,0,0,100,100,2,0,1,3,0,5,0,0,0,1
Style: EN,{en_name},{EN_SIZE},{ink},{ink},{glow},&H00000000,0,0,0,0,100,100,0,0,1,3,0,5,0,0,0,1
Style: ACN,{cn_name},200,{ink},{ink},{glow},&H00000000,-1,0,0,0,100,100,8,0,1,4,0,5,0,0,0,1
Style: AEN,{en_name},64,{ink},{ink},{glow},&H00000000,-1,0,0,0,100,100,1,0,1,3,0,5,0,0,0,1
Style: SCI,{en_name},34,{ink},{ink},{glow},&H00000000,0,0,0,0,100,100,1,0,1,2,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    blur = r'\blur3'
    for l in spec['lines']:
        s, e = l['start'], l['end']
        cn, en = ass_text(l['cn']), ass_text(l['en'])
        if l.get('type') == 'anchor':
            if l.get('draw', 'scene') == 'scene':      # 锚词和学名由动画画在物上，这里不压
                continue
            size = min(220, int(W * 0.5 / max(1, len(l['cn']))) * 1)
            pop = r'\fscx118\fscy118\t(0,170,\fscx100\fscy100)'
            ev.append(f"Dialogue: 2,{ass_time(s)},{ass_time(e)},ACN,,0,0,0,,{{\\pos({CX},{ANC_CN_Y})\\fs{size}\\fad(0,300){pop}{blur}}}{cn}")
            ev.append(f"Dialogue: 2,{ass_time(s)},{ass_time(e)},AEN,,0,0,0,,{{\\pos({CX},{ANC_EN_Y})\\fad(0,300){pop}{blur}}}{en}")
            if l.get('sci'):
                ev.append(f"Dialogue: 2,{ass_time(l.get('sci_at', s + 0.6))},{ass_time(e)},SCI,,0,0,0,,{{\\pos({CX},{ANC_SCI_Y})\\fad(250,300){blur}}}{ass_text(l['sci'])}")
        else:
            ev.append(f"Dialogue: 1,{ass_time(s)},{ass_time(e)},CN,,0,0,0,,{{\\pos({CX},{SUB_CN_Y})\\fad(220,220){blur}}}{cn}")
            ev.append(f"Dialogue: 1,{ass_time(s)},{ass_time(e)},EN,,0,0,0,,{{\\pos({CX},{SUB_EN_Y})\\fad(220,220){blur}}}{en}")
    return hdr + '\n'.join(ev) + '\n', sorted({os.path.dirname(cn_path), os.path.dirname(en_path)})


def cmd_burn(a):
    spec = load(a.subs)
    if cmd_check(argparse.Namespace(subs=a.subs)) and not a.force:
        sys.exit('字幕有红灯，先改字幕.json（确要硬压加 --force）')
    ass, fontdirs = build_ass(spec, spec.get('style', {}))
    ass_path = os.path.splitext(a.out)[0] + '.ass'
    with open(ass_path, 'w', encoding='utf-8') as fh:
        fh.write(ass)
    fd = fontdirs[0]
    vf = f"ass='{ass_path}':fontsdir='{fd}'"
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', a.video]
    if a.audio:
        cmd += ['-i', a.audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest']
    else:
        cmd += ['-c:a', 'copy']
    cmd += ['-vf', vf, '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', a.out]
    subprocess.run(cmd, check=True)
    print('已出', a.out, '（字幕文件', ass_path, '）')


# ---------------------------------------------------------------- preview
def cmd_preview(a):
    from PIL import Image, ImageDraw
    T = load(a.subs).get('T') if a.subs else None
    times = []
    for tok in a.times.split(','):
        tok = tok.strip()
        if 'T' in tok:
            if T is None:
                sys.exit('时间里用了 T，要同时传 --subs')
            tok = str(eval(tok.replace('T', str(T)), {}))
        times.append(float(tok))
    tiles = []
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(times):
            p = os.path.join(td, f'{i}.png')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', a.video, '-frames:v', '1', p], check=True)
            im = Image.open(p).convert('RGBA').resize((W, H))
            ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
            d = ImageDraw.Draw(ov)
            red = (230, 40, 40, 70)
            d.rectangle([0, 0, W, SAFE['top']], fill=red)
            d.rectangle([0, SAFE['bottom'], W, H], fill=red)
            d.rectangle([SAFE['right'], SAFE['top'], W, SAFE['bottom']], fill=red)
            d.rectangle([0, SAFE['top'], SAFE['left'], SAFE['bottom']], fill=red)
            im = Image.alpha_composite(im, ov).convert('RGB')
            from PIL import ImageFont
            ImageDraw.Draw(im).text((24, 24), f'{t:.2f}s', fill=(255, 255, 255), font=ImageFont.load_default(72))
            tiles.append(im.resize((W // 3, H // 3)))
    cols = min(len(tiles), 6)
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W // 3, rows * H // 3), 'white')
    for i, tl in enumerate(tiles):
        sheet.paste(tl, ((i % cols) * W // 3, (i // cols) * H // 3))
    sheet.save(a.out, quality=88)
    print('已出', a.out, '（红色区域会被抖音 / TikTok 的界面挡住，里面不能有字）')


# ---------------------------------------------------------------- zone
def cmd_zone(a):
    import numpy as np
    y0, y1 = SUB_CN_Y - 60, SUB_EN_Y + 45          # 字幕块实际占的那一条
    x0, x1 = SAFE['left'], SAFE['right']
    w, h = (x1 - x0) // 2, (y1 - y0) // 2
    vf = f'fps={a.fps},scale={W}:{H},crop={x1 - x0}:{y1 - y0}:{x0}:{y0},scale={w}:{h}'
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)
    bad = []
    for i, f in enumerate(fr):
        base = np.median(f)                          # 纸底的亮度
        n = int((np.abs(f - base) > a.diff).sum())
        if n > a.thresh:
            bad.append((i / a.fps, n))
    runs = []
    for t, n in bad:
        if runs and t - runs[-1][1] <= 1.5 / a.fps:
            runs[-1][1] = t; runs[-1][2] = max(runs[-1][2], n)
        else:
            runs.append([t, t, n])
    print(f'字幕带 y {y0}–{y1}，{len(fr)} 帧，命中 {len(bad)} 帧')
    for t0, t1, n in runs:
        print(f'  ✗ {t0:6.2f}–{t1:6.2f}s  最多 {n} 个像素和纸底差得多：画面主体压进了字幕带，压字幕后会看不清')
    if not runs:
        print('字幕带干净，可以压字幕。')
    return 1 if runs else 0


# ---------------------------------------------------------------- lint
def cmd_lint(a):
    with open(a.file, encoding='utf-8') as fh:
        text = fh.read()
    bad = 0
    for n, line in enumerate(text.splitlines(), 1):
        for w in banned_hits(line):
            print(f'✗ 第 {n} 行 违禁词「{w}」：{line.strip()[:60]}')
            bad += 1
    print('干净' if not bad else f'{bad} 处要改')
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    p = sp.add_parser('drop'); p.add_argument('audio'); p.add_argument('--min-t', type=float, default=6)
    p = sp.add_parser('check'); p.add_argument('subs')
    p = sp.add_parser('burn'); p.add_argument('subs'); p.add_argument('--video', required=True)
    p.add_argument('--out', required=True); p.add_argument('--audio'); p.add_argument('--force', action='store_true')
    p = sp.add_parser('preview'); p.add_argument('video'); p.add_argument('--times', required=True)
    p.add_argument('--out', required=True); p.add_argument('--subs')
    p = sp.add_parser('zone'); p.add_argument('video'); p.add_argument('--fps', type=float, default=10)
    p.add_argument('--diff', type=int, default=60, help='和纸底亮度差多少算图形'); p.add_argument('--thresh', type=int, default=150)
    p = sp.add_parser('lint'); p.add_argument('file')
    a = ap.parse_args()
    rc = {'drop': cmd_drop, 'check': cmd_check, 'burn': cmd_burn, 'preview': cmd_preview, 'zone': cmd_zone, 'lint': cmd_lint}[a.cmd](a)
    sys.exit(rc or 0)


if __name__ == '__main__':
    main()
