# Generates launcher icons, notification icon and splash screens for Executive Desk.
from PIL import Image, ImageDraw
import os, glob
RES="android/app/src/main/res"
NAVY=(19,35,61,255); ORANGE=(217,134,47,255); CREAM=(247,241,230,255); BLUE=(44,94,168,255); GREEN=(31,122,77,255)
S=1024
def mark(size, mono=False, pad=0.0):
    """Calendar page with three timeline bars."""
    im=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    W=lambda c:(255,255,255,255) if mono else c
    x0,y0,x1,y1=[int(S*v) for v in (0.22,0.24,0.78,0.78)]
    d.rounded_rectangle((x0,y0,x1,y1),radius=int(S*0.06),fill=W(CREAM) if not mono else None,outline=W(CREAM),width=int(S*0.035) if mono else 0)
    d.rounded_rectangle((x0,y0,x1,y0+int(S*0.12)),radius=int(S*0.06),fill=W(ORANGE))
    d.rectangle((x0,y0+int(S*0.07),x1,y0+int(S*0.12)),fill=W(ORANGE))
    for cx in (0.34,0.66):
        d.rounded_rectangle((int(S*cx)-int(S*0.025),y0-int(S*0.05),int(S*cx)+int(S*0.025),y0+int(S*0.05)),radius=int(S*0.02),fill=W(NAVY) if not mono else W(CREAM))
    bars=[(0.29,0.58,BLUE,0.47),(0.40,0.71,ORANGE,0.58),(0.31,0.50,GREEN,0.69)]
    for a,b,c,yy in bars:
        y=int(S*yy); h=int(S*0.06)
        d.rounded_rectangle((int(S*a),y-h//2,int(S*b),y+h//2),radius=h//2,fill=W(c))
    return im.resize((size,size),Image.LANCZOS)
dens={"mdpi":1,"hdpi":1.5,"xhdpi":2,"xxhdpi":3,"xxxhdpi":4}
for k,f in dens.items():
    n=int(48*f)
    # legacy square + round
    base=Image.new("RGBA",(S,S),(0,0,0,0)); ImageDraw.Draw(base).rounded_rectangle((0,0,S-1,S-1),radius=int(S*0.2),fill=NAVY)
    base.alpha_composite(mark(S)); base.resize((n,n),Image.LANCZOS).save(f"{RES}/mipmap-{k}/ic_launcher.png")
    rnd=Image.new("RGBA",(S,S),(0,0,0,0)); ImageDraw.Draw(rnd).ellipse((0,0,S-1,S-1),fill=NAVY)
    rnd.alpha_composite(mark(S)); rnd.resize((n,n),Image.LANCZOS).save(f"{RES}/mipmap-{k}/ic_launcher_round.png")
    # adaptive foreground: 108dp canvas, art inside central 66dp
    fn=int(108*f); fg=Image.new("RGBA",(fn,fn),(0,0,0,0)); art=mark(int(fn*0.80)); o=(fn-art.width)//2; fg.alpha_composite(art,(o,o))
    fg.save(f"{RES}/mipmap-{k}/ic_launcher_foreground.png")
    # notification small icon (white silhouette) 24dp
    os.makedirs(f"{RES}/drawable-{k}",exist_ok=True)
    mark(int(24*f),mono=True).save(f"{RES}/drawable-{k}/ic_stat_desk.png")
open(f"{RES}/values/ic_launcher_background.xml","w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#13233D</color>\n</resources>\n')
# splash screens: navy with centred mark
for p in glob.glob(f"{RES}/drawable*/splash.png"):
    w,h=Image.open(p).size; sp=Image.new("RGBA",(w,h),NAVY); m=mark(int(min(w,h)*0.35)); sp.alpha_composite(m,((w-m.width)//2,(h-m.height)//2)); sp.convert("RGB").save(p)
mark(512).save("resources/icon-preview.png")
print("icons done")
