import json, re, numpy as np, soundfile as sf
from ktts import tts
from lines import LINES
SID=16; SPEED=1.2; SR=24000
parts=[]; out=[]; t=0.35
parts.append(np.zeros(int(SR*0.35),np.float32))
for i,(scene,text,sub) in enumerate(LINES):
    a=np.asarray(tts.generate(text,sid=SID,speed=SPEED).samples,np.float32)
    # trim silence
    idx=np.where(np.abs(a)>0.01)[0]; a=a[max(idx[0]-240,0):idx[-1]+480]
    d=len(a)/SR
    # split subtitle into chunks by ｜, proportionally to char count
    chunks=sub.split("｜"); w=[len(re.sub(r"\s","",c)) for c in chunks]; s=t
    subs=[]
    for c,wi in zip(chunks,w):
        dd=d*wi/sum(w); subs.append([round(s,3),round(s+dd,3),c]); s+=dd
    out.append(dict(scene=scene,start=round(t,3),end=round(t+d,3),text=text,subs=subs))
    gap=0.42 if (i+1<len(LINES) and LINES[i+1][0]!=scene) else 0.18
    parts+= [a, np.zeros(int(SR*gap),np.float32)]
    t+=d+gap
parts.append(np.zeros(int(SR*1.3),np.float32)); t+=1.3
sf.write("voice.wav",np.concatenate(parts),SR)
json.dump(dict(total=round(t,3),lines=out),open("timing.json","w"),ensure_ascii=False,indent=1)
print("total",t)
for o in out: print(o["scene"],o["start"],o["end"])
