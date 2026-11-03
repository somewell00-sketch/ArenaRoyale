// ---- the mentor: one-line tips the first time things happen, with spotlights on the map; plus the rules card in the pause menu ----
(function(){
const MENTORS=["Cassia Vell","Orren Pike","Tamsin Rowe","Bram Halloway","Ilsa Moreno","Dov Kettering","Marigold Ash","Ezra Quill","Nell Haskins","Ruben Thatch","Sabra Oake","Corin Lyle"];
let on=true;try{on=localStorage.getItem("mentor")!=="off"}catch(e){}
const done=new Set();try{JSON.parse(localStorage.getItem("mentorSeen")||"[]").forEach(k=>done.add(k))}catch(e){}
const remember=()=>{try{localStorage.setItem("mentorSeen",JSON.stringify([...done]))}catch(e){}};
const css=document.createElement("style");css.textContent=`
.mentor{position:absolute;z-index:14;left:50%;top:64px;transform:translate(-50%,-8px);max-width:calc(100% - 24px);display:flex;gap:10px;align-items:center;
  padding:7px 8px 7px 7px;border-radius:999px;background:rgba(18,14,15,.96);border:1px solid rgba(250,208,44,.5);box-shadow:0 10px 30px rgba(0,0,0,.55);opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;cursor:pointer}
.mentor.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.desk .mentor{top:62px}
.mentor .mav{flex:none;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#3a2f22,#1a1314);border:1.5px solid #fad02c;color:#fad02c;font:600 11px Rajdhani,sans-serif}
.mentor .mq{margin:0;font-size:13.5px;line-height:1.3;color:#ece8e3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mentor .mx{flex:none;width:24px;height:24px;border-radius:50%;border:0;background:rgba(255,255,255,.06);color:#b9b3ac;font:14px/24px Inter,sans-serif;cursor:pointer;padding:0}
.mentor .bar{position:absolute;left:20px;right:20px;bottom:-1px;height:2px;border-radius:2px;background:rgba(250,208,44,.6);transform-origin:left;transform:scaleX(0)}
.mentor.on .bar{animation:mtime 8s linear forwards}
@keyframes mtime{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.coach{position:relative;z-index:2;animation:coach 1.4s ease-in-out infinite!important;border-radius:10px}
@keyframes coach{0%,100%{box-shadow:0 0 0 0 rgba(250,208,44,0),0 0 0 2px rgba(250,208,44,.85)}50%{box-shadow:0 0 0 7px rgba(250,208,44,.2),0 0 0 2px rgba(250,208,44,1)}}
svg.coachmap{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
svg.coachmap path{fill:none;stroke-width:4;stroke-linejoin:round;vector-effect:non-scaling-stroke;animation:spot 1.4s ease-in-out infinite}
svg.coachmap path.fill{stroke:none;animation:spotf 1.4s ease-in-out infinite}
@keyframes spot{0%,100%{stroke-opacity:.35}50%{stroke-opacity:1}}
@keyframes spotf{0%,100%{fill-opacity:0}50%{fill-opacity:.22}}
.rules{position:absolute;inset:0;z-index:15;display:none;align-items:center;justify-content:center;background:rgba(8,6,7,.86)}
.rules.on{display:flex}
.rules .rc{width:min(400px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:16px 16px 12px;border-radius:14px;background:#141011;border:1px solid rgba(250,208,44,.3)}
.rules .rt{font:600 13px Rajdhani,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#fad02c;text-align:center}
.rules ol{list-style:none;margin:10px 0;padding:0}
.rules li{display:flex;gap:12px;align-items:center;padding:9px 0;border-top:1px solid rgba(250,208,44,.12);font-size:13px;color:#ece8e3}
.rules li i{flex:none;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-style:normal;font-size:16px;background:rgba(250,208,44,.07);border:1px solid rgba(250,208,44,.25);color:#fad02c}
.rules .cols{display:inline-flex;gap:4px;flex-wrap:wrap}.rules .cols em{width:12px;height:12px;border-radius:3px;display:inline-block}
.rules button{width:100%;height:38px;border-radius:10px;border:0;background:#fad02c;color:#1b1400;font:600 13px Inter,sans-serif;cursor:pointer}
.mtoggle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(250,208,44,.14)}
.mtoggle b{display:block;font-weight:500;font-size:13px}.mtoggle span{font-size:11px;color:#8f8983}
.sw{flex:none;width:40px;height:22px;border-radius:11px;border:1px solid rgba(250,208,44,.4);background:transparent;position:relative;cursor:pointer;padding:0}
.sw::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#8f8983;transition:transform .2s,background .2s}
.sw.on{background:rgba(250,208,44,.18)}.sw.on::after{transform:translateX(18px);background:#fad02c}
`;document.head.appendChild(css);

// setup screen: the mentor switch
const setup=document.querySelector(".setup");
if(setup){const row=document.createElement("div");row.className="mtoggle";
  row.innerHTML=`<div><b>Mentor</b><span>Tips the first time things happen. Turn it on again to replay them.</span></div><button class="sw ${on?"on":""}" aria-label="Mentor"></button>`;
  setup.insertBefore(row,document.getElementById("enter"));
  row.querySelector(".sw").addEventListener("click",e=>{on=!on;if(on){done.clear();remember()}e.currentTarget.classList.toggle("on",on);try{localStorage.setItem("mentor",on?"on":"off")}catch(_){}})}

const RULES=[["◐","Each action takes a part of the day."],["☾","Cannons = deaths. Faces at night."],["◎","Lit areas: where you can go."],
 ["▣",`Bag colours: <span class="cols"><em style="background:#e2574c"></em><em style="background:#6cc06c"></em><em style="background:#5aa8f0"></em><em style="background:#e9a93a"></em><em style="background:#b98552"></em></span> fight · food · heal · gear · packs`],
 ["▨","Red stripes vanish at night."],["✦","Be bold. Sponsors are watching."]];

let game=null,card=null,rules=null,mapsvg=null,mapg=null,timer=0,coached=null,spot=null;
function ensure(){const g=document.getElementById("game");if(!g||g===game)return!!game;game=g;
  card=document.createElement("div");card.className="mentor";g.appendChild(card);card.addEventListener("click",hide);
  mapsvg=document.createElementNS("http://www.w3.org/2000/svg","svg");mapsvg.setAttribute("class","coachmap");mapg=document.createElementNS("http://www.w3.org/2000/svg","g");mapsvg.appendChild(mapg);
  const pulse=g.querySelector("svg.pulse");pulse.after(mapsvg);
  rules=document.createElement("div");rules.className="rules";
  rules.innerHTML=`<div class="rc"><div class="rt">How the Games work</div><ol>${RULES.map(([i,t])=>`<li><i>${i}</i><div>${t}</div></li>`).join("")}</ol><button class="rclose">Back</button></div>`;
  g.appendChild(rules);rules.querySelector(".rclose").addEventListener("click",()=>rules.classList.remove("on"));
  new MutationObserver(()=>{const m=g.querySelector(".modal .mcard");if(m&&/Paused/.test(m.textContent)&&!m.querySelector(".mrules-btn")&&!m.querySelector(".totitle")){
    const b=document.createElement("button");b.className="mbtn c mrules-btn";b.textContent="How the Games work";b.addEventListener("click",e=>{e.stopPropagation();rules.classList.add("on")});
    m.insertBefore(b,m.querySelector(".leave"))}}).observe(g,{childList:true,subtree:true});
  return true}
// keep the spotlight glued to the map
function follow(){if(spot){mapg.setAttribute("transform","");mapg.style.transform=getComputedStyle(game.querySelector(".world")).transform}requestAnimationFrame(follow)}
requestAnimationFrame(follow);
const poly=c=>"M"+c.poly.map(p=>p.join(",")).join("L")+"Z";
function spotlight(list,color){spot=list;mapg.innerHTML=list.map(c=>`<path class="fill" d="${poly(c)}" fill="${color}"/><path d="${poly(c)}" stroke="${color}"/>`).join("")}
function unspot(){spot=null;mapg.innerHTML=""}
function uncoach(){if(coached){coached.classList.remove("coach");coached=null}}
function say(key,text,target,cellsToLight,color){if(!on||done.has(key)||card.classList.contains("on"))return false;done.add(key);remember();
  const name=MENTORS[(SETUP.district-1)%12];
  card.innerHTML=`<div class="mav" title="${name}, your mentor">${name.split(" ").map(w=>w[0]).join("")}</div><p class="mq">${text}</p><button class="mx" aria-label="Close">×</button><div class="bar"></div>`;
  card.classList.add("on");uncoach();unspot();
  const t=typeof target==="function"?target():target?game.querySelector(target):null;if(t){coached=t;t.classList.add("coach")}
  if(cellsToLight&&cellsToLight.length)spotlight(cellsToLight,color||"#fad02c");
  clearTimeout(timer);timer=setTimeout(hide,8000);return true}
function hide(){card.classList.remove("on");clearTimeout(timer);setTimeout(()=>{uncoach();unspot()},400)}
document.addEventListener("click",e=>{if(coached&&coached.contains(e.target))hide()},true);
const reach=()=>{const y=cells[state.you];return y.nb.map(n=>cells[n]).filter(c=>!c.closed)};

function watch(){if(!ensure()||typeof state==="undefined")return;const m=state.modal;const k=m&&m.k;const you=cells[state.you];
  if(rules.classList.contains("on")||k==="intro"||game.querySelector(".boom"))return;
  if(!m&&state.bloodbath&&state.day===1)return void say("gong","Grab what's close. Or just run.",".act .opt[data-a='loot']",[cells[corn]]);
  if(k==="loot"&&!m.res)return void say("loot","Closer to the horn: better loot, more danger.");
  if(!m&&!state.bloodbath&&state.day===1)if(say("map","Lit areas: where you can go. Tap one.",null,reach()))return;
  if(!m&&inventory().length)if(say("bag","Your things. Tap to use them.",".bagbtn:not(.empty), .carry .slot2"))return;
  if(k==="enc"&&!m.res)return void say("enc","Read them first. Size, weapon, stance.");
  if(k==="beast"&&!m.res)return void say("beast","Some mutts you outrun. Some you don't.");
  {const b=you.nb.map(n=>cells[n]).find(c=>c.sense==="beast");if(!m&&b)if(say("paw","Teeth nearby. Keep your distance.",null,[b],"#ff6a5a"))return}
  if(k==="night")return void say("night","Night. The faces are the dead.",".mcard.night .sleep");
  {const cl=cells.filter(c=>c.closing);if(!m&&cl.length)if(say("closing","Red stripes vanish tonight. Get out.",null,cl,"#ff6a5a"))return}
  if(!m&&state.hp<55)if(say("hurt","Hurt. Rest under cover. Bind bleeding first.",()=>game.querySelector(".act .opt[data-a='bandage']")||game.querySelector(".act .opt[data-a='rest']")))return;
  {const w=cells.filter(c=>c.water&&c.seen&&!c.closed);if(!m&&state.thirst>=2&&w.length)if(say("water","Thirsty. Water is marked in blue.",null,w.slice(0,3),"#8fb4ff"))return}
  if(!m&&state.allies.length)if(say("ally","Allies help. Watch them anyway.",".allies .al"))return;
  if(!m&&state.day>=2)say("pause","Lost? Pause → How the Games work.",".menubtn")}
setInterval(watch,400);
})();
