"""Free ambient edit of approved synthetic footage. Run in Higgsfield sandbox."""
import cv2, numpy as np, pathlib, json, urllib.request, zipfile, subprocess
from PIL import Image, ImageDraw, ImageFont

cv2.setNumThreads(2)
root = pathlib.Path('/home/user/ascend-ambient'); root.mkdir(exist_ok=True)
cfg = json.loads((root/'config.json').read_text())
urllib.request.urlretrieve(cfg['source'], root/'sources.zip')
with zipfile.ZipFile(root/'sources.zip') as z: z.extractall(root/'sources')
fonts = pathlib.Path('/usr/share/fonts/truetype/higgsfield')
def font(size, bold=False):
    return ImageFont.truetype(str(fonts/('Montserrat-ExtraBold.ttf' if bold else '../liberation2/LiberationSans-Regular.ttf')), size)
def screen(name):
    im=Image.new('RGB',(1000,660),'#f4f8f6'); d=ImageDraw.Draw(im)
    d.line([(42,99),(73,39),(104,99)],fill='#7465ef',width=8,joint='curve')
    d.line([(60,99),(73,73),(87,99)],fill='#7465ef',width=7,joint='curve')
    d.text((130,46),'ASCEND',font=font(48,True),fill='#15392f')
    d.line((40,123,960,123),fill='#dce5df',width=2)
    if name=='student':
        d.text((46,148),'ROLE READINESS · AI FEEDBACK',font=font(23,True),fill='#6351af')
        d.text((46,191),'Customer Success Associate',font=font(39,True),fill='#183c31')
        d.text((46,249),'Communication & ownership · Your practice response',font=font(26),fill='#50695f')
        d.rounded_rectangle((40,297,483,487),radius=16,fill='white',outline='#dce6e0',width=2)
        d.rounded_rectangle((501,297,960,487),radius=16,fill='#f0ebfc',outline='#d9cef4',width=2)
        d.text((63,321),"WHAT'S WORKING",font=font(23,True),fill='#285847')
        d.text((63,375),'You recognised the',font=font(31),fill='#253f37')
        d.text((63,416),"customer's concern.",font=font(31),fill='#253f37')
        d.text((525,321),'FOCUS NEXT',font=font(23,True),fill='#674caf')
        d.text((525,375),'Name the owner.',font=font(32,True),fill='#423263')
        d.text((525,416),'Set an update time.',font=font(31),fill='#423263')
        d.text((46,510),'Next practice · Handle a delayed order',font=font(27),fill='#344f44')
        d.rounded_rectangle((45,556,951,618),radius=13,fill='#6852c8')
        d.text((74,570),'Improve my response',font=font(29,True),fill='white')
        d.text((46,635),'Illustrative role feedback · Sample response',font=font(16),fill='#596b63')
        im.save(root/(name+'-screen.png'))
        return cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2BGR)
    elif name=='college':
        title='Focus your placement support.'; label='COHORT READINESS'
        lines=['Role direction', 'Workplace practice', 'Interview preparation']; button='See the work behind readiness'; note='Planned college experience'
    else:
        title='Readiness, backed by the work.'; label='PRODUCTIVITY INDEX'
        lines=['Work artifacts', 'Skill evidence', 'Interview readiness']; button='Review the evidence'; note='Planned employer experience'
    d.text((46,153),label,font=font(23,True),fill='#6351af')
    d.text((46,203),title,font=font(38,True),fill='#183c31')
    d.rounded_rectangle((38,278,962,497),radius=18,fill='white',outline='#dfe8e2',width=2)
    for i,line in enumerate(lines):
        d.text((68,303+i*58),line,font=font(32,i==0 and name=='student'),fill='#253f37')
    d.rounded_rectangle((45,528,951,603),radius=13,fill='#6852c8')
    d.text((74,547),button,font=font(29,True),fill='white')
    d.text((46,624),note,font=font(18),fill='#596b63')
    im.save(root/(name+'-screen.png'))
    return cv2.cvtColor(np.asarray(im),cv2.COLOR_RGB2BGR)

shots=[
    ('student','student-v2-finished',[(1107,450),(1590,468),(1547,806),(1056,749)],(505,325),(360,320)),
    ('college','college-finished',[(1015,493),(1392,497),(1332,790),(946,758)],(480,255),(290,230)),
    ('employer','employer-finished',[(1280,274),(1852,234),(1835,747),(1243,655)],(625,310),(420,225)),
]
report=[]; qa=[]
for name,source,quad,center,axes in shots:
    cap=cv2.VideoCapture(str(root/'sources'/(source+'.mp4')))
    frames=[]
    for i in range(12 if name=='student' else 31):
        ok,fr=cap.read()
        if not ok: break
        frames.append(cv2.resize(fr,(1920,1080)))
    cap.release(); base=frames[0]; h,w=base.shape[:2]
    # Track only the static surroundings to cancel the generated camera drift.
    g0=cv2.cvtColor(base,cv2.COLOR_BGR2GRAY)
    feature_mask=np.full((h,w),255,np.uint8)
    cv2.ellipse(feature_mask,center,(axes[0]+100,axes[1]+100),0,0,360,0,-1)
    cv2.fillConvexPoly(feature_mask,np.int32(quad),0)
    feature_mask[650:]=0
    points=cv2.goodFeaturesToTrack(g0,500,.015,15,mask=feature_mask)
    stabilized=[]
    for frame in frames:
        gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
        nxt,status,err=cv2.calcOpticalFlowPyrLK(g0,gray,points,None,winSize=(41,41),maxLevel=4)
        good=(status.ravel()==1)&(err.ravel()<25)
        matrix,_=cv2.estimateAffinePartial2D(nxt[good],points[good],method=cv2.RANSAC,ransacReprojThreshold=2)
        stabilized.append(cv2.warpAffine(frame,matrix,(w,h),borderMode=cv2.BORDER_REFLECT) if matrix is not None else frame)
    # Selective motion: the device, keyboard and hands stay fixed throughout.
    # Keep the entire face opaque; feathering across a moving face creates ghosts.
    row=np.clip((710-np.arange(h))/100,0,1).astype(np.float32)
    row=row*row*(3-2*row)
    mask=np.repeat(row[:,None],w,axis=1)
    locked=np.zeros((h,w),np.uint8); cv2.fillConvexPoly(locked,np.int32(quad),255)
    locked=cv2.dilate(locked,np.ones((71,71),np.uint8))
    mask*=1-cv2.GaussianBlur(locked,(0,0),10).astype(np.float32)/255
    alpha=mask[...,None]
    q=np.float32(quad); insert=screen(name)
    H=cv2.getPerspectiveTransform(np.float32([(0,0),(999,0),(999,659),(0,659)]),q)
    warped=cv2.warpPerspective(insert,H,(w,h))
    screenmask=np.zeros((h,w),np.uint8);cv2.fillConvexPoly(screenmask,np.int32(q),255)
    screenalpha=cv2.GaussianBlur(screenmask,(3,3),.5)[...,None].astype(np.float32)/255
    writer=cv2.VideoWriter(str(root/(name+'-raw.mp4')),cv2.VideoWriter_fourcc(*'mp4v'),24,(w,h))
    selected=[]
    for i in range(192):
        # Cosine timing lands at both ends with zero velocity: no hard reset.
        t=(1-np.cos(2*np.pi*i/192))*.5*(len(frames)-1)
        lo=int(t); hi=min(lo+1,len(frames)-1); weight=t-lo
        moving=cv2.addWeighted(stabilized[lo],1-weight,stabilized[hi],weight,0)
        result=(moving*alpha+base*(1-alpha)).astype(np.uint8)
        result=(warped*screenalpha+result*(1-screenalpha)).astype(np.uint8)
        writer.write(result)
        if i==0: cv2.imwrite(str(root/(name+'.jpg')),result,[cv2.IMWRITE_JPEG_QUALITY,95])
        if i in [0,48,96,144,191]: selected.append(result)
    writer.release()
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/(name+'-raw.mp4')),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(root/(name+'.mp4'))],check=True)
    for fr in selected: qa.append(cv2.resize(fr,(480,270)))
    report.append({'audience':name,'duration':8,'frames':192,'loopBoundaryMeanDifference':float(np.abs(selected[0].astype(float)-selected[-1]).mean()),'method':'camera-stabilized selective motion, fixed hands/device, static authored screen, eased forward/reverse ambient cycle'})
    print(name+' finished',flush=True)
cv2.imwrite(str(root/'qa.jpg'),np.vstack([np.hstack(qa[i:i+5]) for i in range(0,15,5)]))
(root/'report.json').write_text(json.dumps(report,indent=2))
with zipfile.ZipFile(root/'ambient.zip','w',zipfile.ZIP_STORED) as z:
    for name,_,_,_,_ in shots:
        for ext in ['jpg','mp4']: z.write(root/(name+'.'+ext),name+'.'+ext)
        z.write(root/(name+'-screen.png'),name+'-screen.png')
    for filename in ['qa.jpg','report.json']:z.write(root/filename,filename)
req=urllib.request.Request(cfg['upload_url'],data=(root/'ambient.zip').read_bytes(),method='PUT',headers={'Content-Type':cfg['content_type']})
with urllib.request.urlopen(req) as response:print('Upload HTTP',response.status,flush=True)
