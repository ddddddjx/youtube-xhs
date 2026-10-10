"""Original score — clockwork minimalism, 96 BPM, C major. Marimba ostinato, woodblock clock, glockenspiel, vibraphone.
One instrument joins per board region; the sentence is written over woodblock alone; two hard silences; a rising
vibraphone step per rung of the ladder; a glockenspiel run on the pull-back; the motif returns and lands on the cap.
Writes music/score.wav (stereo 48k)."""
import sys, os, json
LIB = os.environ.get('LIB') or os.path.expanduser('~/lemo-opuscar')
sys.path.insert(0, LIB)
import soundfile as sf
from core.audio import sampler as S
from core.audio.sfx import SR
HERE = os.path.dirname(os.path.abspath(__file__))
ev = json.load(open(os.path.join(HERE, 'events.json'))); E = ev['ev']; DUR = ev['dur']
C = next(e for e in E if e['type'] == 'cues'); B = C['BEAT']; VO = C['v']
lines = {l['id']: l for l in json.load(open(os.path.join(HERE, 'lines.json'), encoding='utf-8'))}
VD = json.load(open(os.path.join(HERE, 'voices', 'dur.json')))
def at(i, w, end=False):                                   # same proportional word timing as film.js
    s = ''.join((lines[i].get('say') or lines[i]['text']).split()); k = s.index(w)
    return VO[i] + VD[i] * (k + (len(w) if end else 0)) / len(s)
S.seed(5)
N = []
def n(t, inst, p, d, v=.6, pan=0., g=1.): N.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=v, pan=pan, gain=g))
T0 = .3
bt = lambda b: T0 + b * B
CH = {'C': ['C4', 'E4', 'G4'], 'Am': ['A3', 'C4', 'E4'], 'F': ['F3', 'A3', 'C4'], 'G': ['G3', 'B3', 'D4']}
PROG = ['C', 'Am', 'F', 'G']
def bar(b, ch, lv=1., mar=True, wood=False, vib=False, glock=None):
    r, t3, f5 = (S.midi(p) for p in CH[ch])
    if mar:
        for i, m in enumerate([r, f5, r + 12, f5, t3 + 12, f5, r + 12, f5]):
            n(bt(b + i * .5), 'marimba', m, .3, (.58 if i % 2 == 0 else .44) * lv, -.15, .9)
        n(bt(b), 'marimba', r - 12, 1.2, .55 * lv, 0, 1.0)
    if wood:
        for i in range(4): n(bt(b + i), 'woodblock', 'a' if i % 2 == 0 else 'b', None, .33 * lv, .35, .5)
    if vib: n(bt(b), 'vibraphone', t3 + 12, 2.2, .4 * lv, .25, .7)
    if glock:
        for o, p in glock: n(bt(b + o), 'glockenspiel', p, .4, .42 * lv, .3, .6)

def sec(t):                                                # beat index of time t
    return (t - T0) / B

# 1 · the tangle (0–4): motif alone, soft
for k, ch in enumerate(['C', 'Am']): bar(4 * k, ch, .7)
# 2–3 · manual + rules (4–19): woodblock joins at the plane, vibraphone at the rules
b = 8
while bt(b) < VO['v05'] - .4:
    t = bt(b)
    bar(b, PROG[(b // 4) % 4], .9, wood=t > VO['v02'] - .3, vib=t > VO['v04'] - .6,
        glock=[(0, 'G5'), (1.5, 'E5'), (3, 'C6')] if VO['v04'] - .6 < t < VO['v05'] - 2.6 else None)
    b += 4
# 4 · the sentence is written over the clock alone
t = bt(b)
while t < C['SIL1'][0] - .1:
    n(t, 'woodblock', 'a' if round(sec(t)) % 2 == 0 else 'b', None, .36, .3, .55); t += B
# silence → eraser (foley only) → the rewrite: marimba comes back on 改完
b0 = sec(VO['v06']); b0 = int(b0) + 1
for k, ch in enumerate(['C', 'G', 'C']):
    if bt(b0 + 4 * k) < VO['v08'] - .3: bar(b0 + 4 * k, ch, .85, wood=k > 0, glock=[(0, 'C6'), (.5, 'E6'), (1, 'G6')] if k == 1 else None)
# 5 · the ladder: a vibraphone step per rung, over a light ostinato
b1 = int(sec(VO['v08'])) + 1
for k, ch in enumerate(['F', 'G', 'Am', 'F', 'G']):
    if bt(b1 + 4 * k) < C['SIL2'][0] - .2: bar(b1 + 4 * k, ch, .7, wood=True)
for p, w in zip(['C5', 'E5', 'G5', 'C6'], ['文字', '图', '网页', '视频']):
    n(at('v09', w), 'vibraphone', p, 1.4, .58, .2, .9)
# silence → the reveal: glockenspiel run during the pull-back, held vibraphone chord on the whole board
p0, p1 = C['pull0'], C['pull1']
run = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'C7']
for i, p in enumerate(run): n(p0 + (p1 - p0) * i / len(run), 'glockenspiel', p, .5, .35 + .03 * i, .25, .6)
n(C['SIL2'][1] + .1, 'vibraphone', 'E4', 3.5, .35, -.2, .6); n(C['SIL2'][1] + .1, 'vibraphone', 'G4', 3.5, .35, .2, .6)
# 6 · back to 文字: the opening motif returns, last note on the cap
b2 = int(sec(VO['v11'])) + 1
for k, ch in enumerate(['C', 'Am', 'F']):
    if bt(b2 + 4 * k) < C['capAt'] - .4: bar(b2 + 4 * k, ch, .75, vib=k == 2)
n(C['capAt'], 'marimba', 'C4', 2.5, .65, 0, 1.0); n(C['capAt'], 'marimba', 'C5', 2.5, .5, 0, .9)
n(C['capAt'], 'glockenspiel', 'C6', 2.0, .4, .3, .6)

mix = S.render([e for e in N if e['t'] < DUR], dur=DUR + 1)
mix = S.room(mix, size=.4, mix=.16)
os.makedirs(os.path.join(HERE, 'music'), exist_ok=True)
sf.write(os.path.join(HERE, 'music', 'score.wav'), mix, SR)
print('score', len(N), 'notes →', os.path.join(HERE, 'music', 'score.wav'))
used = sorted({e['inst'] for e in N}); print('instruments', used)
