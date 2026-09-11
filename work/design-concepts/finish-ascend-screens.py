"""Screen finishing for this production's generated footage; run in Higgsfield sandbox."""
import cv2, numpy as np, json, pathlib, urllib.request, subprocess, concurrent.futures, zipfile
cv2.setNumThreads(2)
root=pathlib.Path('/home/user/ascend-finishing');root.mkdir(exist_ok=True)
cfg=json.loads((root/'config.json').read_text())
def download(item):
    name,url=item;urllib.request.urlretrieve(url,root/name)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(download,cfg['downloads'].items()))
def order(q):
    q=np.array(q,dtype=np.float32).reshape(4,2);s=q.sum(axis=1);d=np.diff(q,axis=1).ravel()
    return np.array([q[np.argmin(s)],q[np.argmin(d)],q[np.argmax(s)],q[np.argmax(d)]],np.float32)
def detect(frame,expected):
    hsv=cv2.cvtColor(frame,cv2.COLOR_BGR2HSV)
    mask=cv2.inRange(hsv,np.array([0,0,135]),np.array([179,85,255]))
    roi=np.zeros(mask.shape,np.uint8);c=expected.mean(axis=0);cv2.fillConvexPoly(roi,np.int32(c+(expected-c)*1.2),255);mask=cv2.bitwise_and(mask,roi)
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
    contours,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    area=abs(cv2.contourArea(expected));best=None;cost=999999
    for contour in contours:
        a=abs(cv2.contourArea(contour))
        if not .7*area<a<1.3*area:continue
        poly=cv2.approxPolyDP(contour,.025*cv2.arcLength(contour,True),True)
        if len(poly)!=4 or not cv2.isContourConvex(poly):continue
        q=order(poly);err=np.linalg.norm(q-expected,axis=1).mean()
        if err<cost and err<40:best=q;cost=err
    return best
def features(gray,q):
    mask=np.zeros(gray.shape,np.uint8);c=q.mean(axis=0)
    cv2.fillConvexPoly(mask,np.int32(c+(q-c)*1.10),255)
    cv2.fillConvexPoly(mask,np.int32(c+(q-c)*.88),0)
    return cv2.goodFeaturesToTrack(gray,180,.006,5,mask=mask,blockSize=5)
qa=[];report=[]
for shot in cfg['shots']:
    cap=cv2.VideoCapture(str(root/(shot['name']+'.mp4')));fps=cap.get(cv2.CAP_PROP_FPS);ok,first=cap.read()
    if not ok:raise RuntimeError(shot['name'])
    h,w=first.shape[:2];q=np.float32(shot['quad'])*[w,h];q=q.astype(np.float32)
    if shot['screen']!='back':q=detect(first,q) if detect(first,q) is not None else q
    src=np.float32([[0,0],[1199,0],[1199,749],[0,749]])
    if shot['screen']=='back':
        # Reconstruct an unbranded graphite lid; generated UI on a laptop's back is an artifact.
        yy,xx=np.mgrid[0:750,0:1200];tone=(59+17*(1-yy/750)+6*np.sin(xx/1200*np.pi)).astype(np.uint8)
        insert=np.stack([tone,tone+1,tone+3],axis=-1)
    else:insert=cv2.resize(cv2.imread(str(root/(shot['screen']+'.png'))),(1200,750),interpolation=cv2.INTER_AREA)
    out=root/(shot['name']+'-raw.mp4');writer=cv2.VideoWriter(str(out),cv2.VideoWriter_fourcc(*'mp4v'),fps,(w,h))
    prev=None;points=None;idx=0;tracking=[]
    cap.set(cv2.CAP_PROP_POS_FRAMES,0)
    while True:
        ok,frame=cap.read()
        if not ok:break
        gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY)
        if prev is not None and points is not None and len(points)>=6:
            nxt,st,err=cv2.calcOpticalFlowPyrLK(prev,gray,points,None,winSize=(31,31),maxLevel=3)
            good=(st.ravel()==1)&(err.ravel()<30)
            if good.sum()>=6:
                matrix,inliers=cv2.findHomography(points[good],nxt[good],cv2.RANSAC,2.5)
                if matrix is not None:
                    moved=cv2.perspectiveTransform(q[None],matrix)[0]
                    ratio=abs(cv2.contourArea(moved))/max(1,abs(cv2.contourArea(q)))
                    if .93<ratio<1.07 and np.linalg.norm(moved-q,axis=1).max()<22:q=moved
        points=features(gray,q);prev=gray
        renderq=q.copy()
        if shot['screen']=='back':renderq=renderq.mean(axis=0)+(renderq-renderq.mean(axis=0))*1.045
        H=cv2.getPerspectiveTransform(src,renderq.astype(np.float32));warped=cv2.warpPerspective(insert,H,(w,h))
        alpha=np.zeros((h,w),np.uint8);cv2.fillConvexPoly(alpha,np.int32(renderq),255)
        alpha=cv2.GaussianBlur(alpha,(3,3),.6).astype(np.float32)/255
        if shot['screen']!='back':
            b,g,r=cv2.split(frame.astype(np.float32));skin=(r>g*1.09)&(g>b*1.06)&(r>75)&((r-b)>25)
            skin=cv2.dilate(skin.astype(np.uint8),np.ones((3,3),np.uint8))
            alpha*=1-cv2.GaussianBlur(skin.astype(np.float32),(5,5),1)
        # A slight illumination blend keeps replacement UI from looking pasted on.
        result=(warped.astype(np.float32)*alpha[...,None]+frame.astype(np.float32)*(1-alpha[...,None])).clip(0,255).astype(np.uint8)
        writer.write(result);tracking.append(q.tolist())
        if idx in [4,int(fps*2.5),int(fps*5.4)]:
            thumb=cv2.resize(result,(640,360));cv2.putText(thumb,shot['name']+' '+str(round(idx/fps,1))+'s',(12,340),cv2.FONT_HERSHEY_SIMPLEX,.5,(255,255,255),1,cv2.LINE_AA);qa.append(thumb)
        idx+=1
    cap.release();writer.release()
    dest=root/(shot['name']+'-finished.mp4')
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(out),'-vf','scale=1920:1080,fps=24,tpad=stop_mode=clone:stop_duration=0.2','-t',str(shot.get('duration',6)),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(dest)],check=True)
    report.append({'name':shot['name'],'frames':idx,'fps':fps,'tracked':len(tracking),'firstQuad':tracking[0],'lastQuad':tracking[-1]})
    (root/(shot['name']+'-tracking.json')).write_text(json.dumps(tracking));print('finished',shot['name'],flush=True)
board=np.vstack([np.hstack(qa[i:i+3]) for i in range(0,len(qa),3)])
cv2.imwrite(str(root/'screen-qa.jpg'),board,[cv2.IMWRITE_JPEG_QUALITY,91]);(root/'report.json').write_text(json.dumps(report,indent=2))
with zipfile.ZipFile(root/'finished.zip','w',zipfile.ZIP_STORED) as z:
    for path in list(root.glob('*-finished.mp4'))+[root/'screen-qa.jpg',root/'report.json']:z.write(path,path.name)
print(json.dumps(report),flush=True)
subprocess.run(['curl','-f','-sS','-X','PUT','-H','Content-Type: application/octet-stream','--upload-file',str(root/'finished.zip'),cfg['upload_url'],'-w','%{http_code}'],check=True)
