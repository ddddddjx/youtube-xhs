"""events.json (cues.subs from the page) → cues.json for core/render/srt.py"""
import json, os, sys
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = next(e for e in json.load(open(os.path.join(HERE, 'events.json')))['ev'] if e['type'] == 'cues')
json.dump([{'t0': round(s['t0'], 3), 't1': round(s['t1'], 3), 'text': s['text']} for s in C['subs']],
          open(os.path.join(HERE, 'out', 'cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(C['subs']), 'subtitles')
