import json, numpy as np, soundfile as sf
E=json.load(open('events.json')); SR=48000; N=int((E['total']+0.2)*SR); out=np.zeros(N)
t=np.arange(N)/SR; rnd=np.random.default_rng(1)
def add(sig,at,gain=1.0):
    i=int(at*SR); j=min(N,i+len(sig)); 
    if i<N: out[i:j]+=gain*sig[:j-i]
def env(d,a=0.005,k=8):
    x=np.arange(int(d*SR))/SR; return np.minimum(x/a,1)*np.exp(-x*k)
def thump(f=52,d=0.35,k=11):
    x=np.arange(int(d*SR))/SR; fr=f*(1+1.2*np.exp(-x*30)); return np.sin(2*np.pi*np.cumsum(fr)/SR)*env(d,0.004,k)
def heartbeat(): s=np.zeros(int(0.6*SR)); a=thump(); s[:len(a)]+=a; b=thump(46,0.3,13)*0.7; o=int(0.2*SR); s[o:o+len(b)]+=b; return s
def lowpass(x,a): 
    y=np.zeros_like(x); acc=0.0
    for i in range(len(x)): acc+=a*(x[i]-acc); y[i]=acc
    return y
def whoosh(d=0.6):
    n=rnd.standard_normal(int(d*SR)); x=np.arange(len(n))/len(n); 
    from numpy.fft import rfft,irfft
    # band sweep via simple one-pole lowpass with time-varying alpha
    y=np.zeros_like(n); acc=0
    for i in range(len(n)): acc+=(0.01+0.25*np.sin(np.pi*x[i]))*(n[i]-acc); y[i]=acc
    return y*np.sin(np.pi*x)**2*0.9
def blip(f=880,d=0.18): x=np.arange(int(d*SR))/SR; return (np.sin(2*np.pi*f*x)+0.3*np.sin(2*np.pi*2*f*x))*env(d,0.003,22)
for b in E['hookBeats']: add(heartbeat(),b-0.02,0.9)
for b in E['cgrpBeats']: add(heartbeat(),b-0.02,1.0); add(thump(38,0.5,6),b-0.02,0.6)
for s in E['scenes']: add(whoosh(),s-0.35,0.35)
add(thump(35,1.4,3),E['cross'],1.1); add(whoosh(0.8),E['cross']-0.05,0.4)
for p in E['pops']: add(blip(1046,0.15),p,0.12)
for k in range(4): add(blip(1568,0.25),E['block']+k*0.18+0.5,0.1)
# ambient pad: Am drone, ends on C major for end card
def pad(freqs,t0,t1):
    i,j=int(t0*SR),int(min(t1,E['total']+0.2)*SR); x=np.arange(j-i)/SR; s=np.zeros(j-i)
    for f in freqs:
        for det in (-0.6,0.6): s+=np.sin(2*np.pi*(f+det)*x+rnd.random()*6)*(1+0.3*np.sin(2*np.pi*0.13*x+f))
    fi=np.minimum(x/1.5,1)*np.minimum((x[-1]-x)/1.5,1); out[i:j]+=s/len(freqs)/2*fi*0.07
pad([110,164.81,220,261.63],0,E['card']+1.2)
pad([130.81,196,261.63,329.63],E['card']-0.3,E['total']+0.2)
sf.write('sfx.wav',np.clip(out,-1,1),SR); print('ok',out.max())
