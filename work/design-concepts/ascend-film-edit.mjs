// Run with Higgsedit v0.14 in the Higgsfield sandbox. Source paths are task assets.
const editFilm = async ({project,rect,text,media,path}) => {
 const dir='/home/user/ascend-final-edit';
 const p=await project({dir:dir+'/project',size:'1920x1080',fps:24,background:'#0a211c'});
 const add=async n=>p.add(dir+'/media/'+n);
 const footage=async(n,at,dur,from=0,extra=[])=>p.compose([media({file:await add(n),x:0,y:0,width:1920,height:1080,fit:'cover',trimStart:from}),...extra],{at,dur});
 const label=s=>[rect({x:48,y:40,width:680,height:50,fill:'#0b211de8',radius:12}),text(s,{x:70,y:50,width:640,height:34,fontFamily:'Montserrat',fontSize:22,color:'#e2f2e9'})];
 const screen=async(n,at,dur,title,note)=>{
  const asset=await add(n);
  p.compose([
   rect({width:1920,height:1080,fill:{kind:'linear',angle:30,stops:[{offset:0,color:'#0c3632'},{offset:1,color:'#17452d'}]}}),
   text(title,{x:100,y:48,width:1720,height:70,fontFamily:'Montserrat',fontSize:38,fontWeight:600,color:'#f0f7f2'}),
   rect({x:303,y:137,width:1314,height:837,fill:'#25302f',radius:22,shadow:{y:18,blur:35,color:'#00000070'}}),
   media({file:asset,x:320,y:154,width:1280,height:800,fit:'contain'}),
   rect({x:237,y:974,width:1446,height:18,fill:'#66716d',radius:8}),
   text(note,{x:100,y:1020,width:1720,height:35,fontFamily:'Montserrat',fontSize:22,color:'#c8ddd1'})
  ],{at,dur});
 };
 await footage('film-opening.mp4',0,5.85);
 await screen('welcome.png',5.85,3.83,'Your next chapter starts here.','Ascend · Current welcome experience');
 await footage('film-phone.mp4',9.68,4.02,0,label('Role discovery · Illustrative mobile view'));
 await screen('assessment.png',13.7,2.86,'Practise the work behind a role.','Actual public assessment preview · Simulated workplace');
 await screen('feedback.png',16.56,3.8,'See the gap. Know what to improve.','Illustrative AI feedback · Customer Success Associate');
 await footage('film-interview.mp4',20.36,1.7);
 await screen('profile.png',22.06,2.94,'Build a professional identity.','Actual LinkedIn Profile Builder · Start screen');
 await footage('film-practice.mp4',25,5,.8,label('Build job readiness through practice'));
 await screen('college.png',30,2.06,'Help colleges focus their support.','Planned college experience · Concept');
 await footage('film-recruiter.mp4',32.06,3);
 await footage('film-evidence-finished.mp4',35.06,5.45,0,label('Planned employer experience · Sample evidence'));
 await screen('employer.png',40.51,5,'Look at what the work demonstrates.','Planned employer experience · Sample evidence');
 await screen('employer-gap.png',45.51,4.79,'Readiness needs evidence and context.','Productivity Index · No score calculated in this example');
 await footage('film-contribution.mp4',50.3,4.97,0,[
  rect({x:0,y:540,width:1920,height:540,fill:'#0a211c'}),
  text('A clearer path to productivity.',{x:240,y:670,width:1440,height:100,fontFamily:'Montserrat',fontSize:48,fontWeight:600,align:'center',color:'#f1f7f3'}),
  text('Better evidence. Better hiring conversations.',{x:240,y:800,width:1440,height:70,fontFamily:'Montserrat',fontSize:34,align:'center',color:'#9dd3b7'})
 ]);
 p.compose([
  rect({width:1920,height:1080,fill:{kind:'linear',angle:30,stops:[{offset:0,color:'#0c3632'},{offset:1,color:'#17452d'}]}}),
  path({d:'M14 94 L55 18 L96 94 M36 94 L55 60 L74 94',x:715,y:300,width:110,height:110,stroke:{color:'#a797f5',width:4.5,cap:'round'}}),
  text('ASCEND',{x:855,y:323,width:450,height:110,fontFamily:'Montserrat',fontSize:64,fontWeight:600,color:'#f1f7f3'}),
  text('A talent fulfilment network.',{x:240,y:535,width:1440,height:90,fontFamily:'Montserrat',fontSize:50,align:'center',color:'#e8f5ed'}),
  text('Bridging the productivity gap.',{x:240,y:650,width:1440,height:90,fontFamily:'Montserrat',fontSize:42,align:'center',color:'#9dd3b7'})
 ],{at:55.27,dur:4.73});
 await p.frame(21,'renders/interview-review.png');
 await p.frame(57,'renders/closing-review.png');
 await p.render('renders/picture.mp4',{depth:8,bitrate:6000000,concurrency:2,shards:4});
};

export default editFilm;
