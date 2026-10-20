const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const todayISO=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const addDays=(iso,n)=>{const d=new Date(iso+"T00:00:00");d.setDate(d.getDate()+n);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const fmtD=iso=>{if(!iso)return"";const d=new Date(iso+"T00:00:00");return isNaN(d)?iso:d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})};
const daysTo=iso=>iso?Math.round((new Date(iso+"T00:00:00")-new Date(todayISO()+"T00:00:00"))/864e5):null;
const money=n=>"Le "+(Number(n)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const toMin=t=>{if(!t)return null;const[h,m]=t.split(":").map(Number);return h*60+m};

/* ---------- tool definitions (one per TOR area) ---------- */
const TOOLS=[
 {id:"commitments",num:1,nav:"Liaison & Commitments",title:"Corporate Liaison & Commitment Tracker",
  lede:"Every board, institution and organisation the MD is affiliated with, and each obligation to them, ranked and followed up.",
  fields:[
   {k:"org",label:"Board / institution",req:1},{k:"commitment",label:"Commitment or obligation",req:1,wide:1},
   {k:"contact",label:"Contact person"},{k:"start",label:"Start date",type:"date",def:"@today"},{k:"due",label:"Due date",type:"date"},
   {k:"priority",label:"Priority",type:"select",opts:["High","Medium","Low"],def:"Medium"},
   {k:"status",label:"Status",type:"select",opts:["Open","Followed up","Awaiting reply","Done"],def:"Open"},
   {k:"nextstep",label:"Next follow-up step",wide:1}],
  sort:(a,b)=>(a.status==="Done")-(b.status==="Done")||({High:0,Medium:1,Low:2}[a.priority]-({High:0,Medium:1,Low:2}[b.priority]))||String(a.due||"9").localeCompare(String(b.due||"9")),
  flag:r=>r.status!=="Done"&&r.due&&daysTo(r.due)<0,
  cols:[["Commitment",r=>`<b>${esc(r.commitment)}</b><span class="sub">${esc(r.org)}${r.contact?" · "+esc(r.contact):""}</span>`],
        ["Priority",r=>`<span class="pill ${r.priority==="High"?"bad":r.priority==="Medium"?"warn":""}">${esc(r.priority)}</span>`],
        ["Due",r=>dueCell(r.due,r.status==="Done")],
        ["Status",r=>statusPill(r.status)],
        ["Next step",r=>esc(r.nextstep)]],
  chips:rs=>{const open=rs.filter(r=>r.status!=="Done");return[
    [open.length,"Open commitments"],[open.filter(r=>r.due&&daysTo(r.due)<0).length,"Overdue","bad"],
    [open.filter(r=>r.due&&daysTo(r.due)>=0&&daysTo(r.due)<=7).length,"Due in 7 days","warn"],[open.filter(r=>r.priority==="High").length,"High priority"]]}},

 {id:"files",num:2,nav:"Files & Documents",title:"Document Control Register",
  lede:"One index for every business and personal file, digital or physical, so anything can be found in seconds. Leave the reference blank and one is generated.",
  fields:[
   {k:"title",label:"Document title",req:1,wide:1},
   {k:"owner",label:"Business or personal",type:"select",opts:["Business","Personal"],def:"Business"},
   {k:"category",label:"Category",type:"select",opts:["Board papers","Contracts","Finance","Correspondence","HR","Projects","Legal","Identity & certificates","Property","Other"],def:"Correspondence"},
   {k:"format",label:"Format",type:"select",opts:["Digital","Physical","Both"],def:"Digital"},
   {k:"location",label:"Location (folder path or cabinet/drawer)",wide:1},
   {k:"ref",label:"Reference code"},{k:"date",label:"Document date",type:"date"},
   {k:"access",label:"Access",type:"select",opts:["Normal","Confidential","MD only"],def:"Normal"},
   {k:"tags",label:"Keywords"}],
  search:1,sort:(a,b)=>String(b.date||"").localeCompare(String(a.date||"")),
  beforeSave:(o,rs)=>{if(!o.ref){const p=(o.owner==="Personal"?"PER":"BUS")+"-"+(o.category||"GEN").replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase();const n=rs.filter(r=>String(r.ref||"").startsWith(p)).length+1;o.ref=p+"-"+String(n).padStart(3,"0")}return o},
  cols:[["Ref",r=>`<span style="font-family:var(--f-mono);font-size:13px">${esc(r.ref)}</span>`],
        ["Document",r=>`<b>${esc(r.title)}</b><span class="sub">${esc(r.category)} · ${esc(r.owner)}${r.tags?" · "+esc(r.tags):""}</span>`],
        ["Where",r=>`<span class="pill info">${esc(r.format)}</span><span class="sub">${esc(r.location)}</span>`],
        ["Access",r=>`<span class="pill ${r.access==="Normal"?"":"acc"}">${esc(r.access)}</span>`],
        ["Date",r=>esc(fmtD(r.date))]],
  chips:rs=>[[rs.length,"Documents indexed"],[rs.filter(r=>r.owner==="Business").length,"Business"],[rs.filter(r=>r.owner==="Personal").length,"Personal"],[rs.filter(r=>r.format!=="Digital").length,"Physical copies"],[rs.filter(r=>!r.location).length,"Missing location","warn"]]},

 {id:"research",num:3,nav:"Research & Briefings",title:"Research & Briefing Builder",
  lede:"Log each research request, gather notes and sources, then turn them into a short briefing the MD can act on.",
  fields:[
   {k:"topic",label:"Topic",req:1,wide:1},{k:"question",label:"What the MD wants to know",type:"textarea",wide:1},
   {k:"requested",label:"Date requested",type:"date",def:"@today"},{k:"deadline",label:"Needed by",type:"date"},
   {k:"status",label:"Status",type:"select",opts:["Requested","Researching","Brief drafted","Delivered"],def:"Requested"},
   {k:"sources",label:"Sources (one per line)",type:"textarea",wide:1},
   {k:"notes",label:"Research notes",type:"textarea",wide:1},
   {k:"brief",label:"Briefing summary",type:"textarea",wide:1}],
  ai:{label:"Draft briefing",target:"brief",prompt:r=>`You are helping an executive assistant brief a Managing Director of an engineering consultancy in Sierra Leone.
Write a concise, actionable briefing (max 200 words) using ONLY the notes and sources given. Structure: "Bottom line" (2 sentences), "Key points" (3-5 bullets), "Recommended next steps" (2-3 bullets), "Gaps to verify" (bullets, if any). Do not invent facts or figures.

Topic: ${r.topic}
Question: ${r.question||"-"}
Sources:
${r.sources||"-"}
Notes:
${r.notes||"-"}`},
  sort:(a,b)=>(a.status==="Delivered")-(b.status==="Delivered")||String(a.deadline||"9").localeCompare(String(b.deadline||"9")),
  flag:r=>r.status!=="Delivered"&&r.deadline&&daysTo(r.deadline)<0,
  cols:[["Topic",r=>`<b>${esc(r.topic)}</b><span class="sub">${esc(r.question)}</span>`],
        ["Needed by",r=>dueCell(r.deadline,r.status==="Delivered")],["Status",r=>statusPill(r.status)],
        ["Brief",r=>r.brief?`<span class="pill ok">Ready</span>`:`<span class="pill">Not yet</span>`]],
  chips:rs=>[[rs.filter(r=>r.status!=="Delivered").length,"Open requests"],[rs.filter(r=>r.status!=="Delivered"&&r.deadline&&daysTo(r.deadline)<0).length,"Past deadline","bad"],[rs.filter(r=>r.brief&&r.status!=="Delivered").length,"Briefs ready to send","ok"],[rs.filter(r=>r.status==="Delivered").length,"Delivered"]]},

 {id:"social",num:4,nav:"Social Media",title:"Social Media Content Planner",
  lede:"Plan, draft and approve the MD's LinkedIn and other posts so every post fits his personal and corporate brand.",
  fields:[
   {k:"date",label:"Planned date",type:"date"},{k:"platform",label:"Platform",type:"select",opts:["LinkedIn","X (Twitter)","Facebook","Instagram"],def:"LinkedIn"},
   {k:"pillar",label:"Content theme",type:"select",opts:["Engineering projects","Energy & utilities","Thought leadership","Company news","Events & speaking","Community & CSR","Personal milestone"],def:"Thought leadership"},
   {k:"status",label:"Status",type:"select",opts:["Idea","Drafted","Awaiting MD approval","Approved","Posted"],def:"Idea"},
   {k:"topic",label:"What the post is about",req:1,wide:1},{k:"draft",label:"Post text",type:"textarea",wide:1},
   {k:"link",label:"Link after posting",wide:1}],
  ai:{label:"Draft post",target:"draft",prompt:r=>`Draft a ${r.platform} post for the Managing Director of an engineering consultancy in Sierra Leone, written in his voice (first person), professional and warm, plain English.
Theme: ${r.pillar}. What it is about: ${r.topic}.
${r.draft?"Improve this existing draft rather than starting over:\n"+r.draft+"\n":""}Rules: ${r.platform==="X (Twitter)"?"under 270 characters":"120-180 words, short paragraphs"}; no invented facts, names or numbers (use [brackets] for anything the MD must fill in); end with at most 3 relevant hashtags. Reply with the post text only.`},
  sort:(a,b)=>String(a.date||"9").localeCompare(String(b.date||"9")),
  cols:[["Date",r=>esc(fmtD(r.date))||'<span class="sub">Unscheduled</span>'],
        ["Post",r=>`<b>${esc(r.topic)}</b><span class="sub">${esc(r.platform)} · ${esc(r.pillar)}</span>`],
        ["Status",r=>statusPill(r.status)],["Draft",r=>r.draft?`<span class="sub">${esc(r.draft.slice(0,90))}${r.draft.length>90?"…":""}</span>`:""]],
  chips:rs=>[[rs.filter(r=>r.status==="Awaiting MD approval").length,"Awaiting approval","warn"],[rs.filter(r=>r.status==="Approved").length,"Approved, not posted"],[rs.filter(r=>r.status==="Posted"&&r.date&&r.date.slice(0,7)===todayISO().slice(0,7)).length,"Posted this month","ok"],[rs.filter(r=>r.status==="Idea").length,"Ideas in the bank"]]},

 {id:"expenses",num:5,nav:"Personal Finance",title:"Personal Expenses & Banking Log",
  lede:"Track the MD's minor personal expenses, personal-project spending and banking errands. Never record account numbers, PINs or passwords here.",
  notice:"For security, record only descriptions and amounts. Keep account numbers, card numbers, PINs and passwords out of this log.",
  fields:[
   {k:"date",label:"Date",type:"date",def:"@today",req:1},{k:"desc",label:"Description",req:1,wide:1},
   {k:"kind",label:"Type",type:"select",opts:["Expense","Banking errand","Transfer","Reimbursement due"],def:"Expense"},
   {k:"category",label:"Category",type:"select",opts:["Household","Fuel & transport","Utilities","Medical","Gifts & donations","Subscriptions","Personal project","Other"],def:"Household"},
   {k:"project",label:"Personal project (if any)"},{k:"amount",label:"Amount (Le)",type:"number"},
   {k:"method",label:"Paid by",type:"select",opts:["Cash","Bank transfer","Mobile money","Card","Cheque"],def:"Cash"},
   {k:"status",label:"Status",type:"select",opts:["Recorded","Receipt filed","Pending","Reconciled"],def:"Recorded"},
   {k:"note",label:"Note",wide:1}],
  monthFilter:1,sort:(a,b)=>String(b.date||"").localeCompare(String(a.date||"")),
  cols:[["Date",r=>esc(fmtD(r.date))],["Item",r=>`<b>${esc(r.desc)}</b><span class="sub">${esc(r.kind)} · ${esc(r.category)}${r.project?" · "+esc(r.project):""}</span>`],
        ["Paid by",r=>esc(r.method)],["Status",r=>statusPill(r.status)],["Amount",r=>money(r.amount),"num"]],
  chips:rs=>{const by={};rs.forEach(r=>{by[r.category]=(by[r.category]||0)+(Number(r.amount)||0)});const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
    return[[money(rs.reduce((s,r)=>s+(Number(r.amount)||0),0)),"Total in view"],[rs.length,"Entries"],[rs.filter(r=>r.status==="Pending").length,"Pending","warn"],[top?esc(top[0]):"—","Largest category"]]}},

 {id:"diary",num:6,nav:"Diary & Schedule",title:"Diary & Clash Checker",
  lede:"The MD's corporate and personal calendar in one place. Any two entries that overlap on the same day are flagged as a clash.",
  fields:[
   {k:"date",label:"Date",type:"date",def:"@today",req:1},{k:"start",label:"Start",type:"time",req:1},{k:"end",label:"End",type:"time"},
   {k:"type",label:"Type",type:"select",opts:["Engineering deadline","Client pitch","Board / external","Internal meeting","Private appointment","Travel"],def:"Internal meeting"},
   {k:"title",label:"What",req:1,wide:1},{k:"where",label:"Where"},
   {k:"privacy",label:"Visibility",type:"select",opts:["Normal","Private"],def:"Normal"}],
  sort:(a,b)=>String(a.date).localeCompare(String(b.date))||String(a.start).localeCompare(String(b.start)),
  rangeFilter:1,
  flag:r=>r._clash,
  prep:rs=>{rs.forEach(r=>r._clash=false);for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];if(a.date!==b.date)continue;const as=toMin(a.start),ae=toMin(a.end)??as+60,bs=toMin(b.start),be=toMin(b.end)??bs+60;if(as<be&&bs<ae){a._clash=b._clash=true}}},
  cols:[["When",r=>`<b>${esc(fmtD(r.date))}</b><span class="sub">${esc(r.start)}${r.end?"–"+esc(r.end):""}</span>`],
        ["What",r=>`<b>${esc(r.title)}</b><span class="sub">${esc(r.where)}${r.privacy==="Private"?" · Private":""}</span>`],
        ["Type",r=>`<span class="pill ${r.type==="Engineering deadline"?"warn":r.type==="Client pitch"?"acc":r.type==="Private appointment"?"info":""}">${esc(r.type)}</span>`],
        ["Check",r=>r._clash?`<span class="pill bad">Clash</span>`:`<span class="pill ok">Clear</span>`]],
  chips:rs=>{const t=todayISO(),wk=addDays(t,7);return[[rs.filter(r=>r.date===t).length,"Today"],[rs.filter(r=>r.date>=t&&r.date<=wk).length,"Next 7 days"],[rs.filter(r=>r._clash&&r.date>=t).length,"Upcoming clashes","bad"],[rs.filter(r=>r.type==="Engineering deadline"&&r.date>=t&&r.date<=wk).length,"Deadlines this week","warn"]]}},

 {id:"travel",num:7,nav:"Travel & Logistics",title:"Travel Itinerary Planner",
  lede:"Each trip with its flights, hotel, ground transport and a readiness checklist, so nothing is missed before departure.",
  fields:[
   {k:"trip",label:"Trip / purpose",req:1,wide:1},{k:"dest",label:"Destination",req:1},
   {k:"depart",label:"Depart",type:"date"},{k:"ret",label:"Return",type:"date"},
   {k:"flight",label:"Flights (airline, number, times)",wide:1},{k:"hotel",label:"Accommodation",wide:1},
   {k:"ground",label:"Airport transfer / ground transport",wide:1},
   {k:"checklist",label:"Readiness checklist",type:"checks",opts:["Passport valid 6+ months","Visa","Flights booked","Hotel booked","Airport transfer","Per diem / cash","Yellow fever card","Itinerary shared with MD","Meeting packs printed"],wide:1},
   {k:"status",label:"Status",type:"select",opts:["Planning","Booked","Travelling","Completed"],def:"Planning"}],
  sort:(a,b)=>(a.status==="Completed")-(b.status==="Completed")||String(a.depart||"9").localeCompare(String(b.depart||"9")),
  flag:r=>r.status!=="Completed"&&r.depart&&daysTo(r.depart)<=3&&ready(r)<100,
  cols:[["Trip",r=>`<b>${esc(r.trip)}</b><span class="sub">${esc(r.dest)}</span>`],
        ["Dates",r=>`${esc(fmtD(r.depart))}${r.ret?" → "+esc(fmtD(r.ret)):""}`],["Status",r=>statusPill(r.status)],
        ["Ready",r=>`<span style="font:500 13px var(--f-mono)">${ready(r)}%</span><div class="bar"><i style="width:${ready(r)}%"></i></div>`]],
  chips:rs=>{const up=rs.filter(r=>r.status!=="Completed");return[[up.length,"Upcoming trips"],[up.filter(r=>r.depart&&daysTo(r.depart)<=14&&daysTo(r.depart)>=0).length,"Departing in 14 days","warn"],[up.filter(r=>ready(r)<100).length,"Not fully ready","bad"],[rs.filter(r=>r.status==="Completed").length,"Completed"]]}},

 {id:"meetings",num:8,nav:"Meetings & Actions",title:"Meeting Manager",
  lede:"Plan executive and board meetings: agenda, brief pack checklist, minutes and an action log that is followed up until every item is closed.",
  fields:[
   {k:"title",label:"Meeting",req:1,wide:1},{k:"type",label:"Type",type:"select",opts:["Board meeting","Executive / management","Client","Partner / external","Internal review"],def:"Executive / management"},
   {k:"date",label:"Date",type:"date"},{k:"time",label:"Time",type:"time"},{k:"venue",label:"Venue / link"},
   {k:"attendees",label:"Attendees",wide:1},{k:"agenda",label:"Agenda (one item per line)",type:"textarea",wide:1},
   {k:"pack",label:"Brief pack",type:"checks",opts:["Agenda circulated","Previous minutes","Action log update","Papers / reports","Financials","Presentation"],wide:1},
   {k:"notes",label:"Rough notes taken in the meeting",type:"textarea",wide:1},
   {k:"minutes",label:"Final minutes",type:"textarea",wide:1}],
  ai:{label:"Write minutes + actions",target:"minutes",json:1,prompt:r=>`Turn these rough meeting notes into concise formal minutes and an action list. Use ONLY what is in the notes; do not invent decisions, names or dates.
Reply with only JSON: {"minutes": string (plain text, numbered by agenda item, decisions stated clearly), "actions": [{"action": string, "owner": string ("" if not stated), "due": "YYYY-MM-DD" or ""}]}

Meeting: ${r.title} (${r.type}) on ${r.date||"date not given"}
Attendees: ${r.attendees||"-"}
Agenda:
${r.agenda||"-"}
Rough notes:
${r.notes||"-"}`},
  sort:(a,b)=>String(b.date||"").localeCompare(String(a.date||"")),
  cols:[["Meeting",r=>`<b>${esc(r.title)}</b><span class="sub">${esc(r.type)}${r.venue?" · "+esc(r.venue):""}</span>`],
        ["When",r=>`${esc(fmtD(r.date))}<span class="sub">${esc(r.time)}</span>`],
        ["Pack",r=>{const n=(r.pack||[]).length;return`<span style="font:500 13px var(--f-mono)">${n}/6</span><div class="bar"><i style="width:${Math.round(n/6*100)}%"></i></div>`}],
        ["Minutes",r=>r.minutes?`<span class="pill ok">Done</span>`:(r.date&&daysTo(r.date)<0?`<span class="pill warn">Due</span>`:`<span class="pill">—</span>`)],
        ["Actions",r=>{const a=store.actions.filter(x=>x.meeting===r._id);const o=a.filter(x=>x.status!=="Done").length;return a.length?`<span class="pill ${o?"warn":"ok"}">${o} open / ${a.length}</span>`:""}]],
  chips:rs=>{const t=todayISO();const open=store.actions.filter(a=>a.status!=="Done");return[[rs.filter(r=>r.date>=t).length,"Upcoming meetings"],[rs.filter(r=>r.date&&r.date<t&&!r.minutes).length,"Minutes outstanding","warn"],[open.length,"Open actions"],[open.filter(a=>a.due&&a.due<t).length,"Overdue actions","bad"]]}}
];
const ACTION_FIELDS=[{k:"action",label:"Action",req:1,wide:1},{k:"owner",label:"Owner"},{k:"start",label:"Start",type:"date",def:"@today"},{k:"due",label:"Due",type:"date"},{k:"status",label:"Status",type:"select",opts:["Open","In progress","Done"],def:"Open"}];

function ready(r){const opts=TOOLS[6].fields.find(f=>f.k==="checklist").opts;return Math.round(((r.checklist||[]).length/opts.length)*100)}
function statusPill(s){const m={"Done":"ok","Delivered":"ok","Posted":"ok","Reconciled":"ok","Completed":"ok","Approved":"ok","Receipt filed":"ok","Booked":"info","Followed up":"info","Researching":"info","Brief drafted":"info","Drafted":"info","In progress":"info","Travelling":"acc","Awaiting reply":"warn","Awaiting MD approval":"warn","Pending":"warn"};return`<span class="pill ${m[s]||""}">${esc(s)}</span>`}
function dueCell(d,done){if(!d)return'<span class="sub">No date</span>';const n=daysTo(d);let t=fmtD(d),c="";if(!done){if(n<0){c="bad";t+=` · ${-n}d overdue`}else if(n===0){c="warn";t+=" · today"}else if(n<=7){c="warn";t+=` · in ${n}d`}}return c?`<span class="pill ${c}">${esc(t)}</span>`:esc(t)}

/* ---------- data layer ---------- */
// Signed in (normal use): records live in Firebase Firestore under users/{uid}/..., with a full
// offline copy on the device, so phone and computer stay in step and work without internet.
// Not signed in / "use on this device only": records stay on this device (Android Preferences or localStorage).
const store={};[...TOOLS.map(t=>t.id),"actions"].forEach(k=>store[k]=[]);
const N=window.Native||{isNative:false,platform:"web"};
const S=window.Sync||{enabled:false};
const DATA_KEY="eadesk.data.v1",SET_KEY="eadesk.settings.v1",LOCAL_ONLY_KEY="eadesk.localonly";
let db=null,sample=null,downloads=true,canWrite=true,loaded=false;
let mode="local",cloudUser=null,syncState={online:navigator.onLine,pending:false},localData=null;
let settings={remind:true,daysBefore:1,hour:8,minutesBefore:30,backupEvery:7,lastBackup:""};
let view=(()=>{try{return localStorage.getItem("eadesk.view")||"overview"}catch(e){return"overview"}})();
let editing=null,editingAction=null,filters={q:"",month:todayISO().slice(0,7),range:"upcoming"},confirmDel=null;
let tl={span:"3",area:"all",open:true};
const DEVICE=N.platform==="android"?"phone":N.platform==="windows"?"computer":"device";

async function kvGet(k){try{if(N.isNative){const{value}=await N.Preferences.get({key:k});return value}return localStorage.getItem(k)}catch(e){return null}}
async function kvSet(k,v){try{if(N.isNative)await N.Preferences.set({key:k,value:v});else localStorage.setItem(k,v);return true}catch(e){return false}}
async function persist(){
  if(mode==="cloud"){scheduleReminders();return true}
  const ok=await kvSet(DATA_KEY,JSON.stringify({app:"executive-desk",version:1,saved:new Date().toISOString(),data:store}));if(!ok)flash("Could not save to this "+DEVICE+"'s storage.");scheduleReminders();return ok}
async function saveSettings(){await kvSet(SET_KEY,JSON.stringify(settings));scheduleReminders()}
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const COLLS=()=>Object.keys(store);
const syncErr=e=>{console.warn(e);flash(e&&e.code==="permission-denied"?"The online database refused this change. Check the database rules.":"A change could not be uploaded yet. It is kept on this "+DEVICE+".")};

async function boot(){
  renderNav();render();
  try{const raw=await kvGet(DATA_KEY);if(raw){localData=JSON.parse(raw).data||{};Object.keys(store).forEach(k=>{if(Array.isArray(localData[k]))store[k]=localData[k]})}}catch(e){flash("Saved data could not be read.")}
  try{const s=await kvGet(SET_KEY);if(s)settings={...settings,...JSON.parse(s)}}catch(e){}
  const localOnly=(await kvGet(LOCAL_ONLY_KEY))==="1";
  if(S.enabled&&!localOnly){
    cloudWired=true;S.onStatus(s=>{syncState=s;const el=$("#syncState");if(el)el.innerHTML=syncBadge();if(view==="settings")refreshSettingsStatus()});
    S.onAuth(u=>{cloudUser=u;if(u)startCloud();else{mode="signin";loaded=true;render()}});
  }else{loaded=true;render()}
  if(N.isNative){
    N.App.addListener("backButton",()=>{if(editing||editingAction){editing=null;editingAction=null;render()}else if(view!=="overview")go("overview");else N.App.exitApp()});
    N.LocalNotifications.addListener("localNotificationActionPerformed",e=>{const v=e?.notification?.extra?.view;if(v)go(v)});
    N.App.addListener("resume",()=>render());
  }
  if(N.isDesktop)startDesktopReminders();
  scheduleReminders();
}
function startCloud(){
  mode="cloud";loaded=false;COLLS().forEach(k=>store[k]=[]);render();
  const seen=new Set();
  S.subscribe(COLLS(),(name,recs)=>{store[name]=recs;seen.add(name);
    if(!loaded&&seen.size===COLLS().length){loaded=true;migrateLocal()}
    if(loaded){scheduleReminders();if(!document.activeElement||!document.activeElement.closest(".panel"))render();else{renderNav();refreshLists()}}
  },(name,e)=>{loaded=true;render();flash(e&&e.code==="permission-denied"?"This account is not allowed to read the online records.":"Could not read records: "+(e&&e.message||e))});
}
// First sign-in on a device that already holds records: upload any the cloud doesn't have yet.
async function migrateLocal(){
  if(!localData||!cloudUser)return;const flag="eadesk.migrated."+cloudUser.uid;if((await kvGet(flag))==="1")return;
  const items=[];COLLS().forEach(k=>(localData[k]||[]).forEach(r=>{if(r&&r._id&&!store[k].some(x=>x._id===r._id))items.push({name:k,id:r._id,obj:r})}));
  await kvSet(flag,"1");
  if(items.length){S.putMany(items).catch(syncErr);flash(`Added ${items.length} record${items.length>1?"s":""} from this ${DEVICE} to the online desk.`)}
}
async function save(coll,obj,id){
  const clean={};Object.entries(obj).forEach(([k,v])=>{if(!k.startsWith("_"))clean[k]=v});
  clean.updated=new Date().toISOString();
  if(id){const i=store[coll].findIndex(r=>r._id===id);if(i<0)return false;clean.created=store[coll][i].created||clean.updated;store[coll][i]={...clean,_id:id}}
  else{clean.created=clean.updated;id=newId();store[coll].push({...clean,_id:id})}
  if(mode==="cloud")S.set(coll,id,clean).catch(syncErr);
  const ok=await persist();render();return ok;
}
async function remove(coll,id){
  store[coll]=store[coll].filter(r=>r._id!==id);
  const touched=[];if(coll==="meetings")store.actions.forEach(a=>{if(a.meeting===id){a.meeting="";touched.push(a)}});
  if(mode==="cloud"){S.remove(coll,id).catch(syncErr);touched.forEach(a=>S.set("actions",a._id,a).catch(syncErr))}
  await persist();render();
}
function syncBadge(){
  if(mode!=="cloud")return S.enabled?`<span class="pill">On this ${DEVICE} only</span>`:"";
  if(!syncState.online)return`<span class="pill warn" title="Changes are kept on this ${DEVICE} and upload when back online">Offline${syncState.pending?" · changes waiting":""}</span>`;
  return syncState.pending?`<span class="pill info">Syncing…</span>`:`<span class="pill ok">Synced</span>`;
}
function signInHTML(){
  return `<div class="top"><div><div class="eyebrow">Executive Desk</div><h1>Sign in</h1><p class="lede">Sign in with your desk account so this ${DEVICE} shares the same records as your other devices. Records stay available offline.</p></div></div>
  <section class="panel" style="max-width:460px"><div class="form" style="grid-template-columns:1fr">
   <label>Email<input id="siEmail" type="email" autocomplete="username" inputmode="email"></label>
   <label>Password<input id="siPw" type="password" autocomplete="current-password"></label></div>
   <div class="formbar"><button class="btn primary" id="siGo">Sign in</button><button class="btn ghost" id="siReset">Forgot password</button><span class="msg" id="siMsg"></span></div></section>
  <p class="small" style="max-width:460px">No internet right now, or no account yet? <button class="btn sm ghost" id="siLocal">Use on this ${DEVICE} only</button><br>You can sign in later from Settings &amp; sync; records kept on this ${DEVICE} are then added to the online desk.</p>`;
}
function wireSignIn(){
  const msg=t=>$("#siMsg").textContent=t;
  $("#siGo").onclick=async()=>{const e=$("#siEmail").value.trim(),p=$("#siPw").value;if(!e||!p)return msg("Enter your email and password.");
    $("#siGo").disabled=true;msg("Signing in…");
    try{await S.signIn(e,p)}catch(err){$("#siGo").disabled=false;const c=err&&err.code||"";
      msg(/invalid-credential|wrong-password|user-not-found|invalid-email/.test(c)?"Email or password is not correct.":/network/.test(c)?"No internet connection. Connect and try again.":/too-many/.test(c)?"Too many attempts. Wait a few minutes.":"Could not sign in ("+c+").")}};
  $("#siPw").onkeydown=e=>{if(e.key==="Enter")$("#siGo").click()};
  $("#siReset").onclick=async()=>{const e=$("#siEmail").value.trim();if(!e)return msg("Type your email first.");try{await S.resetPassword(e);msg("A reset link was sent to "+e+".")}catch(err){msg("Could not send the reset email.")}};
  $("#siLocal").onclick=async()=>{await kvSet(LOCAL_ONLY_KEY,"1");mode="local";loaded=true;Object.keys(store).forEach(k=>store[k]=Array.isArray(localData?.[k])?localData[k]:[]);render()};
}
let cloudWired=false;
async function enableCloud(){ // from Settings, after choosing "this device only"
  await kvSet(LOCAL_ONLY_KEY,"0");localData=JSON.parse(JSON.stringify(store));
  if(cloudWired){mode="signin";render();return}
  cloudWired=true;S.onStatus(st=>{syncState=st;const el=$("#syncState");if(el)el.innerHTML=syncBadge()});
  S.onAuth(u=>{cloudUser=u;if(u)startCloud();else{mode="signin";loaded=true;render()}});
}
async function doSignOut(){
  if(!(await ask("Sign out on this "+DEVICE+"? Records stay safe online; sign in again to see them.")))return;
  await S.signOut();mode="signin";COLLS().forEach(k=>store[k]=[]);scheduleReminders();render();
}
async function ask(text){if(N.isDesktop){try{return await N.Desktop.dialog.ask(text,{title:"Executive Desk",kind:"warning"})}catch(e){}}return confirm(text)}
let flashMsg="",flashT=null;function flash(m){flashMsg=m;let el=document.querySelector(".toast");if(!el){el=document.createElement("div");el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)}el.textContent=m;el.hidden=false;clearTimeout(flashT);flashT=setTimeout(()=>{el.hidden=true;flashMsg=""},3500)}

/* ---------- rendering ---------- */
function badgeFor(t){const rs=store[t.id];if(t.id==="diary"){t.prep(rs);return rs.filter(r=>r._clash&&r.date>=todayISO()).length}
  if(t.id==="meetings")return store.actions.filter(a=>a.status!=="Done"&&a.due&&a.due<todayISO()).length;
  return t.flag?rs.filter(t.flag).length:0}
function renderNav(){
  const ss=$("#syncState");if(ss)ss.innerHTML=syncBadge();
  const nav=$("#nav");
  nav.innerHTML=`<button data-v="overview" aria-current="${view==="overview"}"><span class="ico">◆</span>Overview</button><button data-v="timeline" aria-current="${view==="timeline"}"><span class="ico">▤</span>Timeline${(()=>{const n=timelineItems().filter(i=>i.cls==="bad").length;return n?`<span class="badge" title="Overdue">${n}</span>`:""})()}</button><div class="sep"></div>`+
   TOOLS.map(t=>{const b=badgeFor(t);return`<button data-v="${t.id}" aria-current="${view===t.id}"><span class="num">${t.num}</span><span>${esc(t.nav)}</span>${b?`<span class="badge" title="Needs attention">${b}</span>`:""}</button>`}).join("")+`<div class="sep"></div><button data-v="settings" aria-current="${view==="settings"}"><span class="ico">⚙</span>Settings & sync${backupDue()?`<span class="badge" title="Backup due">!</span>`:""}</button>`;
  nav.querySelectorAll("button").forEach(b=>b.onclick=()=>go(b.dataset.v));
}
function go(v){view=v;editing=null;editingAction=null;confirmDel=null;filters.q="";try{localStorage.setItem("eadesk.view",v)}catch(e){}renderNav();render();window.scrollTo(0,0)}

function render(){
  renderNav();
  const m=$("#main");
  document.body.classList.toggle("signin",mode==="signin");
  if(mode==="signin"){m.innerHTML=signInHTML();wireSignIn();return}
  if(view==="overview"){m.innerHTML=overviewHTML();m.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));return}
  if(view==="timeline"){m.innerHTML=timelineHTML();wireTimeline();return}
  if(view==="settings"){m.innerHTML=settingsHTML();wireSettings();return}
  const t=TOOLS.find(x=>x.id===view);if(!t){view="overview";return render()}m.innerHTML=toolHTML(t);wireTool(t);
}
function refreshLists(){const t=TOOLS.find(x=>x.id===view);if(!t)return;const w=$("#listwrap");if(w){w.innerHTML=listHTML(t);wireList(t)}const c=$("#chips");if(c)c.innerHTML=chipsHTML(t)}

function notices(){let h="";
  if(loaded&&N.platform==="web"&&mode!=="cloud")h+=`<div class="notice">Preview mode: records are saved in this browser only. Install the Android or Windows app for reminders.</div>`;
  if(mode==="cloud"&&!syncState.online)h+=`<div class="notice warn">You are offline. Changes are saved on this ${DEVICE} and will upload automatically when the internet is back.</div>`;
  if(loaded&&backupDue()&&view==="overview")h+=`<div class="notice warn">Your last backup was ${settings.lastBackup?esc(fmtD(settings.lastBackup.slice(0,10))):"never made"}. <button class="btn sm" data-go="settings">Back up now</button></div>`;
  return h}

function overviewHTML(){
  const t=todayISO(),wk=addDays(t,7);TOOLS[5].prep(store.diary);
  const items=[];
  store.commitments.filter(r=>r.status!=="Done"&&r.due&&r.due<=wk).forEach(r=>items.push([r.due,"Commitment",r.commitment+" — "+r.org,r.due<t?"bad":"warn","commitments"]));
  store.diary.filter(r=>r.date>=t&&r.date<=wk).forEach(r=>items.push([r.date,"Diary "+r.start,r.title,r._clash?"bad":"",  "diary"]));
  store.travel.filter(r=>r.status!=="Completed"&&r.depart>=t&&r.depart<=addDays(t,14)).forEach(r=>items.push([r.depart,"Travel",r.trip+" → "+r.dest+" ("+ready(r)+"% ready)",ready(r)<100?"warn":"","travel"]));
  store.meetings.filter(r=>r.date>=t&&r.date<=wk).forEach(r=>items.push([r.date,"Meeting "+(r.time||""),r.title,"","meetings"]));
  store.actions.filter(a=>a.status!=="Done"&&a.due&&a.due<=wk).forEach(a=>items.push([a.due,"Action",a.action+(a.owner?" ("+a.owner+")":""),a.due<t?"bad":"warn","meetings"]));
  store.research.filter(r=>r.status!=="Delivered"&&r.deadline&&r.deadline<=wk).forEach(r=>items.push([r.deadline,"Briefing due",r.topic,r.deadline<t?"bad":"warn","research"]));
  items.sort((a,b)=>a[0].localeCompare(b[0]));
  const total=Object.values(store).reduce((s,a)=>s+a.length,0);
  const hello=new Date().getHours()<12?"Good morning":new Date().getHours()<17?"Good afternoon":"Good evening";
  return `${notices()}<div class="top"><div><div class="eyebrow">${esc(new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"}))}</div>
   <h1>${hello}, Lorna</h1><p class="lede">What needs your attention across the Office of the MD this week, drawn from all eight tools.</p></div><div class="actions"><button class="btn" data-go="timeline">Open timeline</button></div></div>
   ${!loaded?`<div class="empty"><b>Loading your desk…</b></div>`:total===0?`<div class="panel empty"><b>Your desk is empty</b>Pick any tool on the left and add the first record. Upcoming deadlines, meetings, trips and clashes will gather here.</div>`:""}
   <div class="ovgrid">${TOOLS.map(t=>{const rs=store[t.id];if(t.prep)t.prep(rs);const c=t.chips(rs).slice(0,2);return`<button class="ovcard" data-go="${t.id}"><span class="h"><span class="num">${t.num}</span>${esc(t.nav)}</span><span class="s">${c.map(x=>`<b>${x[0]}</b> ${esc(x[1]).toLowerCase()}`).join(" · ")}</span></button>`}).join("")}</div>
   <div class="panel" style="padding:0"><h2 style="padding:16px 16px 0">Next 7 days</h2>${items.length?`<ul class="agenda">${items.map(i=>`<li><span class="d">${esc(fmtD(i[0]))}</span><span><b>${esc(i[1])}</b> · ${esc(i[2])}</span><span><button class="btn sm ghost" data-go="${i[4]}">Open</button>${i[3]?` <span class="pill ${i[3]}">${i[3]==="bad"?"Act now":"Soon"}</span>`:""}</span></li>`).join("")}</ul>`:`<div class="empty">Nothing due in the next 7 days.</div>`}</div>`;
}

function chipsHTML(t){const rs=filtered(t);if(t.prep)t.prep(store[t.id]);return t.chips(rs).map(c=>`<div class="chip ${c[2]||""}"><div class="v">${c[0]}</div><div class="l">${esc(c[1])}</div></div>`).join("")}
function toolHTML(t){
  const rec=editing&&editing!=="new"?store[t.id].find(r=>r._id===editing):null;
  return `${notices()}<div class="top"><div><div class="eyebrow">TOR area ${t.num} of 8</div><h1>${esc(t.title)}</h1><p class="lede">${esc(t.lede)}</p></div>
   <div class="actions">${canWrite?`<button class="btn primary" id="addBtn">${editing?"Close form":"Add record"}</button>`:""}<button class="btn" id="csvBtn">Export CSV</button></div></div>
   ${t.notice?`<div class="notice">${esc(t.notice)}</div>`:""}
   <div class="chips" id="chips">${chipsHTML(t)}</div>
   ${editing?formHTML(t,rec):""}
   <div class="toolbar">${t.search||true?`<input id="q" type="search" placeholder="Search ${esc(t.nav.toLowerCase())}…" value="${esc(filters.q)}" aria-label="Search">`:""}
    ${t.monthFilter?`<input id="month" type="month" value="${esc(filters.month)}" aria-label="Month"><button class="btn sm ghost" id="allMonths">All months</button>`:""}
    ${t.rangeFilter?`<select id="range" aria-label="Show"><option value="upcoming"${filters.range==="upcoming"?" selected":""}>Today onwards</option><option value="week"${filters.range==="week"?" selected":""}>Next 7 days</option><option value="all"${filters.range==="all"?" selected":""}>All entries</option></select>`:""}</div>
   <div id="listwrap">${listHTML(t)}</div>
   ${t.id==="meetings"?actionsHTML():""}`;
}
function fieldHTML(f,v,prefix="f"){
  const id=prefix+"_"+f.k;const val=v??(f.def==="@today"?todayISO():f.def??(f.type==="checks"?[]:""));
  let inp;
  if(f.type==="select")inp=`<select id="${id}">${f.opts.map(o=>`<option${o===val?" selected":""}>${esc(o)}</option>`).join("")}</select>`;
  else if(f.type==="textarea")inp=`<textarea id="${id}">${esc(val)}</textarea>`;
  else if(f.type==="checks")return`<div class="${f.wide?"wide":""}"><label style="margin-bottom:6px">${esc(f.label)}</label><div class="checks">${f.opts.map((o,i)=>`<label><input type="checkbox" id="${id}_${i}" data-o="${esc(o)}"${(val||[]).includes(o)?" checked":""}> ${esc(o)}</label>`).join("")}</div></div>`;
  else inp=`<input id="${id}" type="${f.type||"text"}"${f.type==="number"?' step="0.01" min="0" inputmode="decimal"':""} value="${esc(val)}">`;
  return`<label class="${f.wide?"wide":""}">${esc(f.label)}${f.req?" *":""}${inp}</label>`;
}
function readFields(fields,prefix="f"){const o={};for(const f of fields){if(f.type==="checks"){o[f.k]=[...document.querySelectorAll(`[id^="${prefix}_${f.k}_"]`)].filter(c=>c.checked).map(c=>c.dataset.o)}else{const el=$("#"+prefix+"_"+f.k);let v=el?el.value.trim():"";if(f.type==="number")v=v===""?"":Number(v);o[f.k]=v}}return o}
function formHTML(t,rec){
  return `<section class="panel"><h2>${rec?"Edit record":"New record"}</h2><div class="form">${t.fields.map(f=>fieldHTML(f,rec?rec[f.k]:undefined)).join("")}</div>
   <div id="aiOut"></div>
   <div class="formbar"><button class="btn primary" id="saveBtn">${rec?"Save changes":"Save"}</button><button class="btn ghost" id="cancelBtn">Cancel</button>
   ${t.ai&&sample?`<button class="btn ai" id="aiBtn">${esc(t.ai.label)} with Claude</button>`:""}<span class="msg" id="formMsg"></span></div></section>`;
}
function filtered(t){let rs=[...store[t.id]];if(t.prep)t.prep(store[t.id]);
  if(filters.q){const q=filters.q.toLowerCase();rs=rs.filter(r=>Object.entries(r).some(([k,v])=>!k.startsWith("_")&&String(Array.isArray(v)?v.join(" "):v).toLowerCase().includes(q)))}
  if(t.monthFilter&&filters.month)rs=rs.filter(r=>String(r.date||"").startsWith(filters.month));
  if(t.rangeFilter&&filters.range!=="all"){const d=todayISO();rs=rs.filter(r=>r.date>=d&&(filters.range!=="week"||r.date<=addDays(d,7)))}
  return rs.sort(t.sort)}
function listHTML(t){
  const rs=filtered(t);
  if(!loaded)return`<div class="tablewrap"><div class="empty"><b>Loading records…</b></div></div>`;
  if(!rs.length)return`<div class="tablewrap"><div class="empty"><b>${store[t.id].length?"No records match":"No records yet"}</b>${store[t.id].length?"Clear the search or change the filter to see more.":canWrite?"Use “Add record” to start this register.":""}</div></div>`;
  return`<div class="tablewrap"><table><thead><tr>${t.cols.map(c=>`<th>${esc(c[0])}</th>`).join("")}<th><span hidden>Actions</span></th></tr></thead><tbody>${rs.map(r=>`<tr class="${t.flag&&t.flag(r)?"flag":""}">${t.cols.map(c=>`<td class="${c[2]||""}" data-l="${esc(c[0])}">${c[1](r)}</td>`).join("")}<td class="rowact">${canWrite?(confirmDel===r._id?`<button class="btn sm danger" data-del="${r._id}">Confirm delete</button> <button class="btn sm ghost" data-nodel>Keep</button>`:`<button class="btn sm" data-edit="${r._id}">Edit</button> <button class="btn sm ghost danger" data-ask="${r._id}" aria-label="Delete">Delete</button>`):""}</td></tr>`).join("")}</tbody></table></div>`;
}
function wireList(t){
  document.querySelectorAll("#listwrap [data-edit]").forEach(b=>b.onclick=()=>{editing=b.dataset.edit;render();$(".panel")?.scrollIntoView({behavior:"smooth",block:"start"})});
  document.querySelectorAll("#listwrap [data-ask]").forEach(b=>b.onclick=()=>{confirmDel=b.dataset.ask;refreshLists()});
  document.querySelectorAll("#listwrap [data-nodel]").forEach(b=>b.onclick=()=>{confirmDel=null;refreshLists()});
  document.querySelectorAll("#listwrap [data-del]").forEach(b=>b.onclick=async()=>{const id=b.dataset.del;confirmDel=null;if(editing===id)editing=null;await remove(t.id,id)});
}
function wireTool(t){
  $("#addBtn")&&($("#addBtn").onclick=()=>{editing=editing?null:"new";render()});
  $("#csvBtn")&&($("#csvBtn").onclick=()=>exportCSV(t));
  const q=$("#q");if(q)q.oninput=()=>{filters.q=q.value;refreshLists()};
  const mo=$("#month");if(mo)mo.onchange=()=>{filters.month=mo.value;refreshLists()};
  $("#allMonths")&&($("#allMonths").onclick=()=>{filters.month="";$("#month").value="";refreshLists()});
  const rg=$("#range");if(rg)rg.onchange=()=>{filters.range=rg.value;refreshLists()};
  wireList(t);
  if(editing){
    $("#cancelBtn").onclick=()=>{editing=null;render()};
    $("#saveBtn").onclick=async()=>{let o=readFields(t.fields);const miss=t.fields.filter(f=>f.req&&!o[f.k]);if(miss.length){$("#formMsg").textContent="Please fill in: "+miss.map(f=>f.label).join(", ");return}
      if(t.beforeSave)o=t.beforeSave(o,store[t.id]);const id=editing==="new"?null:editing;$("#saveBtn").disabled=true;const ok=await save(t.id,o,id);if(ok){editing=null;render()}else $("#saveBtn").disabled=false};
    if($("#aiBtn"))$("#aiBtn").onclick=()=>runAI(t);
  }
  if(t.id==="meetings")wireActions();
}

/* ---------- meeting action log ---------- */
function actionsHTML(){
  const meets=store.meetings;const acts=[...store.actions].sort((a,b)=>(a.status==="Done")-(b.status==="Done")||String(a.due||"9").localeCompare(String(b.due||"9")));
  const rec=editingAction&&editingAction!=="new"?store.actions.find(a=>a._id===editingAction):null;const t=todayISO();
  return `<div class="top" style="margin-top:26px"><div><div class="eyebrow">Follow-up</div><h1 style="font-size:20px">Action log</h1><p class="lede">Every action agreed in a meeting, with an owner and a due date, until it is closed.</p></div>
   ${canWrite?`<div class="actions"><button class="btn" id="addAct">${editingAction?"Close form":"Add action"}</button></div>`:""}</div>
   ${editingAction?`<section class="panel"><div class="form">${ACTION_FIELDS.map(f=>fieldHTML(f,rec?rec[f.k]:undefined,"a")).join("")}<label class="wide">From meeting<select id="a_meeting"><option value="">—</option>${meets.map(m=>`<option value="${m._id}"${rec&&rec.meeting===m._id?" selected":""}>${esc(m.title)} (${esc(fmtD(m.date))})</option>`).join("")}</select></label></div>
     <div class="formbar"><button class="btn primary" id="saveAct">Save action</button><button class="btn ghost" id="cancelAct">Cancel</button><span class="msg" id="actMsg"></span></div></section>`:""}
   <div class="tablewrap">${acts.length?`<table><thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th><span hidden>Actions</span></th></tr></thead><tbody>${acts.map(a=>{const m=meets.find(x=>x._id===a.meeting);return`<tr class="${a.status!=="Done"&&a.due&&a.due<t?"flag":""}"><td data-l="Action"><b>${esc(a.action)}</b>${m?`<span class="sub">${esc(m.title)}</span>`:""}</td><td data-l="Owner">${esc(a.owner)||"—"}</td><td data-l="Due">${dueCell(a.due,a.status==="Done")}</td><td data-l="Status">${statusPill(a.status)}</td><td class="rowact">${canWrite?`${a.status!=="Done"?`<button class="btn sm" data-done="${a._id}">Mark done</button> `:""}<button class="btn sm ghost" data-aedit="${a._id}">Edit</button> ${confirmDel===a._id?`<button class="btn sm danger" data-adel="${a._id}">Confirm delete</button>`:`<button class="btn sm ghost danger" data-aask="${a._id}">Delete</button>`}`:""}</td></tr>`}).join("")}</tbody></table>`:`<div class="empty"><b>No actions yet</b>Use “Add action” to record what was agreed, who owns it and when it is due.</div>`}</div>`;
}
function wireActions(){
  $("#addAct")&&($("#addAct").onclick=()=>{editingAction=editingAction?null:"new";render()});
  if(editingAction){$("#cancelAct").onclick=()=>{editingAction=null;render()};
    $("#saveAct").onclick=async()=>{const o=readFields(ACTION_FIELDS,"a");o.meeting=$("#a_meeting").value;if(!o.action){$("#actMsg").textContent="Please describe the action.";return}
      const ok=await save("actions",o,editingAction==="new"?null:editingAction);if(ok){editingAction=null;render()}}}
  document.querySelectorAll("[data-done]").forEach(b=>b.onclick=()=>{const a=store.actions.find(x=>x._id===b.dataset.done);save("actions",{...a,status:"Done"},a._id)});
  document.querySelectorAll("[data-aedit]").forEach(b=>b.onclick=()=>{editingAction=b.dataset.aedit;render()});
  document.querySelectorAll("[data-aask]").forEach(b=>b.onclick=()=>{confirmDel=b.dataset.aask;render()});
  document.querySelectorAll("[data-adel]").forEach(b=>b.onclick=async()=>{confirmDel=null;await remove("actions",b.dataset.adel)});
}

function runAI(){}

/* ---------- CSV export ---------- */
async function exportCSV(t){
  const rs=filtered(t);const fs=t.fields;const cell=v=>`"${String(Array.isArray(v)?v.join("; "):v??"").replace(/"/g,'""')}"`;
  let csv=fs.map(f=>cell(f.label)).join(",")+"\n"+rs.map(r=>fs.map(f=>cell(r[f.k])).join(",")).join("\n");
  if(t.id==="meetings"){csv+="\n\nAction log\n"+ACTION_FIELDS.map(f=>cell(f.label)).join(",")+","+cell("Meeting")+"\n"+store.actions.map(a=>ACTION_FIELDS.map(f=>cell(a[f.k])).join(",")+","+cell(store.meetings.find(m=>m._id===a.meeting)?.title||"")).join("\n")}
  await exportFile(`${t.id}-${todayISO()}.csv`,"\ufeff"+csv,"text/csv");
}
/* ---------- files: export / backup / restore ---------- */
async function exportFile(name,text,mime){
  if(N.isNative){
    try{const w=await N.Filesystem.writeFile({path:name,data:text,directory:N.Directory.Cache,encoding:N.Encoding.UTF8});
      await N.Share.share({title:name,dialogTitle:"Save or send "+name,files:[w.uri]});return true}
    catch(e){if(!/cancel/i.test(String(e&&e.message)))flash("The file could not be shared.");return false}
  }
  if(N.isDesktop){
    try{const ext=name.split(".").pop();const path=await N.Desktop.dialog.save({defaultPath:name,filters:[{name:ext.toUpperCase()+" file",extensions:[ext]}]});
      if(!path)return false;await N.Desktop.saveText(path,text);flash("Saved to "+path);return true}
    catch(e){flash("The file could not be saved.");return false}
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);return true;
}
const recordCount=()=>Object.values(store).reduce((s,a)=>s+a.length,0);
function backupDue(){if(!loaded||!recordCount()||!settings.backupEvery)return false;if(!settings.lastBackup)return true;return daysTo(settings.lastBackup.slice(0,10))<=-settings.backupEvery}
async function doBackup(){
  const payload=JSON.stringify({app:"executive-desk",version:1,saved:new Date().toISOString(),records:recordCount(),data:store,settings},null,1);
  const ok=await exportFile(`executive-desk-backup-${todayISO()}.json`,payload,"application/json");
  if(ok){settings.lastBackup=new Date().toISOString();await saveSettings();flash("Backup file created. Keep it somewhere safe, such as Google Drive or email.");render()}
}
function startRestore(){const f=$("#restoreFile");f.value="";f.onchange=async()=>{const file=f.files[0];if(!file)return;
  try{const j=JSON.parse(await file.text());if(j.app!=="executive-desk"||!j.data)throw 0;
    const n=Object.values(j.data).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);
    const where=mode==="cloud"?"the online desk (all your devices)":"this "+DEVICE;
    if(!(await ask(`Replace ALL records on ${where} with the backup from ${fmtD(String(j.saved||"").slice(0,10))} (${n} records)?\n\nRecords added since that backup will be lost.`)))return;
    if(mode==="cloud"){
      const items=[];COLLS().forEach(k=>{const keep=new Set((j.data[k]||[]).map(r=>r._id));store[k].forEach(r=>{if(!keep.has(r._id))items.push({name:k,id:r._id,del:true})});(j.data[k]||[]).forEach(r=>{if(r&&r._id)items.push({name:k,id:r._id,obj:r})})});
      S.putMany(items).catch(syncErr);
    }
    Object.keys(store).forEach(k=>store[k]=Array.isArray(j.data[k])?j.data[k]:[]);
    await persist();flash(`Restored ${n} records.`);go("overview");
  }catch(e){flash("That file is not an Executive Desk backup.")}};f.click()}

/* ---------- timeline ---------- */
const AREA={commitments:"Commitments",research:"Research & briefings",travel:"Travel",meetings:"Meetings",actions:"Meeting actions",social:"Social media",diary:"Diary"};
const PROG={commitments:{Open:0,"Followed up":40,"Awaiting reply":70,Done:100},research:{Requested:0,Researching:35,"Brief drafted":75,Delivered:100},
  social:{Idea:10,Drafted:40,"Awaiting MD approval":60,Approved:85,Posted:100},actions:{Open:0,"In progress":50,Done:100}};
const d10=v=>String(v||"").slice(0,10);
function timelineItems(){
  const t=todayISO(),out=[];
  const push=(area,r,title,sub,start,end,done,prog,point,time)=>{end=d10(end)||d10(start);start=d10(start)||end;if(!end)return;if(start>end)start=end;
    let cls=done?"ok":end<t?"bad":daysTo(end)<=7?"warn":"info";if(point&&!done&&end<t)cls=area==="meetings"?"warn":"ok";
    out.push({area,id:r._id,title,sub,start,end,done,prog:Math.max(0,Math.min(100,prog||0)),point,time,cls})};
  store.commitments.forEach(r=>push("commitments",r,r.commitment,r.org,r.start||r.created,r.due,r.status==="Done",PROG.commitments[r.status]));
  store.research.forEach(r=>push("research",r,r.topic,"Research brief",r.requested||r.created,r.deadline,r.status==="Delivered",PROG.research[r.status]));
  store.travel.forEach(r=>{const done=r.status==="Completed";push("travel",r,r.trip,r.dest,r.depart,r.ret||r.depart,done,done?100:ready(r));const it=out[out.length-1];if(it&&it.id===r._id&&!done&&r.depart&&daysTo(r.depart)<=3&&ready(r)<100)it.cls="bad"});
  store.meetings.forEach(r=>push("meetings",r,r.title,r.type,r.date,r.date,!!r.minutes,r.minutes?100:Math.round((r.pack||[]).length/6*100),true,r.time));
  store.actions.forEach(r=>{const m=store.meetings.find(x=>x._id===r.meeting);push("actions",r,r.action,(r.owner||"No owner")+(m?" · "+m.title:""),r.start||r.created,r.due,r.status==="Done",PROG.actions[r.status])});
  store.social.forEach(r=>push("social",r,r.topic,r.platform,r.date,r.date,r.status==="Posted",PROG.social[r.status],true));
  store.diary.forEach(r=>push("diary",r,r.title,r.where||r.type,r.date,r.date,r.date<t,0,true,r.start));
  return out;
}
function timelineHTML(){
  const t=todayISO(),months=Number(tl.span);
  const from=addDays(t,-Math.round(months*30*0.2)),to=addDays(from,months*30);
  const tot=(new Date(to)-new Date(from))/864e5;const pct=iso=>Math.max(0,Math.min(100,((new Date(iso+"T00:00:00")-new Date(from+"T00:00:00"))/864e5)/tot*100));
  let items=timelineItems().filter(i=>i.end>=from&&i.start<=to);
  if(tl.area!=="all")items=items.filter(i=>i.area===tl.area);
  if(tl.open)items=items.filter(i=>!i.done);
  const all=timelineItems();
  const chips=[[all.filter(i=>!i.done&&!i.point).length,"Open tasks with dates"],[all.filter(i=>i.cls==="bad").length,"Overdue / at risk","bad"],[all.filter(i=>!i.done&&i.end>=t&&daysTo(i.end)<=7).length,"Due in 7 days","warn"],[all.filter(i=>i.done&&!i.point).length,"Completed","ok"]];
  // month ticks
  const ticks=[];let m=new Date(from+"T00:00:00");m.setDate(1);m.setMonth(m.getMonth()+1);
  while(m<=new Date(to+"T00:00:00")){const iso=`${m.getFullYear()}-${String(m.getMonth()+1).padStart(2,"0")}-01`;ticks.push(iso);m.setMonth(m.getMonth()+1)}
  const grid=ticks.map(i=>`<div class="tlgrid" style="left:${pct(i)}%"></div>`).join("");
  const today=`<div class="tltoday" style="left:${pct(t)}%"></div>`;
  const groups={};items.forEach(i=>(groups[i.area]=groups[i.area]||[]).push(i));
  const rows=Object.keys(AREA).filter(a=>groups[a]).map(a=>{
    const rs=groups[a].sort((x,y)=>x.start.localeCompare(y.start)||x.end.localeCompare(y.end));
    return `<div class="tlrow grp"><div class="tllab">${esc(AREA[a])} · ${rs.length}</div><div class="tltrack">${grid}${today}</div></div>`+rs.map(i=>{
      const l=pct(i.start),r=pct(addDays(i.end,1)),w=Math.max(r-l,0.8);
      const dates=i.start===i.end?fmtD(i.end)+(i.time?" "+i.time:""):fmtD(i.start)+" → "+fmtD(i.end);
      const tip=`${i.title} — ${dates}${i.point?"":` — ${i.prog}% done`}`;
      const bar=i.point?`<button class="tlitem pt ${i.cls}" style="left:calc(${l}% - 7px)" data-tl="${i.area}|${i.id}" title="${esc(tip)}" aria-label="${esc(tip)}"></button>`
        :`<button class="tlitem ${i.cls}" style="left:${l}%;width:${w}%" data-tl="${i.area}|${i.id}" title="${esc(tip)}" aria-label="${esc(tip)}"><i class="fill" style="width:${100-i.prog}%"></i><span>${i.prog}%</span></button>`;
      return `<div class="tlrow"><div class="tllab" data-tl="${i.area}|${i.id}"><b>${esc(i.title)}</b><small>${esc(dates)}${i.sub?" · "+esc(i.sub):""}</small></div><div class="tltrack">${grid}${today}${bar}</div></div>`}).join("")}).join("");
  return `${notices()}<div class="top"><div><div class="eyebrow">All areas</div><h1>Timeline</h1><p class="lede">Every dated task on one chart: bars run from start to due date, the solid part shows progress, and colour shows whether it is on track.</p></div></div>
   <div class="chips">${chips.map(c=>`<div class="chip ${c[2]||""}"><div class="v">${c[0]}</div><div class="l">${esc(c[1])}</div></div>`).join("")}</div>
   <div class="tlbar"><select id="tlSpan" aria-label="Period">${[["1","1 month"],["3","3 months"],["6","6 months"],["12","12 months"]].map(([v,l])=>`<option value="${v}"${tl.span===v?" selected":""}>${l}</option>`).join("")}</select>
    <select id="tlArea" aria-label="Area"><option value="all">All areas</option>${Object.entries(AREA).map(([k,l])=>`<option value="${k}"${tl.area===k?" selected":""}>${esc(l)}</option>`).join("")}</select>
    <label><input type="checkbox" id="tlOpen"${tl.open?" checked":""}> Hide completed</label></div>
   <div class="legend"><span><i style="background:var(--bad)"></i>Overdue / at risk</span><span><i style="background:var(--warn)"></i>Due within 7 days</span><span><i style="background:var(--info)"></i>On track</span><span><i style="background:var(--ok)"></i>Done</span><span>● single-day item (meeting, post, diary)</span></div>
   <div class="tl"><div class="tlin"><div class="tlrow head"><div class="tllab">${esc(fmtD(from))} – ${esc(fmtD(to))}</div><div class="tltrack">${ticks.map(i=>`<div class="tlmonth" style="left:${pct(i)}%">${esc(new Date(i+"T00:00:00").toLocaleDateString(undefined,{month:"short",year:"numeric"}))}</div>`).join("")}<div class="tltoday lbl" style="left:${pct(t)}%"></div></div></div>
   ${rows||`<div class="empty"><b>Nothing to show in this period</b>Add due dates to commitments, research requests, trips, meetings or actions and they will appear here.</div>`}</div></div>
   <p class="small" style="margin-top:10px">Tap any bar or name to open and edit that record. Scroll sideways to see the whole period.</p>`;
}
function wireTimeline(){
  $("#tlSpan").onchange=e=>{tl.span=e.target.value;render()};$("#tlArea").onchange=e=>{tl.area=e.target.value;render()};$("#tlOpen").onchange=e=>{tl.open=e.target.checked;render()};
  document.querySelectorAll("[data-tl]").forEach(b=>b.onclick=()=>{const[a,id]=b.dataset.tl.split("|");
    if(a==="actions"){go("meetings");editingAction=id}else{go(a);editing=id}render();setTimeout(()=>$(".panel")?.scrollIntoView({behavior:"smooth",block:"start"}),50)});
  const tlEl=$(".tl"),today=$(".tltoday.lbl");if(tlEl&&today){const x=today.getBoundingClientRect().left-tlEl.getBoundingClientRect().left;const lw=$(".tlrow.head .tllab").offsetWidth;const want=x-lw-(tlEl.clientWidth-lw)*0.3;if(want>0)tlEl.scrollLeft=want}
}

/* ---------- reminders: Android (scheduled by the phone) and Windows (fired by the running app) ---------- */
let remTimer=null,remCount=0,permState="unknown",exactState="unknown";
function hashId(str){let h=7;for(const c of str)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)%2000000000+1}
function atLocal(iso,hhmm){const[h,m]=(hhmm||`${settings.hour}:00`).split(":").map(Number);const d=new Date(iso+"T00:00:00");d.setHours(h,m||0,0,0);return d}
function buildReminders(pastHours=0){
  const from=new Date(Date.now()-pastHours*36e5),limit=new Date(Date.now()+90*864e5),list=[],hh=String(settings.hour).padStart(2,"0")+":00";
  const add=(key,when,title,body,v)=>{if(when>from&&when<limit)list.push({id:hashId(key),title,body,schedule:{at:when,allowWhileIdle:true},channelId:"desk",smallIcon:"ic_stat_desk",extra:{view:v}})};
  const db=Number(settings.daysBefore)||0;
  timelineItems().filter(i=>!i.done).forEach(i=>{
    const v=i.area==="actions"?"meetings":i.area,lab=AREA[i.area].replace(/s$/,"");
    if(i.time&&(i.area==="meetings"||i.area==="diary")){const at=atLocal(i.end,i.time);add(i.id+"t"+i.end+i.time,new Date(at-settings.minutesBefore*6e4),`${lab} at ${i.time}`,i.title+(i.sub?" · "+i.sub:""),v)}
    if(i.area==="diary"||i.area==="social")return;
    const verb=i.area==="travel"?"departs":i.area==="meetings"?"is on":"is due";
    const day=i.area==="travel"?i.start:i.end;
    if(db>0)add(i.id+"b"+day+db,atLocal(addDays(day,-db),hh),`${lab} ${verb} in ${db} day${db>1?"s":""}`,i.title,v);
    add(i.id+"d"+day,atLocal(day,hh),`${lab} ${verb} today`,i.title,v);
  });
  if(recordCount()&&settings.backupEvery){const base=settings.lastBackup?d10(settings.lastBackup):todayISO();let due=addDays(base,settings.backupEvery);if(due<todayISO())due=addDays(todayISO(),1);add("backup"+due,atLocal(due,hh),"Time to back up your desk","Open Settings & sync and tap “Back up now”.","settings")}
  return list.sort((a,b)=>a.schedule.at-b.schedule.at).slice(0,pastHours?400:60);
}
function scheduleReminders(){clearTimeout(remTimer);remTimer=setTimeout(doSchedule,400)}
async function doSchedule(){
  if(N.isDesktop){remCount=settings.remind?buildReminders().length:0;if(view==="settings")refreshSettingsStatus();return}
  if(!N.isNative)return;const LN=N.LocalNotifications;
  try{
    const pend=await LN.getPending();if(pend.notifications.length)await LN.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
    remCount=0;if(!settings.remind)return;
    let p=await LN.checkPermissions();if(p.display==="prompt"||p.display==="prompt-with-rationale")p=await LN.requestPermissions();permState=p.display;if(p.display!=="granted")return;
    try{exactState=(await LN.checkExactNotificationSetting()).exact_alarm}catch(e){}
    await LN.createChannel({id:"desk",name:"Desk reminders",description:"Due dates, meetings and trips",importance:4,visibility:0,vibration:true});
    const list=buildReminders();if(list.length)await LN.schedule({notifications:list});remCount=list.length;
  }catch(e){console.warn(e)}finally{if(view==="settings")refreshSettingsStatus()}
}
// Windows: the app keeps running in the system tray and checks every 30 seconds. Reminders missed while the
// computer was off are shown when it starts, if they are less than 12 hours old.
const FIRED_KEY="eadesk.fired";
async function desktopNotify(title,body){
  const n=N.Desktop.notify;try{let ok=await n.isPermissionGranted();if(!ok)ok=(await n.requestPermission())==="granted";permState=ok?"granted":"denied";if(ok)n.sendNotification({title,body});return ok}catch(e){console.warn(e);return false}
}
function startDesktopReminders(){
  const tick=async()=>{
    if(!settings.remind||!loaded||mode==="signin")return;
    let fired={};try{fired=JSON.parse(localStorage.getItem(FIRED_KEY)||"{}")}catch(e){}
    const now=Date.now();
    for(const r of buildReminders(12)){if(r.schedule.at.getTime()<=now&&!fired[r.id]){fired[r.id]=now;await desktopNotify(r.title,r.body)}}
    Object.keys(fired).forEach(k=>{if(now-fired[k]>3*864e5)delete fired[k]});
    try{localStorage.setItem(FIRED_KEY,JSON.stringify(fired))}catch(e){}
  };
  setTimeout(tick,8000);setInterval(tick,30000);
}

/* ---------- settings view ---------- */
function settingsHTML(){
  const opt=(v,cur,l)=>`<option value="${v}"${String(cur)===String(v)?" selected":""}>${l}</option>`;
  const syncPanel=!S.enabled?`<section class="panel"><h2>Sync</h2><p class="small">Sync is not set up in this version. Records stay on this ${DEVICE}.</p></section>`
   :mode==="cloud"?`<section class="panel"><h2>Sync</h2><p class="small">Signed in as <b>${esc(cloudUser?.email||"")}</b>. Records are shared with your other devices and kept on this ${DEVICE} for offline use.</p>
     <p class="small" id="syncLine"></p><div class="row2"><button class="btn ghost" id="sOut">Sign out</button></div></section>`
   :`<section class="panel"><h2>Sync</h2><p class="small">This ${DEVICE} is not signed in, so its records are not shared with your other devices.</p><div class="row2"><button class="btn primary" id="sIn">Sign in to sync</button></div></section>`;
  const remNote=N.isDesktop?`<label class="switch" style="margin-top:12px"><input type="checkbox" id="sAuto"> Start Executive Desk when Windows starts (needed for reminders)</label><p class="small">Closing the window keeps the desk running in the system tray (by the clock) so reminders still appear. To quit fully, right-click the tray icon and choose Quit.</p>`:"";
  return `${notices()}<div class="top"><div><div class="eyebrow">This ${DEVICE}</div><h1>Settings & sync</h1><p class="lede">Sync, reminders and backups for this ${DEVICE}. Reminder settings apply to this ${DEVICE} only.</p></div></div>
  <div class="setgrid">
  ${syncPanel}
  <section class="panel"><h2>Reminders</h2>
   <label class="switch"><input type="checkbox" id="sRemind"${settings.remind?" checked":""}> Remind me about due dates, meetings and trips</label>
   <div class="form" style="margin-top:12px">
    <label>Early reminder<select id="sDays">${[0,1,2,3,7].map(d=>opt(d,settings.daysBefore,d?`${d} day${d>1?"s":""} before`:"None (only on the day)")).join("")}</select></label>
    <label>Reminder time<select id="sHour">${[6,7,8,9,10,12,14,17].map(h=>opt(h,settings.hour,String(h).padStart(2,"0")+":00")).join("")}</select></label>
    <label>Meetings and diary<select id="sMins">${[10,15,30,60,120].map(m=>opt(m,settings.minutesBefore,(m<60?m+" minutes":m/60+" hour"+(m>60?"s":""))+" before")).join("")}</select></label>
   </div>${remNote}
   <p class="small" id="remStatus" style="margin-top:12px"></p>
   <div class="row2"><button class="btn" id="sTest">Send a test reminder</button><button class="btn ghost" id="sExact" hidden>Allow on-time alarms</button></div>
  </section>
  <section class="panel"><h2>Backup & restore</h2>
   <p class="small">Last backup: <b>${settings.lastBackup?esc(fmtD(d10(settings.lastBackup))):"never"}</b> · ${recordCount()} records.</p>
   <p class="small">“Back up now” makes one file holding every record, a safety copy that does not depend on the internet or the online account. Keep it on Google Drive, in email or on a USB stick.</p>
   <div class="row2" style="margin-top:8px"><button class="btn primary" id="sBackup">Back up now</button><button class="btn" id="sRestore">Restore from file</button></div>
   <div class="form" style="margin-top:14px"><label>Remind me to back up<select id="sEvery">${[[0,"Never"],[1,"Every day"],[7,"Every week"],[14,"Every 2 weeks"],[30,"Every month"]].map(([v,l])=>opt(v,settings.backupEvery,l)).join("")}</select></label></div>
  </section>
  <section class="panel"><h2>About</h2><p class="small">Executive Desk 2.0 for ${N.platform==="windows"?"Windows":N.platform==="android"?"Android":"the web"} · Office of the MD, CEMMATS. ${mode==="cloud"?"Records are stored in the desk's private Firebase database (Google) and on this "+DEVICE+"; only the signed-in account can read them.":"Records are stored on this "+DEVICE+" only."}</p></section>
  </div>`;
}
function refreshSettingsStatus(){
  const sl=$("#syncLine");if(sl)sl.innerHTML=`Status: ${syncBadge()}`;
  const el=$("#remStatus");if(!el)return;
  if(N.isDesktop)el.textContent=!settings.remind?"Reminders are switched off.":permState==="denied"?"Windows is blocking notifications for this app. Turn them on in Windows Settings → System → Notifications.":`${remCount} reminder${remCount===1?"":"s"} coming up in the next 90 days.`;
  else el.textContent=!N.isNative?"Reminders work in the Android and Windows apps.":!settings.remind?"Reminders are switched off.":permState==="denied"?"Notifications are blocked for this app. Turn them on in Android Settings → Apps → Executive Desk → Notifications.":`${remCount} reminder${remCount===1?"":"s"} scheduled for the next 90 days.`+(exactState==="denied"?" Android may deliver them a few minutes late; tap “Allow on-time alarms” to fix this.":"");
  const ex=$("#sExact");if(ex)ex.hidden=!(N.isNative&&exactState==="denied")}
function wireSettings(){
  const upd=async(k,v)=>{settings[k]=v;await saveSettings()};
  $("#sRemind").onchange=e=>upd("remind",e.target.checked);$("#sDays").onchange=e=>upd("daysBefore",Number(e.target.value));
  $("#sHour").onchange=e=>upd("hour",Number(e.target.value));$("#sMins").onchange=e=>upd("minutesBefore",Number(e.target.value));
  $("#sEvery").onchange=e=>upd("backupEvery",Number(e.target.value));
  $("#sBackup").onclick=doBackup;$("#sRestore").onclick=startRestore;
  $("#sOut")&&($("#sOut").onclick=doSignOut);$("#sIn")&&($("#sIn").onclick=enableCloud);
  if(N.isDesktop){const a=N.Desktop.autostart,cb=$("#sAuto");a.isEnabled().then(v=>cb.checked=v).catch(()=>{});
    cb.onchange=async()=>{try{cb.checked?await a.enable():await a.disable()}catch(e){flash("Could not change the start-up setting.")}}}
  $("#sExact").onclick=async()=>{try{await N.LocalNotifications.changeExactNotificationSetting()}catch(e){}scheduleReminders()};
  $("#sTest").onclick=async()=>{
    if(N.isDesktop){flash("A test reminder will appear in 5 seconds.");setTimeout(async()=>{if(!(await desktopNotify("Executive Desk","Reminders are working.")))flash("Windows is blocking notifications for this app.");refreshSettingsStatus()},5000);return}
    if(!N.isNative){flash("Reminders work in the Android and Windows apps.");return}
    try{let p=await N.LocalNotifications.requestPermissions();if(p.display!=="granted"){flash("Notifications are blocked for this app.");return}
      await N.LocalNotifications.createChannel({id:"desk",name:"Desk reminders",importance:4,visibility:0,vibration:true});
      await N.LocalNotifications.schedule({notifications:[{id:999,title:"Executive Desk",body:"Reminders are working.",channelId:"desk",smallIcon:"ic_stat_desk",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]});flash("A test reminder will appear in 5 seconds.")}catch(e){flash("The test reminder could not be set.")}};
  refreshSettingsStatus();doSchedule();
}

boot();
