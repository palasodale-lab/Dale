import numpy as np, wave
SR=44100; DUR=96.0; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(3)
BPM=100; beat=60/BPM; bar=4*beat
def mtof(m): return 440*2**((m-69)/12)
def onepole(x,fc):
    # vectorised-ish one-pole lowpass via scipy-free recursion in chunks
    a=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); s=0.0
    for i in range(0,len(x),4096):
        seg=x[i:i+4096]; out=np.empty_like(seg)
        for j,v in enumerate(seg): s=(1-a)*v+a*s; out[j]=s
        y[i:i+4096]=out
    return y
def saw(f,tt,ph=0): return 2*((f*tt+ph)%1)-1
chords=[[50,57,62,64,69],[47,54,59,62,66],[43,50,55,59,66],[45,52,57,59,64]]  # Dadd9, Bm7, Gmaj7, Asus
CH=2*bar
pad=np.zeros(N); bass=np.zeros(N)
for k in range(int(DUR/CH)+1):
    c=chords[k%4]; s0=k*CH; s1=s0+CH
    i0=int(max(0,(s0-0.6))*SR); i1=min(N,int((s1+0.6)*SR))
    if i0>=N: break
    tt=t[i0:i1]; env=np.clip((tt-(s0-0.6))/1.2,0,1)*np.clip(((s1+0.6)-tt)/1.2,0,1)
    seg=np.zeros(len(tt))
    for m in c:
        for d in (-0.08,0.0,0.08):
            seg+=saw(mtof(m+12)*2**(d/12),tt,rng.random())*0.035
        seg+=np.sin(2*np.pi*mtof(m)*tt)*0.05
    pad[i0:i1]+=seg*env
    bf=mtof(c[0]-12); bass[i0:i1]+=np.sin(2*np.pi*bf*tt)*0.22*env
pad=onepole(pad,1400)
# slow filter-like swell via amplitude LFO
pad*=0.75+0.25*np.sin(2*np.pi*t/9.6)
# arpeggio (8ths) from 6s
arp=np.zeros(N); step=beat/2
pat=[0,2,1,3,4,3,1,2]
n=0; ts=6.0
while ts<DUR-3:
    k=int(ts//CH); c=chords[k%4]; m=c[pat[n%8]%len(c)]+24
    i0=int(ts*SR); L=int(0.45*SR); tt=np.arange(L)/SR
    note=(np.sin(2*np.pi*mtof(m)*tt)+0.3*np.sin(2*np.pi*mtof(m)*2*tt))*np.exp(-tt*7)
    vel=0.09*(1.0 if n%2==0 else 0.7)
    e=min(N,i0+L); arp[i0:e]+=note[:e-i0]*vel; n+=1; ts+=step
arp*=np.clip((t-6)/4,0,1)
# drums from 17s (soft kick on beats 1&3, hats on offbeats)
dr=np.zeros(N); ts=17.0; b=0
while ts<86:
    i0=int(ts*SR)
    if b%2==0:
        L=int(.35*SR); tt=np.arange(L)/SR; f=45+80*np.exp(-tt*30); ph=2*np.pi*np.cumsum(f)/SR
        k=np.sin(ph)*np.exp(-tt*9)*0.35; e=min(N,i0+L); dr[i0:e]+=k[:e-i0]
    j=int((ts+beat/2)*SR); L=int(.06*SR); h=rng.standard_normal(L); h=h-onepole(h,6000) if False else np.diff(np.concatenate([[0],h]))
    h*=np.exp(-np.arange(L)/SR*60)*0.05; e=min(N,j+L)
    if j<N: dr[j:e]+=h[:e-j]
    ts+=beat; b+=1
dr*=np.clip((t-17)/3,0,1)*np.clip((86-t)/2,0,1)
# riser into final (72-75.5) + impacts
ris=np.zeros(N); i0=int(71.5*SR); i1=int(75.5*SR); tt=t[i0:i1]-71.5
ris[i0:i1]=rng.standard_normal(i1-i0)*(tt/4)**2*0.06
ris=onepole(ris,3000)
def boom(at,amp=.5):
    i0=int(at*SR); L=int(2.5*SR); tt=np.arange(L)/SR
    x=np.sin(2*np.pi*(38+30*np.exp(-tt*6))*tt)*np.exp(-tt*2.2)*amp; e=min(N,i0+L); out=np.zeros(N); out[i0:e]=x[:e-i0]; return out
mix=pad*0.9+bass+arp+dr+ris+boom(0.3,.35)+boom(75.5,.5)+boom(87.4,.45)
# reverb
L=int(2.8*SR); ir=rng.standard_normal(L)*np.exp(-np.arange(L)/SR*2.2); ir/=np.sqrt((ir**2).sum())
M=1<<int(np.ceil(np.log2(N+L)))
wet=np.fft.irfft(np.fft.rfft(mix,M)*np.fft.rfft(ir,M),M)[:N]
out=mix*0.8+wet*0.35
# stereo widen with tiny delay on wet
d=int(0.012*SR); left=out; right=np.concatenate([np.zeros(d),out[:-d]])*0.5+out*0.5
st=np.stack([left,right],1)
st*=np.clip(t/1.5,0,1)[:,None]*np.clip((DUR-t)/4,0,1)[:,None]
st/=np.abs(st).max()/0.89
st=np.tanh(st*1.1)/np.tanh(1.1)*0.89
with wave.open('music.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes())
print('ok')
