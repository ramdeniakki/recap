'use client';
import {useState,useEffect,useRef} from 'react';
import {motion,AnimatePresence} from 'framer-motion';
const KEY='studypop:v2',SK='studypop:streak',TK='studypop:theme';
const rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const uid=()=>Math.random().toString(36).slice(2,9);
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const eq=(a,b)=>a.toLowerCase()===b.toLowerCase();
const EXAMS=[['SSC','🏛️'],['UPSC','🇮🇳'],['Banking','🏦'],['Railways','🚆'],['State PSC','📜'],['Defence','🎖️']];
const STOP=new Set('about above after again also because before being between could does during each either every from have having here however into itself might more most much must other over same should since some such than that their them then there these they this those through under until upon very were what when where which while with within without would your will can may often called using used make made'.split(' '));

function gen(text){
  const clean=text.replace(/\s+/g,' ');
  const sents=(clean.match(/[^.!?]+[.!?]/g)||[]).map(s=>s.trim()).filter(s=>s.length>=50&&s.length<=230);
  const freq={};
  (clean.toLowerCase().match(/[a-z][a-z-]{4,}/g)||[]).forEach(w=>{if(!STOP.has(w))freq[w]=(freq[w]||0)+1});
  const pool=Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,200);
  const step=Math.max(1,Math.floor(sents.length/20));
  const out=[];
  sents.filter((_,i)=>i%step===0).slice(0,20).forEach(s=>{
    const words=(s.match(/[A-Za-z][A-Za-z-]{4,}/g)||[]).filter(w=>!STOP.has(w.toLowerCase()));
    if(!words.length)return;
    const a=words.sort((x,y)=>(freq[y.toLowerCase()]||0)-(freq[x.toLowerCase()]||0))[0],al=a.toLowerCase();
    const ds=shuffle(pool.filter(w=>w!==al&&!s.toLowerCase().includes(w))).slice(0,12)
      .sort((x,y)=>Math.abs(x.length-al.length)-Math.abs(y.length-al.length)).slice(0,3)
      .map(w=>a[0]===a[0].toUpperCase()?w[0].toUpperCase()+w.slice(1):w);
    if(ds.length<3)return;
    out.push({id:uid(),q:s.replace(a,'_____'),a,opts:shuffle([a,...ds]),exp:s});
  });
  return out;
}
async function readPdf(file){
  const pdfjsLib=await import('pdfjs-dist/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc=`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  let t='';
  for(let i=1;i<=pdf.numPages;i++){t+=(await (await pdf.getPage(i)).getTextContent()).items.map(x=>x.str).join(' ')+' '}
  return {text:t,pages:pdf.numPages};
}

const Glow=({children,className='',...p})=><motion.div {...p} className={'glow '+className} onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mx',e.clientX-r.left+'px');e.currentTarget.style.setProperty('--my',e.clientY-r.top+'px')}}>{children}</motion.div>;
const Reveal=({text})=><>{text.split(' ').map((w,i)=><motion.span key={i} style={{display:'inline-block',marginRight:'.28em'}} initial={{opacity:0,y:14,filter:'blur(6px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} transition={{delay:i*.07}}>{w}</motion.span>)}</>;
const Toggle=({on,set})=><div className={'tg '+(on?'on':'')} onClick={()=>set(!on)}/>;

function Quiz({doc,onDone}){
  const [ph,setPh]=useState('setup'),[timed,setTimed]=useState(true),[neg,setNeg]=useState(true);
  const [qs,setQs]=useState([]),[i,setI]=useState(0),[pick,setPick]=useState(null),[ans,setAns]=useState([]),[left,setLeft]=useState(0);
  const start=()=>{const s=shuffle(doc.qs);setQs(s);setI(0);setPick(null);setAns([]);setLeft(s.length*60);setPh('play')};
  const fin=a=>{setAns(a);setPh('done')};
  const next=skip=>{const a=[...ans,{pick:skip?null:pick}];if(i+1>=qs.length)fin(a);else{setAns(a);setI(i+1);setPick(null)}};
  useEffect(()=>{if(ph!=='play'||!timed)return;if(left<=0){fin([...ans,{pick}]);return}const t=setTimeout(()=>setLeft(l=>l-1),1000);return()=>clearTimeout(t)},[left,ph]);
  useEffect(()=>{const h=e=>{if(ph!=='play'||pick!==null)return;const k='abcd1234'.indexOf(e.key.toLowerCase());if(k>=0&&qs[i]?.opts[k%4])setPick(qs[i].opts[k%4])};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[ph,pick,i,qs]);
  const correct=ans.filter((r,k)=>r.pick&&eq(r.pick,qs[k].a)).length,wrong=ans.filter(r=>r.pick).length-correct,skipped=qs.length-correct-wrong;
  const score=correct-(neg?wrong*.25:0),pct=qs.length?Math.max(0,Math.round(correct/qs.length*100)):0;
  useEffect(()=>{if(ph==='done')onDone(pct)},[ph]);
  if(ph==='setup')return <Glow initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
    <span className="badge p">Practice round</span><h2 style={{margin:'10px 0 4px'}}>Ready when you are</h2>
    <p style={{color:'var(--mut)',margin:0}}>{doc.qs.length} questions, one mark each</p>
    <div className="sw"><div>⏱️ Clock<span>One minute a question. Keeps you honest.</span></div><Toggle on={timed} set={setTimed}/></div>
    <div className="sw"><div>➖ Negative marking<span>Lose a quarter mark for every wrong guess</span></div><Toggle on={neg} set={setNeg}/></div>
    <p style={{color:'var(--mut)',fontSize:'.8rem'}}>On a laptop? Press A to D (or 1 to 4) to answer faster.</p>
    <button className="btn" disabled={!doc.qs.length} onClick={start}>Let's go</button></Glow>;
  if(ph==='done'){const C=2*Math.PI*70;return <Glow className="center" initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}}>
    <span className="badge p">{pct>=80?'🏆 Brilliant, hold on to this':pct>=50?'👏 Decent, push a little more':'💪 Not yet, but you will get there'}</span>
    <div className="ring"><svg width="170" height="170"><circle cx="85" cy="85" r="70" fill="none" stroke="var(--bd)" strokeWidth="12"/><circle cx="85" cy="85" r="70" fill="none" stroke="url(#g)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${C*pct/100} ${C}`} style={{transition:'stroke-dasharray 1s'}}/><defs><linearGradient id="g"><stop offset="0" stopColor="#8b5cf6"/><stop offset="1" stopColor="#ec4899"/></linearGradient></defs></svg><div>{pct}%</div></div>
    <div className="res"><div><b>{score.toFixed(2).replace(/\.?0+$/,'')}</b><span>Score</span></div><div><b style={{color:'var(--ok)'}}>{correct}</b><span>Correct</span></div><div><b style={{color:'var(--bad)'}}>{wrong}</b><span>Wrong</span></div><div><b>{skipped}</b><span>Skipped</span></div></div>
    <div className="row" style={{justifyContent:'center'}}><button className="btn" onClick={start}>🔁 Try again</button><button className="btn o" onClick={()=>setPh('setup')}>Change settings</button></div>
    {wrong+skipped>0&&<div style={{textAlign:'left',marginTop:20}}><h3>📝 Where you slipped</h3>
      {qs.map((q,k)=>{const r=ans[k];if(r&&r.pick&&eq(r.pick,q.a))return null;return <div className="exp" key={q.id} style={{marginBottom:8}}>
        <div style={{color:'var(--fg)',marginBottom:6}}>{q.q}</div><div>✅ <b style={{color:'var(--ok)'}}>{q.a}</b>{r&&r.pick&&<> · ❌ <span style={{color:'var(--bad)'}}>{r.pick}</span></>}</div></div>})}</div>}
  </Glow>}
  const q=qs[i],m=Math.floor(left/60),s=String(left%60).padStart(2,'0');
  return <div>
    <div className="row" style={{justifyContent:'space-between'}}><span className="badge p">Q {i+1} / {qs.length}</span>
      {timed&&<span className={'badge timer '+(left<30?'low':'')}>⏱️ {m}:{s}</span>}<span className="badge">✅ {ans.filter((r,k)=>r.pick&&eq(r.pick,qs[k].a)).length}</span></div>
    <div className="pbar"><div style={{width:(i/qs.length*100)+'%'}}/></div>
    <AnimatePresence mode="wait"><Glow key={q.id} initial={{x:50,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-50,opacity:0}}>
      <div className="q">{q.q}</div>
      {q.opts.map((o,k)=>{const right=eq(o,q.a),cls=pick===null?'':right?'ok':pick===o?'bad':'';
        return <motion.button key={k} className={'opt '+cls} disabled={pick!==null} whileHover={{x:4}} whileTap={{scale:.98}} onClick={()=>setPick(o)}><kbd>{'ABCD'[k]}</kbd>{o}{pick!==null&&right?' ✅':pick===o?' ❌':''}</motion.button>})}
      {pick!==null&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><div className="exp">💡 {q.exp}</div></motion.div>}
      <div className="row" style={{marginTop:14}}>{pick===null?<button className="btn o" onClick={()=>next(true)}>Skip for now</button>:<button className="btn" onClick={()=>next(false)}>{i+1===qs.length?'See my result':'Next →'}</button>}</div>
    </Glow></AnimatePresence></div>
}

function Cards({doc}){
  const [i,setI]=useState(0),[flip,setFlip]=useState(false),q=doc.qs[i];
  if(!q)return <div className="empty">No questions here. Add a few from the Edit tab.</div>;
  const go=d=>{setFlip(false);setI((i+d+doc.qs.length)%doc.qs.length)};
  return <div>
    <div className="row" style={{justifyContent:'space-between',marginBottom:12}}><span className="badge p">Card {i+1}/{doc.qs.length}</span><span style={{color:'var(--mut)',fontSize:'.82rem'}}>Tap the card to see the answer</span></div>
    <div className="flash" onClick={()=>setFlip(!flip)}><motion.div style={{position:'relative',width:'100%',height:'100%',transformStyle:'preserve-3d'}} animate={{rotateY:flip?180:0}} transition={{duration:.5}}>
      <div className="face front">{q.q}</div><div className="face back">{q.a}</div></motion.div></div>
    <div className="row" style={{justifyContent:'center'}}><button className="btn o" onClick={()=>go(-1)}>← Prev</button><button className="btn" onClick={()=>go(1)}>Next →</button></div>
  </div>
}

function Editor({doc,save}){
  const upd=(id,f,v)=>save({...doc,qs:doc.qs.map(q=>q.id===id?{...q,[f]:v}:q)});
  const setOpt=(q,k,v)=>{const opts=[...q.opts],was=opts[k]===q.a;opts[k]=v;save({...doc,qs:doc.qs.map(x=>x.id===q.id?{...x,opts,a:was?v:x.a}:x)})};
  return <div>
    <Glow style={{marginBottom:14}}><label>PDF title</label><input value={doc.title} onChange={e=>save({...doc,title:e.target.value})}/>
      <label>Exam</label><div className="chips" style={{justifyContent:'flex-start',marginBottom:12}}>{EXAMS.map(([n,e])=><button key={n} className={'chip '+(doc.exam===n?'on':'')} onClick={()=>save({...doc,exam:n})}>{e} {n}</button>)}</div>
      <div className="row"><button className="btn" onClick={()=>save({...doc,qs:[...doc.qs,{id:uid(),q:'New question?',a:'Right',opts:['Right','Wrong 1','Wrong 2','Wrong 3'],exp:'Add an explanation.'}]})}>＋ Add question</button>
      <button className="btn o" onClick={()=>save({...doc,qs:gen(doc.text)})}>🔄 Make fresh questions</button></div></Glow>
    <AnimatePresence>{doc.qs.map((q,n)=><Glow key={q.id} style={{marginBottom:12}} layout initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,x:-80}}>
      <span className="badge">#{n+1}</span><label style={{marginTop:10}}>Question</label><textarea rows={2} value={q.q} onChange={e=>upd(q.id,'q',e.target.value)}/>
      <label>Options (✔ = correct answer)</label>
      {q.opts.map((o,k)=><div key={k} className="row" style={{flexWrap:'nowrap',alignItems:'flex-start'}}><button className={'btn sm '+(o===q.a?'':'o')} style={{marginTop:3}} onClick={()=>upd(q.id,'a',o)}>✔</button><input value={o} onChange={e=>setOpt(q,k,e.target.value)}/></div>)}
      <label>Explanation</label><textarea rows={2} value={q.exp} onChange={e=>upd(q.id,'exp',e.target.value)}/>
      <button className="btn d sm" onClick={()=>save({...doc,qs:doc.qs.filter(x=>x.id!==q.id)})}>🗑 Delete question</button></Glow>)}</AnimatePresence>
  </div>
}

export default function App(){
  const [docs,setDocs]=useState([]);
  const [view,setView]=useState('home'),[aid,setAid]=useState(null),[exam,setExam]=useState('SSC');
  const [busy,setBusy]=useState(false),[over,setOver]=useState(false),[toast,setToast]=useState('');
  const [streak,setStreak]=useState({last:'',count:0});
  const [theme,setTheme]=useState('dark');
  const [ready,setReady]=useState(false),fileRef=useRef(),active=docs.find(d=>d.id===aid);
  useEffect(()=>{setDocs(rd(KEY,null)||rd('studypop:v1',[]).map(d=>({...d,best:null})));setStreak(rd(SK,{last:'',count:0}));setTheme(rd(TK,matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));setReady(true)},[]);
  useEffect(()=>{if(!ready)return;document.documentElement.dataset.theme=theme;try{localStorage.setItem(TK,JSON.stringify(theme))}catch(e){}},[theme]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(KEY,JSON.stringify(docs))}catch(e){setToast('Browser storage is full. Delete an old PDF first.')}},[docs]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(t)}},[toast]);
  const save=d=>setDocs(ds=>ds.map(x=>x.id===d.id?d:x));
  const go=(v,id)=>{setView(v);setAid(id||null);window.scrollTo(0,0)};
  const day=o=>new Date(Date.now()-o*864e5).toDateString();
  const bump=()=>{if(streak.last===day(0))return;const n={last:day(0),count:streak.last===day(1)?streak.count+1:1};setStreak(n);try{localStorage.setItem(SK,JSON.stringify(n))}catch(e){}};
  const upload=async f=>{
    if(!f||(f.type!=='application/pdf'&&!/\.pdf$/i.test(f.name)))return setToast("That doesn't look like a PDF");
    setBusy(true);
    try{const {text,pages}=await readPdf(f),qs=gen(text);
      if(!qs.length){setToast("Couldn't find any text in this one. Is it a scanned copy?");setBusy(false);return}
      setDocs(ds=>[{id:uid(),title:f.name.replace(/\.pdf$/i,''),exam,pages,date:new Date().toLocaleDateString(),text:text.slice(0,60000),qs,best:null},...ds]);
      setToast(`Done. ${qs.length} questions are ready for you`);
    }catch(e){setToast("Couldn't open this PDF. Try another one?")}
    setBusy(false);
  };
  const del=d=>{if(confirm(`Delete "${d.title}"? You can't undo this.`)){setDocs(ds=>ds.filter(x=>x.id!==d.id));if(aid===d.id)go('home')}};
  const bests=docs.filter(d=>d.best!=null),avg=bests.length?Math.round(bests.reduce((a,d)=>a+d.best,0)/bests.length):0;
  const stats=[['📄',docs.length,'PDFs in your bag'],['❓',docs.reduce((a,d)=>a+d.qs.length,0),'Questions waiting'],['🎯',avg+'%','Your average'],['🔥',streak.count+(streak.count===1?' day':' days'),'Days in a row']];
  return <div className="wrap"><div className="spot"/>
    <div className="nav"><div className="logo" onClick={()=>go('home')}><i>📚</i><span className="grad">StudyPop</span></div>
      <button className="btn o sm" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?'☀️ Light':'🌙 Dark'}</button></div>
    <AnimatePresence mode="wait">
    {view==='home'?<motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div className="hero"><span className="badge p">🇮🇳 Made for sarkari exam aspirants</span>
        <h1><Reveal text="Your notes, but now they quiz you back"/></h1>
        <p>Drop in any PDF you study from. You get questions, a ticking clock and marks cut for wrong guesses, just like the real paper. Everything stays on your own phone or laptop.</p></div>
      <div className="bento">{stats.map(([e,v,l],k)=><Glow key={l} className="stat" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.2+k*.08}} whileHover={{y:-4}}><span>{e} {l}</span><b>{v}</b></Glow>)}</div>
      <div style={{color:'var(--mut)',fontSize:'.82rem',textAlign:'center',marginBottom:10}}>What are you preparing for?</div>
      <div className="chips">{EXAMS.map(([n,e])=><button key={n} className={'chip '+(exam===n?'on':'')} onClick={()=>setExam(n)}>{e} {n}</button>)}</div>
      <motion.div className="mb" whileHover={{scale:1.01}} whileTap={{scale:.99}} onClick={()=>fileRef.current.click()} onDragOver={e=>{e.preventDefault();setOver(true)}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);upload(e.dataTransfer.files[0])}}>
        <div style={over?{background:'rgba(139,92,246,.15)'}:null}><div className="big">{busy?'⏳':'📤'}</div><b>{busy?'Going through your pages, one sec…':'Drop your PDF here, or tap to pick one'}</b><small>Typed PDFs work best. Photos of pages won't.</small>
        <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={e=>{upload(e.target.files[0]);e.target.value=''}}/></div></motion.div>
      <h2 className="sec">📚 Your shelf</h2>
      {!docs.length?<div className="empty">Nothing here yet. Add a PDF and let's begin.</div>:
      <div className="grid"><AnimatePresence>{docs.map(d=><Glow key={d.id} layout initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} whileHover={{y:-4}}>
        <div className="row"><span className="badge p">{(EXAMS.find(x=>x[0]===d.exam)||['','📘'])[1]} {d.exam||'General'}</span>{d.best!=null&&<span className="badge">🏅 {d.best}%</span>}</div>
        <h3>{d.title}</h3><div className="meta">{d.pages} pages · {d.qs.length} questions · {d.date}</div>
        <div className="pbar" style={{margin:'0 0 14px'}}><div style={{width:(d.best||0)+'%'}}/></div>
        <div className="row"><button className="btn sm" onClick={()=>go('quiz',d.id)}>Start</button><button className="btn o sm" onClick={()=>go('cards',d.id)}>Cards</button><button className="btn o sm" onClick={()=>go('edit',d.id)}>Edit</button><button className="btn d sm" onClick={()=>del(d)}>Delete</button></div>
      </Glow>)}</AnimatePresence></div>}
    </motion.div>:active&&<motion.div key={view+aid} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
      <button className="btn o sm" onClick={()=>go('home')}>← Back to shelf</button>
      <h2 style={{margin:'14px 0'}}>{active.title}</h2>
      <div className="tabs">{[['quiz','🎯 Test yourself'],['cards','🃏 Flashcards'],['edit','✏️ Edit']].map(([k,l])=><button key={k} className={'tab '+(view===k?'on':'')} onClick={()=>go(k,aid)}>{l}</button>)}</div>
      {view==='quiz'&&<Quiz key={aid} doc={active} onDone={p=>{save({...active,best:Math.max(active.best||0,p)});bump()}}/>}
      {view==='cards'&&<Cards doc={active}/>}
      {view==='edit'&&<Editor doc={active} save={save}/>}
    </motion.div>}
    </AnimatePresence>
    {toast&&<div className="toast">{toast}</div>}
  </div>
}
