import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   FocusBridge v6 — MVP
   NEW: Smart Onboarding · Prayer Times · Weekly Insights
   CORE: Quests · Garden · Salah · Food · Collection · Journey
   Age-adaptive: Kids ↔ Adults
   ══════════════════════════════════════════════════════════════ */

const C={bg:"#0A1312",glass:"rgba(255,255,255,0.032)",border:"rgba(255,255,255,0.05)",
  mint:"#4ADE80",mintD:"#1A6B3A",gold:"#F5C842",goldD:"#B8941F",
  teal:"#2DD4BF",purple:"#A78BFA",rose:"#FB7185",orange:"#FB923C",sky:"#7DD3FC",
  text:"#EDE8DF",mid:"#8A9490",dim:"#4A5553"};
const spr="cubic-bezier(0.34,1.56,0.64,1)";

// ── QURAN ──
const QU=[
  {id:1,s:"Al-Fatiha",v:"1:1",ar:"بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",en:"In the name of Allah, Most Gracious",r:"common"},
  {id:2,s:"Al-Baqarah",v:"2:153",ar:"اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",en:"Seek help through patience and prayer",r:"common"},
  {id:3,s:"Al-Baqarah",v:"2:186",ar:"فَإِنِّي قَرِيبٌ",en:"Indeed I am near",r:"rare"},
  {id:4,s:"Al-Baqarah",v:"2:286",ar:"لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",en:"Allah does not burden a soul beyond capacity",r:"common"},
  {id:5,s:"Ash-Sharh",v:"94:5",ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",en:"With hardship comes ease",r:"epic"},
  {id:6,s:"Ar-Ra'd",v:"13:28",ar:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",en:"In Allah's remembrance do hearts find rest",r:"rare"},
  {id:7,s:"Az-Zumar",v:"39:53",ar:"لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",en:"Do not despair of Allah's mercy",r:"epic"},
  {id:8,s:"Ibrahim",v:"14:7",ar:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",en:"If grateful, I will increase you",r:"rare"},
  {id:9,s:"Al-Ankabut",v:"29:69",ar:"لَنَهْدِيَنَّهُمْ سُبُلَنَا",en:"We will guide them to Our ways",r:"common"},
  {id:10,s:"At-Talaq",v:"65:3",ar:"وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",en:"Whoever relies on Allah, He is sufficient",r:"rare"},
  {id:11,s:"An-Nahl",v:"16:69",ar:"فِيهِ شِفَاءٌ لِّلنَّاسِ",en:"In it is healing for people",r:"legendary"},
  {id:12,s:"Al-Asr",v:"103:1",ar:"وَالْعَصْرِ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",en:"By time, indeed mankind is in loss",r:"common"},
  {id:13,s:"Ar-Rahman",v:"55:13",ar:"فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",en:"Which favors would you deny?",r:"rare"},
  {id:14,s:"Al-Imran",v:"3:173",ar:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",en:"Sufficient for us is Allah",r:"epic"},
  {id:15,s:"Al-Isra",v:"17:82",ar:"وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ",en:"We send down of the Quran that which is healing",r:"legendary"},
];
const RC={common:C.mid,rare:C.teal,epic:C.purple,legendary:C.gold};

// ── PRAYER TIMES ENGINE (algorithmic — no API needed) ──
const calcPrayerTimes=(lat=50.63,lng=5.57)=>{
  const d=new Date(),J=Math.floor(d/86400000)+2440587.5;
  const n=J-2451545.0,L=(280.46+0.9856474*n)%360,g=((357.528+0.9856003*n)%360)*Math.PI/180;
  const ec=(-23.44*Math.cos((360/365*(d.getDate()+10))*Math.PI/180));
  const decR=ec*Math.PI/180, latR=lat*Math.PI/180;
  const eqt=(-7.655*Math.sin(g)+9.873*Math.sin(2*((L*Math.PI/180)+1.914*Math.sin(g)*Math.PI/180)));
  const noon=12-lng/15-eqt/60;
  const ha=(a)=>Math.acos((Math.sin(a*Math.PI/180)-Math.sin(latR)*Math.sin(decR))/(Math.cos(latR)*Math.cos(decR)))*180/Math.PI/15;
  const fmt=(h)=>{const hr=Math.floor(h),mn=Math.round((h-hr)*60);return`${String(hr).padStart(2,'0')}:${String(mn).padStart(2,'0')}`;};
  const fajrHA=ha(-18), maghribHA=ha(-0.833), ishaHA=ha(-17);
  return{
    Fajr:fmt(noon-fajrHA), Sunrise:fmt(noon-maghribHA),
    Dhuhr:fmt(noon+0.02), Asr:fmt(noon+ha(Math.atan(1+Math.tan(Math.abs(latR-decR)))*180/Math.PI)*0.67),
    Maghrib:fmt(noon+maghribHA), Isha:fmt(noon+ishaHA),
  };
};
const timeToMin=(t)=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
const fmtCountdown=(mins)=>{if(mins<0)mins+=1440;const h=Math.floor(mins/60),m=mins%60;return h>0?`${h}h ${m}m`:`${m}m`;};

// ── QUESTS ──
const QP=[
  {id:"fajr",cat:"salah",t:"Fajr Warrior",tk:"Pray Fajr!",i:"🌅",xp:30,df:"medium"},
  {id:"dhuhr",cat:"salah",t:"Noon Anchor",tk:"Pray Dhuhr!",i:"☀️",xp:20,df:"easy"},
  {id:"five",cat:"salah",t:"Full Five",tk:"All 5 prayers!",i:"🕌",xp:80,df:"hard"},
  {id:"task1",cat:"task",t:"One-Thing Hero",tk:"Do #1 task!",i:"☝️",xp:35,df:"medium"},
  {id:"task3",cat:"task",t:"Triple Threat",tk:"Do 3 tasks!",i:"⚡",xp:50,df:"hard"},
  {id:"dump",cat:"task",t:"Brain Dump",tk:"Write 3 ideas!",i:"💭",xp:15,df:"easy"},
  {id:"f25",cat:"focus",t:"Deep Diver",tk:"Focus 25 min!",i:"🎯",xp:30,df:"medium"},
  {id:"f45",cat:"focus",t:"Ultra Focus",tk:"Focus 45 min!",i:"🔥",xp:60,df:"hard"},
  {id:"protein",cat:"food",t:"Brain Fuel",tk:"Eat protein!",i:"🥚",xp:20,df:"easy"},
  {id:"sunnah",cat:"food",t:"Sunnah Snack",tk:"Eat dates!",i:"🫒",xp:15,df:"easy"},
  {id:"water",cat:"food",t:"Water Bearer",tk:"Drink water!",i:"💧",xp:20,df:"easy"},
  {id:"nosugar",cat:"food",t:"Sugar Slayer",tk:"No sugar!",i:"🍬",xp:45,df:"hard"},
  {id:"dhikr",cat:"well",t:"Dhikr Drop",tk:"Say SubhanAllah 33x!",i:"📿",xp:15,df:"easy"},
  {id:"shukr",cat:"well",t:"Gratitude",tk:"Write 3 thanks!",i:"✨",xp:20,df:"easy"},
  {id:"h1",cat:"habit",t:"Seed Planter",tk:"1 good habit!",i:"🌱",xp:15,df:"easy"},
  {id:"h3",cat:"habit",t:"Garden Tender",tk:"3 good habits!",i:"🌿",xp:40,df:"medium"},
  {id:"quran",cat:"well",t:"Quran Moment",tk:"Read 2 ayahs!",i:"📖",xp:20,df:"easy"},
  {id:"walk",cat:"well",t:"Fresh Air",tk:"Go outside!",i:"🚶",xp:20,df:"easy"},
  {id:"sleep",cat:"well",t:"Isha & Sleep",tk:"Pray Isha, screens off!",i:"😴",xp:35,df:"hard"},
];

// ── FOOD ──
const FOODS=[
  {id:"dates",em:"🫒",n:"Dates",h:1,tag:"🧠 Dopamine",j:"Brain on dates: 📈\nEnergy drinks: 📈📉💀",jk:"Dates = candy that makes brain HAPPY! 🎉",sci:"Iron+magnesium → brain fuel",tip:"Eat 3-7 each morning"},
  {id:"honey",em:"🍯",n:"Honey",h:1,tag:"🦠 Gut hero",j:"Prophet ﷺ: 'It heals'\nScience 1400yr later: '…he's right'",jk:"Allah said honey heals. Scientists checked. YEP! 🍯",sci:"Prebiotic → feeds serotonin gut bacteria",tip:"Replace sugar with honey"},
  {id:"olive",em:"🫒",n:"Olive Oil",h:1,tag:"🧬 Shield",j:"Extra virgin olive oil: brain fats\nExtra virgin you: reading this 🫠",jk:"Olive oil = superhero juice for brain! 🦸",sci:"Oleic acid crosses blood-brain barrier",tip:"Cook with it, drizzle on everything"},
  {id:"seed",em:"⚫",n:"Black Seed",h:1,tag:"🛡️ Cure-all",j:"✅ Cures everything except death\n❌ Doesn't cure opening the jar",jk:"Prophet ﷺ said it cures everything! ⚫🎊",sci:"Thymoquinone boosts brain growth factor",tip:"1 tsp daily with honey"},
  {id:"fish",em:"🐟",n:"Salmon",h:1,tag:"🐟 Omega",j:"ADHD brain without omega-3: 🧠💨\nWith: 🧠✨",jk:"Fish makes brain sparkle! ✨🐟",sci:"DHA+EPA = brain cell building blocks",tip:"2-3 servings per week"},
  {id:"eggs",em:"🥚",n:"Eggs",h:1,tag:"🎯 Focus",j:"Nutritionist: 'Protein breakfast'\nADHD at 11am: cold pizza",jk:"Eggs = brain's favorite breakfast! 🥚💪",sci:"Choline → acetylcholine (focus transmitter)",tip:"Eat before noon!"},
  {id:"energy",em:"⚡",n:"Energy Drinks",h:0,tag:"💀 Fraud",j:"*drinks Monster*\n2hrs: 14 otter facts, forgot why I'm here",jk:"Energy drinks LIE to your brain! 🏃💨",sci:"Fake dopamine spike → crash → repeat",tip:"Try green tea instead"},
  {id:"sugar",em:"🍬",n:"Refined Sugar",h:0,tag:"🎢 Crash",j:"Sugar: I'll give energy!\n30min: angry AND sleepy",jk:"Sugar is a TRICKSTER! Steals energy back! 😈",sci:"Glucose spike → crash → brain fog",tip:"Swap for dates or honey"},
  {id:"junk",em:"🍟",n:"Ultra-Processed",h:0,tag:"🧪 Chemicals",j:"47 unpronounceable ingredients\nNarrator: it was not edible",jk:"If grandma can't recognize it, brain can't either! 🤷",sci:"Food coloring worsens ADHD (Lancet)",tip:"Read labels!"},
  {id:"skip",em:"🚫",n:"Skip Breakfast",h:0,tag:"⚠️ Empty",j:"7:00 Alarm\n8:45 PANIC\n10:30 Why can't I think",jk:"Brain without breakfast = phone at 1%! 🔋",sci:"No fuel = impaired memory + impulse control",tip:"Prep dates+eggs night before"},
];

const FC=[
  {id:"p",q:"Protein?",qk:"Eat eggs or meat?",y:"🧠 Factory: ONLINE",yk:"Brain POWERED UP! ⚡",n:"Dopamine is hungry",nk:"Feed me! 🥺",ic:"🥚",co:C.mint},
  {id:"w",q:"Water?",qk:"Drink lots of water?",y:"Hydration: on point",yk:"Happy sponge! 🧽💧",n:"75% regret right now",nk:"Brain is thirsty! 🏃💧",ic:"💧",co:C.teal},
  {id:"o",q:"Omega-3?",qk:"Fish or walnuts?",y:"Membranes: thriving ✨",yk:"Brain cells dancing! 💃",n:"Neurons on dry rubber",nk:"Brain wants fish! 🐟",ic:"🐟",co:C.gold},
  {id:"s",q:"Sunnah food?",qk:"Dates/honey/olive oil?",y:"Prophet ﷺ AND science",yk:"SUPER BRAIN! 🌟",n:"Prophet ﷺ ate dates…",nk:"Eat dates! 🫒",ic:"🫒",co:C.purple},
  {id:"x",q:"No sugar?",qk:"No candy or soda?",y:"Blood sugar: stable",yk:"Beat Sugar Monster! 🏆",n:"Tomorrow is new",nk:"Try again! You're awesome! 💪",ic:"🍬",co:C.rose},
];

const GI={sprout:{s:["🌱","🌿","🪴","🌳"],n:"Tree"},flower:{s:["🌱","🌿","🌷","🌸"],n:"Cherry"},
  palm:{s:["🌱","🌿","🌴","🌴"],n:"Palm"},rose:{s:["🌱","🌿","🥀","🌹"],n:"Rose"},
  sun:{s:["🌱","🌿","🌻","🌻"],n:"Sunflower"},herb:{s:["🌱","🌿","🍃","🍀"],n:"Herb"}};

const JS=[{n:"The Desert",l:"🏜️",xp:0,d:"Every journey begins with one step."},
  {n:"The Oasis",l:"🏝️",xp:200,d:"Rest, then continue."},
  {n:"The Garden",l:"🌿",xp:500,d:"Your efforts are blooming."},
  {n:"The Village",l:"🏘️",xp:1000,d:"Building something meaningful."},
  {n:"The Masjid",l:"🕌",xp:2000,d:"A place of peace."},
  {n:"The Mountain",l:"🏔️",xp:3500,d:"The view is breathtaking."},
  {n:"The Holy City",l:"🕋",xp:5500,d:"The journey never ends."}];

const SURPRISES=["🎁 Say SubhanAllah 10x for a garden boost!","💡 Prophet ﷺ focused 2+ hour prayers. You showed up!",
  "🌟 Opening this app = act of intention. الحمد لله","📿 3 breaths, say Bismillah. Garden grew!",
  "🧠 Your prefrontal cortex says thank you!","🫒 Sunnah snack? 3 dates. Dopamine celebrates!",
  "💧 Water check: is your brain happy?","🌊 'Take benefit of five before five.'"];

const dayH=()=>{const d=new Date(),s=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);};

// ── COMPONENTS ──
const G=({ch,s={},onClick,glow})=><div onClick={onClick} style={{background:C.glass,backdropFilter:"blur(14px)",borderRadius:20,padding:15,border:`1px solid ${C.border}`,cursor:onClick?"pointer":"default",position:"relative",overflow:"hidden",transition:"all 0.2s ease",...s}}>{ch}</div>;
const Ring=({v,sz=44,sk=3,co=C.mint,ch})=>{const r=(sz-sk)/2,ci=2*Math.PI*r,off=ci-Math.min(v/100,1)*ci;return<div style={{position:"relative",width:sz,height:sz}}><svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={sk}/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={co} strokeWidth={sk} strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round" style={{transition:`stroke-dashoffset 0.8s ${spr}`,filter:`drop-shadow(0 0 5px ${co}30)`}}/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{ch}</div></div>;};
const Geo=({o=0.025,co=C.gold})=><svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:o,pointerEvents:"none"}} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs><pattern id="gp" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke={co} strokeWidth="0.3"/><circle cx="20" cy="20" r="6" fill="none" stroke={co} strokeWidth="0.2"/></pattern></defs><rect width="200" height="200" fill="url(#gp)"/></svg>;

// Loot
const Loot=({show,rw,onClose})=>{const[vis,sV]=useState(false);useEffect(()=>{if(show){sV(true);setTimeout(()=>{sV(false);onClose?.();},4200);}},[show]);if(!vis||!rw)return null;
  const sp=Array.from({length:35},(_,i)=>({x:50+(Math.random()-0.5)*80,y:42+(Math.random()-0.5)*60,s:2+Math.random()*5,d:Math.random()*400,c:[C.gold,"#fff",C.mint,C.teal,C.purple][i%5]}));
  const rc=rw.type==="ayah"?RC[rw.data?.r]||C.gold:C.gold;
  return<div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.92)",backdropFilter:"blur(20px)",animation:"fadeIn 0.3s"}} onClick={()=>{sV(false);onClose?.();}}>
    {sp.map((p,i)=><div key={i} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,background:p.c,borderRadius:"50%",animation:`conf 1.4s ${spr} ${p.d}ms forwards`,opacity:0}}/>)}
    <div style={{textAlign:"center",zIndex:2,padding:28,maxWidth:320,animation:"pop 0.5s ease 100ms both"}}>
      {rw.type==="ayah"?<><div style={{fontSize:13,fontWeight:800,color:rc,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{rw.data.r==="legendary"?"⭐ LEGENDARY":rw.data.r==="epic"?"💎 EPIC":"✨ "+rw.data.r.toUpperCase()} VERSE</div><div style={{background:"rgba(255,255,255,0.03)",borderRadius:20,padding:20,border:`1px solid ${rc}18`}}><p style={{fontFamily:"'Amiri',serif",fontSize:18,color:`${rc}bb`,direction:"rtl",textAlign:"right",lineHeight:1.9,marginBottom:6}}>{rw.data.ar}</p><p style={{fontSize:11,color:C.mid,fontStyle:"italic"}}>"{rw.data.en}"</p><p style={{fontSize:10,color:rc,fontWeight:800,marginTop:6}}>— {rw.data.s} {rw.data.v}</p></div></>:
      <><div style={{fontSize:48,marginBottom:8}}>{rw.icon||"🌟"}</div><h3 style={{fontSize:20,fontWeight:900,color:C.gold,margin:"0 0 4px"}}>{rw.title}</h3><p style={{fontSize:12,color:C.mid}}>{rw.desc}</p><div style={{marginTop:10,padding:"5px 14px",borderRadius:12,background:`${C.mint}12`,display:"inline-block"}}><span style={{fontSize:13,fontWeight:900,color:C.mint}}>+{rw.xp} XP</span></div></>}
    </div></div>;};

// ════════════════════════════
//  MAIN APP
// ════════════════════════════
export default function App(){
  // ── STATE ──
  const[phase,setPhase]=useState("onboard"); // onboard → app
  const[mode,setMode]=useState(null);
  const[profile,setProfile]=useState({struggle:null,name:""});
  const[obStep,setObStep]=useState(0);
  const[screen,setScreen]=useState("home");
  const[xp,setXP]=useState(0);
  const[loot,setLoot]=useState(null);
  const[col,setCol]=useState([1]);
  const[garden,setGarden]=useState([{t:"sprout",g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0},{t:null,g:0}]);
  const[qDone,setQD]=useState({});
  const[salah,setSalah]=useState({Fajr:0,Dhuhr:0,Asr:0,Maghrib:0,Isha:0});
  const[foodChecks,setFCh]=useState({});
  const[foodCard,setFoodCard]=useState(0);
  const[foodFlip,setFoodFlip]=useState(false);
  const[bonusDone,setBD]=useState(false);
  const[bonusVis,setBV]=useState(false);
  const[now,setNow]=useState(nowMin());
  // Simulated week history for insights
  const[weekLog]=useState(()=>{const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days.push({date:d.toLocaleDateString("en",{weekday:"short"}),salah:Math.floor(Math.random()*4)+1,quests:Math.floor(Math.random()*3)+1,food:Math.floor(Math.random()*4)+1,xp:Math.floor(Math.random()*80)+20});}return days;});

  const k=mode==="kid";
  const seed=useMemo(()=>dayH(),[]);
  const prayers=useMemo(()=>calcPrayerTimes(),[]);
  const quests=useMemo(()=>{const e=QP.filter(q=>q.df==="easy"),m=QP.filter(q=>q.df==="medium"),h=QP.filter(q=>q.df==="hard");
    // Personalize based on struggle
    let pool=QP;
    if(profile.struggle==="salah") pool=QP.filter(q=>q.cat==="salah"||q.cat==="well").concat(QP.filter(q=>q.cat!=="salah"&&q.cat!=="well"));
    if(profile.struggle==="focus") pool=QP.filter(q=>q.cat==="focus"||q.cat==="task").concat(QP.filter(q=>q.cat!=="focus"&&q.cat!=="task"));
    if(profile.struggle==="food") pool=QP.filter(q=>q.cat==="food"||q.cat==="well").concat(QP.filter(q=>q.cat!=="food"&&q.cat!=="well"));
    if(profile.struggle==="morning") pool=[QP.find(q=>q.id==="fajr"),...QP.filter(q=>q.id==="protein"),...QP.filter(q=>q.cat==="habit"),...QP.filter(q=>q.cat!=="habit"&&q.id!=="fajr"&&q.id!=="protein")];
    const ep=pool.filter(q=>q.df==="easy"),mp=pool.filter(q=>q.df==="medium"),hp=pool.filter(q=>q.df==="hard");
    return[ep[seed%ep.length],mp[(seed*7)%mp.length],hp[(seed*13)%hp.length]];
  },[seed,profile.struggle]);
  const bonus=useMemo(()=>QP.filter(q=>q.cat==="well")[seed%QP.filter(q=>q.cat==="well").length],[seed]);
  const surprise=useMemo(()=>SURPRISES[seed%SURPRISES.length],[seed]);
  const station=useMemo(()=>{let s=JS[0];for(const st of JS)if(xp>=st.xp)s=st;return s;},[xp]);
  const nextSt=useMemo(()=>{const i=JS.indexOf(station);return i<JS.length-1?JS[i+1]:null;},[station]);

  useEffect(()=>{const t=setTimeout(()=>setBV(true),6000);return()=>clearTimeout(t);},[]);
  useEffect(()=>{const t=setInterval(()=>setNow(nowMin()),30000);return()=>clearInterval(t);},[]);

  // Next prayer calculation
  const nextPrayer=useMemo(()=>{
    const order=["Fajr","Sunrise","Dhuhr","Asr","Maghrib","Isha"];
    for(const p of order){const m=timeToMin(prayers[p]);if(m>now)return{name:p,time:prayers[p],mins:m-now};}
    return{name:"Fajr",time:prayers.Fajr,mins:timeToMin(prayers.Fajr)+1440-now};
  },[prayers,now]);

  const doQuest=(q)=>{if(qDone[q.id])return;setQD({...qDone,[q.id]:true});setXP(x=>x+q.xp);
    if(Math.random()<0.3){const unc=QU.filter(a=>!col.includes(a.id));if(unc.length){const wt=unc.map(a=>a.r==="legendary"?1:a.r==="epic"?3:a.r==="rare"?6:10);const tw=wt.reduce((s,w)=>s+w,0);let r=Math.random()*tw,pk=unc[0];for(let i=0;i<unc.length;i++){r-=wt[i];if(r<=0){pk=unc[i];break;}}setCol([...col,pk.id]);setTimeout(()=>setLoot({type:"ayah",data:pk}),400);return;}}
    setTimeout(()=>setLoot({type:"xp",icon:q.i,title:k?"Quest done! 🎉":"Quest Complete!",desc:q.t,xp:q.xp}),300);
    setGarden(gs=>{const ng=[...gs];const gw=ng.filter(s=>s.t&&s.g<3);if(gw.length)gw[Math.floor(Math.random()*gw.length)].g++;else{const em=ng.findIndex(s=>!s.t);if(em>=0){const ty=Object.keys(GI);ng[em]={t:ty[Math.floor(Math.random()*ty.length)],g:0};}}return ng;});};
  const qdc=Object.keys(qDone).length+(bonusDone?1:0);
  const qt=quests.length+(bonusVis?1:0);
  const sdone=Object.values(salah).filter(v=>v>0).length;
  const cscore=Object.values(foodChecks).filter(Boolean).length;
  const cycleSalah=(p)=>{const nx=salah[p]===0?1:salah[p]===1?0.5:0;setSalah({...salah,[p]:nx});if(nx===1)setXP(x=>x+10);};

  // ══════════════════════════════════
  //  1. SMART ONBOARDING (60 seconds)
  // ══════════════════════════════════
  if(phase==="onboard") return<div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg,maxWidth:430,margin:"0 auto",fontFamily:"'Nunito',system-ui,sans-serif",color:C.text,padding:24,justifyContent:"center"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Nunito:wght@600;700;800;900&display=swap');
      @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      @keyframes pop{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes conf{0%{transform:translateY(0)rotate(0);opacity:1}100%{transform:translateY(-120px)rotate(720deg)scale(0);opacity:0}}
      @keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    `}</style>
    <Geo o={0.04} co={C.gold}/>
    <div style={{position:"relative",zIndex:1,animation:"fadeIn 0.5s ease"}}>
      {/* Step 0: Welcome */}
      {obStep===0&&<div style={{textAlign:"center"}}>
        <p style={{fontFamily:"'Amiri',serif",fontSize:18,color:`${C.gold}55`,marginBottom:12}}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
        <h1 style={{fontSize:30,fontWeight:900,margin:"0 0 4px"}}>FocusBridge 🌿</h1>
        <p style={{fontSize:14,color:C.mid,margin:"0 0 6px"}}>Your Islamic ADHD companion</p>
        <p style={{fontSize:12,color:C.dim,margin:"0 0 28px"}}>The only app that understands your ADHD<br/>and your deen are not in conflict.</p>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>{setMode("kid");setObStep(1);}} style={{flex:1,padding:"24px 14px",borderRadius:22,background:`${C.gold}06`,border:`2px solid ${C.gold}18`,cursor:"pointer"}}><div style={{fontSize:38,marginBottom:6}}>🧒</div><div style={{fontSize:15,fontWeight:900,color:C.gold}}>Kids</div><div style={{fontSize:10,color:C.dim}}>Ages 7-14</div></button>
          <button onClick={()=>{setMode("adult");setObStep(1);}} style={{flex:1,padding:"24px 14px",borderRadius:22,background:`${C.mint}05`,border:`2px solid ${C.mint}15`,cursor:"pointer"}}><div style={{fontSize:38,marginBottom:6}}>🧑</div><div style={{fontSize:15,fontWeight:900,color:C.mint}}>Adults</div><div style={{fontSize:10,color:C.dim}}>Ages 15+</div></button>
        </div>
      </div>}
      {/* Step 1: What's hardest */}
      {obStep===1&&<div style={{animation:"fadeIn 0.4s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
          <div style={{width:8,height:8,borderRadius:4,background:C.mint}}/><div style={{flex:1,height:3,borderRadius:2,background:"rgba(255,255,255,0.04)"}}><div style={{width:"33%",height:"100%",borderRadius:2,background:C.mint}}/></div>
        </div>
        <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 4px"}}>{k?"What's the hardest thing? 🤔":"What's your biggest struggle?"}</h2>
        <p style={{fontSize:12,color:C.mid,margin:"0 0 18px"}}>{k?"Pick one — we'll make quests just for you!":"This personalizes your first quests."}</p>
        {[{id:"salah",i:"🤲",t:k?"Remembering prayers":"Keeping up with Salah",d:k?"I forget prayer times":"Time blindness + prayer guilt"},
          {id:"focus",i:"🎯",t:k?"Staying focused":"Focusing on tasks",d:k?"My brain jumps everywhere":"Executive function struggles"},
          {id:"food",i:"🧠",t:k?"Eating healthy":"Nutrition & energy",d:k?"I skip meals or eat junk":"Blood sugar crashes + brain fog"},
          {id:"morning",i:"🌅",t:k?"Morning routine":"Starting the day",d:k?"I can never wake up on time":"Fajr + breakfast + getting going"},
        ].map(opt=><button key={opt.id} onClick={()=>{setProfile({...profile,struggle:opt.id});setObStep(2);}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:16,marginBottom:8,borderRadius:20,background:C.glass,border:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left",transition:"all 0.2s ease"}}>
          <div style={{fontSize:28,width:48,height:48,borderRadius:16,background:`${C.mint}08`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{opt.i}</div>
          <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>{opt.t}</div><div style={{fontSize:11,color:C.dim}}>{opt.d}</div></div>
        </button>)}
      </div>}
      {/* Step 2: Name (optional) */}
      {obStep===2&&<div style={{animation:"fadeIn 0.4s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
          <div style={{width:8,height:8,borderRadius:4,background:C.mint}}/><div style={{flex:1,height:3,borderRadius:2,background:"rgba(255,255,255,0.04)"}}><div style={{width:"66%",height:"100%",borderRadius:2,background:C.mint}}/></div>
        </div>
        <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 4px"}}>{k?"What's your name? 😊":"What should we call you?"}</h2>
        <p style={{fontSize:12,color:C.mid,margin:"0 0 18px"}}>Optional — or just tap continue.</p>
        <input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder={k?"Your name...":"Your name (optional)"} style={{width:"100%",padding:"16px 18px",borderRadius:18,background:C.glass,border:`1px solid ${C.border}`,color:C.text,fontSize:16,fontWeight:700,fontFamily:"inherit",outline:"none",marginBottom:14,boxSizing:"border-box"}}/>
        <button onClick={()=>setObStep(3)} style={{width:"100%",padding:"16px",borderRadius:18,background:C.mint,border:"none",color:"#0A1312",fontSize:15,fontWeight:900,cursor:"pointer"}}>Continue →</button>
      </div>}
      {/* Step 3: Ready */}
      {obStep===3&&<div style={{textAlign:"center",animation:"fadeIn 0.4s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,justifyContent:"center"}}>
          <div style={{width:8,height:8,borderRadius:4,background:C.mint}}/><div style={{width:120,height:3,borderRadius:2,background:C.mint}}/>
        </div>
        <div style={{fontSize:56,marginBottom:12}}>🌿</div>
        <h2 style={{fontSize:24,fontWeight:900,margin:"0 0 6px"}}>Bismillah{profile.name?`, ${profile.name}`:""} ✨</h2>
        <p style={{fontSize:13,color:C.mid,margin:"0 0 6px"}}>Your journey begins now.</p>
        <p style={{fontSize:12,color:C.dim,margin:"0 0 8px"}}>We've personalized your quests around: <strong style={{color:C.gold}}>{{salah:"Salah",focus:"Focus",food:"Nutrition",morning:"Mornings"}[profile.struggle]}</strong></p>
        <p style={{fontFamily:"'Amiri',serif",fontSize:16,color:`${C.gold}70`,margin:"12px 0 24px"}}>فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
        <button onClick={()=>setPhase("app")} style={{width:"100%",padding:"16px",borderRadius:18,background:`linear-gradient(135deg,${C.mint},${C.teal})`,border:"none",color:"#0A1312",fontSize:16,fontWeight:900,cursor:"pointer"}}>Start My Journey 🌿</button>
      </div>}
    </div>
  </div>;

  // ════════════════════════
  //  MAIN APP SCREENS
  // ════════════════════════
  const greeting=profile.name?(k?`Hey ${profile.name}! 🏆`:`${profile.name} 🌿`):(k?"Assalamu Alaikum! 🏆":"Assalamu Alaikum 🌿");

  // ── HOME: Quests + Prayer Times ──
  const HomeScr=()=><div style={{padding:"0 16px 100px",animation:"fadeIn 0.35s ease"}}>
    <div style={{position:"relative",margin:"0 -16px",padding:"14px 16px 18px",overflow:"hidden"}}>
      <Geo o={0.03} co={C.gold}/>
      <div style={{position:"relative",zIndex:1}}>
        <p style={{fontFamily:"'Amiri',serif",fontSize:k?14:16,color:`${C.gold}45`,textAlign:"center",marginBottom:4}}>بِسْمِ ٱللَّهِ</p>
        <h1 style={{fontSize:k?21:24,fontWeight:900,color:C.text,margin:"0 0 2px"}}>{greeting}</h1>
        <p style={{fontSize:10,color:C.mid}}>{new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"})} · {station.l} {station.n}</p>
      </div>
    </div>

    {/* ⏰ PRAYER TIMES WIDGET — THE KILLER FEATURE */}
    <G s={{marginBottom:10,padding:"12px 14px",background:`${C.teal}04`,border:`1px solid ${C.teal}08`}} ch={<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:k?22:18}}>🕌</span>
          <div><div style={{fontSize:11,fontWeight:800,color:C.teal}}>{nextPrayer.name==="Sunrise"?"Sunrise":`Next: ${nextPrayer.name}`}</div>
            <div style={{fontSize:k?20:17,fontWeight:900,color:C.text}}>{nextPrayer.time}</div></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:k?18:15,fontWeight:900,color:nextPrayer.mins<=30?C.rose:nextPrayer.mins<=60?C.gold:C.teal}}>
            {fmtCountdown(nextPrayer.mins)}
          </div>
          <div style={{fontSize:9,color:C.dim}}>remaining</div>
        </div>
      </div>
      <div style={{display:"flex",gap:3}}>
        {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map(p=>{
          const t=prayers[p];const m=timeToMin(t);const passed=now>=m;const isNext=p===nextPrayer.name;const prayed=salah[p]>0;
          return<div key={p} style={{flex:1,textAlign:"center",padding:"6px 2px",borderRadius:10,
            background:prayed?`${C.mint}12`:isNext?`${C.teal}10`:"rgba(255,255,255,0.015)",
            border:`1px solid ${prayed?`${C.mint}15`:isNext?`${C.teal}12`:"transparent"}`,transition:"all 0.2s"}}>
            <div style={{fontSize:k?10:8,fontWeight:800,color:prayed?C.mint:isNext?C.teal:passed?C.dim:C.mid}}>{p}</div>
            <div style={{fontSize:k?11:10,fontWeight:700,color:prayed?C.mint:C.text}}>{t}</div>
            {prayed&&<div style={{fontSize:8,color:C.mint}}>✓</div>}
          </div>;
        })}
      </div>
    </>}/>

    {/* Journey bar mini */}
    <G s={{marginBottom:10,padding:"10px 14px"}} ch={<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:k?22:18}}>{station.l}</span><div><div style={{fontSize:10,fontWeight:800,color:C.gold}}>{station.n}</div>{nextSt&&<div style={{fontSize:8,color:C.dim}}>{nextSt.xp-xp} XP → {nextSt.n}</div>}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{fontSize:k?18:15,fontWeight:900,color:C.gold}}>{xp}<span style={{fontSize:9,color:C.dim}}> XP</span></div>
        <Ring v={qt>0?(qdc/qt)*100:0} sz={36} sk={2.5} co={qdc===qt&&qt>0?C.gold:C.mint} ch={<span style={{fontSize:10,fontWeight:900,color:qdc===qt&&qt>0?C.gold:C.mint}}>{qdc}/{qt}</span>}/></div>
    </div>}/>

    {/* Daily Quests */}
    <h3 style={{fontSize:k?15:14,fontWeight:900,color:C.text,margin:"0 0 8px"}}>{k?"Today's Missions! ⚔️":"Today's Quests"}</h3>
    {quests.map((q,i)=>{const done=qDone[q.id];const dc=q.df==="hard"?C.rose:q.df==="medium"?C.gold:C.mint;
      return<G key={q.id} onClick={done?undefined:()=>doQuest(q)} s={{marginBottom:7,opacity:done?0.3:1,animation:`su 0.3s ease ${i*50}ms both`,borderLeft:done?"none":`3px solid ${dc}30`,borderRadius:done?20:"4px 20px 20px 4px"}} ch={
        <div style={{display:"flex",alignItems:"center",gap:k?12:10}}>
          <div style={{width:k?48:42,height:k?48:42,borderRadius:k?16:13,flexShrink:0,background:done?`${C.mint}10`:`${dc}07`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:k?24:20,border:`1.5px solid ${done?C.mint:dc}15`}}>{done?<span style={{color:C.mint}}>✓</span>:q.i}</div>
          <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:4,marginBottom:1}}><span style={{fontSize:k?13:12,fontWeight:800,color:done?C.dim:C.text,textDecoration:done?"line-through":"none"}}>{q.t}</span><span style={{fontSize:7,fontWeight:800,padding:"2px 6px",borderRadius:5,background:`${dc}10`,color:dc}}>{q.df.toUpperCase()}</span></div><p style={{fontSize:k?10:9,color:C.dim,margin:0}}>{k?q.tk:q.t}</p></div>
          <span style={{fontSize:12,fontWeight:900,color:done?C.dim:C.gold}}>+{q.xp}</span>
        </div>}/>;})}

    {bonusVis&&<G onClick={bonusDone?undefined:()=>{setBD(true);setXP(x=>x+bonus.xp);setTimeout(()=>setLoot({type:"xp",icon:"🎁",title:"Bonus!",desc:bonus.t,xp:bonus.xp}),300);}} s={{marginBottom:10,opacity:bonusDone?0.3:1,animation:"pop 0.5s ease",background:`${C.purple}04`,border:`1px solid ${C.purple}08`}} ch={
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:k?48:42,height:k?48:42,borderRadius:14,background:`${C.purple}08`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:k?22:18}}>{bonusDone?"✓":"🎁"}</div>
        <div style={{flex:1}}><span style={{fontSize:k?13:12,fontWeight:800,color:bonusDone?C.dim:C.purple}}>BONUS: {bonus.t}</span></div>
        <span style={{fontSize:12,fontWeight:900,color:bonusDone?C.dim:C.purple}}>+{bonus.xp}</span>
      </div>}/>}

    <G s={{background:`${C.gold}03`,border:`1px solid ${C.gold}05`}} ch={<p style={{fontSize:k?11:10,color:C.mid,lineHeight:1.5,margin:0}}>{surprise}</p>}/>
  </div>;

  // ── SALAH + FOOD ──
  const PrayScr=()=>{const[tab,setTab]=useState("salah");
    return<div style={{padding:"0 16px 100px",animation:"fadeIn 0.3s ease"}}>
      <h2 style={{fontSize:k?20:22,fontWeight:900,color:C.text,padding:"14px 0 8px",margin:0}}>{k?"My Ibadah 🤲":"Salah & Nutrition"}</h2>
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        {[{id:"salah",l:"🤲 Salah"},{id:"food",l:"🧠 Food"},{id:"check",l:"✅ Check"}].map(t=>
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 6px",borderRadius:12,background:tab===t.id?`${C.mint}14`:"rgba(255,255,255,0.02)",border:`1.5px solid ${tab===t.id?C.mint:"rgba(255,255,255,0.03)"}`,color:tab===t.id?C.mint:C.dim,fontSize:k?11:10,fontWeight:800,cursor:"pointer"}}>{t.l}</button>)}
      </div>
      {tab==="salah"&&<>
        <G s={{marginBottom:10}} ch={<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div><p style={{fontSize:9,fontWeight:800,color:C.mid,letterSpacing:1,margin:0}}>TODAY'S SALAH</p><p style={{fontSize:11,color:sdone>=5?C.gold:C.mint,fontWeight:700,margin:"2px 0 0"}}>{sdone>=5?(k?"ALL FIVE! ⭐":"ما شاء الله!"):`${sdone}/5`}</p></div>
            <Ring v={(sdone/5)*100} sz={38} sk={2.5} co={C.gold} ch={<span style={{fontSize:12,fontWeight:900,color:C.gold}}>{sdone}</span>}/>
          </div>
          <div style={{display:"flex",gap:4}}>
            {["Fajr","Dhuhr","Asr","Maghrib","Isha"].map((p,i)=>{const val=salah[p];const icons=["🌅","☀️","🌤️","🌆","🌙"];
              return<button key={p} onClick={()=>cycleSalah(p)} style={{flex:1,padding:k?"10px 2px":"8px 2px",borderRadius:14,cursor:"pointer",background:val===1?`${C.mint}15`:val===0.5?`${C.gold}12`:"rgba(255,255,255,0.02)",border:`2px solid ${val===1?C.mint:val===0.5?C.gold:"rgba(255,255,255,0.03)"}`,transition:`all 0.2s ${spr}`}}><div style={{fontSize:k?20:17,marginBottom:1}}>{val===1?"✓":val===0.5?"½":icons[i]}</div><div style={{fontSize:k?9:7,fontWeight:800,color:val===1?C.mint:val===0.5?C.gold:C.dim}}>{p}</div></button>;})}
          </div>
        </>}/>
        <G s={{background:`${C.rose}03`,border:`1px solid ${C.rose}05`}} ch={<div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:k?24:20}}>💚</span>
          <div><p style={{fontSize:k?12:11,fontWeight:800,color:C.rose,margin:"0 0 3px"}}>{k?"Missed a prayer? That's OK!":"Missed a prayer? Read this."}</p>
            <p style={{fontSize:10,color:C.mid,lineHeight:1.4,margin:0}}>{k?"ADHD makes time hard. Missing prayer ≠ bad Muslim. Allah knows you try! 💪":"ADHD affects time perception — missing prayers is a symptom, not a sin."}</p>
            <p style={{fontFamily:"'Amiri',serif",fontSize:12,color:`${C.gold}70`,marginTop:6}}>لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ — 39:53</p>
          </div></div>}/>
      </>}
      {tab==="food"&&(()=>{const fd=FOODS[foodCard];const dc=fd.h?C.mint:C.rose;
        return<><div onClick={()=>setFoodFlip(!foodFlip)} style={{background:`linear-gradient(145deg,rgba(255,255,255,0.02),${dc}05)`,borderRadius:22,padding:k?20:18,minHeight:k?260:230,cursor:"pointer",border:`1px solid ${dc}10`,animation:"fadeIn 0.25s",marginBottom:8}}>
          <div style={{display:"inline-flex",padding:"3px 9px",borderRadius:10,background:`${dc}10`,marginBottom:8}}><span style={{fontSize:9,fontWeight:800,color:dc}}>{fd.h?"✅ HERO":"🚫 VILLAIN"}</span></div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:k?38:32}}>{fd.em}</span><div><h3 style={{fontSize:k?16:14,fontWeight:900,color:C.text,margin:0}}>{fd.n}</h3><span style={{fontSize:9,color:dc,fontWeight:700}}>{fd.tag}</span></div></div>
          {!foodFlip?<div style={{animation:"fadeIn 0.2s"}}>
            <div style={{background:"rgba(255,255,255,0.025)",borderRadius:14,padding:12,border:`1px solid ${C.border}`}}><p style={{fontSize:8,fontWeight:800,color:C.dim,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>😂 JOKE</p><p style={{fontSize:k?12:11,color:C.text,lineHeight:1.6,whiteSpace:"pre-line",fontWeight:600}}>{k?fd.jk:fd.j}</p></div>
            <p style={{fontSize:9,color:C.dim,textAlign:"center",marginTop:6}}>Tap → science</p>
          </div>:<div style={{animation:"fadeIn 0.2s"}}>
            <div style={{background:`${C.mint}04`,borderRadius:12,padding:10,marginBottom:6,border:`1px solid ${C.mint}06`}}><p style={{fontSize:8,fontWeight:800,color:C.mint,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>🔬 SCIENCE</p><p style={{fontSize:10,color:C.mid,lineHeight:1.4}}>{fd.sci}</p></div>
            <div style={{background:`${C.gold}03`,borderRadius:10,padding:8,border:`1px solid ${C.gold}05`}}><p style={{fontSize:8,fontWeight:800,color:C.gold,letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>💡 ACTION</p><p style={{fontSize:10,color:C.mid}}>{fd.tip}</p></div>
            <p style={{fontSize:9,color:C.dim,textAlign:"center",marginTop:6}}>Tap → joke</p>
          </div>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={e=>{e.stopPropagation();setFoodFlip(false);setFoodCard((foodCard-1+FOODS.length)%FOODS.length);}} style={{width:38,height:38,borderRadius:19,background:C.glass,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:14,color:C.text}}>←</button>
          <div style={{display:"flex",gap:3}}>{FOODS.map((_,i)=><div key={i} style={{width:i===foodCard?14:4,height:4,borderRadius:2,background:i===foodCard?(FOODS[i].h?C.mint:C.rose):"rgba(255,255,255,0.04)",transition:`all 0.3s ${spr}`}}/>)}</div>
          <button onClick={e=>{e.stopPropagation();setFoodFlip(false);setFoodCard((foodCard+1)%FOODS.length);}} style={{width:38,height:38,borderRadius:19,background:C.glass,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:14,color:C.text}}>→</button>
        </div></>;})()}
      {tab==="check"&&<>
        <G s={{marginBottom:10,textAlign:"center",background:cscore>=5?`linear-gradient(135deg,${C.goldD},#8B6914)`:C.glass}} ch={<>
          <div style={{fontSize:8,fontWeight:800,letterSpacing:1.5,color:cscore>=5?"rgba(255,255,255,0.7)":C.dim,textTransform:"uppercase"}}>{cscore>=5?"OPTIMAL 🌟":"BRAIN FUEL"}</div>
          <div style={{fontSize:38,fontWeight:900,color:cscore>=5?"#fff":C.text,margin:"3px 0"}}>{cscore}/5</div>
          <div style={{fontSize:10,color:cscore>=5?"rgba(255,255,255,0.8)":C.mid,fontWeight:600}}>{cscore===0?(k?"Power up! 🔋":"Running on hope."):cscore<=2?(k?"Getting there! 💪":"Cautiously optimistic."):cscore<=4?(k?"Almost! 🤩":"One more for max."):k?"ULTIMATE POWER! 🧠⚡":"ما شاء الله!"}</div>
        </>}/>
        {FC.map((it,i)=>{const ck=foodChecks[it.id];return<div key={it.id} style={{background:ck?`${it.co}05`:C.glass,borderRadius:16,padding:k?12:10,marginBottom:6,border:`1px solid ${ck?`${it.co}10`:C.border}`,display:"flex",alignItems:"center",gap:10,animation:`su 0.3s ease ${i*40}ms both`}}>
          <button onClick={()=>setFCh({...foodChecks,[it.id]:!ck})} style={{width:k?42:36,height:k?42:36,borderRadius:k?21:18,flexShrink:0,background:ck?it.co:"rgba(255,255,255,0.02)",border:ck?"none":"2px solid rgba(255,255,255,0.05)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:k?18:15,color:ck?"#fff":C.text,transition:`all 0.2s ${spr}`}}>{ck?"✓":it.ic}</button>
          <div style={{flex:1}}><p style={{fontSize:k?12:11,fontWeight:800,color:C.text,margin:"0 0 1px"}}>{k?it.qk:it.q}</p><p style={{fontSize:9,color:ck?it.co:C.dim,fontWeight:600,margin:0}}>{ck?(k?it.yk:it.y):(k?it.nk:it.n)}</p></div>
        </div>;})}
      </>}
    </div>;};

  // ── GARDEN + COLLECTION ──
  const GardenScr=()=><div style={{padding:"0 16px 100px",animation:"fadeIn 0.3s"}}>
    <h2 style={{fontSize:k?20:22,fontWeight:900,color:C.text,padding:"14px 0 8px",margin:0}}>{k?"My Garden! 🌿":"Your Garden"}</h2>
    <div style={{position:"relative",borderRadius:24,overflow:"hidden",marginBottom:12,background:"linear-gradient(180deg,#0A1820,#0E241E 40%,#132E1A)",border:`1px solid ${C.border}`,padding:k?"24px 12px 16px":"20px 12px 14px"}}>
      <Geo o={0.02} co={C.mint}/><div style={{position:"absolute",top:8,right:16,fontSize:16,opacity:0.3}}>🌙</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:k?10:8,position:"relative",zIndex:1}}>
        {garden.map((sl,i)=>{const it=sl.t?GI[sl.t]:null;const em=it?it.s[Math.min(sl.g,3)]:null;
          return<div key={i} style={{aspectRatio:"1",borderRadius:k?18:16,background:em?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.01)",border:`1px dashed ${em?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:`fadeIn 0.3s ease ${i*40}ms both`}}>
            {em?<><span style={{fontSize:k?36:30,animation:sl.g>=3?"sway 3s ease infinite":"none"}}>{em}</span><span style={{fontSize:k?8:6,color:C.dim,fontWeight:700,marginTop:2}}>{it.n}</span></>:<span style={{fontSize:18,opacity:0.1}}>·</span>}
          </div>;})}
      </div>
    </div>
    <p style={{fontSize:k?11:10,color:C.dim,marginBottom:12,lineHeight:1.4,padding:"0 4px"}}>{k?"Every quest grows a plant! 🌱→🌳 Your garden NEVER dies — it waits for you! 💚":"Quests grow plants through 4 stages. Your garden never dies — it waits."}</p>
    <h3 style={{fontSize:k?14:13,fontWeight:800,color:C.text,margin:"0 0 6px"}}>📿 Ayah Collection ({col.length}/{QU.length})</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
      {QU.map((a,i)=>{const own=col.includes(a.id);const rc=RC[a.r];return<div key={a.id} style={{borderRadius:14,padding:own?8:6,background:own?`${rc}04`:"rgba(255,255,255,0.01)",border:`1px solid ${own?`${rc}10`:"rgba(255,255,255,0.02)"}`,animation:`su 0.2s ease ${i*25}ms both`}}>
        {own?<><span style={{fontSize:6,fontWeight:800,color:rc,textTransform:"uppercase"}}>{a.r}</span><p style={{fontFamily:"'Amiri',serif",fontSize:k?12:10,color:`${rc}a0`,direction:"rtl",textAlign:"right",lineHeight:1.7,margin:"2px 0",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{a.ar}</p><p style={{fontSize:6,color:rc,fontWeight:700}}>{a.s}</p></>:
        <div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:k?18:14,opacity:0.1}}>🔒</div><p style={{fontSize:6,color:C.dim,margin:"2px 0 0"}}>{a.s}</p></div>}
      </div>;})}
    </div>
  </div>;

  // ══════════════════════════════════════
  //  3. WEEKLY INSIGHTS DASHBOARD
  // ══════════════════════════════════════
  const InsightsScr=()=>{
    const totalSalah=weekLog.reduce((s,d)=>s+d.salah,0);
    const totalQuests=weekLog.reduce((s,d)=>s+d.quests,0);
    const totalFood=weekLog.reduce((s,d)=>s+d.food,0);
    const totalXPWeek=weekLog.reduce((s,d)=>s+d.xp,0);
    const bestDay=weekLog.reduce((b,d)=>d.xp>b.xp?d:b,weekLog[0]);
    const maxSalah=Math.max(...weekLog.map(d=>d.salah));
    const maxXP=Math.max(...weekLog.map(d=>d.xp));

    return<div style={{padding:"0 16px 100px",animation:"fadeIn 0.35s"}}>
      <h2 style={{fontSize:k?20:22,fontWeight:900,color:C.text,padding:"14px 0 4px",margin:0}}>{k?"My Week! 📊":"Weekly Insights"}</h2>
      <p style={{fontSize:10,color:C.mid,margin:"0 0 12px"}}>{k?"Look how much you did! ":""}Patterns help you understand your ADHD brain.</p>

      {/* Hero stat */}
      <G s={{marginBottom:10,textAlign:"center",background:`linear-gradient(135deg,${C.goldD}15,${C.mintD}15)`,border:`1px solid ${C.gold}10`}} ch={<>
        <div style={{fontSize:8,fontWeight:800,letterSpacing:1.5,color:C.mid,textTransform:"uppercase"}}>WEEKLY XP EARNED</div>
        <div style={{fontSize:k?42:36,fontWeight:900,color:C.gold,margin:"2px 0"}}>{totalXPWeek}</div>
        <p style={{fontSize:10,color:C.mid,margin:0}}>{k?`Best day: ${bestDay.date} — you were on FIRE! 🔥`:`Best day: ${bestDay.date} (${bestDay.xp} XP)`}</p>
      </>}/>

      {/* XP bar chart */}
      <G s={{marginBottom:10}} ch={<>
        <p style={{fontSize:9,fontWeight:800,color:C.mid,letterSpacing:1,textTransform:"uppercase",margin:"0 0 8px"}}>📊 DAILY XP</p>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:k?100:80}}>
          {weekLog.map((d,i)=>{const h=maxXP>0?(d.xp/maxXP)*100:0;const isToday=i===6;
            return<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:8,fontWeight:700,color:isToday?C.gold:C.dim}}>{d.xp}</span>
              <div style={{width:"100%",borderRadius:6,background:isToday?`linear-gradient(180deg,${C.gold},${C.mintD})`:d.xp>=60?`${C.mint}60`:`${C.mint}30`,height:`${Math.max(h,8)}%`,transition:`height 0.6s ${spr} ${i*60}ms`,minHeight:4}}/>
              <span style={{fontSize:k?9:7,fontWeight:isToday?800:600,color:isToday?C.gold:C.dim}}>{d.date}</span>
            </div>;})}
        </div>
      </>}/>

      {/* Salah chart */}
      <G s={{marginBottom:10}} ch={<>
        <p style={{fontSize:9,fontWeight:800,color:C.mid,letterSpacing:1,textTransform:"uppercase",margin:"0 0 8px"}}>🤲 PRAYERS THIS WEEK</p>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:k?80:60}}>
          {weekLog.map((d,i)=>{const h=maxSalah>0?(d.salah/5)*100:0;const isToday=i===6;
            return<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:8,fontWeight:700,color:d.salah>=5?C.gold:C.dim}}>{d.salah}/5</span>
              <div style={{width:"100%",borderRadius:6,background:d.salah>=5?`${C.gold}60`:d.salah>=3?`${C.teal}50`:`${C.teal}25`,height:`${Math.max(h,8)}%`,transition:`height 0.6s ${spr} ${i*60}ms`,minHeight:4}}/>
              <span style={{fontSize:k?9:7,fontWeight:isToday?800:600,color:isToday?C.teal:C.dim}}>{d.date}</span>
            </div>;})}
        </div>
        <div style={{marginTop:8,padding:"8px 10px",borderRadius:12,background:`${C.teal}05`,border:`1px solid ${C.teal}06`}}>
          <p style={{fontSize:10,color:C.teal,fontWeight:700,margin:0}}>💡 {totalSalah>=30?(k?"WOW! Almost every prayer! You're amazing! 🌟":"Incredible — nearly every prayer this week. ما شاء الله"):totalSalah>=20?(k?"Great progress! Keep building! 💪":"Good consistency — you prayed "+totalSalah+"/35. Building momentum."):(k?"Every prayer counts! You did "+totalSalah+"! 🤲":"You logged "+totalSalah+"/35 prayers. Small progress is still progress.")}</p>
        </div>
      </>}/>

      {/* Food & Nutrition */}
      <G s={{marginBottom:10}} ch={<>
        <p style={{fontSize:9,fontWeight:800,color:C.mid,letterSpacing:1,textTransform:"uppercase",margin:"0 0 6px"}}>🧠 BRAIN FUEL SCORE</p>
        <div style={{display:"flex",gap:4}}>
          {weekLog.map((d,i)=>{const isToday=i===6;return<div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{width:"100%",aspectRatio:"1",borderRadius:10,background:d.food>=4?`${C.mint}15`:d.food>=2?`${C.gold}10`:`${C.rose}08`,border:`1px solid ${d.food>=4?C.mint:d.food>=2?C.gold:C.rose}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:k?14:12,fontWeight:900,color:d.food>=4?C.mint:d.food>=2?C.gold:C.rose}}>{d.food}/5</div>
            <span style={{fontSize:k?8:6,color:isToday?C.mint:C.dim,fontWeight:isToday?800:600}}>{d.date}</span>
          </div>;})}
        </div>
      </>}/>

      {/* Insight cards */}
      <h3 style={{fontSize:k?13:12,fontWeight:800,color:C.text,margin:"4px 0 8px"}}>{k?"🔍 What I learned":"🔍 Patterns"}</h3>
      {[{icon:"🕌",text:k?`You prayed ${totalSalah} times this week! ${totalSalah>=25?"That's amazing!":"Every one counts!"}`:`${totalSalah}/35 prayers logged. ${totalSalah>=25?"Strong consistency.":"Building the habit."}`,co:C.teal},
        {icon:"⚔️",text:k?`${totalQuests} quests completed! Your garden is ${garden.filter(s=>s.t).length} plants strong!`:`${totalQuests} quests → ${garden.filter(s=>s.t).length} garden plants. Quests feed growth.`,co:C.gold},
        {icon:"🧠",text:k?`Brain fuel average: ${(totalFood/7).toFixed(1)}/5. ${totalFood>=25?"Your brain is THRIVING!":"More protein = more focus!"}`:`Avg nutrition score: ${(totalFood/7).toFixed(1)}/5. ${totalFood>=25?"Excellent fuel.":"Protein breakfast = instant focus boost."}`,co:C.mint},
        {icon:"📿",text:k?`${col.length} Quran verses collected! ${QU.length-col.length} more to discover!`:`${col.length}/${QU.length} ayahs unlocked. Keep questing for rare drops.`,co:C.purple},
      ].map((ins,i)=><G key={i} s={{marginBottom:6,padding:"10px 12px",animation:`su 0.3s ease ${i*60}ms both`}} ch={
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:k?20:16}}>{ins.icon}</span>
          <p style={{fontSize:k?11:10,color:C.mid,lineHeight:1.4,margin:0,flex:1}}>{ins.text}</p>
        </div>}/>)}

      {/* Journey progress */}
      <G s={{marginTop:6,background:`${C.gold}03`,border:`1px solid ${C.gold}06`}} ch={<>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:k?28:24}}>{station.l}</span>
          <div><div style={{fontSize:12,fontWeight:800,color:C.gold}}>{station.n}</div><div style={{fontSize:9,color:C.dim}}>{xp} XP total · {nextSt?`${nextSt.xp-xp} to ${nextSt.n}`:"Journey complete!"}</div></div>
        </div>
        {nextSt&&<div style={{marginTop:8,height:5,borderRadius:3,background:"rgba(255,255,255,0.03)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:`linear-gradient(90deg,${C.gold},${C.mint})`,width:`${Math.min(((xp-station.xp)/(nextSt.xp-station.xp))*100,100)}%`,transition:`width 0.8s ${spr}`}}/></div>}
      </>}/>

      {/* Mode switch */}
      <div style={{marginTop:16,textAlign:"center"}}>
        <button onClick={()=>setPhase("onboard")} style={{padding:"7px 16px",borderRadius:12,background:C.glass,border:`1px solid ${C.border}`,color:C.dim,fontSize:10,fontWeight:700,cursor:"pointer"}}>⚙️ Restart onboarding</button>
      </div>
    </div>;};

  // ── NAV ──
  const nav=[{id:"home",i:"⚔️",l:"Quests"},{id:"pray",i:"🤲",l:k?"Ibadah":"Salah"},{id:"garden",i:"🌿",l:"Garden"},{id:"insights",i:"📊",l:k?"My Week":"Insights"}];

  return<div style={{height:"100vh",display:"flex",flexDirection:"column",background:C.bg,maxWidth:430,margin:"0 auto",fontFamily:"'Nunito',system-ui,sans-serif",color:C.text,position:"relative"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Nunito:wght@600;700;800;900&display=swap');
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @keyframes pop{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}
      @keyframes su{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
      @keyframes conf{0%{transform:translateY(0)rotate(0);opacity:1}100%{transform:translateY(-120px)rotate(720deg)scale(0);opacity:0}}
      @keyframes sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    `}</style>
    <Loot show={!!loot} rw={loot} onClose={()=>setLoot(null)}/>
    <div style={{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}>
      {screen==="home"&&<HomeScr/>}
      {screen==="pray"&&<PrayScr/>}
      {screen==="garden"&&<GardenScr/>}
      {screen==="insights"&&<InsightsScr/>}
    </div>
    <div style={{height:k?78:72,display:"flex",alignItems:"flex-start",justifyContent:"space-around",background:"rgba(10,19,18,0.96)",backdropFilter:"blur(16px)",borderTop:`1px solid ${C.border}`,paddingTop:8,flexShrink:0}}>
      {nav.map(it=><button key={it.id} onClick={()=>setScreen(it.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:`all 0.2s ${spr}`,transform:screen===it.id?"scale(1.1)":"scale(1)"}}>
        <div style={{width:k?44:40,height:k?44:40,borderRadius:k?15:13,background:screen===it.id?`${C.mint}12`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:k?20:18}}>{it.i}</div>
        <span style={{fontSize:k?10:9,fontWeight:screen===it.id?800:600,color:screen===it.id?C.mint:C.dim}}>{it.l}</span>
      </button>)}
    </div>
  </div>;
}
