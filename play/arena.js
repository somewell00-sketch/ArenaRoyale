
// ---------- shared world ----------
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng((Math.random()*1e9)|0);
let SETUP={size:48,players:24,district:1,S:7,D:7,P:6};try{const j=sessionStorage.getItem("arenaSetup");if(j)SETUP=Object.assign(SETUP,JSON.parse(j))}catch(e){}
const W=1600,H=1600,N=SETUP.size;const SP=Math.min(150,Math.sqrt(Math.PI*752*752/N)*.72);const ZS=95/SP;
const pts=[];
// jittered grid inside a blob
let tries=0;while(pts.length<N&&tries++<200000){const x=R()*W,y=R()*H;const d=Math.hypot(x-W/2,y-H/2);if(d<W*.47 && pts.every(p=>Math.hypot(p[0]-x,p[1]-y)>SP))pts.push([x,y]);}
const NREAL=pts.length;for(let k=0;k<44;k++){const t=k/44*Math.PI*2;pts.push([W/2+Math.cos(t)*W*.54,H/2+Math.sin(t)*H*.54])}
const del=d3.Delaunay.from(pts);const vor=del.voronoi([0,0,W,H]);
// ---------- arena (ported from the real game: thematic arenas, tags, hazards, elements, creatures) ----------
const BIOMES=["forest","swamp","lake","mountain","plains","jungle","desert","tundra","woods","savanna","glacier","caatinga","industrial"];
const NAMES={forest:["Pine Hollow","Old Forest","Mossback","Deep Pines"],swamp:["Black Marsh","Reed Mire","Sump","Drowned Wood"],lake:["Still Lake","Cold Pool","Grey Shallows","Mirror Water"],
  mountain:["Rockfall","High Scree","Broken Ridge","Eagle Step"],plains:["Open Field","Long Grass","Wide Meadow","Bare Hill"],jungle:["Vine Tangle","Green Dark","Rot Garden","Canopy Floor"],
  desert:["Red Dunes","Salt Flat","Glass Sand","Bone Basin"],tundra:["White Waste","Frost Plain","Lichen Flats","Grey Steppe"],woods:["Birch Wood","Thin Wood","Ash Copse","Silver Stand"],
  savanna:["Dry Grass","Acacia Rise","Lion Flats","Yellow Reach"],glacier:["Ice Shelf","Blue Crevasse","Frozen Falls","Snow Bowl"],caatinga:["Thorn Scrub","Dust Bush","Cactus Run","Dry Wash"],
  industrial:["Rust Yard","Old Works","Pipe Maze","Slag Heap"]};
const ARENA_NAME={glacier:"Himani Arena",tundra:"Kunlun Arena",mountain:"Orqo Arena",desert:"Sahari Arena",caatinga:"Baraúna Arena",savanna:"Savanaari Arena",plains:"Pampaari Arena",
  woods:"Aranya Arena",forest:"Ka’aguay Arena",jungle:"Yvapurũ Arena",swamp:"Pantanari Arena",lake:"Mayu Arena",industrial:"Karkhan Arena"};
const ARENA_LINE={glacier:"Ice, mostly. The nights will kill more than the knives.",tundra:"Frozen plains. Nowhere to hide from the wind.",mountain:"Rock and scree. Watch your footing.",
  desert:"Sand, mostly. Water will be worth more than weapons.",caatinga:"Thorn and dust. Thirst comes fast here.",savanna:"Dry grass to the horizon. You'll be seen from far away.",
  plains:"Open ground. Easy to run, hard to hide.",woods:"Thin woods. Cover, but not much.",forest:"Deep forest. Plenty of cover. Plenty of things in it.",
  jungle:"Jungle, thick and wet. Food everywhere, and things that eat you.",swamp:"Marsh and black water. Every step is slow.",lake:"Lakes and cold water. Never thirsty, often stuck.",
  industrial:"Rust and ruins. Loot in every building, and air you shouldn't breathe."};
// 70% of games: a thematic arena where one biome takes ~3/4 of the map (same rule as the real game)
const THEMATIC=R()<.7;const DOM=THEMATIC?BIOMES[Math.floor(R()*BIOMES.length)]:null;
const ARENA={name:THEMATIC?ARENA_NAME[DOM]:"Survival Arena",dom:DOM,line:THEMATIC?ARENA_LINE[DOM]:"A bit of everything. Learn each place as you go."};
const bseeds=[];BIOMES.forEach(b=>{const k=THEMATIC?(b===DOM?30:1):2;for(let j=0;j<k;j++)bseeds.push([b,W*.06+R()*W*.88,H*.06+R()*H*.88])});
const nameIdx={};
const TAGW={desert:[1,.35,.45,.25,.6],caatinga:[1,.35,.45,.25,.6],savanna:[1,.35,.45,.25,.6],plains:[1,.35,.45,.25,.6],glacier:[.85,.3,.35,.55,.7],tundra:[.85,.3,.35,.55,.7],
  mountain:[.6,.55,.45,.3,.6],woods:[.3,.95,.6,.55,.35],forest:[.3,.95,.6,.55,.35],jungle:[.3,.95,.6,.55,.35],swamp:[.35,.55,.35,.8,.55],lake:[.35,.55,.35,.8,.55],industrial:[.45,.55,.8,.2,.6]};
const TAGK=["exposed","sheltered","rich","quiet","hazard"];
function wpick(ws){let s=ws.reduce((a,b)=>a+b,0),r=R()*s;for(let i=0;i<ws.length;i++){r-=ws[i];if(r<=0)return i}return ws.length-1}
function pickTags(b){const w=TAGW[b]||[.55,.55,.45,.4,.4];const t=[TAGK[wpick(w)]];if(R()<.2){const w2=w.slice();w2[TAGK.indexOf(t[0])]=0;if(t[0]==="quiet")w2[2]=0;if(t[0]==="rich")w2[3]=0;const s=TAGK[wpick(w2)];if(!t.includes(s))t.push(s)}return t}
function pickHazard(b){if(["desert","caatinga","savanna"].includes(b))return"heat";if(["glacier","tundra"].includes(b))return"cold";if(["swamp","lake"].includes(b))return"flooded";
  if(b==="industrial")return R()<.65?"toxic":"unstable";if(b==="mountain")return"unstable";return["heat","cold","toxic","unstable","flooded"][Math.floor(R()*5)]}
const CREATURES={cold:[["Wolf-Bear",15,25],["Iron Eagle",10,18],["Thermal Serpent",8,12],["Mimetic Yeti",20,30]],arid:[["Whip Scorpion",12,20],["Bomb Armadillo",25,35],["Vigilant Vulture",5,10],["Glass Lizard",10,15]],
  green:[["Tracker Wasp",8,14],["Shadow Panther",18,28],["Howler Monkey",5,12],["Thorn Wolf",12,22]],special:[["Giant Bullfrog",15,20],["Blade Dragonfly",10,16],["Mechanical Dog",20,30],["Pulse Eel",15,25]]};
const B2G={glacier:"cold",tundra:"cold",mountain:"cold",desert:"arid",caatinga:"arid",savanna:"arid",plains:"green",woods:"green",forest:"green",jungle:"green",swamp:"special",lake:"special",industrial:"special",cornucopia:"special"};
const MODS=[["Brutal","add",10],["Ferocious","add",5],["Alpha","mul",1.5],["Venomous","poison"],["Toxic","poison"],["Hungry","flavor"],["Ancient","flavor"],["Blind","flavor"],["Giant","add",6],["Wounded","weak"]];
const STRUCT=[["Safe Cave",["mountain","glacier"]],["Oasis",["desert","caatinga"]],["Fruit Tree",["jungle","forest"]],["Abandoned Shelter",["industrial"]]];
// each mutt has a way of hunting
const PROF={"Shadow Panther":"stalker","Mimetic Yeti":"stalker","Glass Lizard":"stalker","Thermal Serpent":"ambusher","Whip Scorpion":"ambusher","Pulse Eel":"ambusher",
  "Giant Bullfrog":"brute","Bomb Armadillo":"brute","Wolf-Bear":"brute","Tracker Wasp":"hunter","Thorn Wolf":"hunter","Mechanical Dog":"hunter","Iron Eagle":"hunter",
  "Howler Monkey":"skittish","Vigilant Vulture":"skittish","Blade Dragonfly":"skittish"};
const PDATA={
  hunter:{hunt:.3,range:3,blood:2,see:1,t:"Something on a scent",read:"It's following a scent. Yours.",still:.5,flee:.45,night:.06},
  stalker:{hunt:.18,range:2,blood:1,see:.2,t:"A shape that shouldn't be there",read:"You never heard it coming.",still:.35,flee:.5,night:.07},
  ambusher:{hunt:0,range:0,blood:0,see:.04,t:"Too still. Too quiet",read:"It was waiting here. For anyone.",still:.5,flee:.55,night:0},
  brute:{hunt:0,range:0,blood:0,see:1,t:"Something huge, breathing slow",read:"It doesn't want to move. It wants you to.",still:.85,flee:.2,night:.02},
  skittish:{hunt:.12,range:2,blood:1,see:1,t:"Chittering, restless",read:"All nerves and noise.",still:.75,flee:.25,night:.03,wander:.5}};
const prof=cr=>PDATA[cr.p||(cr.p=PROF[cr.n]||"brute")];
// can you tell it's there? (sneaky ones only with luck and a good eye; fixed per part of the day)
function beastSeen(c){const cr=c.creature;if(!cr)return false;const P=prof(cr);if(P.see>=1)return true;const k=state.day*3+state.pi+":"+c.i;
  if(cr.sk!==k){cr.sk=k;cr.sv=Math.random()<P.see+SETUP.P*(cr.p==="stalker"?.05:.035)+(cr.close?.1:0)}return cr.sv}
function makeCreature(b){const g=CREATURES[B2G[b]||"green"];const [n,lo,hi]=g[Math.floor(R()*g.length)];const m=R()<.35?MODS[Math.floor(R()*MODS.length)]:null;return{n,lo,hi,mod:m,p:PROF[n]||"brute"}}
const cells=pts.slice(0,NREAL).map((p,i)=>{
  let bb=null,bd=1e9;bseeds.forEach(([b,x,y])=>{const d=Math.hypot(x-p[0],y-p[1])+R()*50;if(d<bd){bd=d;bb=b}});
  const poly=vor.cellPolygon(i);
  const cx=poly.reduce((a,q)=>a+q[0],0)/poly.length, cy=poly.reduce((a,q)=>a+q[1],0)/poly.length;
  const dc=Math.hypot(cx-W/2,cy-H/2);
  nameIdx[bb]=(nameIdx[bb]||0)+1;const nm=NAMES[bb][(nameIdx[bb]-1)%NAMES[bb].length];
  return {i,poly,cx,cy,dc,biome:bb,name:nm,nb:[...del.neighbors(i)].filter(n=>n<NREAL)};
});
let corn=0;cells.forEach(c=>{if(c.dc<cells[corn].dc)corn=c.i});
cells[corn].biome="cornucopia";cells[corn].name="Cornucopia";
const maxd=Math.max(...cells.map(c=>c.dc));
cells.forEach(c=>{c.closed=false;c.closing=false});
cells.forEach(c=>{const xs=c.poly.map(q=>q[0]),ys=c.poly.map(q=>q[1]);c.bx=Math.min(...xs);c.by=Math.min(...ys);c.bw=Math.max(...xs)-c.bx;c.bh=Math.max(...ys)-c.by});
// per-area personality
cells.forEach(c=>{if(c.biome==="cornucopia"){c.tags=["rich","exposed"];return}
  c.tags=pickTags(c.biome);c.hazard=c.tags.includes("hazard")?pickHazard(c.biome):null;
  c.water=c.biome==="lake"?"clean":c.biome==="swamp"?"murky":null;
  if(R()<.2){const r=R();if(r<.55)c.creature=makeCreature(c.biome);else if(r<.8)c.ration=true;else{const s=STRUCT.find(([,ok])=>ok.includes(c.biome));if(s){c.struct=s[0];if(s[0]==="Oasis")c.water="clean"}}}
});
// starting cell: inner edge of the ring, made calm so the opening isn't a death trap
let start=corn;cells[corn].people=null;cells[corn].visited=true;cells[corn].seen=true;cells[corn].nb.forEach(n=>cells[n].seen=true);
// guarantee one creature and one structure near the start so the systems show up early
(()=>{const s=cells[start];const nb=s.nb.map(n=>cells[n]).filter(c=>!c.closed);
  if(!nb.some(c=>c.creature)){const c=nb.find(c=>!c.people&&c.biome!=="cornucopia");if(c)c.creature=makeCreature(c.biome)}
  const ring2=[...new Set(nb.flatMap(c=>c.nb))].map(n=>cells[n]).filter(c=>!c.closed&&c.i!==start&&!c.creature);
  if(!ring2.some(c=>c.struct)){const c=ring2.find(c=>STRUCT.some(([,ok])=>ok.includes(c.biome)))||ring2[0];if(c){const s=STRUCT.find(([,ok])=>ok.includes(c.biome));c.struct=s?s[0]:"Abandoned Shelter";if(c.struct==="Oasis")c.water="clean"}}
})();
// senses: derived from what is really there
const SENSE={water:{c:"#8fb4ff",t:"Running water"},steps:{c:"#ece8e3",t:"Footsteps — someone alone"},beast:{c:"#ff8f7d",t:"Something big breathing"},smoke:{c:"#e9a23b",t:"Smoke and heat — fire"},crowd:{c:"#ece8e3",t:"Voices, more than one"}};
let READY=false;
function refreshSenses(){cells.forEach(c=>{const b=c.creature&&(!READY||beastSeen(c));c.sense=c.burning?"smoke":b?"beast":c.people?c.people:c.water?"water":null;c.senseT=b?prof(c.creature).t:null})}
refreshSenses();
const HAZ={heat:{n:"Heat",t:"The heat drains your strength.",peek:"Heat shimmers over the ground.",tone:"r"},cold:{n:"Cold",t:"Cold bites through your clothes.",peek:"Frost on everything.",tone:"b"},
  flooded:{n:"Flooded",t:"Water tugs at every step.",peek:"Standing water, knee-deep.",tone:"b"},toxic:{n:"Fumes",t:"A sharp chemical smell stings your lungs.",peek:"A chemical stink drifts from there.",tone:"y"},
  unstable:{n:"Loose ground",t:"The ground here is treacherous.",peek:"Loose rock. Careful.",tone:"y"}};
const TAGTXT={exposed:["Exposed","Open ground. Easy to be seen, hard to hide.","m"],sheltered:["Sheltered","Cover here. Rest comes easier and nights are safer.","g"],rich:["Supplies","People left things here. Worth a search.","g"],quiet:["Quiet","Few people pass through.","m"],hazard:null};
const STRUCTTXT={"Safe Cave":"A cave mouth, dry inside.","Oasis":"Palms, and water under them.","Fruit Tree":"A tree heavy with fruit.","Abandoned Shelter":"A shelter with a door that still shuts."};
const FORAGE={forest:["fruit","roots"],jungle:["fruit","fruit","roots"],woods:["roots","fruit"],plains:["roots"],savanna:["roots"],lake:["fish"],swamp:["fish","roots"],mountain:["roots"],caatinga:["roots"],tundra:[],glacier:[],desert:[],industrial:[],cornucopia:[]};
const LOOSE=["knife","club","pack","pack","bottle","band","potion","camo","net","firstaid","kit","stim","spear","axe"];
cells.forEach(c=>{c.ground=[];if(c.biome==="cornucopia")return;const n=c.tags.includes("rich")?2:R()<.22?1:0;
  for(let k=0;k<n;k++)c.ground.push({id:LOOSE[Math.floor(R()*LOOSE.length)],hidden:R()<.5})});
const sheltered=c=>c.tags&&c.tags.includes("sheltered")||c.struct==="Safe Cave"||c.struct==="Abandoned Shelter";

const state={you:start,day:3,phase:"Afternoon",alive:Math.round(SETUP.players*.58),trail:[],
  journal:[{d:2,t:"A cannon, far off. Thirteen faces in the sky."},{d:3,t:"Morning. You wake stiff, the fire cold."},{d:3,t:"You move into the "+cells[start].name.toLowerCase()+"."},{d:3,t:"You drink until your stomach aches."}]};

const ICON={water:'<path d="M8 2.2C8 2.2 4.2 6.8 4.2 9.6a3.8 3.8 0 0 0 7.6 0C11.8 6.8 8 2.2 8 2.2Z"/><path d="M6.3 10.2a1.8 1.8 0 0 0 1.5 1.6"/>',
steps:'<path d="M5 3.2c1.2 0 1.7 1.3 1.6 2.8S5.9 8.6 5 8.6 3.5 7.4 3.4 6 3.8 3.2 5 3.2Z"/><path d="M11 7.4c1.2 0 1.7 1.3 1.6 2.8s-.7 2.6-1.6 2.6-1.5-1.2-1.6-2.6.4-2.8 1.6-2.8Z"/>',
beast:'<path d="M8 8.6c1.9 0 3.3 1.6 3.3 3 0 1.1-1 1.6-1.9 1.4-.6-.1-1-.3-1.4-.3s-.8.2-1.4.3c-.9.2-1.9-.3-1.9-1.4 0-1.4 1.4-3 3.3-3Z"/><circle cx="4" cy="7" r=".9"/><circle cx="6.4" cy="4.4" r=".9"/><circle cx="9.6" cy="4.4" r=".9"/><circle cx="12" cy="7" r=".9"/>',
smoke:'<path d="M6 13.5c-1.6-1.6 1.6-2.6 0-4.4s1.4-2.8 0-4.6"/><path d="M10.2 13.5c-1.6-1.6 1.6-2.6 0-4.4s1.4-2.8 0-4.6"/>',
crowd:'<circle cx="5.6" cy="5.4" r="1.9"/><circle cx="10.8" cy="6" r="1.5"/><path d="M2.4 12.6c.5-2.2 1.8-3.2 3.2-3.2s2.7 1 3.2 3.2"/><path d="M9.6 12.2c.4-1.6 1.1-2.4 2.1-2.4s1.7.8 2 2.4"/>'};
const ACT={hide:"You press into the reeds and hold your breath.",forage:"You dig through the mud. Two bitter roots, better than nothing.",rest:"You sit with your back to a tree. Your legs stop shaking.",bandage:"You wrap the cut tight. It still throbs, but it holds.",
search:"You comb the ground. A broken arrow, a strip of cloth.",climb:"From the branches you see smoke far to the north.",snare:"You bend a sapling and tie the wire. Maybe by morning.",eat:"You eat the bread slowly, crumb by crumb.",drink:"Warm water, tasting of tin.",swap:"You tuck the club into your belt.",call:"You whisper into the dark. No answer, then a twig snaps."};
let VARIANT="side";
const NOTES={radial:"Ações em anel à volta de ti. Sem caixa: o texto vai para o log, só o nome e o perigo ficam junto ao ponto.",pill:"Uma cápsula fina por baixo do ponto: uma linha de texto e ações em ícone (nome no hover).",side:"Painel de cena: ações sugeridas no topo, o que existe à tua volta e a tua mochila sempre à vista (sem menu escondido). Situações com outros tributos aparecem só quando acontecem.",card:"O cartão quadrado atual, para comparar."};
const AIC={forage:'<path d="M3 13C3 7 7 3 13 3c0 6-4 10-10 10Z"/><path d="M3 13l6-6"/>',rest:'<path d="M12.5 10.5A5.5 5.5 0 0 1 5.5 3.5a5.5 5.5 0 1 0 7 7Z"/>',bandage:'<path d="M6 2.5h4v3.5h3.5v4H10v3.5H6V10H2.5V6H6z"/>',hide:'<path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8Z"/><path d="M2.5 13.5l11-11"/>',more:'<circle cx="3.5" cy="8" r=".9"/><circle cx="8" cy="8" r=".9"/><circle cx="12.5" cy="8" r=".9"/>'};
const svgI=k=>`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${AIC[k]}</svg>`;
const DIRS=["east","south-east","south","south-west","west","north-west","north","north-east"];
function dirOf(a,b){const ang=Math.atan2(b.cy-a.cy,b.cx-a.cx);return DIRS[(Math.round(ang/(Math.PI/4))+8)%8]}

// ---------- game ----------
const PH=["Morning","Afternoon","Evening"];
Object.assign(state,{day:1,pi:0,phase:"Morning",hp:100,en:85,thirst:0,bleed:false,band:0,bread:0,flask:0,poison:0,snare:null,modal:null,fx:[],dead:false,prev:null,ring:.72,bloodbath:true,alive:SETUP.players});
state.journal=[{d:1,t:"The plate rises. Light. Sixty seconds on the clock."},{d:1,t:"The gong."}];
const DNAMES={"1":{"first":["Amira","Zahra","Soraya","Nayeli","Samira","Laila","Inara","Yara","Aisha","Zuleika","Farah","Malika","Esmeria","Aziza","Kalila","Naima","Sahar","Mireya","Jasira","Alina"],"last":["Zahiri","Amarat","Qalir","Samheen","Dorai","Kalem","Azhar","Lumari","Sahal","Mireth","Alqen","Raziq","Belanir","Yashim","Kareth","Inzari","Solune","Fariel","Naqem","Jassur"]},"2":{"first":["Aresia","Kael","Dario","Tarek","Malik","Rayan","Idris","Basil","Oren","Samir","Kadir","Enzo","Nadir","Ilias","Omar","Farid","Zahir","Lucan","Adil","Arman"],"last":["Kadar","Barak","Tharun","Malrek","Qorin","Zaim","Dorsha","Rakhim","Talvek","Ashkar","Borun","Hadrim","Kalzor","Nemat","Yorgal","Fashir","Kurad","Zorim","Ardash","Belkar"]},"3":{"first":["Neo","Ivo","Elia","Noa","Soren","Tao","Lin","Kai","Riku","Zev","Milo","Arun","Ezra","Yuki","Aiko","Nilo","Remi","Io","Sami","Lior"],"last":["Lin","Var","Solk","Nema","Tesh","Kiro","Anix","Rell","Ikan","Mova","Zyn","Kesh","Ulon","Pher","Yuto","Sarn","Oxi","Leth","Kova","Tain"]},"4":{"first":["Nerina","Kaiara","Moana","Luan","Yumi","Nerea","Amani","Talia","Maris","Sirah","Iara","Calan","Miro","Nael","Selka","Rhea","Anahí","Sumi","Dilan","Aris"],"last":["Maru","Narel","Kalua","Senda","Aroha","Lemor","Iqari","Tavek","Yorin","Selu","Amaru","Koral","Nemi","Ulani","Varek","Moeri","Talua","Iskai","Ruma","Kaien"]},"5":{"first":["Luxa","Elen","Zain","Kira","Solan","Iri","Nox","Aven","Ciro","Anil","Rumi","Vega","Asha","Orion","Luma","Eron","Sena","Timo","Kali","Ylen"],"last":["Zahir","Lumen","Ankor","Keshan","Virek","Solari","Yelem","Arqan","Tivar","Helun","Qiro","Satek","Nural","Ixon","Belor","Rasen","Kadin","Elzar","Orel","Syk"]},"6":{"first":["Ruta","Mavi","Iker","Nilo","Dara","Jano","Kemi","Lior","Enai","Rami","Olin","Zola","Teo","Sira","Yara","Arel","Noem","Pavi","Kato","Elun"],"last":["Rava","Nomu","Kair","Tarek","Ulto","Sivan","Jorel","Pash","Nexo","Odan","Yarek","Vilo","Enra","Zair","Kodo","Luma","Rish","Toma","Aven","Deru"]},"7":{"first":["Cedra","Ilex","Rowan","Silan","Tora","Ligna","Bira","Yvon","Arvo","Nara","Olin","Faye","Timo","Elow","Suri","Kaori","Brisa","Iara","Lume","Viro"],"last":["Arvo","Lignar","Koru","Temba","Yari","Selan","Borel","Noki","Iram","Farel","Tika","Oren","Silu","Maku","Kaori","Vesh","Rokan","Elun","Pira","Naru"]},"8":{"first":["Seda","Lila","Yuna","Mire","Anisa","Tessa","Imani","Rina","Soli","Nema","Cora","Avel","Lina","Sira","Malu","Kesi","Zira","Asha","Meli","Ylen"],"last":["Sari","Luma","Anan","Tilu","Kesi","Miraq","Zena","Rinu","Avel","Kora","Yani","Meli","Soli","Nira","Pashu","Esha","Tami","Ravel","Ina","Kalu"]},"9":{"first":["Ciro","Mila","Jara","Enai","Olin","Sima","Kavi","Ruel","Dara","Noem","Iara","Tavi","Luma","Arel","Sami","Yori","Bina","Elan","Nuri","Sol"],"last":["Tera","Amil","Kavi","Selo","Jara","Noma","Ruma","Padi","Elan","Kora","Bani","Suma","Tavi","Aru","Deka","Muna","Sori","Lani","Omi","Hela"]},"10":{"first":["Tau","Brava","Ivo","Lobo","Nara","Kora","Juno","Aric","Madu","Taro","Bela","Kito","Rumi","Sela","Zeca","Duna","Bori","Cora","Iman","Vela"],"last":["Tau","Brak","Selo","Kora","Rumo","Daro","Belaq","Vanu","Kesh","Iram","Lodo","Nara","Tamu","Orek","Bori","Sika","Garo","Paku","Madu","Reka"]},"11":{"first":["Amadou","Ayo","Zuri","Kofi","Dandara","Nala","Sefu","Imani","Ayana","Binta","Kaleb","Jamila","Omari","Lemba","Amina","Tafari","Nuru","Sade","Kwame","Zola"],"last":["Okoye","Dlamin","Mbala","Quila","Nzuri","Abeni","Kalunga","Tunde","Sanko","Amari","Zemba","Lemba","Makori","Ayode","Jafari","Bantu","Sefu","Nago","Tola","Kintu"]},"12":{"first":["Cinza","Lio","Bram","Iva","Nox","Doro","Kela","Sila","Jax","Rena","Vico","Marn","Tesa","Orel","Fira","Ciro","Lume","Noa","Eron","Katniss","Kali"],"last":["Kora","Ashen","Nox","Brum","Sile","Daro","Lume","Kren","Marn","Orel","Tesk","Fira","Gorn","Reka","Zim","Cavo","Nira","Vesh","Everdeen","Kalo","Drim"]}};
const TRADE={1:"Luxury",2:"Masonry",3:"Technology",4:"Fishing",5:"Power",6:"Transport",7:"Lumber",8:"Textiles",9:"Grain",10:"Livestock",11:"Agriculture",12:"Mining"};
const ROSTER=(()=>{const per=SETUP.players/12;const slots=[];for(let d=1;d<=12;d++)for(let k=0;k<per;k++)slots.push([d,k%2?"m":"f"]);
  const mine=slots.findIndex(x=>x[0]===SETUP.district);slots.splice(mine,1);const used=new Set();
  return slots.map(([d,g])=>{const p=DNAMES[d];let f,t=0;do{f=p.first[Math.floor(Math.random()*p.first.length)]}while(used.has(f)&&t++<50);used.add(f);return[f,d,g,p.last[Math.floor(Math.random()*p.last.length)]]})})()
 .map(([n,d,g,l])=>{const career=d<=4;const str=career?.62+Math.random()*.2:.3+Math.random()*.25;
   return{n,last:l,d,g,str,career,weapon:career?["spear","sword","knife"][Math.floor(Math.random()*3)]:["hatchet","knife","sling","bare hands"][Math.floor(Math.random()*4)],hurt:Math.random()<.3,know:null}});
const PARTNER=ROSTER.find(r=>r.d===SETUP.district)||null;
const CAREER_ME=SETUP.district<=4;
const pr=f=>f.g==="f"?{s:"she",S:"She",o:"her",p:"her"}:{s:"he",S:"He",o:"him",p:"his"};
Object.assign(state,{fallen:[],todayDead:[],cannon:null,cause:null,place:null,moments:[],total:SETUP.players,allies:[]});

const aliveR=()=>ROSTER.filter(r=>!r.dead);
function recapRows(){const rows=state.fallen.map(r=>({n:r.n,dt:r.d,d:r.obit?r.obit.d:r.deadDay,p:r.obit?r.obit.p:"",how:r.obit?r.obit.how:"Fell",where:r.obit?r.obit.where:""}));
  if(state.dead){const da=state.deathAt||{d:state.day,p:PH[state.pi],where:""};rows.push({n:"You",dt:SETUP.district,d:da.d,p:da.p,how:state.cause,where:da.where,me:true});
    const e=state.end;if(e){e.standings.slice(1).reverse().forEach(x=>{const o=x;const ord=(e.order||[]).find(z=>z.r===x.r)||{};rows.push({n:x.r.n,dt:x.r.d,d:x.d,p:"",how:ord.how||"Fell",where:ord.where||""})});
      rows.push({n:e.victor.n,dt:e.victor.d,d:e.lastDay,win:true,how:`Won the ${state.games||74}th Games`,where:""})}}
  else rows.push({n:"You",dt:SETUP.district,d:state.day,win:true,me:true,how:`Won the ${state.games||74}th Games`,where:""});
  return rows}
function M(t){state.moments.push({d:state.day,p:PH[state.pi],t})}
function kill(r,how,where){r.dead=true;r.deadDay=state.day;r.obit={d:state.day,p:PH[state.pi],how:how||"Fell somewhere in the arena",where:where||(cells[r.at!=null?r.at:state.you]||{}).name};state.fallen.push(r);state.todayDead.push(r);state.alive--;if(r.ally){r.ally=false;state.allies=state.allies.filter(a=>a!==r);L(`${r.n} didn't come back.`);M(`You lost ${r.n}, your ally.`)}}
function know(r,rel,note){r.know={rel,note,day:state.day,where:cells[state.you].name}}
function nextFace(){const pool=aliveR().filter(r=>!(state.modal&&state.modal.foe===r));const r=pool[Math.floor(Math.random()*pool.length)];if(r)kill(r);return r}
function ending(){const left=aliveR();const killer=state.pendingKiller;
  let victor=killer&&!killer.dead&&Math.random()<.5?killer:left[Math.floor(Math.random()*left.length)];
  const rest=left.filter(r=>r!==victor).sort(()=>Math.random()-.5);
  const lastDay=state.day+Math.max(1,Math.ceil(left.length/3));
  const open=cells.filter(c=>!c.closed);const order=rest.map((r,k)=>({r,d:Math.min(lastDay,state.day+1+Math.floor(k/3)),where:open[Math.floor(Math.random()*open.length)].name}));
  order.forEach((o,k)=>{const later=[...order.slice(k+1).map(x=>x.r),victor];const by=k===order.length-1?victor:Math.random()<.7?later[Math.floor(Math.random()*later.length)]:null;
    o.how=by?`Killed by ${by.n}`:["Taken by a mutt","Lost when the ground closed","Died of their wounds","Caught in the open by the Gamemakers"][Math.floor(Math.random()*4)];
    if(k===order.length-1)o.how+=", in the final fight"});
  const standings=[{rank:1,r:victor,d:lastDay,win:true},...order.slice().reverse().map((o,k)=>({rank:k+2,r:o.r,d:o.d}))];
  let fate=null;if(killer){if(killer===victor)fate=`${killer.n} went on to win.`;else{const o=order.find(x=>x.r===killer);if(o)fate=`${killer.n} fell on day ${o.d}, in the ${o.where.toLowerCase()}.`;else if(killer.dead)fate=`${killer.n} was already gone.`}}
  return{victor,lastDay,standings,fate,order}}
function die(cause){state.cause=cause;state.place=state.alive;state.alive--;state.dead=true;state.end=ending();state.modal={k:"dead"};state.deathAt={d:state.day,p:PH[state.pi],where:cells[state.you].name}}
const LBL={forage:"Forage",rest:"Rest",bandage:"Bandage",hide:"Hide",drinkHere:"Drink",drink:"Drink from the flask",eat:"Eat the bread",search:"Search the ground",climb:"Climb and look",snare:"Set a snare",call:"Call out softly",swap:"Put the club away",go:"Go",
  grab:"Grab a pack",loot:"Run for the supplies",leftovers:"Search the leftovers",cave:"Shelter in the cave",shelterIn:"Hole up in the shelter",oasis:"Drink at the oasis",fruit:"Pick fruit",ration:"Take the ration"};
const SUBT={forage:"roots, maybe",rest:"catch your breath",bandage:"stop the bleeding",hide:"keep still",drinkHere:"fill the flask too",drink:"half a mouthful",eat:"your last",
  grab:"everyone wants one",loot:"weapons, packs, water",cave:"dry, out of sight",shelterIn:"walls, a door",oasis:"clean water",fruit:"ripe, heavy",ration:"Capitol food"};
Object.assign(AIC,{loot:'<path d="M4 6h8l-1 8H5z"/><path d="M6 6V4.5a2 2 0 0 1 4 0V6"/>',grab:'<path d="M4 6h8l-1 8H5z"/><path d="M6 6V4.5a2 2 0 0 1 4 0V6"/>',cave:'<path d="M2 13.5C2 7 4.5 3 8 3s6 4 6 10.5"/><path d="M5.5 13.5c0-3 1-5 2.5-5s2.5 2 2.5 5"/>',shelterIn:'<path d="M2.5 7.5 8 3l5.5 4.5V13h-11z"/><path d="M6.5 13V9.5h3V13"/>',
  oasis:'<path d="M8 2.2C8 2.2 4.2 6.8 4.2 9.6a3.8 3.8 0 0 0 7.6 0C11.8 6.8 8 2.2 8 2.2Z"/>',fruit:'<circle cx="8" cy="9.5" r="4"/><path d="M8 5.5c0-1.5 1-2.5 2.5-3"/>',ration:'<rect x="3" y="5" width="10" height="7" rx="1"/><path d="M3 8h10"/>',
  drinkHere:'<path d="M8 2.2C8 2.2 4.2 6.8 4.2 9.6a3.8 3.8 0 0 0 7.6 0C11.8 6.8 8 2.2 8 2.2Z"/>'});
function hpWord(){const h=state.hp;return h>80?"Unhurt":h>60?"Scratched":h>40?"Wounded":h>20?"Badly wounded":"Dying"}
function conds(){const c=[],you=cells[state.you];if(state.bleed)c.push(["Bleeding","r"]);if(state.poison>0)c.push(["Poisoned","y"]);
  if(state.thirst>=3)c.push(["Parched","r"]);else if(state.thirst>=2)c.push(["Thirsty","b"]);if(state.en<35)c.push(["Hungry","y"]);
  if(you.hazard==="cold"&&!sheltered(you))c.push(["Cold","b"]);if(you.hazard==="toxic")c.push(["Coughing","y"]);if(you.hazard==="flooded")c.push(["Soaked","b"]);if(you.hazard==="heat")c.push(["Overheating","r"]);if(state.camo>0)c.push(["Camouflaged","g"]);return c}
function bfsTo(from,pred){const prev=new Map([[from,null]]);const q=[from];
  while(q.length){const c=q.shift();if(c!==from&&pred(cells[c])){let s=c,d=1;while(prev.get(s)!==from){s=prev.get(s);d++}return{goal:c,step:s,dist:d}}
    for(const n of cells[c].nb){if(!prev.has(n)&&!cells[n].closed&&!cells[n].burning){prev.set(n,c);q.push(n)}}}return null}
const hasWater=c=>!!c.water;
// ---------- world event (storm / fog / fire / scarcity), same four types as the real game ----------
const EV_TYPES=["storm","fog","fire","scarcity"];
const EVENT={type:EV_TYPES[Math.floor(Math.random()*4)],start:2,end:3,on:false,announced:false};
try{const q=new URLSearchParams(location.search);const forced=q.get("event");if(EV_TYPES.includes(forced))EVENT.type=forced;if(q.get("eventday")){EVENT.start=+q.get("eventday");EVENT.end=EVENT.start+1}}catch(e){}
const EVTXT={storm:{n:"Storm",ann:"Attention, tributes. A storm is coming. We suggest you find cover.",ic:"⛈",hint:"Exposed places will hurt."},
  fog:{n:"Fog",ann:"Attention, tributes. Visibility will be… limited.",ic:"≋",hint:"You can't sense what's around you."},
  fire:{n:"Fire",ann:"Attention, tributes. The Gamemakers have lit a fire.",ic:"🔥",hint:"It spreads every few hours."},
  scarcity:{n:"Scarcity",ann:"Attention, tributes. Supplies in the arena have been… reduced.",ic:"∅",hint:"Foraging will find little."}};
function startEvent(){EVENT.on=true;EVENT.announced=true;
  if(EVENT.type==="fire"){const you=cells[state.you];const far=cells.filter(c=>!c.closed&&Math.hypot(c.cx-you.cx,c.cy-you.cy)>500&&Math.hypot(c.cx-you.cx,c.cy-you.cy)<760);
    const o=far[Math.floor(Math.random()*far.length)]||cells[corn];o.burning=true;EVENT.from=dirOf(you,o)}
  refreshSenses();state.modal={k:"broadcast",t:EVTXT[EVENT.type].ann,sub:EVENT.type==="fire"?`Smoke rises to the ${EVENT.from}.`:EVTXT[EVENT.type].hint};
  L(`The Capitol speaks: ${EVTXT[EVENT.type].ann}`);M(`The Capitol sent a ${EVTXT[EVENT.type].n.toLowerCase()}.`)}
function spreadFire(){const burning=cells.filter(c=>c.burning);burning.forEach(c=>{c.nb.map(n=>cells[n]).filter(n=>!n.closed&&!n.burning&&!n.burnt&&!n.water).sort(()=>Math.random()-.5).slice(0,1).forEach(n=>{if(Math.random()<.7)n.burning=true})});refreshSenses()}
function endEvent(){EVENT.on=false;if(EVENT.type==="fire")cells.forEach(c=>{if(c.burning){c.burning=false;c.burnt=true}});refreshSenses();L(`The ${EVTXT[EVENT.type].n.toLowerCase()} is over.`)}
// ---------- what your body wants ----------
function intention(){const r0=intention0();if(r0.to!=null&&!cells[r0.to])delete r0.to;if(r0.a==="go"&&r0.to==null)return{a:"hide",u:r0.u,t:r0.t.replace(/ Head inward.*|— .*|Get out.*/,"")+" There's nowhere to go. Get low."};return r0}
function intention0(){const you=cells[state.you];const nb=you.nb.map(n=>cells[n]).filter(c=>!c.closed&&!c.burning);
  const fogged=EVENT.on&&EVENT.type==="fog"&&SETUP.P<8;const beastNb=fogged?null:you.nb.map(n=>cells[n]).find(c=>c.creature&&!c.closed&&beastSeen(c));
  const away=(pred)=>nb.filter(pred).sort((a,b)=>a.dc-b.dc)[0];
  if(state.bloodbath&&you.biome==="cornucopia"&&nb.length){const run=nb.slice().sort((a,b)=>(b.tags.includes("sheltered")?1:0)-(a.tags.includes("sheltered")?1:0)||(a.creature&&beastSeen(a)?1:0)-(b.creature&&beastSeen(b)?1:0))[0];
    return{a:"loot",to:run.i,u:true,t:"The gong. Everyone is sprinting for the supplies. Go for the loot — or run while they fight."}}
  if(you.burning){const t=away(c=>!c.burning)||nb[0];if(t)return{a:"go",to:t.i,u:true,t:`Fire! The air is burning. Get out — ${dirOf(you,t)}, now.`}}
  if(state.bleed&&state.band>0)return{a:"bandage",t:"The cut on your arm keeps opening. Bind it before it gets worse."};
  if(you.nb.some(n=>cells[n].burning)){const fire=you.nb.map(n=>cells[n]).find(c=>c.burning);const t=nb.slice().sort((a,b)=>Math.hypot(b.cx-fire.cx,b.cy-fire.cy)-Math.hypot(a.cx-fire.cx,a.cy-fire.cy))[0];if(t)return{a:"go",to:t.i,u:true,t:`The fire is in the ${fire.name.toLowerCase()}, ${dirOf(you,fire)} of you. Move away from it.`}}
  if(you.hazard==="toxic"){const t=away(c=>c.hazard!=="toxic");if(t)return{a:"go",to:t.i,t:`Your lungs burn. Get out of the fumes — ${dirOf(you,t)}.`}}
  if(you.closing){const r=bfsTo(state.you,c=>!c.closing&&!c.closed);if(r){const st=cells[r.step];const far=r.dist>1?` Safe ground is ${r.dist} moves away.`:"";
    return{a:"go",to:st.i,u:true,t:state.pi===2?`This ground is gone by morning, and you with it. Move now — ${dirOf(you,st)}.`:`This area disappears tonight. Anyone still here dies. Head ${dirOf(you,st)}.${far}`}}}
  if(EVENT.on&&EVENT.type==="storm"&&!sheltered(you)){if(you.struct==="Safe Cave")return{a:"cave",t:"Thunder. Get into the cave."};const r=bfsTo(state.you,sheltered);if(r&&r.dist<=2)return{a:"go",to:r.step,t:`The storm is on you. There's cover to the ${dirOf(you,cells[r.step])}.`};return{a:"hide",t:"The storm is on you and there's nowhere to go. Get low."}}
  if(state.thirst>=2){
    if(you.struct==="Oasis")return{a:"oasis",t:"Palms. Water under them. Drink."};
    if(you.water)return{a:"drinkHere",t:you.water==="murky"?"Water — brown and warm, but water.":"Water, at last. Drink before anything else."};
    if(state.flask)return{a:"drink",t:"Your mouth is dry. There's a little left in the flask."};
    const r=bfsTo(state.you,hasWater);
    if(r){const st=cells[r.step];return{a:"go",to:r.step,t:(you.hazard==="heat"?"The heat is cooking you. ":"Your mouth is dry. ")+(r.dist===1?`You can hear water to the ${dirOf(you,st)}.`:`There was water somewhere ${dirOf(you,cells[r.goal])}, past the ${st.name.toLowerCase()}.`)}}}
  if(beastNb){const hp=prof(beastNb.creature).hunt;const away=hp?nb.filter(c=>!c.creature&&!beastNb.nb.includes(c.i)&&c.i!==beastNb.i).sort((a,b)=>a.dc-b.dc)[0]:null;
    if(away)return{a:"go",to:away.i,t:`Something to the ${dirOf(you,beastNb)} has your scent. Keep moving — ${dirOf(you,away)}.`};
    return{a:"hide",t:`Something big is breathing to the ${dirOf(you,beastNb)}. Keep still.`}}
  if(you.hazard==="cold"&&state.pi>=1&&!sheltered(you)){if(you.struct)return{a:you.struct==="Safe Cave"?"cave":"shelterIn",t:"Night is coming and the cold with it. Get inside."};const r=bfsTo(state.you,sheltered);if(r)return{a:"go",to:r.step,t:`Night is coming and the cold will be worse. Find cover — ${dirOf(you,cells[r.step])}.`}}
  if(you.closing&&nb.length){const inward=nb.slice().sort((a,b)=>a.dc-b.dc)[0];return{a:"go",to:inward.i,t:`This edge of the arena is dying. Better to drift inward, ${dirOf(you,inward)}.`}}
  if(you.ration)return{a:"ration",t:"A silver parcel, half-buried. Capitol food."};
  if(state.en<40){if(state.bread)return{a:"eat",t:"Your hands are shaking. Eat."};if(you.struct==="Fruit Tree"&&!you.picked)return{a:"fruit",t:"Fruit, right above you. Eat."};return{a:"forage",t:"Your stomach is a fist. Find something to eat."}}
  if(state.hp<50){if(you.struct==="Safe Cave")return{a:"cave",t:"A dry cave. Rest where no one can see you."};return{a:"rest",t:"Every step costs you. Rest while it's quiet."}}
  const r=bfsTo(state.you,c=>c.biome==="cornucopia");
  if(r)return{a:"go",to:r.step,t:`You're steady. The Cornucopia lies ${dirOf(you,cells[r.goal])}: supplies, and people.`};
  return{a:"forage",t:"Quiet. A good time to gather."}}
function options(it){const you=cells[state.you];const pool=[];
  if(you.biome==="cornucopia"&&!state.bloodbath&&lootLeft())pool.push("leftovers");
  if(it.a==="loot")return["loot","go","hide"];
  if(you.struct==="Safe Cave")pool.push("cave");if(you.struct==="Abandoned Shelter")pool.push("shelterIn");if(you.struct==="Oasis")pool.push("oasis");if(you.struct==="Fruit Tree"&&!you.picked)pool.push("fruit");if(you.ration)pool.push("ration");
  if(you.water&&you.struct!=="Oasis")pool.push("drinkHere");
  if(state.band>0&&(state.bleed||state.hp<70))pool.push("bandage");
  pool.push("forage","rest","hide");
  return [it.a,...pool.filter(a=>a!==it.a)].slice(0,3)}
function forecast(a,to){if(a&&a.includes(":"))a=a.split(":")[0];const you=cells[state.you];const p=PH[state.pi].toLowerCase();let f="";
  const scarce=EVENT.on&&EVENT.type==="scarcity";
  switch(a){case"forage":{const pool=FORAGE[you.biome]||[];f=scarce?"The Capitol has stripped the arena.":!pool.length?"Not much grows here — but you might turn something up.":you.biome==="lake"||you.biome==="swamp"?"Fish in the shallows, maybe roots.":"Fruit, roots — whatever the ground gives."+(you.ground.some(g=>g.hidden)?" Something might be buried here.":"");if(state.bleed)f+=" You'll bleed while you search.";break}
  case"grab":f="Supplies, maybe a weapon. And everyone else wants them too.";break;
  case"forage":f=scarce?"The Capitol has stripped the arena. You'll find little.":you.biome==="desert"||you.hazard==="heat"?"Little grows here.":you.tags.includes("rich")?"Others have been through. Some leftovers, maybe.":"Something to eat, maybe.";if(state.bleed)f+=" You'll bleed while you dig.";break;
  case"rest":f=state.bleed?"Resting won't close the wound.":sheltered(you)?"Good cover. You'll mend.":you.tags.includes("exposed")?"Out in the open. You'll mend a little, and be seen.":"You'll mend a little.";if(you.closing)f+=" The ground here won't wait.";break;
  case"bandage":f=`The bleeding stops. ${state.band>1?"One roll left after this.":"Your last roll."}`;break;
  case"hide":f=state.bloodbath?"Flat behind a crate. If no one looks this way.":state.hideSpot&&state.hideSpot.i===you.i&&state.hideSpot.n>=1?"Same spot again. It gets harder every time.":you.nb.some(n=>cells[n].creature)?"It may pass you by.":you.tags.includes("exposed")?"Hard to hide out here.":"Safe — but the day slips away.";break;
  case"drinkHere":f=you.water==="murky"?"Thirst gone. The water might turn your stomach.":"Thirst gone, and the flask full.";break;
  case"oasis":f="Clean water. Thirst gone, and the flask full.";break;
  case"cave":f="Out of sight, out of the weather. You'll mend.";break;
  case"shelterIn":f="Four walls. Safe from the weather tonight.";break;
  case"fruit":f="Food for today and tomorrow.";break;
  case"ration":f="Real food. The kind that keeps.";break;
  case"drink":f="It takes the edge off. The flask will be empty.";break;
  case"eat":f="Strength comes back.";break;
  case"search":f=you.tags.includes("rich")?"People left things here. Worth a look.":"Slow. You might find something someone dropped.";break;
  case"climb":f="You'll see further — and be seen.";break;
  case"snare":f="Nothing now. Maybe food by morning.";break;
  case"call":f="Whoever's there will know where you are.";break;
  case"camo":f="For a day, you're hard to find. Fewer encounters, easier to hide.";break;
  case"net":f="Strung between trees. Food by morning — or something worse.";break;
  case"potion":f="Medicine or poison. Only one way to find out.";break;
  case"stim":f="Energy, all at once.";break;
  case"loot":f="Weapons, packs, water. And everyone else.";break;
  case"ground":f="Look at what's here. Taking things is quick.";break;
  case"leftovers":f="What the bloodbath left behind. Careers might still be close.";break;
  case"go":{const c=cells[to];const bits=[];
    if(c.burning)bits.push("It's burning.");else{if(!(EVENT.on&&EVENT.type==="fog")&&c.sense)bits.push(((c.sense==="beast"&&c.senseT)||SENSE[c.sense].t)+".");if(c.creature&&!beastSeen(c)&&c.creature.p==="ambusher"&&SETUP.P>=5&&!(EVENT.on&&EVENT.type==="fog"))bits.push("Too quiet.");if(c.hazard&&SETUP.P>=5)bits.push(HAZ[c.hazard].peek);else if(c.hazard)bits.push("Something about it feels wrong.");
      if(c.struct&&c.seen)bits.push(STRUCTTXT[c.struct]);if(EVENT.on&&EVENT.type==="fog")bits.push("The fog hides the rest.")}
    if(c.closing)bits.push("Gone tonight.");f=bits.join(" ")||"Quiet there.";break}}
  return f+` <span class="cost">${state.pi===2?"Takes your evening. Then night.":`Takes your ${p}.`}</span>`}
function L(t){state.journal.push({d:state.day,t})}
function perform(a,to){if(state.modal||state.dead)return;let arg=null;if(a&&a.includes(":"))[a,arg]=a.split(":");const you=cells[state.you];const fx=[];const scarce=EVENT.on&&EVENT.type==="scarcity";
  const bb=state.bloodbath;state.bloodbath=false;
  switch(a){
  case"grab":if(Math.random()<.5){state.band+=2;state.bread+=1;state.flask=1;M("You grabbed a pack at the Cornucopia.");L("You snatch an orange pack from the grass and run, bent double. Behind you, screaming.");fx.push(["+ bandages","g"],["+ food","g"],["+ flask","b"])}
    else{L("You get a hand on a pack — and someone else gets a hand on you.");startEncounter(true);return}break;
  case"forage":{state.en=Math.min(100,state.en+(scarce?3:8));
    const pool=FORAGE[you.biome]||[];let n=scarce?(Math.random()<.3?1:0):you.hazard==="heat"?(Math.random()<.3?1:0):1+(Math.random()<.45?1:0)+(you.tags.includes("rich")?1:0);
    const found=[];for(let k=0;k<n&&pool.length;k++)found.push(pool[Math.floor(Math.random()*pool.length)]);
    let revealed=0;you.ground.forEach(g=>{if(g.hidden&&Math.random()<.35+SETUP.P*.05){g.hidden=false;revealed++}});
    found.forEach(id=>you.ground.push({id,hidden:false,fresh:true}));
    L(found.length||revealed?`You search the ${you.name.toLowerCase()} on hands and knees.`:scarce?"Nothing. Someone — something — stripped this place.":"You search for hours. Nothing worth taking.");
    state.modal={k:"ground",mode:"forage",c:you.i,nothing:!found.length&&!revealed};rerenderAll();return}
  case"rest":{const gain=state.bleed?2:sheltered(you)?16:12;state.hp=Math.min(100,state.hp+gain);state.en=Math.min(100,state.en+10);L(state.bleed?"You sit, but the cut keeps seeping.":"You sit with your back to something solid. Your legs stop shaking.");fx.push(state.bleed?["still bleeding","r"]:["+ mended","g"]);break}
  case"cave":case"shelterIn":state.hp=Math.min(100,state.hp+(state.bleed?4:20));state.en=Math.min(100,state.en+12);state.sheltered=true;L(a==="cave"?"You crawl into the cave. Dry rock, and quiet.":"You pull the door shut behind you. For a while, the arena is outside.");fx.push(["+ mended","g"],["sheltered","b"]);break;
  case"bandage":M("You bound your own wound.");state.band--;state.bleed=false;state.hp=Math.min(100,state.hp+6);L("You wrap the cut tight. It throbs, but it holds.");fx.push(["bleeding stopped","g"]);break;
  case"hide":if(bb){state.bb.hid=true;if(Math.random()<.7){L("You flatten yourself behind a crate while the bloodbath happens around you. No one looks your way.");fx.push(["unseen","b"])}else{L("Someone sees you behind the crate.");startEncounter(true);return}break}
  {state.en=Math.max(0,state.en-5);const spot=state.hideSpot&&state.hideSpot.i===you.i?state.hideSpot.n+1:1;state.hideSpot={i:you.i,n:spot};
    const ok=Math.random()<.9-(spot-1)*.22-(you.tags.includes("exposed")?.25:0)+(sheltered(you)?.12:0)+(state.camo>0?.2:0);
    const b=you.nb.map(n=>cells[n]).find(c=>c.creature);
    if(b){const cr=b.creature,keen={hunter:.35,stalker:.3,skittish:.8,brute:.85,ambusher:1}[cr.p]??.7;
      if(ok&&Math.random()<keen){const to=b.nb.map(n=>cells[n]).find(c=>c.i!==state.you&&!c.closed&&!c.creature);if(to){to.creature=cr;b.creature=null;refreshSenses()}L(`You press yourself flat. The ${cr.n.toLowerCase()} passes, close enough to smell. Then it's gone.`);fx.push(["it passed","b"])}
      else if(prof(cr).hunt&&state.beastDay!==state.day){b.creature=null;you.creature=cr;cr.close=false;state.beastDay=state.day;L(`You press yourself flat. It doesn't matter. The ${cr.n.toLowerCase()} has your scent.`);refreshSenses();startBeast(you,true);return}
      else{state.hiddenNow=true;L("You stay low. Something big circles, then loses interest.");fx.push(["unseen","m"])}}
    else if(ok){state.hiddenNow=true;L(spot>=3?"The same hollow again. It still holds. For now.":EVENT.on&&EVENT.type==="storm"?"You curl up against the rain and wait it out.":"You stay low for hours. Nothing comes.");fx.push(["unseen","m"])}
    else{state.hiddenNow=false;state.foundOut=true;L(spot>=2?"You've used this spot too often. Someone has noticed.":you.tags.includes("exposed")?"There's nowhere to hide out here. Someone saw you go to ground.":"A twig snaps nearby. You've been seen.");fx.push(["seen","r"])}
    break}
  case"drinkHere":M(`You found water in the ${you.name.toLowerCase()}.`);state.thirst=0;if(state.flask>=0)state.flask=1;if(you.water==="murky"&&Math.random()<.35){state.poison=2;L("You drink the brown water. An hour later your stomach turns.");fx.push(["+ water","b"],["sick","y"])}else{L("You drink until your stomach aches, then fill the flask.");fx.push(["+ water","b"],["flask full","b"])}break;
  case"oasis":M("You drank at an oasis.");state.thirst=0;if(state.flask>=0)state.flask=1;L("Clean water under the palms. You drink, and drink, and fill the flask.");fx.push(["+ water","b"],["flask full","b"]);break;
  case"fruit":you.picked=true;state.bread+=2;state.en=Math.min(100,state.en+14);L("You climb and eat until the sweetness hurts. Two more for later.");fx.push(["+ food","g"]);break;
  case"ration":you.ration=false;state.bread+=2;state.en=Math.min(100,state.en+10);M("You found a Capitol ration.");L("Silver foil. Real bread, dried meat. Someone in the Capitol wanted this found.");fx.push(["+ food","g"]);break;
  case"drink":state.thirst=Math.max(0,state.thirst-2);state.flask=0;L("Warm water, tasting of tin.");fx.push(["+ water","b"]);break;
  case"eat":state.bread--;state.en=Math.min(100,state.en+22);L("You eat slowly, crumb by crumb.");fx.push(["+ strength","g"]);break;
  case"search":if(Math.random()<.4+(you.tags.includes("rich")?.25:0)+(SETUP.D-6)*.04){state.band++;L("In the dirt, a torn pack. Inside: a roll of bandage.");fx.push(["+ bandage","g"])}else{L("You comb the ground. A broken arrow, nothing more.");fx.push(["nothing","m"])}break;
  case"climb":{you.nb.forEach(n=>cells[n].nb.forEach(m=>cells[m].seen=true));const r=bfsTo(state.you,hasWater);L(r?`From up high you catch water glinting to the ${dirOf(you,cells[r.goal])}.`:"From up high: smoke, far off.");fx.push(["you see further","b"]);break}
  case"snare":state.snare=state.you;L("You bend a sapling and tie the wire. Maybe by morning.");fx.push(["snare set","m"]);break;
  case"call":{const s=you.nb.map(n=>cells[n]).find(c=>atCell(c.i).length);if(!s){L("You call out softly. Nothing answers.");fx.push(["no answer","m"]);break}
    const f=atCell(s.i)[0];f.at=state.you;presence();refreshSenses();L("You call out softly. A long silence. Then footsteps, coming closer.");startEncounter(false,f);return}
  case"camo":state.camo=4;state.gear.splice(+arg,1);L("You smear the paste over your skin and clothes. In the shade, you're hard to see.");fx.push(["camouflaged","g"]);break;
  case"net":state.gear.splice(+arg,1);state.net=state.you;L("You string the net low between two trunks. By morning, something.");fx.push(["net set","m"]);break;
  case"potion":{const g=state.gear[+arg];state.gear.splice(+arg,1);if(g&&g.kind==="medicine"){state.hp=Math.min(100,state.hp+30);state.bleed=false;state.poison=0;L("Bitter, then warm. The pain fades. Medicine.");fx.push(["+ healed","g"])}else{state.poison=3;state.poisonCause="The unlabelled flask was poison.";L("Bitter, then burning. Your vision swims. Poison.");fx.push(["poisoned","y"])}break}
  case"loot":state.bloodbath=bb;openLoot();return;
  case"stim":state.gear.splice(+arg,1);state.en=Math.min(100,state.en+40);L("The needle stings. Then your heart races and the tiredness is just… gone.");fx.push(["+ energy","g"]);break;
  case"ground":openGround("look");return;
  case"leftovers":openLoot();return;
  case"go":if(to==null||!cells[to])break;return moveTo(to)}
  state.fx=fx;advance()}
function moveTo(i){state.bloodbath=false;const c=cells[i],from=cells[state.you];state.trail.push(state.you);if(state.trail.length>4)state.trail.shift();state.prev=from.i;state.you=i;c.visited=true;c.seen=true;c.nb.forEach(n=>cells[n].seen=true);
  L(`You move ${dirOf(from,c)} into the ${c.name.toLowerCase()}${state.allies.length?`, ${state.allies.map(a=>a.n).join(" and ")} close behind`:""}.`);state.fx=[];state.en=Math.max(0,state.en-(from.hazard==="flooded"?8:4));
  if(from.hazard==="flooded")state.fx.push(["slow going","m"]);
  if(c.water)state.fx.push(["water here","b"]);
  if(c.hazard==="unstable"&&Math.random()<.35){state.hp-=6;state.fx.push(["− a fall","r"]);L("The ground slides under your foot. You go down hard.");state.lastHaz=`The ground in the ${c.name.toLowerCase()} gave way.`}
  if(c.burning){state.hp-=12;state.fx.push(["− burned","r"]);state.lastHaz=`The fire caught you in the ${c.name.toLowerCase()}.`}
  views.forEach(v=>v.resetCam());
  if(c.creature){startBeast(c);return}
  state.allies.forEach(a=>a.at=i);
  const there=atCell(i);const meet=there.length&&Math.random()<(state.camo>0?.45:c.tags.includes("exposed")?.95:.8);
  if(meet){const f=there.find(r=>r.pack)||there[Math.floor(Math.random()*there.length)];startEncounter(false,f);return}
  if(c.ground.some(g=>!g.hidden)&&!c.groundShown)state.pendingGround=c.i;
  advance()}
function advance(){const you=cells[state.you];state.calm=(state.calm||0)+1;
  // body
  const thirstUp=you.water?0:you.hazard==="heat"?1:.35;state.thirst=Math.min(3,state.thirst+thirstUp);state.en=Math.max(0,state.en-6);
  let why=null;const here=you.name.toLowerCase();
  if(state.bleed){state.hp-=6;state.fx.push(["− blood","r"]);why=`You bled out in the ${here}, alone.`}
  if(state.poison>0){state.poison--;state.hp-=4;state.fx.push(["− poison","y"]);why=why||state.poisonCause||"Something in your blood finished you."}
  if(state.thirst>=3){state.hp-=5;state.fx.push(["parched","r"]);why=why||(you.hazard==="heat"?`The heat and the thirst took you in the ${here}.`:`Thirst took you in the ${here}.`)}
  if(you.hazard==="heat"){state.en=Math.max(0,state.en-3);state.fx.push(["the heat","r"])}
  if(you.hazard==="cold"&&!sheltered(you)){state.en=Math.max(0,state.en-2)}
  if(you.hazard==="toxic"){state.hp-=3;state.fx.push(["− fumes","y"]);why=why||`The fumes in the ${here} finished what the wounds started.`}
  if(you.burning){state.hp-=12;state.fx.push(["− burned","r"]);why=`The fire caught you in the ${here}.`}
  if(EVENT.on&&EVENT.type==="storm"&&!sheltered(you)&&!state.sheltered){state.hp-=you.tags.includes("exposed")?6:3;state.fx.push(["− the storm","b"]);why=why||`The storm caught you out in the open, in the ${here}.`}
  if(you.burning)allyHarm(.35,"The fire takes them.");if(EVENT.on&&EVENT.type==="storm"&&you.tags.includes("exposed")&&!sheltered(you))allyHarm(.1,"The storm was too much.");
  const hidNow=state.hiddenNow;state.hiddenNow=false;state.lastHid=hidNow;if(state.camo>0)state.camo--;
  if(state.hp<=0){die(state.pendingCause||state.lastHaz||why||"Your body simply stopped.");return rerenderAll()}
  // allies help
  state.allies.forEach(a=>{if(Math.random()<.22){if(state.thirst>=2){state.thirst--;state.fx.push([`${a.n} shares water`,"b"])}else if(state.en<55){state.en=Math.min(100,state.en+12);state.fx.push([`${a.n} shares food`,"g"])}}});
  // world
  if(EVENT.on&&EVENT.type==="fire")spreadFire();
  if(state.day===1&&!state.bbDone&&cells[state.you].biome==="cornucopia"){const b=state.bb;
    let c=CAREER_ME?(SETUP.district===3?.3:.55):0;
    if(b.horn)c+=CAREER_ME?.25:.12;if(b.won)c+=CAREER_ME?.3:.15;if(b.horn&&b.won&&!CAREER_ME)c+=.08;
    if(b.hid&&!b.grabs&&!b.won)c-=.35;c+=(SETUP.S-6)*.04;
    if(Math.random()<Math.max(0,Math.min(.95,c))){state.packOffer=true;state.packWhy=b.won?`They saw what you did to ${b.won}.`:b.horn?`They saw you take the ${b.horn} from the horn.`:CAREER_ME?"District "+SETUP.district+". You trained for this.":""}}
  if(state.day===1&&!state.bbDone){state.bbDone=true;bloodbath();const d=state.deaths;state.deaths=[];cannonsFrom(d,"bloodbath")}
  else{npcTurn();const d=state.deaths;state.deaths=[];cannonsFrom(d,"day");const bc=muttsMove();if(bc)state.beastCome=bc.i;
    if(state.foundOut){state.foundOut=false;const near=npcs().filter(r=>cells[state.you].nb.includes(r.at)).sort((a,b)=>b.aggr-a.aggr)[0];if(near&&near.aggr>.35){(near.pack?npcs().filter(x=>x.pack&&x.at===near.at):[near]).forEach(x=>x.at=state.you);presence()}}
    const v=atCell(state.you);if(v.length&&!hidNow&&Math.random()<(state.camo>0?.3:.7))state.arrival=v.find(r=>r.pack)||v[0]}
  if(state.pi===2){
    // the night itself
    const cold=you.hazard==="cold"&&!sheltered(you)&&!state.sheltered;
    state.allies.forEach(a=>{if(!a.suspicious){const base=.04+(state.alive<=6?.25:0)+(a.career&&!CAREER_ME?(state.weakLink?.2:.12):0)+(a.career&&CAREER_ME&&state.alive<=8?.2:0)+(a===PARTNER?-.03:0);if(Math.random()<base)a.suspicious=true}});
    const faces=[...state.todayDead];state.modal={k:"night",n:faces.length,faces,cold,storm:EVENT.on&&EVENT.type==="storm",signs:state.allies.filter(a=>a.suspicious)}}
  else{state.pi++;state.phase=PH[state.pi];
    if(!EVENT.announced&&state.day>=EVENT.start&&state.pi>=1)startEvent()}
  state.lastHaz=null;
  if(state.beastCome!=null&&!state.modal&&!state.dead){const c=cells[state.beastCome];state.beastCome=null;state.arrival=null;if(c.creature&&c.i===state.you){L(`Something comes into the ${c.name.toLowerCase()}.`);startBeast(c,true);return}}
  state.beastCome=null;
  if(state.arrival&&!state.modal&&!state.dead&&state.alive>1){const f=state.arrival;state.arrival=null;L(`Someone steps into the ${cells[state.you].name.toLowerCase()}.`);startEncounter(false,f,true);return}
  state.arrival=null;
  if(state.alive<=1&&!state.dead&&!state.won){state.won=true;M("You were the last one standing.");state.modal={k:"win"}}
  if(state.packOffer&&!state.modal&&!state.dead){state.packOffer=false;const who=aliveR().filter(r=>r.career&&!r.know).slice(0,3);if(who.length>=2)state.modal={k:"pack",who}}
  if(state.pendingGround!=null&&!state.modal&&!state.dead){state.modal={k:"ground",mode:"enter",c:state.pendingGround};cells[state.pendingGround].groundShown=true}
  state.pendingGround=null;rerenderAll()}
// ---------- the other tributes live on the map (rules ported from the classic engine's ai.js / sim.js) ----------
const WPOW={spear:.17,sword:.2,knife:.09,hatchet:.12,sling:.08,axe:.16,trident:.18,bow:.17,club:.07,"bare hands":-.08};
ROSTER.forEach(r=>{const t=Math.max(0,Math.min(1,(r.d-1)/11));// district gradient: D1 aggressive … D12 cautious (makeTraits)
  r.aggr=Math.min(1,.25+Math.random()*.75*.8+(1-t)*.35-t*.05);r.caut=Math.min(1,.2+Math.random()*.8*.8+t*.35);r.greed=.15+Math.random()*.85;
  r.at=corn;r.wpow=WPOW[r.weapon]??0;r.pack=r.career});
const npcs=()=>ROSTER.filter(r=>!r.dead&&!r.ally);
const atCell=(i)=>npcs().filter(r=>r.at===i);
function presence(){cells.forEach(c=>c.people=null);npcs().forEach(r=>{const c=cells[r.at];c.people=c.people?"crowd":"steps"})}
// fight between two NPCs; district bias decides whether it happens (ai.js scoring, simplified)
function willFight(a,b){let s=.06+a.aggr*.22-a.caut*.12+Math.max(0,state.day-3)*.06;
  if(a.d===b.d)s-=.55;if(b.d===SETUP.district)s-=.1;
  const late=state.alive<=6;
  if(a.career&&b.career)s-=late?.0:.45;else if(a.career&&!b.career)s+=.2;else if(!a.career&&b.career)s-=.1;
  if(b.hurt)s+=.15;return Math.random()<Math.max(0,s)}
const HOW={fire:"Caught in the fire",fumes:"Choked on the fumes",closing:"Lost when the ground closed"};
function npcDeath(r,cause,by){const how=cause==="fight"&&by?`Killed by ${by.n}${by.weapon&&by.weapon!=="bare hands"?`, ${by.weapon} in hand`:""}`:cause==="mutt"&&by?`Taken by ${art(beastName(by))} ${beastName(by).toLowerCase()}`:HOW[cause];
  kill(r,how);state.deaths.push({r,at:r.at,cause})}
function npcFight(a,b){const pa=.5+(a.str-b.str)+(a.wpow-b.wpow)*1.5+(b.hurt?.15:0)-(a.hurt?.15:0);const [w,l]=Math.random()<pa?[a,b]:[b,a];
  if(Math.random()<.45||l.hurt){npcDeath(l,"fight",w);w.kills=(w.kills||0)+1;if(l.wpow>w.wpow){w.wpow=l.wpow;w.weapon=l.weapon}}else{l.hurt=true}}
function stepToward(r,pred){const res=bfsTo(r.at,pred);return res?res.step:null}
function npcTurn(){const you=state.you;state.deaths=state.deaths||[];
  const late=state.alive<=6;
  // the Careers move as one pack until it breaks
  const pack=npcs().filter(r=>r.pack&&!late);
  if(pack.length){const lead=pack[0];let to=null;const c=cells[lead.at];
    if(c.closing||c.burning)to=stepToward(lead,x=>!x.closing&&!x.closed&&!x.burning);
    else if(state.day<=2&&lead.at===corn&&Math.random()<.6)to=null; // guard the loot early
    else{const prey=bfsTo(lead.at,x=>atCell(x.i).some(r=>!r.pack)||x.i===you);if(prey&&Math.random()<(state.day<=2?.35:.6))to=prey.step;else if(Math.random()<.4){const nb=c.nb.filter(n=>!cells[n].closed&&!cells[n].closing);to=nb[Math.floor(Math.random()*nb.length)]}}
    if(to!=null)pack.forEach(r=>r.at=to)}
  // everyone else
  npcs().filter(r=>!(r.pack&&!late)).forEach(r=>{const c=cells[r.at];let to=null;
    if(c.closing||c.closed||c.burning||c.hazard==="toxic")to=stepToward(r,x=>!x.closing&&!x.closed&&!x.burning&&x.hazard!=="toxic");
    else if(Math.random()<.45-r.caut*.15){const nb=c.nb.filter(n=>{const x=cells[n];return!x.closed&&!x.closing&&!x.burning&&!(x.creature&&r.aggr<.7)});
      const score=n=>{const x=cells[n];let s=Math.random();if(x.tags.includes("sheltered"))s+=r.caut*.4;if(x.tags.includes("quiet"))s-=.2;if(x.tags.includes("rich")||x.ground.some(g=>!g.hidden))s+=r.greed*.4;if(atCell(n).some(o=>o.pack))s-=r.career?0:.8;if(x.i===corn&&state.day>1)s+=r.greed*.2-r.caut*.3;if(r.feast&&state.feast&&state.day<=state.feast.until)s+=(1-hops(n,corn,12)/12)*1.2;if(state.day>=4)s+=(1-x.dc/maxd)*(.25+.08*(state.day-4));return s};
      nb.sort((a,b)=>score(b)-score(a));to=nb[0]??null}
    if(to!=null)r.at=to});
  // what happens where they stand
  cells.forEach(c=>{const ppl=atCell(c.i);if(!ppl.length)return;
    if(c.creature&&Math.random()<.35){const v=ppl[Math.floor(Math.random()*ppl.length)];if(v.hurt||Math.random()<.45)npcDeath(v,"mutt",c.creature);else v.hurt=true}
    if(c.burning)ppl.forEach(v=>{if(!v.dead&&Math.random()<.4)npcDeath(v,"fire")});
    if(c.hazard==="toxic")ppl.forEach(v=>{if(!v.dead&&Math.random()<.08)npcDeath(v,"fumes")});
    if(EVENT.on&&EVENT.type==="storm"&&c.tags.includes("exposed"))ppl.forEach(v=>{if(!v.dead&&Math.random()<.12)v.hurt=true});
    const live=atCell(c.i);
    for(let k=0;k<live.length;k++)for(let j=k+1;j<live.length;j++){const a=live[k],b=live[j];if(a.dead||b.dead)continue;if(willFight(a,b)||willFight(b,a))npcFight(a,b)}
    // scavenge what's lying around
    const g=c.ground.filter(x=>!x.hidden);atCell(c.i).forEach(v=>{if(g.length&&Math.random()<v.greed*.5){const it=g.shift();c.ground.splice(c.ground.indexOf(it),1);const pw=IT[it.id]&&IT[it.id].pow;if(pw&&pw>v.wpow){v.wpow=pw;v.weapon=IT[it.id].n.toLowerCase()}}})});
  // the wounded slowly recover
  npcs().forEach(r=>{if(r.hurt&&Math.random()<.15)r.hurt=false});
  presence();refreshSenses()}
// the bloodbath, played out
function bloodbath(){state.deaths=[];const all=npcs();
  all.forEach(r=>{if(!r.career&&Math.random()<.35+r.caut*.4){const nb=cells[corn].nb.filter(n=>!cells[n].closed);r.at=nb[Math.floor(Math.random()*nb.length)]}
    else if(Math.random()<.5){const best=["sword","spear","bow","axe","trident"][Math.floor(Math.random()*5)];if(WPOW[best]>r.wpow){r.wpow=WPOW[best];r.weapon=best}}});
  for(let round=0;round<3;round++){const at=atCell(corn);for(let k=0;k<at.length;k++){const a=at[k];if(a.dead)continue;const b=at[Math.floor(Math.random()*at.length)];if(b!==a&&!b.dead&&(willFight(a,b)||Math.random()<.25))npcFight(a,b)}}
  presence();refreshSenses()}
function cannonsFrom(list,kind){if(!list.length)return;const you=cells[state.you];
  if(list.length===1){const d=list[0];state.cannon={dir:d.at===state.you?"near":dirOf(you,cells[d.at])};L(d.at===state.you?"A cannon. Close — very close.":`A cannon. Somewhere to the ${state.cannon.dir}.`)}
  else{state.cannon={dir:"many",n:list.length,kind};L(kind==="bloodbath"?`Cannons. ${list.length} of them. The bloodbath is over.`:kind==="closing"?`At dawn: ${list.length} cannons. The arena took them with the ground.`:`${list.length} cannons, one after another.`)}}
// ---------- tributes ----------
function disposition(f,force){if(force)return"hostile";if(f.know&&f.know.rel==="hostile")return"hostile";
  let o,h;if(f===PARTNER){o=.65;h=.05}else if(f.career&&CAREER_ME){o=state.alive>8?.5:.1;h=state.alive>8?.15:.6}else if(f.career){o=.05;h=.75}
  else if(CAREER_ME){o=.1;h=.4}else{o=.35;h=.2;if(Math.abs(f.d-SETUP.district)<=1)o+=.15}
  if(f.know&&f.know.rel==="friendly"){o+=.3;h*=.4}const r=Math.random();return r<o?"open":r<o+h?"hostile":"wary"}
function relLine(f){if(f.ally)return"Your ally";if(f===PARTNER)return"Your district partner";const k=f.know;
  if(k)return`Met on day ${k.day}${k.note?" — "+k.note:""}`;if(f.career&&!CAREER_ME)return"Career";if(f.career)return"Career, like you";return""}
function startEncounter(career,who,free){state.calm=0;let pool=atCell(state.you);if(!pool.length)pool=npcs();if(!pool.length)return advance();if(career&&pool.some(r=>r.career))pool=pool.filter(r=>r.career);const foe=who||pool[Math.floor(Math.random()*pool.length)];foe.at=state.you;
  const disp=disposition(foe,career);
  const P=pr(foe);const posture=disp==="hostile"?(foe.weapon==="bare hands"?`${P.S} squares up the moment ${P.s} sees you.`:`${P.S} raises ${P.p} ${foe.weapon} the moment ${P.s} sees you.`):disp==="wary"?`${P.S} stops dead, watching your hands.`:foe===PARTNER?`${P.S} lowers ${P.p} ${foe.weapon==="bare hands"?"fists":foe.weapon}. "It's you."`:`${P.S} shows you empty hands. "Easy. I'm not here for you."`;
  const read=[foe.str>.6?"Bigger than you":foe.str<.42?"Smaller than you":"About your size",foe.weapon==="bare hands"?"Unarmed":`Carries a ${foe.weapon}`,foe.hurt?"Limping":foe.career?"Well fed":"Thin, hungry"];
  const group=foe.pack?atCell(state.you).filter(r=>r.pack&&r!==foe):[];if(group.length)read.unshift(`${group.length===1?"One more":group.length+" more"} behind ${pr(foe).o}`);
  const here=cells[state.you];const unaware=!free&&!career&&Math.random()<(.15+SETUP.P*.035)*(here.tags.includes("exposed")?.5:1)*(state.camo>0?1.6:1)*(group.length?.5:1);
  state.modal={k:"enc",foe,disp:group.length&&!CAREER_ME?"hostile":disp,posture:unaware?`${P.S} hasn't seen you. ${P.S}'s crouched over something, back turned.`:posture,read,group:group.length,free:!!free,rel:relLine(foe),where:here.name,unaware};rerenderAll()}
function winChance(f,disp){const m=state.modal;return Math.min(.92,Math.max(.06,1-f.str-(f.wpow||0)-(m&&m.group?.15*m.group:0)+weaponPow()+(SETUP.S-6)*.03+(f.hurt?.15:0)+(disp==="open"?.15:0)+.15*Math.min(2,state.allies.length)+(m&&m.unaware?.22:0)+(hasShield()?.08:0)))}
function allyChance(f,m){let c=f===PARTNER?.8:(f.career&&CAREER_ME)?.65:(!f.career&&!CAREER_ME)?.45:.15;if(m.disp==="hostile")c*=.2;if(m.disp==="open")c+=.15;if(f.know&&f.know.rel==="friendly")c+=.15;if(state.allies.length>=2)c*=.6;return Math.min(.92,c)}
function encFore(o,m){const f=m.foe;const mine=state.held?IT[state.held.id].n.split(" ")[0]:"Fists";const theirs=f.weapon==="bare hands"?"fists":f.weapon;
  if(o==="fight")return(m.unaware?"Strike first. ":"")+`${mine} vs ${theirs}.`+(hasShield()?" Shield up.":"")+(state.allies.length?` ${state.allies[0].n} with you.`:"");
  if(o==="talk")return"Guard down.";
  if(o==="ally")return f===PARTNER?"Same district.":"Ask for help.";
  return m.unaware?"They'll never know.":f.pack||m.group?"Careers run fast.":"They'll see you go."}
// running costs something
// what a beaten tribute leaves behind: their weapon if it beats yours, maybe their pack
const WID={sword:"sword",spear:"spear",trident:"trident",axe:"axe",bow:"bow",knife:"knife",club:"club","bow and arrows":"bow"};
function takeSpoils(f){const out={t:"",fx:[]};const id=WID[f.weapon];
  if(id&&IT[id].pow>weaponPow()+.005){addItem(id);f.weapon="bare hands";f.wpow=-.08;out.t+=` You take ${pr(f).p} ${IT[id].n.toLowerCase()}.`;out.fx.push(["+ "+IT[id].n.toLowerCase(),"g"])}
  if(Math.random()<.5){const pk=["band","bottle","food","camo","potion"][Math.floor(Math.random()*5)];const got=addItem(pk);out.t+=` In ${pr(f).p} pack: ${got}.`;out.fx.push(["+ "+(IT[pk]?IT[pk].n.toLowerCase():pk),"g"])}
  return out}
function dropInRush(){if(Math.random()>.3)return null;if(state.bread>0){state.bread--;return"some food"}const g=state.gear.filter(x=>x!==state.held);if(g.length){const x=g[Math.floor(Math.random()*g.length)];state.gear.splice(state.gear.indexOf(x),1);return"the "+IT[x.id].n.toLowerCase()}return null}
function resolveEnc(o){const m=state.modal;if(m.k==="beast")return resolveBeast(o);const f=m.foe,P=pr(f),here=cells[state.you].name.toLowerCase();let v,tone,t,fx=[];
  const hurt=(n,bleed,cause)=>{state.hp-=soften(n);if(bleed&&!shieldStopsBleed())state.bleed=true;state.pendingKiller=f;state.pendingCause=cause;allyHarm(.3,`${f.n} turns on ${pr(f).o} next.`)};
  if(o==="ally"){if(Math.random()<allyChance(f,m)){state.allies.push(f);f.ally=true;f.pack=false;f.at=state.you;know(f,"ally","your ally");v=`${f.n} joins you`;tone="green";
      t=f===PARTNER?`"Same district. Same odds." ${P.S} falls in beside you.`:f.career&&CAREER_ME?`"Fine. But when it's just us, it's just us." ${P.S} grins and doesn't mean it as a joke.`:`A long silence. Then ${P.s} nods. "Until it's just us."`;fx=[["+ ally","g"]];M(`${f.n} of District ${f.d} became your ally.`)}
    else if(m.disp==="hostile"){hurt(10,false,`${f.n} of District ${f.d} didn't want a friend.`);know(f,"hostile","attacked you");v=`${f.n} laughed — then attacked`;tone="red";t=`You hold out your hand. ${P.S} answers with the ${f.weapon==="bare hands"?"fist":f.weapon}.`;fx=[["− hurt","r"]]}
    else{know(f,"neutral","said no to an alliance");v=`${f.n} says no`;tone="amber";t=`"Not today." ${P.S} backs away, watching you until ${P.s}'s gone.`;fx=[["no ally","m"]]}
    if(!state.bleed)fx=fx.filter(x=>x[0]!=="bleeding");if(state.shieldNote){fx.push([state.shieldNote,"b"]);state.shieldNote=null}L(`${v}. ${t}`);m.res={v,tone,t,fx};return rerenderAll()}
  if(o==="fight"){if(Math.random()<winChance(f,m.disp)){if(state.day===1&&state.pi===0)state.bb.won=f.n;
      const wc=winChance(f,m.disp),cost=Math.round(16*(1-wc))+2;state.bold=(state.bold||0)+2;state.calm=0;const spoils=takeSpoils(f);
      if(Math.random()<.6+(f.hurt?.2:0)+(m.unaware?.15:0)){kill(f,"Killed by you",cells[state.you].name);state.kills++;state.hp-=soften(cost);state.bread++;state.cannon={dir:"here",name:f.n};v=`You killed ${f.n}`;tone="gold";t=`${m.unaware?"They never saw you coming. ":""}It's fast and ugly, and then it's over. A cannon, right above you.${spoils.t}`;fx=[["− hurt","r"],["+ food","g"],...spoils.fx];M(`You killed ${f.n} of District ${f.d}.`)}
      else{state.hp-=soften(cost);state.bread++;know(f,"hostile","you drove them off");v=`${f.n} ran`;tone="green";t=`You land the first blow. ${P.S} breaks and runs, dropping what ${P.s} carried.${spoils.t}`;fx=[["− hurt","r"],["+ food","g"],...spoils.fx];M(`You drove off ${f.n}.`)}}
    else{know(f,"hostile","nearly killed you");hurt(24,true,`${f.n} of District ${f.d} found you in the ${here}. The wound never closed.`);v=`${f.n} beat you`;tone="red";t=`The ${f.weapon==="bare hands"?"fists come":f.weapon+" comes"} faster than you thought. You get away, bleeding.`;fx=[["badly hurt","r"],["bleeding","r"]];M(`${f.n} nearly killed you.`)}}
  else if(o==="talk"){const r=Math.random();
    if(m.disp==="hostile"&&r<.8||m.disp==="wary"&&r<.45||m.disp==="open"&&r<.2){
      know(f,"hostile",m.disp==="open"?"betrayed you":"attacked you");hurt(12,true,m.disp==="open"?`You trusted ${f.n}. It cost you.`:`${f.n} of District ${f.d} didn't come to talk.`);
      v=m.disp==="open"?`${f.n} betrayed you`:`${f.n} attacked you`;tone="red";t=m.disp==="open"?`A smile, a step closer — then the ${f.weapon==="bare hands"?"rock":f.weapon}. You twist away, not clean.`:`You open your mouth; ${P.s} lunges before you finish. You twist away, not clean.`;fx=[["− hurt","r"],["bleeding","r"]];M(`${f.n} attacked you.`)}
    else if(m.disp==="open"){know(f,"friendly","shared water");state.thirst=0;const c=cells.find(x=>x.struct&&!x.seen);if(c)c.seen=true;v=`${f.n} was kind`;tone="green";
      t=`${P.S} shares ${P.p} water${c?` and tells you about a ${c.struct.toLowerCase()} in the ${c.name.toLowerCase()}, ${dirOf(cells[state.you],c)} of here`:""}. Then ${P.s}'s gone.`;fx=[["+ water","b"],["+ a tip","m"]];M(`${f.n} shared water with you.`)}
    else{know(f,"neutral","let you be");v=`${f.n} let you be`;tone="amber";t=`A long look. A nod. ${P.S} backs into the ${here} and is gone.`;fx=[["no harm","m"]]}}
  else{const tired=(state.hp<40?.15:0)+(state.en<30?.12:0)-(SETUP.D-6)*.03;const catchP=m.unaware?0:Math.max(0,(f.pack||m.group?.45:m.disp==="hostile"?.35:m.disp==="wary"?.12:0)+(m.disp==="open"?0:tired));
    if(Math.random()<catchP){know(f,"hostile","chased you");hurt(8,false,`${f.n} of District ${f.d} ran you down in the ${here}.`);v=`${f.n} caught you`;tone="red";t=`You turn to go; ${P.s}'s faster. A blow across the back before you break free.`;fx=[["− hurt","r"]]}
    else{if(state.prev!=null&&state.prev!==state.you){state.you=state.prev;state.allies.forEach(a=>a.at=state.you);views.forEach(v=>v.resetCam())}else{const nb=cells[state.you].nb.filter(n=>!cells[n].closed);if(nb.length){state.you=nb[0];views.forEach(v=>v.resetCam())}}v="You got away";tone="amber";t=m.unaware?`${P.S} never even turned around.`:`You back away the way you came. ${P.S} doesn't follow.`;fx=[["safe","m"]];if(!m.unaware){const lost=dropInRush();if(lost){t+=` You lost ${lost} in the rush.`;fx.push(["− "+lost,"r"])}}}}
  if(!state.bleed)fx=fx.filter(x=>x[0]!=="bleeding");if(state.shieldNote){fx.push([state.shieldNote,"b"]);state.shieldNote=null}L(`${v}. ${t}`);m.res={v,tone,t,fx};rerenderAll()}
// ---------- creatures (Gamemaker mutts) ----------
const art=w=>/^[aeiou]/i.test(w)?"an":"a";
function beastName(cr){return cr.mod&&!cr.n.toLowerCase().includes(cr.mod[0].toLowerCase())?`${cr.mod[0]} ${cr.n}`:cr.n}
function beastDmg(cr){let d=cr.lo+Math.random()*(cr.hi-cr.lo);if(cr.mod){if(cr.mod[1]==="add")d+=cr.mod[2];if(cr.mod[1]==="mul")d*=cr.mod[2];if(cr.mod[1]==="weak")d*=.6}return Math.round(d)}
function hops(a,b,max){if(a===b)return 0;let fr=[a];const seen=new Set([a]);for(let d=1;d<=max;d++){const nx=[];for(const i of fr)for(const n of cells[i].nb){if(seen.has(n)||cells[n].closed)continue;if(n===b)return d;seen.add(n);nx.push(n)}fr=nx}return null}
function stepTo(a,b){let best=null,bd=1e9;cells[a].nb.forEach(n=>{if(cells[n].closed)return;const d=hops(n,b,6);if(d!=null&&d<bd){bd=d;best=n}});return best}
// mutts move during the day: hunters follow scent and blood, skittish ones wander; returns your cell if one comes into it
function muttsMove(){const you=cells[state.you];let came=null;const tick=state.day*3+state.pi;
  if(state.lastAt===state.you)state.stayed=(state.stayed||0)+1;else state.stayed=0;state.lastAt=state.you;
  cells.filter(c=>c.creature&&!c.closed&&c.i!==state.you).forEach(c=>{const cr=c.creature;if(cr.moved===tick)return;const P=prof(cr);let to=null;
    const reach=P.range+(state.bleed?P.blood:0),d=P.hunt?hops(c.i,state.you,reach):null;
    if(d&&state.day>=2&&Math.random()<P.hunt+(state.bleed?.2:0)+(state.stayed>=2?.15:0)+(cr.close?.15:0))to=stepTo(c.i,state.you);
    else if(P.wander&&Math.random()<P.wander){const nb=c.nb.filter(n=>!cells[n].closed);to=nb[Math.floor(Math.random()*nb.length)]}
    if(to==null)return;const t=cells[to];
    if(to===state.you){const sneaky=cr.p==="stalker";if((cr.close||sneaky)&&!came&&!(state.beastDay>=state.day-1)&&state.pi<2&&!(state.lastHid&&Math.random()<.5)&&!(state.day<=2&&to===corn))came=c;return}
    if(t.closed||t.closing||t.creature||t.burning||(state.day<=2&&to===corn))return;
    t.creature=cr;c.creature=null;cr.moved=tick});
  if(came){const cr=came.creature;came.creature=null;you.creature=cr;cr.moved=tick;state.beastDay=state.day;cr.close=false;return you}
  // who is close now: a warning, if you can tell
  cells.forEach(c=>{if(!c.creature)return;const cr=c.creature,adj=you.nb.includes(c.i),was=cr.close;cr.close=adj&&!!prof(cr).hunt;
    if(cr.close&&!was){if(beastSeen(c))L(`Something is circling closer, ${dirOf(you,c)} of you.`);else if(cr.p==="stalker"&&Math.random()<.5)L("You feel watched.")}});
  return null}
function startBeast(c,came){state.calm=0;const cr=c.creature;const P=prof(cr);const noticed=came?Math.random()>(state.camo>0?.5:.15):cr.p==="ambusher"?Math.random()<.7:Math.random()>(.3+SETUP.P*.05)*(c.tags.includes("exposed")?.6:1)*(state.camo>0?1.5:1);
  const read=[cr.hi>=25?"Bigger than anything should be":cr.hi>=16?"Big, and fast":"Small, but not harmless",cr.mod&&cr.mod[1]==="poison"?"Something wet on its fangs":cr.mod&&cr.mod[1]==="weak"?"It's hurt":cr.mod&&cr.mod[0]==="Blind"?"Its eyes are milk-white":"Made, not born"];
  read.splice(1,0,P.read);
  state.modal={k:"beast",c:c.i,cr,noticed,read,where:c.name,came:came||null};rerenderAll()}
function beastFore(o,m){const cr=m.cr;const odds=(cr.hi<=15?.7:cr.hi<=25?.45:.25)+weaponPow()+(SETUP.S-6)*.03+(m.cr.mod&&m.cr.mod[1]==="weak"?.2:0)+.12*Math.min(2,state.allies.length)+(hasShield()?.08:0);m.odds=odds;
  if(o==="fight")return`${state.held?IT[state.held.id].n.split(" ")[0]:"Fists"} vs that.`+(hasShield()?" Shield up.":"");
  if(o==="still")return"Don't move.";
  return"Slowly."}
function resolveBeast(o){const m=state.modal,cr=m.cr,c=cells[m.c],nm=beastName(cr),here=c.name.toLowerCase();beastFore("fight",m);let v,tone,t,fx=[];
  const bite=(mult)=>{allyHarm(.3,`The ${cr.n.toLowerCase()} doesn't stop at you.`);const d=soften(Math.round(beastDmg(cr)*mult));state.hp-=d;state.pendingCause=`${art(nm)[0].toUpperCase()+art(nm).slice(1)} ${nm.toLowerCase()} found you in the ${here}.`;state.pendingKiller=null;
    if(cr.mod&&cr.mod[1]==="poison"){state.poison=3;state.poisonCause=`The ${nm.toLowerCase()}'s venom worked through you.`;fx.push(["poisoned","y"])}return d};
  if(o==="fight"){if(Math.random()<m.odds){c.creature=null;bite(.4);state.bread+=1;v=`You killed the ${cr.n}`;tone="gold";t=`It goes down thrashing. You're shaking, and bleeding a little, and alive. There's meat on it.`;fx.unshift(["− hurt","r"],["+ food","g"]);M(`You killed ${art(nm)} ${nm}.`)}
    else{bite(1);if(!shieldStopsBleed())state.bleed=true;v=`The ${cr.n} mauled you`;tone="red";t=`It's on you before you can swing. You tear free and run.`;fx.unshift(["badly hurt","r"],["bleeding","r"]);M(`${art(nm)[0].toUpperCase()+art(nm).slice(1)} ${nm} nearly killed you.`);
      if(m.came){const nb=c.nb.map(n=>cells[n]).filter(x=>!x.closed&&!x.creature&&!x.burning);if(nb[0]){state.you=nb[0].i;views.forEach(v=>v.resetCam())}}else if(state.prev!=null){state.you=state.prev;views.forEach(v=>v.resetCam())}}}
  else if(o==="still"){const P=prof(cr);if(Math.random()<(m.noticed?P.still*.5:Math.max(.75,P.still))){v="It passed you by";tone="green";t=`You don't breathe. The ${cr.n.toLowerCase()} sniffs the air, turns, and is gone into the ${here}.`;fx=[["unseen","b"]];const to=c.nb.map(n=>cells[n]).find(x=>!x.closed&&!x.creature&&x.i!==state.you);if(to){to.creature=cr;c.creature=null}}
    else{bite(.8);v=`The ${cr.n} found you`;tone="red";t="Keeping still was a mistake. It was already looking at you.";fx.unshift(["− hurt","r"])}}
  else{const P=prof(cr);if(Math.random()<(m.noticed?P.flee*(m.came?.7:1):P.flee*.3)){bite(.5);v="It caught you as you ran";tone="red";t=`Claws across your back, then you're out of the ${here}.`;fx.unshift(["− hurt","r"])}else{v="You got away";tone="amber";t=`You back out the way you came. Behind you, the ${cr.n.toLowerCase()} settles back into the ${here}.`;fx=[["safe","m"]];if(m.noticed){const lost=dropInRush();if(lost){t+=` You lost ${lost} in the rush.`;fx.push(["− "+lost,"r"])}}}
    if(m.came){const nb=c.nb.map(n=>cells[n]).filter(x=>!x.closed&&!x.creature&&!x.burning);const to=nb.find(x=>x.i===state.prev)||nb[0];if(to){state.you=to.i;to.seen=true;views.forEach(v=>v.resetCam())}}
    else if(state.prev!=null){state.you=state.prev;views.forEach(v=>v.resetCam())}}
  if(!state.bleed)fx=fx.filter(x=>x[0]!=="bleeding");if(state.shieldNote){fx.push([state.shieldNote,"b"]);state.shieldNote=null}refreshSenses();L(`${v}. ${t}`);m.res={v,tone,t,fx};rerenderAll()}
function finishEnc(){const m=state.modal,r=m.res;state.modal=null;state.fx=r.fx;if(m.foe&&!m.foe.dead&&!m.foe.ally&&m.foe.at===state.you){const nb=cells[state.you].nb.filter(n=>!cells[n].closed&&!cells[n].closing);if(nb.length){const to=nb[Math.floor(Math.random()*nb.length)];(m.foe.pack?atCell(state.you).filter(x=>x.pack):[m.foe]).forEach(x=>x.at=to)}}presence();refreshSenses();if(state.hp<=0){die(state.pendingCause||"It was over before you knew it.");return rerenderAll()}if(m.free)return rerenderAll();advance()}
READY=true;state.sp={favor:0,gifts:0,lastKills:0};state.kills=0;
function dropAlly(a){state.allies=state.allies.filter(x=>x!==a);a.ally=false;a.suspicious=false}
function partWays(name){const a=state.allies.find(x=>x.n===name);if(!a)return;dropAlly(a);const nb=cells[state.you].nb.filter(n=>!cells[n].closed&&!cells[n].closing);if(nb.length)a.at=nb[Math.floor(Math.random()*nb.length)];
  know(a,"friendly","parted on good terms");L(`You and ${a.n} split what you have and go separate ways. "Don't die," ${pr(a).s} says.`);M(`You parted ways with ${a.n}.`);state.modal=null;state.fx=[["parted ways","m"]];rerenderAll()}
function allyHarm(chance,how){state.allies.slice().forEach(a=>{if(Math.random()<chance){if(a.hurt&&Math.random()<.5){kill(a,"Died at your side, your ally",cells[state.you].name);state.cannon={dir:"near"};L(`${a.n} goes down beside you. ${how}`)}else{a.hurt=true;state.fx.push([`${a.n} is hurt`,"r"])}}})}
function betrayAlly(name,asleep){const a=state.allies.find(x=>x.n===name);if(!a)return;const P=pr(a);const others=state.allies.filter(x=>x!==a);dropAlly(a);state.sp.favor+=2;
  const win=Math.min(.92,(asleep?.82:.55)+(SETUP.S-6)*.03+weaponPow()-(a.wpow||0)-(a.str-.5)*.6+(a.hurt?.15:0));let v,tone,t,fx=[];
  if(Math.random()<win){if(Math.random()<(asleep?.85:.6)){kill(a,"Betrayed and killed by you, their ally",cells[state.you].name);state.kills++;state.cannon={dir:"here",name:a.n};v=`You killed ${a.n}`;tone="gold";
      t=asleep?`${P.S} never wakes. The cannon booms right over you, and the night goes very quiet.`:`${P.S} trusted you right up to the end. ${P.S} takes the surprise into the dark with ${P.o}.`;fx=[["+ the crowd","g"]];M(`You killed ${a.n}, your ally.`)}
    else{know(a,"hostile","you betrayed them");const nb=cells[state.you].nb.filter(n=>!cells[n].closed);if(nb.length)a.at=nb[0];a.hurt=true;v=`${a.n} got away`;tone="amber";t=`You draw blood, but ${P.s} twists free and runs, bleeding. ${P.S}'ll remember.`;fx=[["a new enemy","r"]];M(`You turned on ${a.n}.`)}}
  else{know(a,"hostile","you betrayed them");state.hp-=soften(20);state.bleed=true;state.pendingKiller=a;state.pendingCause=`You turned on ${a.n} of District ${a.d}. ${P.S} was faster.`;v=`${a.n} was ready`;tone="red";t=`${asleep?P.S+" was never really asleep.":P.S+" saw it in your eyes."} The ${a.weapon==="bare hands"?"fists come":a.weapon+" comes"} up before yours does.`;fx=[["badly hurt","r"],["bleeding","r"]];M(`You turned on ${a.n} — and it went wrong.`)}
  others.forEach(o=>{if(o.career||Math.random()<.6){dropAlly(o);know(o,"hostile",`saw you betray ${a.n}`);const nb=cells[state.you].nb.filter(n=>!cells[n].closed);if(nb.length)o.at=nb[nb.length-1];t+=` ${o.n} saw it all, and leaves without a word.`}});
  L(`${v}. ${t}`);return{v,tone,t,fx}}
function sponsorCheck(){const sp=state.sp;sp.favor+=(state.day>=2?1:0)+3*Math.max(0,state.kills-sp.lastKills)+(state.bold||0)-((state.calm||0)>=4?1:0);sp.lastKills=state.kills;state.bold=0;
  const th=6+4*sp.gifts;if(sp.favor<th||Math.random()>=.6)return null;sp.favor-=th;sp.gifts++;
  const gift=state.hp<45?"firstaid":state.en<35?"ration":!state.gear.some(g=>IT[g.id].k==="weapon")?"knife":Math.random()<.5?"stim":"kit";return gift}
function leaveAlly(name){const a=state.allies.find(x=>x.n===name);if(!a)return;const sus=a.suspicious;dropAlly(a);a.suspicious=sus;know(a,a.suspicious?"neutral":"hostile",a.suspicious?"you left them in the night":"you abandoned them");L(`In the dark you slip away from ${a.n}. You don't look back.`);M(`You left ${a.n} in the night.`);const nb=cells[state.you].nb.filter(n=>!cells[n].closed);if(nb.length)state.you=nb.find(n=>!cells[n].closing)??nb[0];a.at=cells.findIndex(c=>c===cells[a.at]);if(state.modal&&state.modal.k==="night")state.modal.note=`You slip away from ${a.n} in the dark.`;views.forEach(v=>v.resetCam());rerenderAll()}
function sleep(){const m=state.modal;
  for(const a of state.allies.slice()){if(a.suspicious&&Math.random()<.6){state.allies=state.allies.filter(x=>x!==a);a.ally=false;a.suspicious=false;know(a,"hostile","betrayed you");
    state.hp-=22;state.bleed=true;state.pendingKiller=a;state.pendingCause=`${a.n} of District ${a.d} — your ally — waited until you slept.`;L(`You wake to a blade. ${a.n}. You fight free, bleeding, and ${pr(a).s}'s gone.`);M(`${a.n} betrayed you in the night.`);state.betrayed=a}
    else if(a.suspicious&&Math.random()<.5)a.suspicious=false}state.journal.push({d:state.day,t:m.n?`Night. In the sky: ${m.faces.map(f=>f.n).join(", ")}.`:"Night. No faces in the sky."});M(`You survived day ${state.day}.`);state.todayDead=[];
  const you0=cells[state.you];state.fx=[];
  if(m.cold){state.hp-=10;state.fx.push(["− the cold","b"]);L("The cold got into your bones in the night.");if(state.hp<=0){die(`The cold took you in the night, in the ${you0.name.toLowerCase()}.`);return rerenderAll()}}
  const wasSheltered=state.sheltered;state.day++;state.pi=0;state.phase=PH[0];state.modal=null;state.thirst=Math.min(3,state.thirst+(you0.hazard==="heat"?.5:.25));state.sheltered=false;
  const closingCount=cells.filter(c=>c.closing).length;
  cells.forEach(c=>{if(c.closing){c.closing=false;c.closed=true;c.creature=null;c.people=null}});
  {const quiet=!state.todayDead.length;state.todayDead=[];state.deaths=[];npcs().forEach(r=>{if(cells[r.at].closed)npcDeath(r,"closing")});state.closingList=state.deaths;state.deaths=[];
    if(quiet&&state.day>2){npcs().forEach(r=>r.aggr=Math.min(1,r.aggr+.12));L("A quiet day. The Gamemakers won't allow another.")}}
  if(state.day>=3&&((state.day-3)%2===0||state.alive<=4)){const nClose=Math.max(4,Math.round(N/12));cells.filter(c=>!c.closed&&!c.closing&&c.i!==corn).sort((a,b)=>b.dc-a.dc).slice(0,nClose).forEach(c=>c.closing=true);
    L(`The Gamemakers mark the edge. ${["Four","Five","Six","Seven","Eight","Nine","Ten"][Math.min(6,nClose-4)]} places will be gone by tomorrow.`);state.fx.push(["the arena shrinks","r"])}
  if(EVENT.on&&state.day>EVENT.end)endEvent();else if(EVENT.on&&EVENT.type==="fire")spreadFire();
  // mutts wander at night, new tributes move about
  cells.filter(c=>c.creature).forEach(c=>{if(Math.random()<.4){const to=c.nb.map(n=>cells[n]).find(x=>!x.closed&&!x.creature&&x.i!==state.you);if(to){to.creature=c.creature;c.creature=null}}});
  presence();refreshSenses();
  if(state.net!=null){state.bread+=2;state.net=null;L("The net is heavy with something. Two days of food.");state.fx.push(["+ food","g"])}
  if(state.snare!=null){state.bread++;state.snare=null;L("Your snare held something small. Food.");state.fx.push(["+ food","g"])}
  const you=cells[state.you];
  if(you.closed){die(`The arena closed over the ${you.name.toLowerCase()}. You were still in it.`);return rerenderAll()}
  if(state.closingList&&state.closingList.length){cannonsFrom(state.closingList,"closing")}state.closingList=null;
  state.allies.slice().forEach(a=>{if(!a.suspicious&&((state.hp<30&&Math.random()<.25)||(state.bread===0&&state.en<35&&Math.random()<.2))){dropAlly(a);know(a,"neutral","left you");if(state.bread>0)state.bread--;L(`${a.n} is gone in the morning. ${pr(a).S} took what food there was.`);state.fx.push([`${a.n} left`,"r"])}});
  L("Morning. Cold, and fewer of you.");
  // the night belongs to the mutts
  if(!state.dead&&!(state.beastDay>=state.day-2)){const cov=(sheltered(you)||wasSheltered)?.15:1;
    const cand=cells.filter(c=>c.creature&&!c.closed&&c.i!==state.you).map(c=>({c,P:prof(c.creature),d:hops(c.i,state.you,3)})).filter(x=>x.d&&x.d<=Math.max(1,x.P.range));
    const thief=cand.find(x=>x.c.creature.p==="skittish"&&x.d===1);
    if(thief&&state.bread>0&&Math.random()<.3){state.bread--;L(`Something got into your food in the night. Tracks of ${art(thief.c.creature.n)} ${thief.c.creature.n.toLowerCase()}.`);state.fx.push(["− food","r"])}
    const hit=cand.find(x=>Math.random()<x.P.night*cov*(state.camo>0?.5:1)*(state.bleed?1.5:1));
    if(hit){const cr=hit.c.creature;hit.c.creature=null;you.creature=cr;state.beastDay=state.day;const watch=state.allies.length&&Math.random()<.6;
      L(watch?`${state.allies[0].n} shakes you awake. Something is in the ${you.name.toLowerCase()}.`:`You wake to breathing that isn't yours.`);
      presence();refreshSenses();startBeast(you,"night");if(watch)state.modal.noticed=false;state.modal.watch=watch?state.allies[0].n:null;return rerenderAll()}}
  const gift=state.dead?null:sponsorCheck();
  if(state.betrayed){const a=state.betrayed;state.betrayed=null;if(state.hp<=0){die(state.pendingCause);return rerenderAll()}state.modal={k:"betray",a};rerenderAll();return}
  if(gift){const got=addItem(gift);M(`Sponsors sent you ${got}.`);L(`A silver parachute drifts down at dawn: ${got}.`);state.modal={k:"gift",id:gift,got};rerenderAll();return}
  if(!EVENT.announced&&state.day>=EVENT.start)startEvent();
  if(!state.modal&&!state.dead&&capitolMoves())return rerenderAll();
  rerenderAll()}
// the Capitol wants a show: a feast once, and a push for anyone who has been hiding too long
function capitolMoves(){const you=cells[state.you];
  if(!state.feast&&state.day>=3&&state.alive>4&&Math.random()<(state.day>=4?1:.5)){state.feast={day:state.day,until:state.day+1};const best=["sword","bow","trident"][Math.floor(Math.random()*3)];
    cells[corn].ground.push({id:"firstaid",fresh:true},{id:"ration",fresh:true},{id:best,fresh:true});
    npcs().filter(r=>r.greed>.45||r.career).forEach(r=>r.feast=true);
    L("The anthem. Then Claudius Templesmith: a feast at the Cornucopia, at dawn. Something for each of you.");M("The Gamemakers announced a feast.");
    state.modal={k:"broadcast",t:"A feast at the Cornucopia. Something each of you needs badly.",sub:you.i===corn?"You're already here. So is everyone, soon.":`It's ${dirOf(you,cells[corn])} of you. Everyone will be there.`};return true}
  if(state.calm>=6&&state.day>=2&&!(state.pushDay>=state.day-1)){state.pushDay=state.day;state.calm=2;state.sp.favor=Math.max(0,state.sp.favor-2);
    const nb=you.nb.map(n=>cells[n]).filter(c=>!c.closed&&!c.creature&&c.i!==corn);const r=Math.random();
    if(r<.45&&nb.length){const c=nb[Math.floor(Math.random()*nb.length)];const g=CREATURES[B2G[c.biome]||"green"].filter(([n])=>PROF[n]==="hunter");const pick=g.length?g[0]:CREATURES.green[0];c.creature={n:pick[0],lo:pick[1],hi:pick[2],mod:null,p:"hunter",close:true};
      state.modal={k:"broadcast",t:"The audience is bored.",sub:`Something has been let loose ${dirOf(you,c)} of you. It already has your scent.`}}
    else{const hunters=npcs().filter(x=>x.aggr>.5||x.career);const h=hunters.sort((a,b)=>(hops(a.at,state.you,12)??99)-(hops(b.at,state.you,12)??99))[0];
      if(h){const to=nb[0]||you;(h.pack?npcs().filter(x=>x.pack&&x.at===h.at):[h]).forEach(x=>x.at=to.i);presence()}
      state.modal={k:"broadcast",t:"The audience is bored.",sub:h?`Your face on every screen in the Capitol. ${h.career?"The Careers":h.n} know exactly where you are.`:"Your face on every screen in the Capitol."}}
    L("The Gamemakers have noticed you've been hiding.");refreshSenses();return true}
  return false}

// ---------- items (same catalogue as the real game's data/items.json) ----------
const SV=(p)=>`<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const RO="#1a1213",RST=`stroke="${RO}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const RPG=p=>`<svg class="rpg" viewBox="0 0 64 64" aria-hidden="true">${p}</svg>`;
// item type → slot colour (weapons red, food & water green, medicine blue, gear amber, packs brown)
const CAT={sword:"wpn",spear:"wpn",trident:"wpn",axe:"wpn",bow:"wpn",knife:"wpn",club:"wpn",fruit:"food",roots:"food",fish:"food",ration:"food",food:"food",bread:"food",bottle:"food",flask:"food",
  band:"med",firstaid:"med",stim:"med",potion:"med",shield:"gear",camo:"gear",net:"gear",pack:"pack",bigpack:"pack",kit:"pack"};
const catOf=id=>"cat-"+(CAT[id]||"pack")+(id==="ration"?" capitol":"");
const ITEMIC={
  sword:RPG(`<g transform="rotate(45 32 32)"><path d="M28.5 6 32 1.5 35.5 6V40h-7z" fill="#cfd8e0" ${RST}/><path d="M32 4v35" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/><path d="M32 6V40h3.5V6z" fill="#8f9ba7" opacity=".55"/><rect x="19" y="39" width="26" height="6" rx="2" fill="#f2c14e" ${RST}/><rect x="29" y="45" width="6" height="11" fill="#7a4a26" ${RST}/><circle cx="32" cy="59" r="4" fill="#f2c14e" ${RST}/></g>`),
  knife:RPG(`<g transform="rotate(40 32 32)"><path d="M29 10c7 4 8 18 6 26h-6z" fill="#d6dde3" ${RST}/><path d="M30.5 13c4 4 4.5 14 3.5 21" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" fill="none"/><rect x="27" y="36" width="10" height="4" rx="1.5" fill="#5d5a57" ${RST}/><rect x="28.5" y="40" width="7" height="16" rx="3" fill="#8a5a33" ${RST}/><path d="M30 44h4M30 48h4M30 52h4" stroke="${RO}" stroke-width="1.4"/></g>`),
  spear:RPG(`<g transform="rotate(45 32 32)"><rect x="30" y="18" width="4" height="44" rx="2" fill="#a26c3d" ${RST}/><path d="M32 1 38 14 32 20 26 14z" fill="#cfd8e0" ${RST}/><path d="M32 4v13" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/><rect x="28.5" y="19" width="7" height="4" fill="#5d5a57" ${RST}/></g>`),
  trident:RPG(`<g transform="rotate(45 32 32)"><rect x="30" y="24" width="4" height="38" rx="2" fill="#2f7f88" ${RST}/><path d="M20 6v12c0 5 5 8 12 8s12-3 12-8V6" fill="none" stroke="${RO}" stroke-width="6"/><path d="M20 6v12c0 5 5 8 12 8s12-3 12-8V6" fill="none" stroke="#e6c35a" stroke-width="3"/><path d="M32 2v22" stroke="${RO}" stroke-width="6"/><path d="M32 2v22" stroke="#e6c35a" stroke-width="3"/><path d="M17 8l3-6 3 6M29 4l3-6 3 6M41 8l3-6 3 6" fill="#e6c35a" ${RST}/></g>`),
  axe:RPG(`<g transform="rotate(30 32 32)"><rect x="29.5" y="10" width="5" height="50" rx="2.5" fill="#a26c3d" ${RST}/><path d="M34 12c10-4 18 2 18 12s-8 14-18 12z" fill="#cfd8e0" ${RST}/><path d="M46 15c3 3 3 12 0 16" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" fill="none"/><rect x="28" y="14" width="8" height="6" fill="#5d5a57" ${RST}/></g>`),
  club:RPG(`<g transform="rotate(40 32 32)"><path d="M28 60h8l3-36c2-8 1-18-7-20-8 2-9 12-7 20z" fill="#9a6034" ${RST}/><path d="M29 10c-2 5-1 12 1 16" stroke="#c88b55" stroke-width="2" fill="none"/><circle cx="35" cy="14" r="2" fill="#5e3a1d"/><circle cx="29" cy="22" r="1.6" fill="#5e3a1d"/><rect x="27" y="50" width="10" height="4" fill="#5e3a1d" ${RST}/></g>`),
  bow:RPG(`<path d="M14 6c22 6 38 22 44 44" fill="none" stroke="${RO}" stroke-width="7" stroke-linecap="round"/><path d="M14 6c22 6 38 22 44 44" fill="none" stroke="#a26c3d" stroke-width="4" stroke-linecap="round"/><path d="M14 6 58 50" stroke="#e8e2d0" stroke-width="1.6"/><path d="M8 56 46 18" stroke="${RO}" stroke-width="4.5" stroke-linecap="round"/><path d="M8 56 46 18" stroke="#c9a46a" stroke-width="2"/><path d="M46 18l2-8 6 6z" fill="#cfd8e0" ${RST}/><path d="M8 56l-1-7 4 3zM8 56l7 1-3-4z" fill="#d9534f" ${RST}/>`),
  shield:RPG(`<path d="M32 4 54 11v18c0 15-10 25-22 31C20 54 10 44 10 29V11z" fill="#8a5a33" ${RST}/><path d="M32 9 49 15v14c0 11-8 20-17 25-9-5-17-14-17-25V15z" fill="#b3372f"/><path d="M32 9v45" stroke="#e6c35a" stroke-width="4"/><path d="M15 26h34" stroke="#e6c35a" stroke-width="4"/><circle cx="32" cy="27" r="6" fill="#e6c35a" ${RST}/><path d="M20 15c3-1 7-2 9-2" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>`),
  camo:RPG(`<path d="M18 22h28v30c0 4-3 6-6 6H24c-3 0-6-2-6-6z" fill="#cfd8e0" ${RST}/><rect x="16" y="14" width="32" height="9" rx="3" fill="#7a4a26" ${RST}/><path d="M18 30h28v22c0 4-3 6-6 6H24c-3 0-6-2-6-6z" fill="#4f7a34"/><path d="M22 38c4-3 6 2 10-1s7 2 10 0" stroke="#2f5021" stroke-width="2.4" fill="none"/><path d="M22 48c5-2 7 2 12 0" stroke="#7fb05a" stroke-width="2" fill="none"/><path d="M44 8c6 0 10 4 10 10-6 0-10-4-10-10z" fill="#6fbf4a" ${RST}/>`),
  net:RPG(`<path d="M10 12h44v40H10z" fill="#e3d6b4" fill-opacity=".15" ${RST}/><path d="M10 22h44M10 32h44M10 42h44M21 12v40M32 12v40M43 12v40" stroke="#e3d6b4" stroke-width="2.4"/><path d="M10 22h44M10 32h44M10 42h44M21 12v40M32 12v40M43 12v40" stroke="${RO}" stroke-width=".8" opacity=".5"/><circle cx="10" cy="52" r="4" fill="#6c7078" ${RST}/><circle cx="54" cy="52" r="4" fill="#6c7078" ${RST}/><circle cx="32" cy="52" r="4" fill="#6c7078" ${RST}/>`),
  potion:RPG(`<path d="M26 6h12v12l10 14c4 7 0 24-16 24S12 39 16 32l10-14z" fill="#9fd3e0" fill-opacity=".35" ${RST}/><path d="M17 36c6-4 24-4 30 0 2 9-3 18-15 18s-17-9-15-18z" fill="#6b5b8e"/><circle cx="26" cy="44" r="2.4" fill="#fff" opacity=".5"/><circle cx="36" cy="47" r="1.6" fill="#fff" opacity=".4"/><rect x="24" y="2" width="16" height="7" rx="2" fill="#a26c3d" ${RST}/><path d="M22 24c-2 3-4 6-5 9" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`),
  stim:RPG(`<g transform="rotate(45 32 32)"><rect x="25" y="14" width="14" height="30" rx="3" fill="#dfe6ea" ${RST}/><rect x="27.5" y="24" width="9" height="18" fill="#59e08a"/><rect x="22" y="44" width="20" height="5" rx="2" fill="#8e9aa6" ${RST}/><rect x="30" y="4" width="4" height="10" fill="#8e9aa6" ${RST}/><rect x="25" y="1" width="14" height="4" rx="1.5" fill="#8e9aa6" ${RST}/><path d="M32 49v12" stroke="${RO}" stroke-width="3"/><path d="M32 49v12" stroke="#cfd8e0" stroke-width="1.4"/></g>`),
  band:RPG(`<path d="M12 24c0-8 8-14 18-14s18 6 18 14v16c0 8-8 14-18 14s-18-6-18-14z" fill="#f3efe4" ${RST}/><ellipse cx="30" cy="24" rx="18" ry="11" fill="#fffaf0" ${RST}/><ellipse cx="30" cy="24" rx="7" ry="4" fill="#d9cfb6" ${RST}/><path d="M48 36c4 2 6 6 4 12-3 6-8 6-12 4" fill="#f3efe4" ${RST}/><path d="M20 38h20" stroke="#d9534f" stroke-width="3"/>`),
  bread:RPG(`<path d="M10 30c0-10 10-16 22-16s22 6 22 16-10 20-22 20S10 40 10 30z" fill="#8b4a2f" ${RST}/><path d="M16 26c6-6 24-8 32 2" stroke="#b7724a" stroke-width="3" fill="none"/><path d="M22 34c4 2 14 2 20-2" stroke="#5e2e1c" stroke-width="2.4" fill="none"/><path d="M8 44l12-4M56 44l-12-4" stroke="#d8c7a0" stroke-width="3"/><rect x="24" y="44" width="16" height="10" rx="2" fill="#d8c7a0" ${RST}/>`),
  fruit:RPG(`<circle cx="24" cy="38" r="11" fill="#c0392b" ${RST}/><circle cx="40" cy="40" r="10" fill="#d4513e" ${RST}/><circle cx="32" cy="26" r="9" fill="#a93226" ${RST}/><circle cx="21" cy="34" r="3" fill="#fff" opacity=".35"/><circle cx="37" cy="36" r="2.5" fill="#fff" opacity=".35"/><path d="M32 17c0-6 4-10 10-11" stroke="#5e3a1d" stroke-width="3" fill="none"/><path d="M38 8c6-2 12 0 14 5-6 2-11 0-14-5z" fill="#6fbf4a" ${RST}/>`),
  roots:RPG(`<path d="M26 18c-6 10-8 26-2 40 4-6 8-24 6-40z" fill="#e0893a" ${RST}/><path d="M38 20c6 10 6 24 0 36-4-6-6-22-4-36z" fill="#d97b2f" ${RST}/><path d="M24 30h5M23 40h5M36 32h4M36 42h4" stroke="${RO}" stroke-width="1.6"/><path d="M28 18c-4-6-10-8-14-6 2 5 8 8 14 6zM28 18c0-7 4-12 8-12 0 6-3 10-8 12zM36 20c4-6 10-7 14-5-3 5-8 7-14 5z" fill="#6fbf4a" ${RST}/>`),
  fish:RPG(`<path d="M8 32c8-12 26-14 38-4l10-8v24l-10-8C34 46 16 44 8 32z" fill="#7fa9c9" ${RST}/><path d="M12 32c8-7 22-9 32-2" stroke="#c8deee" stroke-width="2.4" fill="none"/><circle cx="18" cy="30" r="2.6" fill="${RO}"/><path d="M28 24c2 4 2 12 0 16" stroke="#4e7899" stroke-width="2" fill="none"/>`),
  ration:RPG(`<rect x="12" y="16" width="40" height="36" rx="5" fill="#cfd5dc" ${RST}/><ellipse cx="32" cy="16" rx="20" ry="5" fill="#e9edf1" ${RST}/><rect x="12" y="26" width="40" height="16" fill="#f2c14e"/><path d="M12 26h40M12 42h40" stroke="${RO}" stroke-width="2"/><path d="M32 28l2.5 5 5.5.8-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.8z" fill="#fff8d6" ${RST}/><path d="M16 46h8" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`),
  firstaid:RPG(`<rect x="8" y="18" width="48" height="36" rx="6" fill="#f3efe4" ${RST}/><rect x="24" y="10" width="16" height="9" rx="3" fill="none" stroke="${RO}" stroke-width="5"/><rect x="24" y="10" width="16" height="9" rx="3" fill="none" stroke="#b9b3ac" stroke-width="2.4"/><path d="M28 26h8v6h6v8h-6v6h-8v-6h-6v-8h6z" fill="#d9534f" ${RST}/><path d="M12 22h10" stroke="#fff" stroke-width="2"/>`),
  kit:RPG(`<rect x="8" y="20" width="48" height="32" rx="4" fill="#6b7d4e" ${RST}/><rect x="8" y="20" width="48" height="10" fill="#7f9360" ${RST}/><rect x="18" y="26" width="8" height="8" rx="2" fill="#c9a24a" ${RST}/><rect x="38" y="26" width="8" height="8" rx="2" fill="#c9a24a" ${RST}/><rect x="24" y="12" width="16" height="9" rx="3" fill="none" stroke="${RO}" stroke-width="5"/><rect x="24" y="12" width="16" height="9" rx="3" fill="none" stroke="#8e9aa6" stroke-width="2.4"/><path d="M14 44h36" stroke="#4c5a37" stroke-width="2"/>`),
  flask:RPG(`<rect x="16" y="16" width="32" height="40" rx="12" fill="#5f7d8c" ${RST}/><rect x="22" y="22" width="20" height="28" rx="8" fill="#7fa3b5"/><rect x="26" y="6" width="12" height="11" rx="2" fill="#8e9aa6" ${RST}/><path d="M16 30h32" stroke="#a26c3d" stroke-width="5"/><path d="M16 30h32" stroke="${RO}" stroke-width="1" opacity=".5"/><path d="M24 26c0 6 0 14 2 20" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" fill="none"/>`),
  pack:RPG(`<path d="M14 24c0-8 6-14 18-14s18 6 18 14v28c0 3-2 5-5 5H19c-3 0-5-2-5-5z" fill="#a8743f" ${RST}/><path d="M14 26c0-6 8-10 18-10s18 4 18 10v8H14z" fill="#c48a4d" ${RST}/><rect x="28" y="30" width="8" height="8" rx="2" fill="#e6c35a" ${RST}/><rect x="20" y="42" width="24" height="10" rx="3" fill="#8b5f33" ${RST}/><path d="M26 10c0-4 3-6 6-6s6 2 6 6" fill="none" stroke="${RO}" stroke-width="4"/>`),
  bigpack:RPG(`<rect x="12" y="6" width="40" height="11" rx="5.5" fill="#5f7d6a" ${RST}/><path d="M12 11h40" stroke="#425a4b" stroke-width="1.6"/><path d="M10 26c0-7 6-11 22-11s22 4 22 11v26c0 4-3 6-6 6H16c-3 0-6-2-6-6z" fill="#8b5f33" ${RST}/><path d="M10 28c0-5 8-8 22-8s22 3 22 8v8H10z" fill="#a8743f" ${RST}/><rect x="28" y="32" width="8" height="8" rx="2" fill="#e6c35a" ${RST}/><rect x="15" y="42" width="14" height="11" rx="3" fill="#6e4a28" ${RST}/><rect x="35" y="42" width="14" height="11" rx="3" fill="#6e4a28" ${RST}/>`)};
const IT={sword:{n:"Sword",k:"weapon",pow:.2},spear:{n:"Spear",k:"weapon",pow:.17},trident:{n:"Trident",k:"weapon",pow:.18},axe:{n:"Axe",k:"weapon",pow:.16},
  bow:{n:"Bow and arrows",k:"weapon",pow:.17},knife:{n:"Knife",k:"weapon",pow:.09},club:{n:"Club",k:"weapon",pow:.07},
  shield:{n:"Shield",k:"gear"},camo:{n:"Camouflage paste",k:"use"},net:{n:"Net",k:"use"},potion:{n:"Unlabelled flask",k:"use"},
  pack:{n:"Backpack",k:"pack"},bigpack:{n:"Large pack",k:"pack"},kit:{n:"Survival kit",k:"pack"},
  fruit:{n:"Wild fruits",k:"food"},roots:{n:"Edible roots",k:"food"},fish:{n:"Freshwater fish",k:"food"},ration:{n:"Capitol ration",k:"food"},
  firstaid:{n:"First aid kit",k:"supply"},stim:{n:"Stimulant",k:"use"},bottle:{n:"Water bottle",k:"supply"},band:{n:"Bandages",k:"supply"},food:{n:"Dried food",k:"supply"}};
const icOf=id=>ITEMIC[id]||(id==="bottle"?ITEMIC.flask:id==="food"?ITEMIC.bread:ITEMIC.pack);
Object.assign(state,{gear:[],held:null,camo:0,net:null,flask:-1});
const weaponPow=()=>state.held?IT[state.held.id].pow:-.08;
const hasShield=()=>state.gear.some(g=>g.id==="shield");
function soften(n){let d=n*(state.allies.length?.85:1);if(hasShield()&&n>0){d*=.65;state.shieldNote=state.shieldNote||"shield took the blow";
    if(n>=18&&Math.random()<.12){const g=state.gear.find(x=>x.id==="shield");state.gear.splice(state.gear.indexOf(g),1);state.shieldNote="your shield split";L("The blow splits your shield in two. You let it fall.")}}return Math.round(d)}
// a shield can turn a blade before it opens you up
const shieldStopsBleed=()=>hasShield()&&Math.random()<.4&&(state.shieldNote="the shield turned the edge");
// add an item; returns a sentence fragment
function addItem(id){
  if(id==="band"){state.band+=2;return"two rolls of bandage"}
  if(id==="food"){state.bread+=1;return"dried meat"}
  if(id==="bottle"){if(state.flask<0){state.flask=1;return"a full water bottle"}state.flask=1;return"water (you top up your bottle)"}
  if(["fruit","roots","fish"].includes(id)){state.bread+=1;return IT[id].n.toLowerCase()}
  if(id==="ration"){state.bread+=2;return"a Capitol ration"}
  if(id==="firstaid"){state.band+=3;return"a first aid kit — three rolls of bandage"}
  if(id==="kit"){const got=pickN(["band","food","bottle","net","knife"],2).map(addItem);return"a survival kit: "+got.join(" and ")}
  if(id==="pack"||id==="bigpack"){const got=pickN(["band","food","bottle","potion","camo","net","knife"],id==="bigpack"?3:2).map(addItem);return got.slice(0,-1).join(", ")+(got.length>1?" and ":"")+got[got.length-1]}
  if(state.gear.length>=5)return`no room for the ${IT[id].n.toLowerCase()} — you leave it`;
  const g={id};if(id==="potion")g.kind=Math.random()<.5?"medicine":"poison";state.gear.push(g);
  if(IT[id].k==="weapon"&&(!state.held||IT[id].pow>IT[state.held.id].pow))state.held=g;
  return(/^[aeiou]/i.test(IT[id].n)?"an ":"a ")+IT[id].n.toLowerCase()}
// ---------- the Cornucopia loot (rings: at your feet / on the way in / at the horn) ----------
function pickN(pool,n){return pool.slice().sort(()=>Math.random()-.5).slice(0,n)}
state.loot={feet:pickN(["pack","bottle","band","food","knife"],3),way:pickN(["pack","knife","net","camo","club","potion","bottle"],4),horn:pickN(["sword","bow","spear","trident","axe","shield","bigpack"],4)};
state.lootRound=0;state.bb={grabs:0,horn:false,won:false,hid:false};
const RINGS=[["feet","At your feet"],["way","On the way in"],["horn","At the horn"]];
function lootRisk(ring){const base={feet:.08,way:.3,horn:.6}[ring]+state.lootRound*.15-(SETUP.D-6)*.035;return Math.min(.92,Math.max(.03,base))}
const riskWord=r=>r<.15?["Safe enough","g"]:r<.35?["Risky","y"]:r<.62?["Dangerous","r"]:["Suicide","r"];
function lootFore(ring,id){const r=lootRisk(ring);const where={feet:"Right at your feet.",way:"Ten strides in. Others are closing.",horn:`At the mouth of the horn. ${2+state.lootRound} Careers are already there.`}[ring];
  const dex=SETUP.D>=8?" You're quick.":SETUP.D<=4?" You're not fast.":"";const what=IT[id].k==="pack"?" Could be anything inside.":IT[id].k==="weapon"?` ${["A real weapon.","Something to fight with."][IT[id].pow>.12?0:1]}`:"";
  return where+what+dex}
const lootLeft=()=>state.loot.feet.length+state.loot.way.length+state.loot.horn.length;
function itemCard(id,attr,fresh){const d=IT[id];let tag="";
  if(d.k==="weapon")tag=`<span class="pw">${[1,2,3].map(k=>`<i class="${d.pow>[0,.08,.15][k-1]?"on":""}"></i>`).join("")}</span>`;
  else if(d.k==="pack"||id==="potion")tag=`<span class="q">?</span>`;
  const peek=(d.k==="pack"&&SETUP.P>=7)?`<small>${["Something long inside","It sloshes","Heavy","Soft, light"][[...attr].reduce((x,ch)=>x+ch.charCodeAt(0),0)%4]}</small>`:"";
  return `<button class="li ${catOf(id)} ${fresh?"fresh":""}" ${attr}>${icOf(id)}<b>${d.n}</b>${tag}${peek}</button>`}
function joinPack(){const m=state.modal;if(!CAREER_ME)state.weakLink=true;m.who.forEach(r=>{r.ally=true;r.at=state.you;state.allies.push(r);know(r,"ally","the Careers' pack")});L(`You join the Careers: ${m.who.map(r=>r.n).join(", ")}.`);M("You joined the Careers.");state.modal=null;state.fx=[["+ the Careers","g"]];rerenderAll()}
function declinePack(){const m=state.modal;m.who.forEach(r=>know(r,"neutral","you turned down the pack"));L("You turn your back on the Careers. They'll remember.");state.modal=null;rerenderAll()}
function openGround(mode){state.modal={k:"ground",mode,c:state.you};rerenderAll()}
function takeGround(i){const m=state.modal,c=cells[m.c];const g=c.ground.filter(x=>!x.hidden)[i];if(!g)return;
  c.ground.splice(c.ground.indexOf(g),1);const got=addItem(g.id);if(c.i===corn&&state.feast){state.bold=(state.bold||0)+2;state.calm=0}L(IT[g.id].k==="pack"?`You open the ${IT[g.id].n.toLowerCase()}: ${got}.`:`You take ${got}.`);m.took=(m.took||[]).concat([IT[g.id].k==="pack"?got:IT[g.id].n]);state.fx=[["+ "+IT[g.id].n.toLowerCase(),"g"]];rerenderAll()}
function closeGround(){const m=state.modal;state.modal=null;cells[m.c].ground.forEach(g=>delete g.fresh);if(m.mode==="forage"){state.fx=m.took&&m.took.length?[]:[["+ strength","g"]];advance()}else rerenderAll()}
function openLoot(){state.calm=0;state.modal={k:"loot",leftovers:!state.bloodbath};rerenderAll()}
function others(){["feet","way","horn"].forEach(r=>{state.loot[r]=state.loot[r].filter(()=>Math.random()>.4)})}
function grabLoot(ring,idx){const m=state.modal;const id=state.loot[ring][idx];if(!id)return;
  const risk=m.leftovers?.22:lootRisk(ring);
  if(Math.random()<risk){state.loot[ring].splice(idx,1);L(m.leftovers?`You dig through what's left — and a Career steps out from behind the horn.`:`You get your hands on the ${IT[id].n.toLowerCase()} — and someone else gets theirs on you.`);
    state.modal=null;state.bloodbath=false;startEncounter(true);return}
  state.loot[ring].splice(idx,1);const got=addItem(id);
  const t=IT[id].k==="pack"?`You tear it open: ${got}.`:`You have ${got}.`;
  M(`You took ${(/^[aeiou]/i.test(IT[id].n)?"an ":"a ")+IT[id].n.toLowerCase()} from the Cornucopia.`);L(t);
  if(m.leftovers){state.modal=null;state.fx=[["+ "+IT[id].n.toLowerCase(),"g"]];advance();return}
  state.bb.grabs++;if(ring==="horn")state.bb.horn=IT[id].n.toLowerCase();state.lootRound++;others();m.res={id,t};rerenderAll()}
function inventory(){const you=cells[state.you];const out=[];
  state.gear.forEach((g,i)=>{const d=IT[g.id];const held=state.held===g;const acts=[],free=[];
    if(d.k==="weapon")free.push(held?["unhold:"+i,"Put it away"]:["hold:"+i,"Take it in hand"]);
    if(g.id==="camo")acts.push(["camo:"+i,"Smear it on"]);if(g.id==="net")acts.push(["net:"+i,"Set it as a trap"]);if(g.id==="potion")acts.push(["potion:"+i,"Drink it"]);if(g.id==="stim")acts.push(["stim:"+i,"Inject it"]);
    out.push({id:"g"+i,base:g.id,n:d.n,ic:icOf(g.id),held,sub:held?"In hand":d.k==="weapon"?"In your bag":g.id==="shield"?"On your arm. Takes a third of every blow, sometimes stops a cut. A heavy hit can split it.":g.id==="potion"?"Could be medicine. Could be poison.":g.id==="camo"?"Mud-green, sticky.":g.id==="net"?"Strong cord, a few hooks.":"",acts,free})});
  if(state.band>0)out.push({id:"band",base:"band",n:"Bandages",ic:ITEMIC.band,q:state.band,sub:state.band>1?`${state.band} rolls`:"One roll left",acts:[["bandage",state.bleed?"Bind the wound":"Re-dress your wounds"]],free:[]});
  if(state.bread>0)out.push({id:"bread",base:"bread",n:"Food",ic:ITEMIC.bread,q:state.bread,sub:state.bread>1?`Enough for ${state.bread} meals`:"One meal",acts:[["eat","Eat"]],free:[]});
  if(state.flask>=0)out.push({id:"flask",base:"flask",n:"Water bottle",ic:ITEMIC.flask,dim:!state.flask,sub:state.flask?"Full":you.water?"Empty — there's water here":"Empty",acts:state.flask?[["drink","Drink"]]:you.water?[["drinkHere","Drink and fill it"]]:[],free:[]});
  return out}
const views=[];
function rerenderAll(){try{presence();refreshSenses()}catch(e){}views.forEach(v=>v.render());state.fx=[];state.cannon=null;if(state.modal&&state.modal.k==='dead')state.modal.shown=true}

// ---------- view ----------
function makeView(root,isPhone){
  root.innerHTML=`
  <canvas class="mapbg"></canvas><svg class="map" xmlns="http://www.w3.org/2000/svg"><defs></defs><g class="world"></g></svg><svg class="pulse" aria-hidden="true"><g class="pw"></g></svg><svg class="tether"><path d="" fill="none" stroke="rgba(250,208,44,.75)" stroke-width="1.6" stroke-dasharray="4 4"/><circle r="3" fill="#fad02c"/></svg>
  <header class="hud">
    <button class="iconbtn menubtn" aria-label="Pause" title="Pause"><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3.5" width="2.6" height="9" rx="1"/><rect x="9.4" y="3.5" width="2.6" height="9" rx="1"/></svg></button><div class="ava">D${SETUP.district}</div><div class="allies"></div>
    <div class="bars" tabindex="0" aria-label="Body and energy">
      <div class="bar"><i class="hpb"></i></div>
      <div class="bar"><i class="enb"></i></div>
      <div class="pop"></div>
    </div>
    <span class="words"></span>
    <span class="sep s1"></span>
    <span class="carry"></span>
    <span class="arena"></span><div class="right"><span class="evchip"></span><span class="rh"></span><span class="when"></span><span><strong class="alive"></strong> alive</span><button class="iconbtn tribbtn" aria-label="Tributes" title="Tributes"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="5.6" cy="5.4" r="1.9"/><circle cx="10.8" cy="6" r="1.5"/><path d="M2.4 12.6c.5-2.2 1.8-3.2 3.2-3.2s2.7 1 3.2 3.2"/><path d="M9.6 12.2c.4-1.6 1.1-2.4 2.1-2.4s1.7.8 2 2.4"/></svg></button>
      ${isPhone?'<button class="iconbtn bag" aria-label="Inventory"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 5h10l-1 9H4z"/><path d="M6 5V3.5a2 2 0 0 1 4 0V5"/></svg></button>':''}
    </div>
  </header>
  ${isPhone?`<div class="drawer"><div class="slot">Club <span>in hand</span></div><div class="slot">Bandages <span>2 uses left</span></div><div class="slot">Empty <span>—</span></div></div>`:''}
  <div class="log"></div>
  <div class="wx"></div><div class="ipop top"></div>
  <section class="act"></section>
  <div class="modal"></div><div class="fls"></div>
  <div class="peek"></div>
  <div class="ctrl"><button class="zin" title="Zoom in">+</button><button class="zout" title="Zoom out">−</button><button class="rec" title="Back to you"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="3"/><path d="M8 1v3M8 12v3M1 8h3M12 8h3"/></svg></button><button class="whole" title="Whole map"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg></button></div>
  <div class="hint">${isPhone?"Tap a lit area to look · tap again to go":"Hover a lit area to sense it · click to go"}</div>`;
  const svg=root.querySelector("svg.map"),world=root.querySelector(".world"),pw=root.querySelector(".pw"),defs=root.querySelector("defs");
  const peek=root.querySelector(".peek"),act=root.querySelector(".act"),log=root.querySelector(".log");
  const hint=root.querySelector(".hint");
  hint.style.cssText=isPhone?"display:none":"right:56px;bottom:16px";
  if(isPhone)root.querySelector(".ctrl").style.cssText="top:104px;bottom:auto";else root.querySelector(".ctrl").style.bottom="14px";
  const uid=root.id;
  // patterns
  const biomes=[...new Set(cells.map(c=>c.biome))];
  defs.innerHTML=`<pattern id="${uid}-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)"><rect width="12" height="12" fill="rgba(255,90,70,.06)"/><line x1="0" y1="0" x2="0" y2="12" stroke="rgba(255,120,100,.38)" stroke-width="3"/></pattern>
    <radialGradient id="${uid}-void"><stop offset="0" stop-color="#050404"/><stop offset="1" stop-color="#0b0909"/></radialGradient>`;
  // map textures live in one pre-painted canvas (moved by the GPU), not in the SVG
  const bgc=root.querySelector(".mapbg"),KB=isPhone?1.15:1.6;bgc.width=Math.round(W*KB);bgc.height=Math.round(H*KB);bgc.style.width=W+"px";bgc.style.height=H+"px";
  const bx=bgc.getContext("2d");const IMG={};let bgKey="",bgRaf=0;
  function tex(b,far){const k=(far?"g/":"")+b;if(!IMG[k]){const im=new Image();im.decoding="async";im.onload=()=>{bgKey="";paintBg()};im.src=`bg/${k}.webp`;IMG[k]=im}return IMG[k]}
  function paintBg(){if(bgRaf)return;bgRaf=requestAnimationFrame(()=>{bgRaf=0;
    const you=cells[state.you],reach=new Set(you.nb.filter(n=>!cells[n].closed)),night=svg.classList.contains("night");
    const key=state.you+"|"+night+"|"+cells.map(c=>c.closed?0:1).join("");if(key===bgKey)return;bgKey=key;
    bx.setTransform(KB,0,0,KB,0,0);bx.clearRect(0,0,W,H);
    cells.forEach(c=>{if(c.closed)return;const isYou=c.i===state.you,isR=reach.has(c.i),im=tex(c.biome,!(isYou||isR));
      bx.save();bx.beginPath();c.poly.forEach(([x,y],k)=>k?bx.lineTo(x,y):bx.moveTo(x,y));bx.closePath();bx.clip();
      if(im.complete&&im.naturalWidth){const m=Math.max(c.bw,c.bh)*1.25;bx.globalAlpha=isYou?1:isR?.9:.42;bx.drawImage(im,c.cx-m/2,c.cy-m/2,m,m)}
      if(!isYou&&!isR){bx.globalAlpha=1;bx.fillStyle="rgba(10,8,9,.25)";bx.fill()}
      bx.restore()});
    if(night){bx.globalCompositeOperation="multiply";bx.fillStyle="rgb(165,160,190)";bx.fillRect(0,0,W,H);bx.globalCompositeOperation="source-over"}})}
  let sel=null; // phone: first tap
  let w=0,h=0;
  const Z0=(isPhone?1.05:1.35)*ZS;
  const cam={z:Z0,px:0,py:0};let hoverI=null;
  function layout(){const r=root.getBoundingClientRect();w=r.width;h=r.height}
  function origin(){return[w/2,isPhone?h*.40:h/2]}
  function tx(){const you=cells[state.you],[ox,oy]=origin();return[ox+cam.px-you.cx*cam.z,oy+cam.py-you.cy*cam.z]}
  function toScreen(x,y){const [a,b]=tx();return[x*cam.z+a,y*cam.z+b]}
  let cardK=0,raf=0;
  function applyCam(anim,rescore){world.classList.toggle("anim",!!anim);bgc.classList.toggle("anim",!!anim);pw.classList.toggle("anim",!!anim);const [a,b]=tx();world.style.transform=pw.style.transform=bgc.style.transform=`translate(${a}px,${b}px) scale(${cam.z})`;
    if(rescore)pickSide(cam.z,a,b);
    cancelAnimationFrame(raf);
    if(anim){const t0=performance.now();const loop=()=>{follow();if(performance.now()-t0<560)raf=requestAnimationFrame(loop)};loop()}else follow();
    root.querySelector(".whole").classList.toggle("on",cam.whole===true)}
  function inPoly(x,y,poly){let o=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)o=!o}return o}
  // fixed, short distance from your dot (independent of area size/zoom)
  function cands(z,a,b){const you=cells[state.you];const sx=you.cx*z+a,sy=you.cy*z+b;const cw=act.offsetWidth||268,ch=act.offsetHeight||120;const d=24;
    return[["l",sx+d,sy-28],["r",sx-d-cw,sy-28],["t",sx-24,sy+d],["b",sx-24,sy-d-ch],
           ["l",sx+d,sy-ch+28],["r",sx-d-cw,sy-ch+28],["t",sx-cw+24,sy+d],["b",sx-cw+24,sy-d-ch]]}
  // choose the side once (per move / recenter), against the target camera
  function pickSide(z,a,b){if(isPhone)return;if(VARIANT!=="card")return;const you=cells[state.you];const cw=act.offsetWidth||268,ch=act.offsetHeight||120;
    const reach=you.nb.filter(n=>!cells[n].closed).map(n=>cells[n]);let best=null;
    cands(z,a,b).forEach(([ar,x,y],k)=>{let hit=0,out=0;
      for(let gx=0;gx<=6;gx++)for(let gy=0;gy<=4;gy++){const px=x+cw*gx/6,py=y+ch*gy/4;
        if(px<8||py<58||px>w-56||py>h-8){out++;continue}
        const wx=(px-a)/z,wy=(py-b)/z;if(reach.some(c=>inPoly(wx,wy,c.poly)))hit++}
      const badge=reach.filter(c=>{const bx=c.cx*z+a,by=c.cy*z+b;return bx>x-16&&bx<x+cw+16&&by>y-16&&by<y+ch+16}).length;
      const score=hit*3+out*5+badge*40+k*.1;if(!best||score<best.score)best={k,score}});
    cardK=best.k;act.className="act v-card ar-"+cands(z,a,b)[cardK][0]+(cardK>3?" lo":"")}
  // glue the card to the live (possibly animating) map transform every frame
  const teth=root.querySelector(".tether");
  function follow(){if(isPhone)return;const m=new DOMMatrixReadOnly(getComputedStyle(world).transform);const you=cells[state.you];
    const sx=you.cx*m.a+m.e,sy=you.cy*m.d+m.f;
    teth.style.display=VARIANT==="side"?"block":"none";
    if(VARIANT==="radial"){act.style.transform=`translate3d(${Math.round(sx)}px,${Math.round(sy)}px,0)`;return}
    if(VARIANT==="pill"){const pw=act.offsetWidth;act.style.transform=`translate3d(${Math.round(sx-pw/2)}px,${Math.round(sy+26)}px,0)`;return}
    if(VARIANT==="side"){const r=act.getBoundingClientRect(),fr=root.getBoundingClientRect();const ex=r.left-fr.left,ey=r.top-fr.top+59;
      teth.querySelector("path").setAttribute("d",`M${sx},${sy} C${(sx+ex)/2},${sy} ${(sx+ex)/2},${ey} ${ex},${ey}`);const c=teth.querySelector("circle");c.setAttribute("cx",ex);c.setAttribute("cy",ey);return}
    const [,x,y]=cands(m.a,m.e,m.f)[cardK];act.style.transform=`translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`}
  function zoomAt(f,mx,my){const z2=Math.min(2,Math.max(.22,cam.z*f));const [a,b]=tx();const wx=(mx-a)/cam.z,wy=(my-b)/cam.z;
    const you=cells[state.you],[ox,oy]=origin();cam.z=z2;cam.px=mx-wx*z2-ox+you.cx*z2;cam.py=my-wy*z2-oy+you.cy*z2;cam.whole=false;hidePeek();applyCam(false)}
  function recenter(){cam.z=Z0;cam.px=0;cam.py=0;cam.whole=false;applyCam(true,true)}
  function whole(){if(cam.whole){recenter();return}const z=Math.min(w,h-(isPhone?200:60))/(W*1.02);const you=cells[state.you],[ox,oy]=origin();
    cam.z=z;cam.px=w/2-W/2*z-ox+you.cx*z;cam.py=(isPhone?(h-150)/2+20:h/2+20)-H/2*z-oy+you.cy*z;cam.whole=true;hidePeek();applyCam(true,true)}
  function path(poly){return"M"+poly.map(p=>p.join(",")).join("L")+"Z"}

  function render(){
    layout();
    const you=cells[state.you];const reach=new Set(you.nb.filter(n=>!cells[n].closed));
    let g="";
    cells.forEach(c=>{
      const d=path(c.poly);
      if(c.closed){g+=`<path d="${d}" fill="url(#${uid}-void)" stroke="#0a0808" stroke-width="2"/>`;return}
      const isYou=c.i===state.you,isR=reach.has(c.i);
      g+=`<path class="cell ${isR?"reach":""}" data-i="${c.i}" d="${d}" fill="transparent" stroke="#0b0909" stroke-width="2"/>`;
      if(c.closing)g+=`<path d="${d}" fill="url(#${uid}-hatch)" pointer-events="none"/>`;
      if(c.burnt)g+=`<path d="${d}" fill="rgba(20,14,12,.72)" pointer-events="none"/>`;
      if(c.burning)g+=`<path class="burn" d="${d}" fill="#ff6a2a" pointer-events="none"/><path d="${d}" fill="none" stroke="#ffb067" stroke-width="2" pointer-events="none"/>`;
    });
    // things you know about: structures, rations (seen areas only)
    if(!state.bloodbath&&lootLeft()){const c=cells[corn];g+=`<g pointer-events="none" transform="translate(${c.cx-22} ${c.cy-20})"><rect x="-10" y="-10" width="20" height="20" rx="6" fill="rgba(12,10,11,.82)" stroke="#fad02c" stroke-opacity=".7" stroke-width=".8"/><g transform="translate(-6 -6) scale(.75)" fill="none" stroke="#fad02c" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${AIC.loot}</g></g>`}
    cells.filter(c=>!c.closed&&(c.struct||c.ration)&&(c.seen||reach.has(c.i)||c.i===state.you)).forEach(c=>{const k=c.struct==="Safe Cave"?"cave":c.struct==="Abandoned Shelter"?"shelterIn":c.struct==="Oasis"?"oasis":c.struct==="Fruit Tree"?"fruit":"ration";
      g+=`<g pointer-events="none" transform="translate(${c.cx+18} ${c.cy-18})"><rect x="-10" y="-10" width="20" height="20" rx="6" fill="rgba(12,10,11,.82)" stroke="#9bd59b" stroke-opacity=".7" stroke-width=".8"/><g transform="translate(-6 -6) scale(.75)" fill="none" stroke="#9bd59b" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${AIC[k]}</g></g>`});
    // closing edges pulse
    let pg="";cells.filter(c=>c.closing).forEach(c=>{g+=`<path d="${path(c.poly)}" fill="none" stroke="#ff7a66" stroke-opacity=".45" stroke-width="2" stroke-dasharray="7 6" pointer-events="none"/>`;pg+=`<path d="${path(c.poly)}" fill="none" stroke="#ff7a66" stroke-opacity=".5" stroke-width="2.4" stroke-dasharray="7 6"/>`});
    // trail
    if(state.trail.length){const t=[...state.trail,state.you].map(i=>cells[i]);g+=`<path d="M${t.map(c=>c.cx+","+c.cy).join("L")}" fill="none" stroke="rgba(250,208,44,.45)" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" pointer-events="none"/>`}
    // lit neighbour rim + sense badges
    reach.forEach(n=>{const c=cells[n];g+=`<path d="${path(c.poly)}" fill="none" stroke="rgba(250,208,44,.5)" stroke-width="1.6" pointer-events="none"/>`;
      if(c.sense&&!(EVENT.on&&EVENT.type==="fog"&&c.sense!=="smoke")){const s=SENSE[c.sense];g+=`<g pointer-events="none" transform="translate(${c.cx} ${c.cy})"><circle r="17" fill="${s.c}" opacity=".10"/><circle r="10.5" fill="rgba(12,10,11,.78)" stroke="${s.c}" stroke-opacity=".5" stroke-width=".8"/><g transform="translate(-6 -6) scale(.75)" fill="none" stroke="${s.c}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${ICON[c.sense]}</g></g>`}});
    const IT=intention();
    if(IT.a==="go"){const tc=cells[IT.to];g+=`<line x1="${you.cx}" y1="${you.cy}" x2="${tc.cx}" y2="${tc.cy}" stroke="#fad02c" stroke-opacity=".55" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" pointer-events="none"/>`}
    // you
    g+=`<path d="${path(you.poly)}" fill="none" stroke="#fad02c" stroke-opacity=".55" stroke-width="2.6" stroke-linejoin="round" pointer-events="none"/>`;
    pg+=`<path d="${path(you.poly)}" fill="#fad02c" fill-opacity=".12" stroke="#fad02c" stroke-opacity=".7" stroke-width="5" stroke-linejoin="round"/>`;pw.innerHTML=pg;
    state.allies.forEach((a,k)=>{const ang=2.4+k*0.9;const ax=you.cx+Math.cos(ang)*16,ay=you.cy+Math.sin(ang)*16;g+=`<g pointer-events="none"><circle cx="${ax}" cy="${ay}" r="4.5" fill="${a.suspicious?"#ff8f7d":"#9bd59b"}" stroke="#0b0909" stroke-width="1.2"/><title>${a.n}</title></g>`});
    g+=`<circle cx="${you.cx}" cy="${you.cy}" r="5.5" fill="#fad02c" stroke="#1b1400" stroke-width="1.5"/>`;
    g+=`<radialGradient id="${uid}-fog" gradientUnits="userSpaceOnUse" cx="${you.cx}" cy="${you.cy}" r="${EVENT.on&&EVENT.type==="fog"?340:520}"><stop offset="${EVENT.on&&EVENT.type==="fog"?.25:.38}" stop-color="#0b0909" stop-opacity="0"/><stop offset="1" stop-color="#0b0909" stop-opacity=".8"/></radialGradient><rect x="-400" y="-400" width="${W+800}" height="${H+800}" fill="url(#${uid}-fog)" pointer-events="none"/>`;
    g+=`<g class="route" pointer-events="none"></g>`;
    world.innerHTML=g;
    // HUD
    root.querySelector(".when").textContent=isPhone?`D${state.day} · ${state.phase}`:`Day ${state.day} · ${state.phase}`;
    root.querySelector(".alive").textContent=state.alive;
    root.classList.toggle("low",state.hp<35&&!state.dead&&!state.won);root.classList.toggle("crit",state.hp<18&&!state.dead&&!state.won);
    root.querySelector(".evchip").innerHTML=EVENT.on?`<span title="${EVTXT[EVENT.type].n}: ${EVTXT[EVENT.type].hint}">${EVTXT[EVENT.type].ic}<em> ${EVTXT[EVENT.type].n}</em></span>`:"";
    root.querySelector(".arena").textContent=ARENA.name;
    root.querySelector(".allies").innerHTML=state.allies.map(a=>`<span class="al ${a.suspicious?"sus":""}" data-allyopen="${a.n}" title="${a.n}, District ${a.d} — your ally">${a.n[0]}</span>`).join("");
    root.querySelector(".wx").className="wx "+(EVENT.on?EVENT.type:"");
    svg.classList.toggle("night",state.phase==="Evening"||(state.modal&&state.modal.k==="night"));paintBg();
    // HUD state
    const hpb=root.querySelector(".hpb"),enb=root.querySelector(".enb");
    hpb.style.width=state.hp+"%";hpb.style.background=state.hp>60?"#4fbf6a":state.hp>35?"#e9a23b":"#e8604f";
    enb.style.width=state.en+"%";enb.style.background=state.en>50?"#4fbf6a":state.en>30?"#e9a23b":"#e8604f";
    const cw=conds();const words=[hpWord(),...cw.slice(0,2).map(c=>`<em class="c-${c[1]}">${c[0]}</em>`)].join(" · ")+(cw.length>2?` <em class="c-m">+${cw.length-2}</em>`:"");const wordsAll=[hpWord(),...cw.map(c=>`<em class="c-${c[1]}">${c[0]}</em>`)].join(" · ");
    root.querySelector(".words").innerHTML=words;root.querySelector(".words").title=cw.map(c=>c[0]).join(", ");root.querySelector(".pop").innerHTML=wordsAll;
    const INV=inventory();const slotHTML=INV.map(it=>`<button class="slot2 ${catOf(it.base)} ${it.held?"held":""} ${it.dim?"dim":""} ${openItem===it.id?"open":""}" data-item="${it.id}" title="${it.n}">${it.ic}${it.q>1?`<i>${it.q}</i>`:""}</button>`).join("")+Array.from({length:Math.max(0,5-INV.length)},()=>'<span class="slot2 empty"></span>').join("");
    root.querySelector(".carry").innerHTML=slotHTML;
    root.querySelector(".rh").innerHTML=PH.map((p,k)=>`<i class="${k<state.pi?"done":k===state.pi?"now":""}" title="${p}"></i>`).join("")+`<i class="moon">☾</i>`;
    root.querySelector(".when").textContent=isPhone?`D${state.day} · ${state.phase}`:`Day ${state.day} · ${state.phase}`;
    const drawerEl=root.querySelector(".drawer");if(drawerEl)drawerEl.innerHTML=`<div class="dslots">${slotHTML}</div><div class="ipop in"></div>`;
    renderItemPop();
    // panel
    const it=IT,opts=options(it);foreMap={};
    opts.forEach(k=>foreMap[k]=forecast(k,it.to));["search","climb","snare","call","eat","drink","swap","drinkHere","bandage"].forEach(k=>{if(!foreMap[k])foreMap[k]=forecast(k)});
    const ARW=deg=>`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${deg}deg)"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;
    const paths=you.nb.map(n=>cells[n]).filter(c=>!c.closed).map(c=>({c,deg:Math.atan2(c.cy-you.cy,c.cx-you.cx)*180/Math.PI})).sort((a,b)=>((a.deg+450)%360)-((b.deg+450)%360));
    paths.forEach(({c})=>foreMap["go:"+c.i]=forecast("go",c.i));
    const pathHTML=paths.map(({c,deg})=>{const sc=c.sense&&!(EVENT.on&&EVENT.type==="fog"&&c.sense!=="smoke")?SENSE[c.sense]:null;const d=dirOf(you,c);
      return `<div class="optw"><button class="opt path ${it.a==="go"&&it.to===c.i?"sug":""}" data-a="go" data-to="${c.i}" data-k="go:${c.i}">${ARW(deg)} ${d[0].toUpperCase()+d.slice(1)}<span class="pn">${c.name}</span><small>${sc?`<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="${sc.c}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON[c.sense]}</svg>`:""}${c.closing?'<em class="c-r">closing</em>':""}</small></button><div class="of"></div></div>`}).join("");
    const optHTML=opts.map((k,j)=>{const isGo=k==="go";const lbl=isGo?`Go ${dirOf(you,cells[it.to])}`:LBL[k];const sub=isGo?cells[it.to].name:SUBT[k]||"";
      return `<div class="optw"><button class="opt ${j===0?"pri":""}" data-a="${k}" data-k="${k}" ${isGo?`data-to="${it.to}"`:""}>${isGo?'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>':svgI(AIC[k]?k:"forage")} ${lbl}<small>${sub}</small></button><div class="of ${j===0?"show":""}">${j===0?foreMap[k]:""}</div></div>`}).join("");
    const stepsNb=you.nb.map(n=>cells[n]).find(c=>c.sense==="steps"&&!c.closed);
    const IC={club:'<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M3 13l6-6"/><path d="M9 7c0-2 1.5-4 3.5-4.2.2 2-1.8 3.7-3.5 4.2Z"/></svg>',
      band:'<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="2.5" y="5.5" width="11" height="5" rx="2.5" transform="rotate(-35 8 8)"/></svg>',
      bread:'<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 9.5C3 6.5 5.2 4.5 8 4.5s5 2 5 5v2H3z"/></svg>',
      water:'<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2.5h4M6.5 2.5v2L5 6.5v6.5h6V6.5L9.5 4.5v-2"/><path d="M5 9h6"/></svg>'};
    const item=(a,ic,name,verb,on,held)=>`<button class="item ${held?"held":""}" data-a="${a}" data-k="${a}" ${on?"":"disabled"}>${ic}<span>${name}</span><small>${verb}</small></button>`;
    const traits=[];if(you.closing)traits.push(["Gone tonight","r"]);if(you.burning)traits.push(["Burning","r"]);if(you.hazard)traits.push([HAZ[you.hazard].n,HAZ[you.hazard].tone]);(you.tags||[]).forEach(t=>{if(TAGTXT[t])traits.push([TAGTXT[t][0],TAGTXT[t][2],TAGTXT[t][1]])});
    if(you.water)traits.push([you.water==="murky"?"Murky water":"Water","b"]);if(you.struct)traits.push([you.struct,"g"]);if(you.ration)traits.push(["Capitol ration","g"]);
    const about=[];if(you.struct)about.push(STRUCTTXT[you.struct]);if(you.hazard)about.push(HAZ[you.hazard].t);(you.tags||[]).filter(t=>TAGTXT[t]&&!(you.biome==="cornucopia"&&t==="rich")).forEach(t=>about.push(TAGTXT[t][1]));
    const traitHTML=`<div class="traits">${traits.map(([n,c,tt])=>`<span class="tr t${c}" ${tt?`title="${tt}"`:""}>${n}</span>`).join("")}</div>${about.length?`<p class="about">${about.slice(0,2).join(" ")}</p>`:""}`;
    act.innerHTML=`${isPhone?"":`<div class="img" style="background-image:url(bg/${you.biome}.webp)"><b>${you.name}</b></div>`}<div class="body">${isPhone?"":traitHTML}
      ${isPhone?`<div class="phn">${you.name}</div>${traitHTML}`:""}
      <p class="intent ${it.u?"urgent":""}">${it.t}</p>
      ${(()=>{if(!state.allies.length)return"";const a=state.allies[0];const b=you.nb.map(n=>cells[n]).find(c=>c.creature&&!c.closed&&beastSeen(c));const st=you.nb.map(n=>cells[n]).find(c=>c.people==="steps");
        const tip=b?`"Something big, ${dirOf(you,b)}. Not that way."`:st?`"Someone's moving to the ${dirOf(you,st)}. Want to see who?"`:state.thirst>=2?`"I need water too."`:"";return tip?`<p class="allytip"><b>${a.n}:</b> ${tip}</p>`:""})()}
      <div class="btns">${optHTML}</div>
      ${you.ground&&you.ground.some(g=>!g.hidden)?`<button class="onground" data-a="ground" data-k="ground"><span>On the ground</span>${you.ground.filter(g=>!g.hidden).map(g=>`<span class="gi ${catOf(g.id)}">${icOf(g.id)}</span>`).join("")}<em>›</em></button>`:""}
      ${isPhone?'<p class="explore">Or tap any lit area to explore.</p>':`<div class="sec">Paths <span>· or click the map</span></div><div class="paths">${pathHTML}</div>`}
      ${stepsNb&&isPhone?`<div class="ctx ph1">Footsteps to the ${dirOf(you,stepsNb)}. <button data-a="call" data-k="call">Call out</button></div>`:""}
      ${stepsNb&&!isPhone?`<div class="ctx">Footsteps to the ${dirOf(you,stepsNb)}. Someone alone.<div class="r"><button data-a="call" data-k="call">Call out softly</button><button data-a="hide" data-k="hide">Stay quiet</button></div></div>`:""}
      ${isPhone?"":`<div class="sec">Around you</div><div class="chips"><button class="chip" data-a="search" data-k="search">Search the ground</button><button class="chip" data-a="climb" data-k="climb">Climb a tree</button><button class="chip" data-a="snare" data-k="snare">Set a snare</button></div><div class="of row"></div>
`}</div>`;
    act.className="act v-side"+(isPhone?" ph":"");
    renderModal();
    spawnFx();
    if(state.cannon||(state.modal&&state.modal.k==="dead"&&!state.modal.shown)){const fr=root;fr.classList.remove("shake");void fr.offsetWidth;fr.classList.add("shake");
      const fl=document.createElement("div");fl.className="flash";root.appendChild(fl);setTimeout(()=>fl.remove(),1200);
      const al=root.querySelector(".alive");al.classList.remove("drop");void al.offsetWidth;al.classList.add("drop");
      if(state.cannon){const b=document.createElement("div");b.className="boom";b.innerHTML=state.cannon.dir==="many"?`<b>Cannons</b><span>${state.cannon.kind==="closing"?`${state.cannon.n}. The arena took them with the ground.`:state.cannon.kind==="bloodbath"?`${state.cannon.n} of them, one after another. The bloodbath is over.`:`${state.cannon.n}, one after another. Somewhere out there.`}</span>`:state.cannon.dir==="near"?`<b>A cannon</b><span>Close. Very close.</span>`:state.cannon.dir==="here"?`<b>A cannon</b><span>${state.cannon.name}. By your hand.</span>`:`<b>A cannon</b><span>Somewhere to the ${state.cannon.dir}. Someone is gone.</span>`;root.appendChild(b);setTimeout(()=>b.remove(),5600)}}
    root.classList.toggle("dead",!!state.dead);
    renderLog();
    hidePeek();
    applyCam(true,true);
  }
  let foreMap={},psel=null;
  const modal=root.querySelector(".modal"),fls=root.querySelector(".fls");
  const SIL='<svg width="54" height="54" viewBox="0 0 54 54" fill="none"><circle cx="27" cy="18" r="9" fill="#2a2324"/><path d="M10 52c1-12 8-20 17-20s16 8 17 20" fill="#2a2324"/><circle cx="27" cy="27" r="26" stroke="rgba(250,208,44,.25)"/></svg>';
  function renderModal(){const m=state.modal;modal.classList.toggle("on",!!m);if(!m){modal.innerHTML="";return}
    if(m.k==="enc"){const f=m.foe;const DT={hostile:["Hostile","red"],wary:["Wary","amber"],open:["Open","green"]}[m.disp];
      modal.innerHTML=`<div class="mcard enc">${SIL}<div class="mt">Someone in the ${m.where.toLowerCase()}</div><div class="who">${f.n} <span class="dist">District ${f.d}</span></div>${m.rel?`<div class="relx">${m.rel}</div>`:""}
      ${m.res?`<div class="verdict t-${m.res.tone}">${m.res.v}</div><p class="res">${m.res.t}</p><div class="fxrow">${m.res.fx.map(x=>`<span class="c-${x[1]}">${x[0]}</span>`).join("")}</div><button class="mbtn pri cont">Continue</button>`:
      `<div class="stance t-${m.unaware?"green":DT[1]}"><b>${m.unaware?"Unaware of you":DT[0]}</b>${m.posture}</div><div class="read">${m.read.map(r=>`<span>${r}</span>`).join("")}</div>`+
      ["fight","talk","ally","slip"].map(o=>`<button class="mbtn ${o==="ally"?"allyb":""}" data-o="${o}">${o==="fight"?"Fight":o==="talk"?"Talk":o==="ally"?"Propose an alliance":"Slip away"}<small>${encFore(o,m)}</small></button>`).join("")}</div>`}
    else if(m.k==="intro"){modal.innerHTML=`<div class="mcard intro"><div class="iimg" style="background-image:url(bg/${ARENA.dom||"arena"}.webp)"></div><div class="mt">The ${state.games||74}th Games</div><div class="aname">${ARENA.name}</div>
      <p class="res">${ARENA.line}</p><p class="res dim">You rise into the light at the Cornucopia. District ${SETUP.district}. ${SETUP.players} of you on the plates.${PARTNER?` Somewhere in the circle: ${PARTNER.n} ${PARTNER.last}, your district partner.`:""}${CAREER_ME?" You trained for this. The Careers will be looking for you.":""}</p><button class="mbtn c pri begin">Step off the plate</button></div>`}
    else if(m.k==="broadcast"){modal.innerHTML=`<div class="mcard bc"><div class="mt">The Capitol</div><p class="res big">“${m.t}”</p><p class="res warnl">${m.sub}</p><button class="mbtn c pri resume">Continue</button></div>`}
    else if(m.k==="beast"){const cr=m.cr,nm=beastName(cr);modal.innerHTML=`<div class="mcard enc beast"><div class="claw"><svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#ff8f7d" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${ICON.beast}</svg></div><div class="mt">${m.came==="night"?`In the dark, in the ${m.where.toLowerCase()}`:m.came?`Something comes into the ${m.where.toLowerCase()}`:`Something in the ${m.where.toLowerCase()}`}</div><div class="who">${nm}<span class="dist">Gamemaker mutt</span></div>${m.watch?`<p class="res dim">${m.watch} woke you in time.</p>`:""}
      ${m.res?`<div class="verdict t-${m.res.tone}">${m.res.v}</div><p class="res">${m.res.t}</p><div class="fxrow">${m.res.fx.map(x=>`<span class="c-${x[1]}">${x[0]}</span>`).join("")}</div><button class="mbtn pri cont">Continue</button>`:
      `<div class="stance t-${m.noticed?"red":"amber"}"><b>${m.noticed?"It's seen you":"Unaware"}</b>${m.noticed?"Its head snaps toward you.":"It hasn't noticed you. Yet."}</div><div class="read">${m.read.map(r=>`<span>${r}</span>`).join("")}</div>`+
      ["fight","still","back"].map(o=>`<button class="mbtn" data-o="${o}">${o==="fight"?"Fight it":o==="still"?"Hold still":"Back away"}<small>${beastFore(o,m)}</small></button>`).join("")}</div>`}
    else if(m.k==="loot"){const sec=m.leftovers?[["feet","What's left"],["way",""],["horn",""]]:RINGS;
      const note={feet:"",way:"Others closing in",horn:`${2+state.lootRound} Careers there`};
      const rows=sec.map(([r,lbl])=>{const items=state.loot[r];if(!items.length)return lbl&&!m.leftovers?`<div class="ring"><div class="rl">${lbl}</div><p class="gone">Gone.</p></div>`:"";
        const [rw,rc]=riskWord(m.leftovers?.22:lootRisk(r));
        return `<div class="ring">${lbl?`<div class="rl">${lbl}${m.leftovers?"":` <span class="rk t${rc}">${rw}</span>${note[r]?`<span class="rn">${note[r]}</span>`:""}`}</div>`:""}<div class="lgrid">${items.map((id,i)=>itemCard(id,`data-loot="${r}:${i}"`)).join("")}</div></div>`}).join("");
      modal.innerHTML=`<div class="mcard loot">${m.res?`<div class="verdict t-green">${IT[m.res.id].k==="pack"?"You got a "+IT[m.res.id].n.toLowerCase():"You got the "+IT[m.res.id].n.toLowerCase()}</div><p class="res">${m.res.t}</p>${lootLeft()?`<p class="res warnl">It's getting worse out there.</p>`:""}`:
        `<div class="mt">${m.leftovers?"The Cornucopia, after":"The Cornucopia"}</div><p class="res dim">${m.leftovers?"Some things were left behind.":"Sixty seconds are over. Everyone runs."}</p>`}
        ${m.res&&!lootLeft()?"":`<div class="rings">${rows}</div>`}
        <div class="mrow">${m.leftovers?`<button class="mbtn c resume">Leave it</button>`:`<button class="mbtn c lrun">Run</button><button class="mbtn c lhide">Stay low</button>`}</div></div>`}
    else if(m.k==="ground"){const c=cells[m.c];const vis=c.ground.filter(x=>!x.hidden);
      const head=m.mode==="forage"?(m.nothing?"Nothing here":"You search the ground"):m.mode==="enter"?"Something on the ground":"On the ground";
      modal.innerHTML=`<div class="mcard loot ground"><div class="mt">${head}</div><p class="res dim">${c.name}</p>
        ${m.took&&m.took.length?`<div class="fxrow">${m.took.map(t=>`<span class="c-g">+ ${t}</span>`).join("")}</div>`:""}
        ${vis.length?`<div class="lgrid">${vis.map((g,i)=>itemCard(g.id,`data-take="${i}"`,g.fresh)).join("")}</div>`:`<p class="gone">${m.nothing?"Bare ground. Whatever was here is gone.":"Nothing left."}</p>`}
        ${c.ground.some(g=>g.hidden)&&m.mode!=="forage"?`<p class="res dim ghint">Something else might be buried here. Forage to look closer.</p>`:""}
        <div class="mrow"><button class="mbtn c pri gdone">${m.mode==="forage"||(m.took&&m.took.length)?"Done":"Leave it"}</button></div></div>`}
    else if(m.k==="recap"){const rows=recapRows();
      modal.innerHTML=`<div class="mcard trib recap"><div class="mt">The ${state.games||74}th Games</div><p class="res dim">Every tribute, in the order they fell.</p>
        <ol class="rcp">${rows.map((r,k)=>`<li class="${r.win?"win":""} ${r.me?"me":""}"><span class="rk">${r.win?"♛":rows.length-k}</span><div><b>${r.n}${r.me?"":` <i>District ${r.dt}</i>`}</b><em>${r.how}${r.where?` · ${r.where}`:""}</em></div><small>Day ${r.d}${r.p?`<br>${r.p.toLowerCase()}`:""}</small></li>`).join("")}</ol>
        <button class="mbtn c pri recapback">Back</button></div>`}
    else if(m.k==="win"){modal.innerHTML=`<div class="mcard obit ${m.shown?"":"enter"}"><div class="obl" style="text-align:center"><div class="sky" style="box-shadow:0 0 60px rgba(250,208,44,.35)"><svg width="54" height="54" viewBox="0 0 16 16" fill="none" stroke="#fad02c" stroke-width="1" stroke-linejoin="round"><path d="M2.5 12.5h11L14 5l-3.5 3L8 3.5 5.5 8 2 5z"/></svg></div>
      <div class="mt">The victor</div><div class="aname">District ${SETUP.district}</div><p class="res">The last cannon fades. Trumpets. A hovercraft drops a ladder of light.</p>
      <div class="stats"><div><b>1st</b><span>of ${state.total}</span></div><div><b>${state.day}</b><span>days</span></div><div><b>${state.moments.filter(x=>/You killed/.test(x.t)).length}</b><span>kills</span></div></div>
      <div class="sec2">Your games</div><ol class="tl">${state.moments.slice(-6).map(x=>`<li><span>D${x.d}</span>${x.t}</li>`).join("")}</ol></div>
      <div class="obr"><div class="sec2">Those who fell</div><div class="after">${state.fallen.slice(-12).reverse().map(r=>`<span>† ${r.n} <i style="color:var(--mute);font-style:normal">${r.d}</i></span>`).join("")}</div>
      <button class="mbtn c recapbtn">What happened to everyone</button><div class="mrow"><button class="mbtn c totitle">New setup</button><button class="mbtn pri restart">Play again</button></div></div></div>`}
    else if(m.k==="pushed"){modal.innerHTML=`<div class="mcard"><div class="mt">The arena closed</div><p class="res big">In the dark, the ${m.pz.from.toLowerCase()} fell away under you.</p><p class="res">You clawed your way into the ${m.pz.to.toLowerCase()}.</p><div class="fxrow"><span class="c-r">− hurt</span></div><p class="res dim">Areas marked with red stripes close at night. Stay inside.</p><button class="mbtn c pri resume">Continue</button></div>`}
    else if(m.k==="allyopts"){const a=ROSTER.find(x=>x.n===m.n);if(!m.res&&!state.allies.includes(a)){state.modal=null;return renderModal()}
      modal.innerHTML=m.res?`<div class="mcard enc">${SIL}<div class="who">${a.n}</div><div class="verdict t-${m.res.tone}">${m.res.v}</div><p class="res">${m.res.t}</p><button class="mbtn pri resume">Continue</button></div>`:
      `<div class="mcard enc">${SIL}<div class="mt">Your ally</div><div class="who">${a.n} <span class="dist">District ${a.d}</span></div><div class="read"><span>${a.hurt?"Hurt":"Steady"}</span><span>${a.weapon==="bare hands"?"Unarmed":"Carries a "+a.weapon}</span>${a.suspicious?'<span class="c-r">Watching you</span>':""}</div>
        <button class="mbtn" data-ao="stay">Stay together<small>Nothing changes.</small></button>
        <button class="mbtn" data-ao="part">Part ways<small>On good terms.</small></button>
        <button class="mbtn betrayb" data-ao="betray">Turn on ${pr(a).o}<small>${pr(a).S}'s not expecting it.</small></button></div>`}
    else if(m.k==="gift"){modal.innerHTML=`<div class="mcard gift"><div class="chute ${catOf(m.id)}">${icOf(m.id)}</div><div class="mt">A silver parachute</div><p class="res big">${m.got[0].toUpperCase()+m.got.slice(1)}.</p><p class="res dim">Someone out there is watching. And paying.</p><button class="mbtn c pri resume">Take it</button></div>`}
    else if(m.k==="pack"){modal.innerHTML=`<div class="mcard"><div class="mt">The Careers</div><p class="res big">${m.who.map(r=>r.n).join(", ")} wave you over to the horn.</p>${state.packWhy?`<p class="res dim">${state.packWhy}</p>`:""}
      <p class="res">${CAREER_ME?"“You're one of us. For now.”":"“You fight like one of us. Someone has to carry the packs.”"}</p>
      <p class="res dim">${CAREER_ME?"With them, few will dare to touch you. But the pack never lasts.":"You'd be the outsider — the first to go when it turns."}</p><button class="mbtn c pri joinpack">Join the Careers</button><button class="mbtn c declinepack">Go alone</button></div>`}
    else if(m.k==="betray"){const a=m.a;modal.innerHTML=`<div class="mcard enc">${SIL}<div class="mt">In the night</div><div class="who">${a.n} <span class="dist">District ${a.d}</span></div><div class="verdict t-red">${a.n} betrayed you</div>
      <p class="res">You wake to the ${a.weapon==="bare hands"?"weight of a knee on your chest":a.weapon} — and ${pr(a).s}'s already pulling back. You fight free, bleeding. By dawn ${pr(a).s}'s gone.</p><div class="fxrow"><span class="c-r">badly hurt</span><span class="c-r">bleeding</span><span class="c-m">ally lost</span></div><button class="mbtn pri resume">Continue</button></div>`}
    else if(m.k==="tributes"){const sel=m.sel?ROSTER.find(r=>r.n===m.sel):null;
      const chip=r=>`<button class="tchip ${r.dead?"dead":""} ${r.ally?"ally":""} ${r.know&&r.know.rel==="hostile"?"hos":r.know&&r.know.rel==="friendly"?"fri":""} ${sel===r?"on":""}" data-trib="${r.n}">${r.n}${r===PARTNER?'<i class="tp">partner</i>':""}${r.dead?`<i>†${(r.deadDay||"")}</i>`:""}</button>`;
      modal.innerHTML=`<div class="mcard trib"><div class="mt">The tributes</div><p class="res dim">${state.alive} still standing · <span class="lg ally">ally</span> <span class="lg fri">friendly</span> <span class="lg hos">hostile</span> <span class="lg car">Career</span></p>
        <div class="dlist">${Array.from({length:12},(_,i)=>i+1).map(d=>`<div class="drow ${d<=4?"car":""} ${d===SETUP.district?"mine":""}"><span class="dn">${d}</span><span class="dt">${TRADE[d]}</span><div class="tch">${d===SETUP.district?'<span class="tchip you">You</span>':""}${ROSTER.filter(r=>r.d===d).map(chip).join("")}</div></div>`).join("")}</div>
        <p class="tdet">${sel?`<b>${sel.n} ${sel.last}</b> · District ${sel.d}${sel.career?" · Career":""}<br>${sel.dead?`Fell on day ${sel.deadDay||"?"}. `:""}${sel.ally?`Your ally. <a href="#" class="tally" data-allyopen="${sel.n}">Options</a>`:sel.know?`Met on day ${sel.know.day} in the ${sel.know.where.toLowerCase()} — ${sel.know.note}.`:sel===PARTNER?"Your district partner. You haven't found each other yet.":"You haven't crossed paths."}`:"Tap a name."}</p>
        <button class="mbtn c pri resume">Close</button></div>`}
    else if(m.k==="menu"){modal.innerHTML=`<div class="mcard"><div class="mt">Paused</div><p class="res dim">Day ${state.day} · ${state.phase}. ${state.alive} still standing.</p>
      ${m.confirm?`<p class="res warnl">Leave the arena? Your games end here and you return to the setup.</p><button class="mbtn c pri totitle">Leave</button><button class="mbtn c resume">Stay</button>`:
      `<button class="mbtn c pri resume">Resume</button><button class="mbtn c leave">Leave the arena</button>`}</div>`}
    else if(m.k==="night"){modal.innerHTML=`<div class="mcard night"><div class="moonbig">☾</div><div class="mt">Night falls · Day ${state.day}</div>
      <p class="res">${m.n?`The anthem. ${m.n===1?"One face":m.n===2?"Two faces":m.n+" faces"} in the sky:`:"The anthem. No faces tonight."}</p>${m.n?`<div class="faces">${m.faces.slice(0,8).map(f=>`<div class="face"><svg width="30" height="30" viewBox="0 0 54 54"><circle cx="27" cy="20" r="9" fill="#3b4060"/><path d="M10 52c1-12 8-20 17-20s16 8 17 20" fill="#3b4060"/></svg><span>${f.n}<small>${f===PARTNER?"your partner":"District "+f.d}</small></span></div>`).join("")}${m.n>8?`<div class="face more">+${m.n-8}</div>`:""}</div>`:""}
      <p class="res dim">You: ${hpWord().toLowerCase()}${conds().length?", "+conds().map(c=>c[0].toLowerCase()).join(", "):""}. ${state.alive} still standing.</p>
      ${state.allies.length?`<p class="res dim">${state.allies.filter(a=>!a.suspicious).map(a=>a.n).join(" and ")||""}${state.allies.filter(a=>!a.suspicious).length>1?" sleep a few feet away.":state.allies.some(a=>!a.suspicious)?" sleeps a few feet away.":""}</p>`:""}
      ${m.note?`<p class="res">${m.note}</p>`:""}
      ${state.allies.map(a=>`<div class="arow"><button class="mbtn c leaveally" data-ally="${a.n}">Slip away from ${a.n}</button><button class="mbtn c killally" data-ally="${a.n}">Kill ${a.n} while ${pr(a).s} sleeps</button></div>`).join("")}
      ${(m.signs||[]).filter(a=>a.ally).map(a=>`<p class="res sign">${[`${a.n} keeps ${pr(a).p} ${a.weapon==="bare hands"?"back":a.weapon} between you while you lie down.`,`${a.n} doesn't sleep. You can feel ${pr(a).o} watching.`,`${a.n} counts the cannons out loud, then looks at you.`][a.n.length%3]}</p>`).join("")}
      ${m.cold?`<p class="res warnl">No cover, and the cold is coming down. This night will hurt.</p>`:""}
      ${cells[state.you].closing?`<p class="res deadly">You're lying on ground that won't exist by morning.</p>`:(cells.some(c=>c.closing)?`<p class="res warnl">Tonight the marked places disappear. You're on safe ground.</p>`:`<p class="res dim">The arena holds tonight.</p>`)}
      ${!EVENT.announced&&state.day+1>=EVENT.start?`<p class="res dim">The Gamemakers have been quiet. Too quiet.</p>`:EVENT.on&&state.day+1>EVENT.end?`<p class="res dim">The ${EVTXT[EVENT.type].n.toLowerCase()} should pass by morning.</p>`:""}
      <button class="mbtn pri sleep">Sleep</button></div>`}
    else{const da=state.deathAt||{d:state.day,p:PH[state.pi],where:cells[state.you].name};const ord=n=>n+(["th","st","nd","rd"][(n%100-20)%10]||["th","st","nd","rd"][n%100]||"th");
      modal.innerHTML=`<div class="mcard obit ${m.shown?"":"enter"}"><div class="obl"><div class="sky"><svg width="70" height="70" viewBox="0 0 54 54"><circle cx="27" cy="20" r="9" fill="#5a4f3a"/><path d="M10 52c1-12 8-20 17-20s16 8 17 20" fill="#5a4f3a"/></svg></div>
        <div class="mt">District ${SETUP.district} · You</div><div class="who">Fell on day ${da.d}, ${da.p.toLowerCase()}</div>
        <p class="res cause">${state.cause}</p>
        <div class="stats"><div><b>${ord(state.place)}</b><span>of ${state.total}</span></div><div><b>${da.d}</b><span>days</span></div><div><b>${state.fallen.length}</b><span>fell before you</span></div></div>
        ${state.moments.length?`<div class="sec2">Your games</div><ol class="tl">${state.moments.slice(-5).map(x=>`<li><span>D${x.d}</span>${x.t}</li>`).join("")}<li class="end"><span>D${da.d}</span>${da.where}. The cannon.</li></ol>`:""}
        </div><div class="obr"><div class="sec2">How it ended</div>
        <div class="crown"><svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#fad02c" stroke-width="1.2" stroke-linejoin="round"><path d="M2.5 12.5h11L14 5l-3.5 3L8 3.5 5.5 8 2 5z"/></svg><div><b>${state.end.victor.n} <i>District ${state.end.victor.d}</i></b><span>Victor · day ${state.end.lastDay}</span></div></div>
        <ol class="stand">${(()=>{const st=state.end.standings,me=state.place;const rows=[];const show=st.filter(r=>r.rank<=4);
          show.forEach(r=>rows.push(`<li class="${r.win?"win":""}"><span>${r.rank}</span><b class="nm">${r.r.n} <i>District ${r.r.d}</i></b><em>${r.win?"":"day "+r.d}</em></li>`));
          if(me>5)rows.push('<li class="gap">···</li>');
          if(me>4)rows.push(`<li class="me"><span>${me}</span>You<em>day ${state.deathAt?state.deathAt.d:state.day}</em></li>`);
          return rows.join("")})()}</ol>
        ${state.end.fate?`<p class="fate">${state.end.fate}</p>`:""}
        <button class="mbtn c recapbtn">What happened to everyone</button><div class="mrow"><button class="mbtn c totitle">New setup</button><button class="mbtn pri restart">Try again</button></div></div></div>`}}
  function spawnFx(){const fx=state.fx.slice();if(!fx.length)return;
    setTimeout(()=>{const you=cells[state.you];const m=new DOMMatrixReadOnly(getComputedStyle(world).transform);const sx=you.cx*m.a+m.e,sy=you.cy*m.d+m.f;
      fx.forEach((f,k)=>setTimeout(()=>{const el=document.createElement("div");el.className="fl c-"+f[1];el.textContent=f[0];el.style.left=sx+"px";el.style.top=(sy-22-k*26)+"px";fls.appendChild(el);setTimeout(()=>el.remove(),1900)},k*380))},520)}
  function showFore(bt){const k=bt?bt.dataset.k:null;
    act.querySelectorAll(".of").forEach(o=>{o.classList.remove("show");o.innerHTML=""});act.querySelectorAll(".optw.hov").forEach(x=>x.classList.remove("hov"));if(bt&&bt.closest(".optw"))bt.closest(".optw").classList.add("hov");
    let tgt=null;
    if(bt){const w=bt.closest(".optw");if(w)tgt=w.querySelector(".of");else{const row=bt.closest(".chips,.bag");if(row)tgt=row.nextElementSibling}}
    if(!tgt){const w=act.querySelector(".btns .optw");if(w){tgt=w.querySelector(".of");const pk=w.querySelector(".opt").dataset.k;tgt.innerHTML=foreMap[pk]||"";tgt.classList.add("show")}}
    else{tgt.innerHTML=foreMap[k]||"";tgt.classList.add("show")}
    root.classList.toggle("costing",!!bt);act.querySelectorAll(".sel").forEach(x=>x.classList.remove("sel"));if(bt&&isPhone)bt.classList.add("sel");
    if(!isPhone){if(bt&&bt.dataset.a==="go"){showRoute(+bt.dataset.to);peek.classList.remove("on")}else if(hoverI!==null)hidePeek()}}
  modal.addEventListener("click",e=>{const o=e.target.closest("[data-o]");if(o)return resolveEnc(o.dataset.o);
    if(e.target.closest(".joinpack"))return joinPack();if(e.target.closest(".declinepack"))return declinePack();
    const la=e.target.closest(".leaveally");if(la)return leaveAlly(la.dataset.ally);
    const ka=e.target.closest(".killally");if(ka){const r=betrayAlly(ka.dataset.ally,true);state.modal.note=`${r.v}. ${r.t}`;state.fx=r.fx;if(state.hp<=0){die(state.pendingCause);}return rerenderAll()}
    const ao=e.target.closest("[data-ao]");if(ao){const m=state.modal;if(ao.dataset.ao==="stay"){state.modal=null;return rerenderAll()}if(ao.dataset.ao==="part")return partWays(m.n);
      m.res=betrayAlly(m.n,false);state.fx=m.res.fx;if(state.hp<=0){die(state.pendingCause);return rerenderAll()}return rerenderAll()}
    const ta=e.target.closest(".tally");if(ta){e.preventDefault();state.modal={k:"allyopts",n:ta.dataset.allyopen};return renderModal()}
    const tr=e.target.closest("[data-trib]");if(tr){state.modal.sel=tr.dataset.trib;return renderModal()}
    const tk=e.target.closest("[data-take]");if(tk)return takeGround(+tk.dataset.take);
    if(e.target.closest(".gdone"))return closeGround();
    const lt=e.target.closest("[data-loot]");if(lt){const [r,i]=lt.dataset.loot.split(":");return grabLoot(r,+i)}
    if(e.target.closest(".lrun")){const you=cells[state.you];const nb=you.nb.map(n=>cells[n]).filter(c=>!c.closed&&!c.creature);const to=(nb.find(c=>c.tags.includes("sheltered"))||nb[0]).i;state.modal=null;return perform("go",to)}
    if(e.target.closest(".lhide")){state.modal=null;return perform("hide")}
    if(e.target.closest(".cont"))return finishEnc();if(e.target.closest(".sleep"))return sleep();if(e.target.closest(".restart")){location.hash="play";return location.reload()}
    if(e.target.closest(".totitle")){location.hash="";return location.reload()}
    if(e.target.closest(".recapbtn")){state.modal.shown=true;state.modal={k:"recap",back:state.modal};return rerenderAll()}
    if(e.target.closest(".recapback")){state.modal=state.modal.back;state.modal.shown=true;return rerenderAll()}
    if(e.target.closest(".resume")||e.target.closest(".begin")){state.modal=null;return rerenderAll()}
    if(e.target.closest(".leave")){state.modal.confirm=true;return rerenderAll()}});
  let openItem=null;
  function renderItemPop(){const pop=isPhone?root.querySelector(".drawer .ipop"):root.querySelector(".ipop.top");if(!pop)return;const it=inventory().find(x=>x.id===openItem);
    if(!it){pop.classList.remove("on");pop.innerHTML="";return}
    const fr=it.free.map(([a,l])=>`<button class="ia free" data-free="${a}">${l}<small>${forecastFree(a)}</small></button>`).join("");
    const ac=it.acts.map(([a,l])=>`<button class="ia" data-ia="${a}">${l}<small>${forecast(a)}</small></button>`).join("");
    pop.innerHTML=`<div class="ih"><span class="slotbig ${catOf(it.base)}">${it.ic}</span><div><b>${it.n}</b><span>${it.sub}</span></div></div>${fr+ac||`<p class="inote">Nothing to do with it right now.</p>`}<button class="idrop" data-drop="${it.id}">Drop</button>`;
    pop.classList.add("on");
    if(!isPhone){const sl=root.querySelector(`.carry [data-item="${it.id}"]`);if(sl){const r=sl.getBoundingClientRect(),f=root.getBoundingClientRect();pop.style.left=Math.max(8,r.left-f.left-8)+"px"}}}
  function forecastFree(a){const [k,i]=a.split(":");const g=state.gear[+i];if(!g)return"";
    if(k==="hold")return(state.held?`Instead of the ${IT[state.held.id].n.toLowerCase()}. `:"")+(IT[g.id].pow>.15?"A real weapon in your hand.":"Better than your fists.")+' <span class="cost">Takes no time.</span>';
    return'Hands free. Harder to fight. <span class="cost">Takes no time.</span>'}
  root.addEventListener("click",e=>{const sl=e.target.closest("[data-item]");
    if(sl){e.stopPropagation();openItem=openItem===sl.dataset.item?null:sl.dataset.item;root.querySelectorAll("[data-item]").forEach(x=>x.classList.toggle("open",x.dataset.item===openItem));renderItemPop();return}
    const fz=e.target.closest("[data-free]");if(fz){e.stopPropagation();const [k,i]=fz.dataset.free.split(":");const g=state.gear[+i];
      if(k==="hold"&&g){state.held=g;L(`You take the ${IT[g.id].n.toLowerCase()} in hand.`)}else{state.held=null;L("You put your weapon away.")}openItem=null;rerenderAll();return}
    const ia=e.target.closest("[data-ia]");if(ia){e.stopPropagation();openItem=null;renderItemPop();perform(ia.dataset.ia);return}
    const dr=e.target.closest("[data-drop]");if(dr){e.stopPropagation();const id=dr.dataset.drop;let what="";
      if(id[0]==="g"){const g=state.gear[+id.slice(1)];if(g){what=IT[g.id].n.toLowerCase();if(state.held===g)state.held=null;state.gear.splice(+id.slice(1),1);if(cells[state.you].biome==="cornucopia")state.loot.feet.push(g.id)}}
      else{if(id==="band"){state.band=0;what="bandages"}if(id==="bread"){state.bread=0;what="food"}if(id==="flask"){state.flask=-1;what="water bottle"}}
      L(`You leave the ${what} behind.`);openItem=null;rerenderAll();return}
    if(!e.target.closest(".ipop"))if(openItem){openItem=null;root.querySelectorAll("[data-item]").forEach(x=>x.classList.remove("open"));renderItemPop()}},true);
  function renderLog(){
    const open=log.classList.contains("open");
    if(open){let html="",d=null;state.journal.forEach(e=>{if(e.d!==d){d=e.d;html+=`<div class="day">Day ${d}</div>`}html+=`<div class="l">${e.t}</div>`});log.innerHTML=html+`<div class="jmore">Close ▴</div>`}
    else{log.innerHTML=state.journal.slice(-3).map((e,k,a)=>`<div class="l${k===a.length-1?" last":""}">${e.t}</div>`).join("")+`<div class="jmore">Journal ▾</div>`}
  }
  log.addEventListener("click",()=>{log.classList.toggle("open");renderLog()});

  function showRoute(i){
    hoverI=i;
    const you=cells[state.you],c=cells[i];
    const r=world.querySelector(".route");
    r.innerHTML=`<path d="${path(c.poly)}" fill="rgba(250,208,44,.12)" stroke="#fad02c" stroke-width="2"/>
      <line x1="${you.cx}" y1="${you.cy}" x2="${c.cx}" y2="${c.cy}" stroke="#fad02c" stroke-width="2.2" stroke-dasharray="6 6" stroke-linecap="round"/>
      <circle cx="${c.cx}" cy="${c.cy}" r="5" fill="none" stroke="#fad02c" stroke-width="2"/>`;
    const [px,py]=toScreen(c.cx,c.cy);
    const fc=forecast("go",i).replace(/ <span class="cost">.*$/,"");
    peek.innerHTML=`<div class="n">${c.name} · ${dirOf(you,c)}</div><div class="s">${fc}</div><div class="go">${isPhone?"Tap again to go":"Click to go"} · <span style="color:var(--mute)">takes your ${PH[state.pi].toLowerCase()}</span></div>`;
    peek.classList.add("on");
    const pw=peek.offsetWidth,ph=peek.offsetHeight;
    let left=px+16,top=py-ph-14;
    if(left+pw>w-8)left=px-pw-16; if(top<58)top=py+18; if(left<8)left=8;
    peek.style.left=left+"px";peek.style.top=top+"px";
  }
  function hidePeek(){hoverI=null;peek.classList.remove("on");const r=world.querySelector(".route");if(r)r.innerHTML=""}
  // pan (drag), pinch, wheel
  const ptrs=new Map();let dragged=false,start=null,pinch=null;
  svg.addEventListener("pointerdown",e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});dragged=false;start={x:e.clientX,y:e.clientY,px:cam.px,py:cam.py};
    if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)}}});
  svg.addEventListener("pointermove",e=>{
    if(ptrs.has(e.pointerId)){ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const r=svg.getBoundingClientRect();zoomAt(d/pinch.d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);pinch.d=d;dragged=true;return}
      const dx=e.clientX-start.x,dy=e.clientY-start.y;
      if(dragged||Math.hypot(dx,dy)>6){if(!dragged)try{svg.setPointerCapture(e.pointerId)}catch(_){}dragged=true;svg.classList.add("drag");cam.px=start.px+dx;cam.py=start.py+dy;cam.whole=false;hidePeek();applyCam(false);return}}
    if(isPhone||e.pointerType==="touch")return;
    const t=document.elementFromPoint(e.clientX,e.clientY);const c=t&&t.closest&&t.closest(".cell.reach");
    if(c){const i=+c.dataset.i;if(i!==hoverI)showRoute(i)}else if(hoverI!==null)hidePeek()});
  const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;svg.classList.remove("drag")};
  svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
  svg.addEventListener("mouseleave",()=>{if(!isPhone)hidePeek()});
  svg.addEventListener("wheel",e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top)},{passive:false});
  root.querySelector(".zin").onclick=()=>zoomAt(1.25,w/2,h/2);
  root.querySelector(".zout").onclick=()=>zoomAt(1/1.25,w/2,h/2);
  root.querySelector(".rec").onclick=recenter;
  root.querySelector(".whole").onclick=whole;
  svg.addEventListener("click",e=>{
    if(dragged){dragged=false;return}
    const hit=document.elementFromPoint(e.clientX,e.clientY);const t=hit&&hit.closest?hit.closest(".cell.reach"):null;
    if(!t){sel=null;hidePeek();return}
    const i=+t.dataset.i;
    if(state.modal)return;
    if(!isPhone){perform("go",i);return}
    if(sel===i){perform("go",i)}else{sel=i;showRoute(i)}
  });
  const pick=t=>t.closest("[data-a]")||(t.closest(".optw")?t.closest(".optw").querySelector("[data-a]"):null);
  act.addEventListener("click",e=>{const bt=pick(e.target);if(!bt||bt.disabled)return;
    if(isPhone&&psel!==bt.dataset.k){psel=bt.dataset.k;showFore(bt);return}
    psel=null;perform(bt.dataset.a,bt.dataset.to!==undefined?+bt.dataset.to:undefined)});
  act.addEventListener("mouseover",e=>{if(isPhone)return;const bt=pick(e.target);if(bt&&!bt.disabled)showFore(bt)});
  act.addEventListener("mouseleave",()=>{if(!isPhone)showFore(null)});
  root.querySelector(".allies").addEventListener("click",e=>{const t=e.target.closest("[data-allyopen]");if(!t||state.modal)return;e.stopPropagation();state.modal={k:"allyopts",n:t.dataset.allyopen};rerenderAll()});
  root.querySelector(".tribbtn").addEventListener("click",e=>{e.stopPropagation();if(state.modal)return;state.modal={k:"tributes"};rerenderAll()});
  root.querySelector(".menubtn").addEventListener("click",e=>{e.stopPropagation();if(state.modal)return;state.modal={k:"menu"};rerenderAll()});
  // bars: tap shows words
  const bars=root.querySelector(".bars"),pop=root.querySelector(".pop");
  bars.addEventListener("click",e=>{e.stopPropagation();pop.classList.toggle("on")});
  const bag=root.querySelector(".bag"),drawer=root.querySelector(".drawer");
  if(bag)bag.addEventListener("click",e=>{e.stopPropagation();drawer.classList.toggle("on")});
  root.addEventListener("click",e=>{if(!e.target.closest(".more")){const m=act.querySelector(".menu");if(m)m.classList.remove("on")}if(!bars.contains(e.target))pop.classList.remove("on");if(drawer&&!drawer.contains(e.target)&&e.target!==bag)drawer.classList.remove("on")});
  return{render,modalOnly(){renderModal();root.querySelector('.alive').textContent=state.alive},resetCam(){sel=null;cam.px=0;cam.py=0;cam.whole=false;if(cam.z<Z0*.8)cam.z=Z0}};
}
// one full-screen view; phone layout under 760px wide
let FULL_PHONE=null;
function mount(){const phone=innerWidth<760;if(phone===FULL_PHONE&&views.length)return;FULL_PHONE=phone;
  const old=document.getElementById("game");const el=document.createElement("div");el.id="game";el.className="frame game "+(phone?"phone":"desk");old.replaceWith(el);
  views.length=0;views.push(makeView(el,phone));rerenderAll()}
mount();
state.modal={k:"intro"};
{const td=document.getElementById('tdeath');if(td)td.onclick=e=>{e.preventDefault()}}
rerenderAll();
const T=document.getElementById('title');
if(location.hash==='#play')T.remove();else{const cfg=Object.assign({},SETUP);
  const ATTR=[["S","Strength","Strikes first. Hits harder."],["D","Dexterity","Quick hands. First to the loot."],["P","Perception","Sharper senses. Harder to ambush."]];
  const PRE={1:[6,7,7,"Luxury","Raised soft, trained hard. Polished."],2:[9,6,5,"Masonry","Stone-strong. Trained for this since childhood."],3:[4,7,9,"Technology","Quick mind, weak arms. Sees everything."],4:[7,8,5,"Fishing","Nets, knots and tridents. Good in water."],
    5:[6,6,8,"Power","Patient. Notices what others miss."],6:[6,8,6,"Transport","Fast on their feet."],7:[8,7,5,"Lumber","Strong arms. At home with an axe."],8:[5,9,6,"Textiles","Clever hands. Makes things."],
    9:[6,6,8,"Grain","Steady. Reads the land."],10:[8,5,7,"Livestock","Tough. Knows animals — and mutts."],11:[5,7,8,"Agriculture","Knows every plant. Never goes hungry."],12:[8,5,7,"Mining","Hard as coal. Used to the dark."]};
  const setDist=d=>{cfg.district=d;[cfg.S,cfg.D,cfg.P]=PRE[d]};if(!sessionStorage.getItem||1){try{if(!sessionStorage.getItem("arenaSetup"))setDist(cfg.district)}catch(_){setDist(cfg.district)}}
  const WORD={12:"Twelve",24:"Twenty-four",36:"Thirty-six",48:"Forty-eight"};
  const draw=()=>{const used=cfg.S+cfg.D+cfg.P,left=20-used;
    document.getElementById('dists').innerHTML=Array.from({length:12},(_,i)=>`<button class="${cfg.district===i+1?"on":""}" data-d="${i+1}">${i+1}</button>`).join("");
    const pr=PRE[cfg.district];const custom=pr[0]!==cfg.S||pr[1]!==cfg.D||pr[2]!==cfg.P;
    document.getElementById('trade').innerHTML=`<b>${pr[3]}</b> — ${pr[4]}${custom?` <span class="cust">Customised · <a href="#" id="rst">reset</a></span>`:""}`;
    document.getElementById('attrs').innerHTML=ATTR.map(([k,n,h])=>`<div class="ar"><div class="an"><b>${n}</b><span>${h}</span></div><div class="pips" data-k="${k}">${Array.from({length:10},(_,i)=>`<i class="${i<cfg[k]?"on":""}" data-v="${i+1}"></i>`).join("")}</div></div>`).join("");
    document.getElementById('left').innerHTML=left>0?`<span class="lp">${Array.from({length:left},()=>"<i></i>").join("")}</span> ${left} point${left>1?"s":""} left to give`:`<span class="ok">Ready.</span> Every point given.`;
    document.getElementById('segSize').innerHTML=[[24,"Small"],[48,"Medium"],[72,"Large"],[120,"Huge"]].map(([v,n])=>`<button class="${cfg.size===v?"on":""}" data-s="${v}"><b>${n}</b><span>${v} areas</span></button>`).join("");
    document.getElementById('segPl').innerHTML=[12,24,36,48].map(v=>`<button class="${cfg.players===v?"on":""}" data-p="${v}"><b>${v}</b></button>`).join("");
    document.getElementById('tag').textContent=`${WORD[cfg.players]} enter. One leaves.`;
    document.getElementById('enter').disabled=left!==0};
  T.addEventListener('click',e=>{if(e.target.id==='rst'){e.preventDefault();setDist(cfg.district);return draw()}const t=e.target.closest('button,i');if(!t)return;
    if(t.dataset.d)setDist(+t.dataset.d);
    else if(t.dataset.s)cfg.size=+t.dataset.s;
    else if(t.dataset.p)cfg.players=+t.dataset.p;
    else if(t.dataset.v){const k=t.parentElement.dataset.k;let v=+t.dataset.v;if(v===cfg[k])v--;const others=20-(cfg.S+cfg.D+cfg.P-cfg[k]);cfg[k]=Math.max(0,Math.min(v,others,10))}
    else if(t.id==='enter'){try{sessionStorage.setItem('arenaSetup',JSON.stringify(cfg))}catch(_){}location.hash='play';location.reload();return}
    draw()});
  draw()}

addEventListener("resize",()=>{mount();rerenderAll()});
