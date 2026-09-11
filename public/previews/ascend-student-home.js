(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const states = {
    new: {
      greeting:'A starting point. At your pace.',direction:'Still exploring — that’s okay.',avatar:'You',label:'YOUR FIRST MOVE',title:'Let’s start with what makes you, you.',description:'Your background and interests give Ascend a starting point for relevant next steps. You don’t need to know your future job yet.',action:'Tell us about you',href:'/profile',note:'Your profile is the starting point. You can update it as your direction changes.',preview:'A little context goes a long way',lines:[['Your background','What you study and what you have tried.'],['Your interests','The work and industries you want to explore.'],['Your starting point','A next step grounded in what you tell us.']],journey:[['Get your bearings','Start with your background.','current'],['Find your direction','Explore and choose a role.',''],['Prepare for the work','Build your next steps around it.','']],records:[]
    },
    returning: {
      greeting:'Welcome back, Priya.',direction:'Exploring Customer Success',avatar:'P',label:'PICK UP WHERE YOU LEFT OFF',title:'See what this role is really like.',description:'You’ve added your background and started exploring Customer Success. Look at its responsibilities and the hard parts before deciding whether it fits.',action:'Continue exploring roles',href:'/discover',note:'Example state: profile complete, career exploration in progress.',preview:'A clearer picture before you choose',lines:[['The working day','What you would actually spend your time doing.'],['The honest parts','The pressure, trade-offs and responsibilities.'],['Your decision','Choose a direction when you have enough context.']],journey:[['Get your bearings','Your background is in place.','done'],['Find your direction','Role exploration is in progress.','current'],['Prepare for the work','Choose a role to give it focus.','']],records:['resume']
    },
    completed: {
      greeting:'Your work is starting to speak, Priya.',direction:'Customer Success Associate',avatar:'P',label:'YOUR NEXT MOVE',title:'Put your feedback into your next interview.',description:'You’ve completed a practice interview for Customer Success. Review its feedback, then use the next attempt to work on the points it identified.',action:'Open interview practice',href:'/interview',note:'Example state: a chosen role, a saved resume and completed interview feedback.',preview:'Make the next attempt count',lines:[['Revisit your last feedback','See what to keep and what needs more work.'],['Practise with a purpose','Focus on the points in that feedback.'],['Keep building your record','Your completed work stays within reach below.']],journey:[['Get your bearings','Your background is in place.','done'],['Find your direction','Customer Success Associate chosen.','done'],['Prepare for the work','Use your feedback in the next attempt.','current']],records:['resume','interview']
    }
  };
  const records = {
    resume:{title:'Customer Success resume',kind:'RESUME',note:'Illustrative saved document',detail:'In the finished home, this would reopen the student’s actual saved resume. This example shows how their own work can become a recognisable object on the page. It contains no saved account data.',href:'/resume/build'},
    interview:{title:'Your interview feedback',kind:'INTERVIEW READ-OUT',note:'Illustrative completed practice',detail:'In the finished home, this would open feedback from the student’s completed interview, including their answers and the points to work on. This preview does not invent scores or assessment findings.',href:'/interview'}
  };
  function showRecord(key){const record=records[key];$('record-title').textContent=record.title;$('record-detail').textContent=record.detail;$('record-tool').href=record.href;$('record-dialog').showModal();}
  function render(name){const state=states[name];document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.state===name)));
    for(const [id,key] of [['greeting','greeting'],['direction','direction'],['avatar','avatar'],['next-label','label'],['next-title','title'],['next-description','description'],['next-note','note'],['preview-heading','preview']])$(id).textContent=state[key];
    $('next-action').innerHTML=state.action+' <span>↗</span>';$('next-action').href=state.href;
    $('preview-lines').innerHTML=state.lines.map((line,i)=>'<div class="preview-line"><span>0'+(i+1)+'</span><p>'+line[0]+'<small>'+line[1]+'</small></p></div>').join('');
    $('journey').innerHTML=state.journey.map(item=>'<li class="'+item[2]+'"><strong>'+item[0]+'</strong><small>'+item[1]+'</small></li>').join('');
    $('empty-work').hidden=state.records.length>0;$('records').hidden=state.records.length===0;
    $('record-label').textContent=state.records.length?state.records.length+' example'+(state.records.length===1?'':'s')+' · open to inspect':'Your work will appear here';
    $('records').innerHTML=state.records.map(key=>{const r=records[key];return '<button class="record" data-record="'+key+'" aria-label="Preview '+r.title+'"><div class="paper" aria-hidden="true"><div class="document-title">'+r.kind+'</div><div class="line teal"></div><div class="line"></div><div class="line short"></div><div class="line"></div><p class="document-note">'+(key==='resume'?'Customer Success Associate':'Your answers · Feedback · Next steps')+'</p></div><h3>'+r.title+' ↗</h3><small>'+r.note+'</small></button>';}).join('');
    document.querySelectorAll('[data-record]').forEach(b=>b.onclick=()=>showRecord(b.dataset.record));
    const url=new URL(location.href);url.searchParams.set('state',name);history.replaceState(null,'',url);
  }
  document.querySelectorAll('[data-state]').forEach(b=>b.onclick=()=>render(b.dataset.state));
  $('close-dialog').onclick=()=>$('record-dialog').close();
  const initial=new URLSearchParams(location.search).get('state');render(Object.hasOwn(states,initial)?initial:'new');
})();
