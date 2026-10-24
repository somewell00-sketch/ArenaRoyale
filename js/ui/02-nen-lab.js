/* ===================== YOUR NEN: type test + Hatsu forge (uses the game's own Nen tables) ===================== */
const NL_TYPES = NEN_CATS;   // hexagon order: Enhancement, Transmutation, Conjuration, Specialization, Manipulation, Emission
const NL_TIE = ['Specialization','Manipulation','Conjuration','Transmutation','Emission','Enhancement'];
const NL_INFO = {
  Enhancement: {kw:'Steel', d:'Straightforward and determined. You make what you already have stronger, and you trust it to carry you.', water:'The water rises and spills over the rim of the glass.'},
  Transmutation: {kw:'Metamorphosis', d:'Fickle, playful and hard to read. Your aura takes on the properties you imagine for it.', water:'Taste the water: it has changed. Sweet, salty, strange.'},
  Conjuration: {kw:'Form', d:'Careful and observant. You build real objects out of aura, as long as you know them inside out.', water:'Small impurities appear in the water, drifting slowly.'},
  Specialization: {kw:'Rule', d:'Independent, private, a little unlike everyone else. Your ability follows rules nobody else could use.', water:'Something unexpected happens to the glass. No one has seen it before.'},
  Manipulation: {kw:'Thread', d:'Logical and goal-driven. You move people and things toward the result you have already chosen.', water:'The leaf begins to turn on the surface, slowly and then faster.'},
  Emission: {kw:'Reach', d:'Impatient, quick-tempered, easy to read. Your aura keeps its strength far away from your body.', water:'The water changes colour.'}
};
const NL_C = {Enhancement:'var(--n-enh)', Transmutation:'var(--n-tra)', Conjuration:'var(--n-con)', Specialization:'var(--n-spe)', Manipulation:'var(--n-man)', Emission:'var(--n-emi)'};
const NL_HEX = {Enhancement:'#6cc07a', Transmutation:'#a98be0', Conjuration:'#6b9fe0', Specialization:'#df5d5d', Manipulation:'#e0c64f', Emission:'#e58c4b'};
// 20 questions; each answer: [label, icon, {type: weight}]
// 40 questions; each has 6–8 possible answers and a test shows 3–5 of them. Answer: [label, icon, weights, hidden hints for the forge]
const NL_Q = [
  ["Day or night?",[["Dawn","sun",{"Conjuration":2},"Light,Sun,Halo,Lantern"],["Noon","circle",{"Enhancement":2,"Emission":1},"Sun,Flame,Gold,Beam,Fist"],["Dusk","half",{"Transmutation":2,"Manipulation":1},"Shadow,Ember,Moth,Veil,Mantle"],["Midnight","moon",{"Specialization":2,"Conjuration":1},"Moon,Void,Ghost,Dream,Mask"],["The hour before the storm","burst",{"Emission":2,"Enhancement":1},"Storm,Static,Lightning,Blast"],["Three in the morning, wide awake","dot",{"Manipulation":2,"Transmutation":1},"Secret,Hush,Owl,Clock"],["The middle of a long afternoon","square",{"Enhancement":1,"Conjuration":2},"Amber,Tea,Clay,Hourglass"]]],
  ["Which road?",[["Along the beach","wave",{"Emission":2,"Transmutation":1},"Water,Tide,Salt,Shell,Wave"],["Over the mountain","tri",{"Enhancement":2,"Conjuration":1},"Stone,Granite,Wind,Anchor,Step"],["Through the city","grid",{"Manipulation":2},"Neon,Coin,Clockwork,Signal,Ledger"],["Through the forest at night","moon",{"Specialization":2,"Transmutation":1},"Owl,Moss,Ghost,Shadow Step"],["Along the railway line","line",{"Emission":2,"Manipulation":1},"Iron,Steel,Rocket,Dart"],["Down the river by boat","wave",{"Transmutation":2,"Conjuration":1},"Water,Tide,Ferry,Ripple"],["The road nobody takes","key",{"Specialization":2,"Enhancement":1},"Void,Riddle,Door,Lock"],["Whichever road my friends take","circle",{"Enhancement":2,"Manipulation":1},"Heart,Promise,Bridge,Shield"]]],
  ["Pick a chess piece.",[["Pawn","circle",{"Enhancement":2},"Iron,Discipline,Fist,Shield"],["Knight","zig",{"Transmutation":2,"Emission":1},"Wind,Hawk,Step,Lance"],["Bishop","diamond",{"Conjuration":1,"Specialization":2},"Light,Crystal,Halo,Book"],["Queen","star",{"Manipulation":2,"Emission":1},"Gold,Chess,Throne,Puppet"],["Rook","square",{"Enhancement":1,"Conjuration":2},"Stone,Basalt,Tower,Wall"],["King","key",{"Manipulation":2},"Gold,Crown,Throne,Command Word"],["I'd rather flip the board","burst",{"Emission":2,"Transmutation":1},"Rage,Fury,Blast,Nova"]]],
  ["A locked door. You…",[["Break it down","burst",{"Enhancement":2,"Emission":1},"Steel,Rage,Hammer,Fist"],["Look for the key","key",{"Conjuration":2,"Manipulation":1},"Key,Memory,Lock,Lens"],["Wait for someone to open it","dot",{"Manipulation":2},"Thread,Lie,Door,Whisper"],["Pick the lock","thread",{"Conjuration":1,"Manipulation":2},"Clockwork,Needle,Pin,Lock"],["Knock and talk your way in","wave",{"Manipulation":1,"Emission":2},"Voice,Rumor,Whistle,Signal"],["Find a window instead","zig",{"Transmutation":2,"Enhancement":1},"Wind,Smoke,Hook,Shadow Step"],["Wonder what is behind it, and leave","moon",{"Specialization":2,"Transmutation":1},"Secret,Mirage,Riddle,Veil"]]],
  ["A friend is in danger. You…",[["Run in first","tri",{"Enhancement":2},"Adrenaline,Bull,Sprint,Armor"],["Shout a warning from where you are","wave",{"Emission":2,"Manipulation":1},"Sound,Voice,Roar,Signal"],["Make a distraction","zig",{"Transmutation":2,"Conjuration":1},"Smoke,Mirror,Mirror Twin,Veil"],["Wait for the exact moment","dot",{"Specialization":2,"Conjuration":1},"Time,Clock,Hourglass,Stance"],["Call for help","line",{"Emission":1,"Manipulation":2},"Whistle,Chime,Flock,Signal"],["Throw whatever is closest","burst",{"Emission":2,"Enhancement":1},"Stone,Flint,Throw,Bullet"],["Take their place","circle",{"Enhancement":2},"Heart,Oath,Shield,Body"]]],
  ["Which sound?",[["Thunder","burst",{"Emission":2,"Enhancement":1},"Lightning,Storm,Static,Blast"],["Rain on a roof","wave",{"Conjuration":2,"Transmutation":1},"Water,Ink,Rain,Bell"],["A lone violin","line",{"Specialization":2,"Manipulation":1},"Song,Sorrow,String,Music Box"],["A crowd cheering","sun",{"Emission":2,"Enhancement":1},"Joy,Voice,Roar,Stage"],["A clock ticking","grid",{"Conjuration":2,"Manipulation":1},"Clock,Clockwork,Hourglass,Tally"],["Wind in tall grass","wave",{"Transmutation":2,"Emission":1},"Wind,Pollen,Whisper,Kite"],["Total silence","dot",{"Specialization":2,"Manipulation":1},"Hush,Void,Veil,Seal"],["Drums far away","tri",{"Enhancement":2,"Manipulation":1},"Drum,Heartbeat,Pulse,Howl"]]],
  ["Which season?",[["Spring","tree",{"Conjuration":1,"Manipulation":2},"Pollen,Petal,Root,Familiar"],["Summer","sun",{"Enhancement":2,"Emission":2},"Sun,Flame,Honey,Flare"],["Autumn","half",{"Transmutation":2},"Ash,Rust,Feather,Kite"],["Winter","diamond",{"Conjuration":2},"Ice,Snow,Frost,Glacier,Sphere"],["The change between them","zig",{"Transmutation":1,"Specialization":2},"Time,Mercury,Moth,Mask"],["The rainy season","wave",{"Transmutation":2,"Conjuration":1},"Water,Rain,Moss,Puddle"]]],
  ["Which texture?",[["Rough stone","square",{"Enhancement":2,"Conjuration":1},"Stone,Granite,Sand,Gauntlet"],["Silk","wave",{"Transmutation":2,"Manipulation":1},"Silk,Thread,Ribbon,Spider"],["Cold glass","diamond",{"Conjuration":2},"Glass,Crystal,Mirror,Lens"],["Warm fur","circle",{"Enhancement":2,"Manipulation":1},"Wolf,Bear,Mantle,Coat"],["Sand running through fingers","line",{"Transmutation":1,"Emission":2},"Sand,Dust,Hourglass,Spray"],["Wet clay","tree",{"Conjuration":2,"Transmutation":1},"Clay,Mud,Hand,Golem"],["Old paper","grid",{"Conjuration":2},"Paper,Ink,Book,Ledger"]]],
  ["Which animal would you trust?",[["A wolf","tri",{"Enhancement":2,"Manipulation":1},"Wolf,Fang,Howl,Hound"],["A fox","zig",{"Transmutation":2,"Manipulation":1},"Fox,Smoke,Mask,Tail"],["An owl","moon",{"Conjuration":2},"Owl,Feather,Eye,Oracle"],["A hawk","line",{"Emission":2,"Enhancement":1},"Hawk,Wind,Arrow,Wing"],["A cat","half",{"Transmutation":1,"Specialization":2},"Shadow,Moon,Claw,Veil"],["A horse","circle",{"Enhancement":2,"Emission":1},"Bull,Wind,Charge,Sprint"],["A spider","thread",{"Manipulation":2,"Conjuration":1},"Spider,Silk,Web,String"],["An octopus","wave",{"Manipulation":2,"Transmutation":1},"Octopus,Ink,Tendril,Grip"]]],
  ["Pick a metal.",[["Iron","square",{"Enhancement":2,"Conjuration":1},"Iron,Anvil,Steel,Hammer"],["Mercury","wave",{"Transmutation":2},"Mercury,Water,Mirror,Gum"],["Gold","star",{"Specialization":2,"Manipulation":2},"Gold,Coin,Debt,Contract"],["Copper","burst",{"Emission":2,"Transmutation":1},"Lightning,Spark,Static,Bullet"],["Silver","moon",{"Conjuration":2,"Manipulation":1},"Moon,Mirror,Bell,Ring"],["Bronze","circle",{"Enhancement":1,"Conjuration":1,"Emission":1},"Bronze,Bell,Shield,Gauntlet"],["Rust","half",{"Transmutation":2,"Manipulation":1},"Rust,Ash,Decay,Lash"]]],
  ["What annoys you most?",[["Being lied to","cross",{"Enhancement":2,"Manipulation":1},"Oath,Lie,Sentence,Trial"],["Boredom","zig",{"Transmutation":2,"Emission":1},"Dice,Card,Game,Lottery"],["Losing control","thread",{"Manipulation":2,"Conjuration":1},"Thread,Puppet,Leash,Collar"],["Waiting","burst",{"Emission":2,"Enhancement":1},"Fury,Spark,Rocket,Sprint"],["Mess and disorder","grid",{"Conjuration":2,"Manipulation":1},"Clockwork,Crystal,Ledger,Tally"],["People who do not keep their word","key",{"Specialization":2,"Enhancement":1},"Oath,Promise,Pact,Covenant"],["Being underestimated","tri",{"Enhancement":2,"Emission":1},"Pride,Rage,Fist,Roar"]]],
  ["What keeps you going?",[["The people around me","circle",{"Enhancement":2,"Manipulation":1},"Heart,Promise,Shield,Bridge"],["Getting it exactly right","diamond",{"Conjuration":2,"Manipulation":1},"Clockwork,Crystal,Blade,Needle"],["Seeing how far I can go","line",{"Emission":2,"Transmutation":1},"Wind,Star,Comet,Beam"],["Knowing something nobody else knows","moon",{"Specialization":2,"Transmutation":1},"Memory,Name,Riddle,Book"],["Winning","star",{"Manipulation":2,"Emission":1},"Gold,Chess,Throne,Tournament"],["Curiosity","zig",{"Transmutation":2,"Conjuration":1},"Mirage,Map,Compass,Lens"],["A promise I made","key",{"Enhancement":1,"Specialization":2},"Promise,Oath,Pact,Heirloom"]]],
  ["An argument. You…",[["Say it to their face","tri",{"Enhancement":2,"Emission":2},"Rage,Voice,Fist,Roar"],["Make a joke until it passes","zig",{"Transmutation":2},"Laughter,Bubble,Gum,Fan"],["Steer it where you want","thread",{"Manipulation":2},"Thread,Magnetism,Leash,Baton"],["Prepare your case first","grid",{"Conjuration":2,"Manipulation":1},"Ink,Paper,Ledger,Contract"],["Leave and come back later","line",{"Emission":1,"Specialization":1,"Transmutation":1},"Echo,Mist,Shadow Step,Door"],["Agree, then do what I wanted anyway","half",{"Transmutation":2,"Manipulation":1},"Lie,Fox,Mask,Clause"],["Ask a question they cannot answer","key",{"Specialization":2,"Conjuration":1},"Riddle,Secret,Trial,Paradox"]]],
  ["What do you keep in a drawer?",[["An old medal","star",{"Enhancement":2,"Emission":1},"Bronze,Oath,Heirloom,Brand"],["A deck of cards","square",{"Transmutation":2,"Manipulation":1},"Card,Dice,Deck,Game"],["A key that opens nothing","key",{"Specialization":2,"Conjuration":1},"Key,Void,Lock,Riddle"],["Letters I never sent","wave",{"Emission":1,"Specialization":1,"Manipulation":1},"Paper,Ink,Whisper,Sorrow"],["Spare parts","grid",{"Conjuration":2,"Enhancement":1},"Clockwork,Iron,Toolbox,Gauntlet"],["Nothing. I keep drawers empty","dot",{"Specialization":1,"Enhancement":1,"Conjuration":1},"Void,Discipline,Veil"],["Someone else's diary","thread",{"Manipulation":2},"Secret,Ink,Book,Ledger"],["Matches","burst",{"Emission":2,"Transmutation":1},"Flame,Spark,Flare,Ember"]]],
  ["Which weather?",[["A storm","burst",{"Emission":2,"Enhancement":1},"Storm,Lightning,Hail,Burst"],["Thick fog","wave",{"Transmutation":1,"Manipulation":2},"Mist,Smoke,Veil,Whisper"],["An eclipse","half",{"Specialization":2,"Conjuration":1},"Moon,Sun,Void,Halo"],["Clear sky","sun",{"Enhancement":2,"Conjuration":1},"Light,Wind,Kite,Beam"],["Snowfall at night","diamond",{"Conjuration":2},"Snow,Frost,Ice,Glacier"],["Heatwave","circle",{"Enhancement":2,"Emission":1},"Sun,Magma,Sweat,Flare"],["A rainbow after rain","star",{"Transmutation":2,"Emission":1},"Rainbow,Prism,Light,Ribbon"]]],
  ["Pick a weapon.",[["Bare fists","circle",{"Enhancement":2},"Bone,Steel,Fist,Gauntlet"],["A bow","line",{"Emission":2,"Conjuration":1},"Hawk,Feather,Bow,Arrow"],["A whip","zig",{"Transmutation":2,"Manipulation":1},"Thorn,Rope,Whip,Lash"],["Something nobody would call a weapon","dot",{"Specialization":2,"Conjuration":1},"Tea,Origami,Umbrella,Fan"],["A sword","diamond",{"Conjuration":2,"Enhancement":1},"Steel,Blade,Edge,Scythe"],["A slingshot","burst",{"Emission":2,"Transmutation":1},"Stone,Flint,Bullet,Disc"],["A rope","thread",{"Manipulation":2,"Transmutation":1},"Rope,Thread,Lasso,Leash"],["Words","wave",{"Manipulation":1,"Specialization":2},"Voice,Name,Command Word,Whisper"]]],
  ["Your role in a team?",[["Up front","tri",{"Enhancement":2,"Emission":1},"Iron,Bull,Shield,Armor"],["The one with the plan","grid",{"Conjuration":1,"Manipulation":2},"Chess,Clockwork,Compass,Tower"],["The surprise","key",{"Specialization":2,"Transmutation":2},"Dice,Mirror,Mask,Paradox"],["Support from the back","line",{"Emission":2,"Conjuration":1},"Hawk,Light,Turret,Signal"],["The one who keeps everyone laughing","zig",{"Transmutation":2,"Enhancement":1},"Laughter,Bubble,Joy,Fan"],["The one who makes the tools","square",{"Conjuration":2,"Enhancement":1},"Iron,Anvil,Toolbox,Weapon"],["The one who handles negotiations","thread",{"Manipulation":2},"Coin,Debt,Bargain,Contract"]]],
  ["A promise is…",[["Something you keep, always","square",{"Enhancement":2,"Conjuration":1},"Oath,Promise,Seal,Covenant"],["Something you can bend","zig",{"Transmutation":2,"Emission":1},"Rubber,Gum,Riddle,Clause"],["A rule you set yourself","key",{"Specialization":2,"Manipulation":1},"Discipline,Oath,Rulebook,Contract"],["A way to get people to act","thread",{"Manipulation":2},"Debt,Coin,Bargain,Collar"],["Something to shout about","burst",{"Emission":2,"Enhancement":1},"Voice,Joy,Roar,Signal"],["Written down and signed","grid",{"Conjuration":2,"Manipulation":1},"Ink,Paper,Ledger,Pact"]]],
  ["Which meal?",[["A huge steak","circle",{"Enhancement":2,"Emission":1},"Blood,Hunger,Fang,Claw"],["Something sweet and strange","star",{"Transmutation":2,"Manipulation":1},"Honey,Bubble,Dream,Music Box"],["Bread you baked yourself","square",{"Conjuration":2,"Enhancement":1},"Salt,Wax,Hand,Palm"],["Whatever the host serves","thread",{"Manipulation":2,"Conjuration":1},"Tea,Silk,Puppet,Doll"],["Something very spicy","burst",{"Emission":2,"Transmutation":1},"Flame,Ember,Spray,Exhale"],["A dish nobody else will try","moon",{"Specialization":2,"Transmutation":1},"Venom,Fungus,Secret,Riddle"],["Street food, on the move","line",{"Emission":2,"Enhancement":1},"Spark,Wind,Sprint,Step"]]],
  ["You find an old map. You…",[["Set off at once","tri",{"Enhancement":1,"Emission":2},"Wind,Comet,Sprint,Step"],["Study every line","grid",{"Conjuration":2,"Manipulation":1},"Ink,Paper,Compass,Lens"],["Look for what is not drawn","moon",{"Specialization":2,"Transmutation":1},"Void,Ghost,Veil,Riddle"],["Sell it to someone who will go for you","thread",{"Manipulation":2,"Transmutation":1},"Coin,Debt,Bargain,Auction"],["Copy it, then burn the original","half",{"Conjuration":1,"Specialization":2},"Ink,Ash,Secret,Seal"],["Show it to all your friends","sun",{"Emission":2,"Enhancement":1},"Joy,Voice,Signal,Map"],["Redraw it the way you like","zig",{"Transmutation":2,"Conjuration":1},"Ink,Mirage,Paint,Map"]]],
  ["Which colour?",[["Red","burst",{"Enhancement":2,"Emission":1},"Blood,Flame,Rage,Fist"],["Blue","wave",{"Conjuration":2,"Emission":1},"Water,Ice,Tide,Sphere"],["Purple","half",{"Transmutation":2},"Amethyst,Dream,Moth,Veil"],["Golden yellow","star",{"Specialization":2,"Manipulation":1},"Gold,Sun,Halo,Crown"],["Green","tree",{"Manipulation":2,"Conjuration":1},"Root,Vine,Moss,Tendril"],["Orange","sun",{"Emission":2,"Transmutation":1},"Ember,Spark,Flare,Beam"],["Black","moon",{"Specialization":1,"Manipulation":1,"Conjuration":1},"Shadow,Void,Ink,Mask"],["White","circle",{"Enhancement":1,"Conjuration":2},"Snow,Light,Bone,Shield"]]],
  ["Pick a smell.",[["Rain on hot stone","wave",{"Transmutation":2,"Enhancement":1},"Water,Stone,Steam,Rain"],["Smoke from a fire","burst",{"Emission":2,"Transmutation":1},"Smoke,Flame,Ash,Flare"],["Old books","grid",{"Conjuration":2,"Manipulation":1},"Paper,Ink,Book,Memory"],["The sea","wave",{"Emission":2,"Manipulation":1},"Salt,Tide,Shell,Wave"],["Fresh bread","circle",{"Enhancement":2,"Conjuration":1},"Salt,Wax,Hand,Palm"],["Incense","moon",{"Specialization":2,"Manipulation":1},"Smoke,Ether,Ritual,Halo"],["Gunpowder","tri",{"Emission":2,"Enhancement":1},"Spark,Flint,Bullet,Cannon"]]],
  ["What scares you most?",[["Being forgotten","moon",{"Specialization":2,"Emission":1},"Memory,Name,Ghost,Portrait"],["Being trapped","square",{"Emission":2,"Transmutation":1},"Wind,Cyclone,Cage,Door"],["Losing someone","circle",{"Enhancement":2,"Manipulation":1},"Heart,Oath,Shield,Bridge"],["Not being in control","thread",{"Manipulation":2,"Conjuration":1},"Thread,Puppet,Leash,Collar"],["Deep water","wave",{"Conjuration":2,"Transmutation":1},"Water,Tide,Jellyfish,Bubble"],["Being ordinary","star",{"Specialization":2,"Transmutation":1},"Gold,Mirage,Mask,Paradox"],["Nothing. And that worries me","dot",{"Enhancement":1,"Specialization":1,"Transmutation":1},"Void,Hush,Veil"]]],
  ["Which dream would you rather have?",[["Flying","line",{"Emission":2,"Transmutation":1},"Wind,Feather,Wing,Kite"],["Talking to animals","tree",{"Manipulation":2,"Conjuration":1},"Wolf,Owl,Familiar,Flock"],["Being somewhere you have never been","moon",{"Specialization":2,"Transmutation":1},"Dream,Mirage,Door,Map"],["Being unbeatable","tri",{"Enhancement":2,"Emission":1},"Iron,Steel,Armor,Fist"],["Building a whole city","grid",{"Conjuration":2,"Manipulation":1},"Stone,Clockwork,Tower,Bridge"],["Turning into something else","zig",{"Transmutation":2},"Mercury,Moth,Mask,Second Skin"],["A dream you can control","thread",{"Manipulation":1,"Specialization":2},"Dream,Thread,Puppet,Lullaby"]]],
  ["How do you spend money?",[["I save every coin","square",{"Conjuration":2,"Manipulation":1},"Coin,Gold,Ledger,Tally"],["On my friends","circle",{"Enhancement":2,"Emission":1},"Heart,Gold,Bridge,Banquet"],["As fast as I get it","burst",{"Emission":2,"Transmutation":1},"Spark,Coin,Burst,Flare"],["On things nobody else wants","moon",{"Specialization":2,"Conjuration":1},"Fortune,Card,Heirloom,Portrait"],["I invest it in people","thread",{"Manipulation":2},"Coin,Debt,Bargain,Contract"],["On good tools","diamond",{"Conjuration":2,"Enhancement":1},"Iron,Steel,Toolbox,Weapon"],["On a bet","zig",{"Transmutation":2,"Manipulation":1},"Dice,Luck,Lottery,Game"]]],
  ["Pick a gift to give.",[["Something I made myself","square",{"Conjuration":2,"Enhancement":1},"Clay,Wax,Hand,Doll"],["Something that makes them laugh","zig",{"Transmutation":2,"Emission":1},"Laughter,Bubble,Fan,Music Box"],["A secret","key",{"Specialization":2,"Manipulation":1},"Secret,Name,Whisper,Riddle"],["A plan to get what they want","thread",{"Manipulation":2,"Conjuration":1},"Chess,Map,Compass,Contract"],["A day out, no plans","sun",{"Emission":2,"Enhancement":1},"Wind,Joy,Kite,Sprint"],["A weapon, just in case","tri",{"Enhancement":2,"Conjuration":1},"Steel,Blade,Gauntlet,Weapon"],["A song","wave",{"Emission":1,"Transmutation":1,"Specialization":1},"Song,Voice,Flute,Lullaby"]]],
  ["Pick a building.",[["A lighthouse","line",{"Emission":2},"Light,Lantern,Beam,Signal"],["A library","grid",{"Conjuration":2},"Paper,Ink,Book,Memory"],["A fortress","square",{"Enhancement":2,"Conjuration":1},"Stone,Iron,Tower,Wall"],["A circus tent","zig",{"Transmutation":2,"Emission":1},"Laughter,Bubble,Stage,Mask"],["A casino","star",{"Manipulation":2},"Dice,Card,Luck,Game"],["A ruined temple","moon",{"Specialization":2,"Conjuration":1},"Ghost,Ash,Ritual,Halo"],["A greenhouse","tree",{"Manipulation":1,"Conjuration":2},"Root,Petal,Seed,Familiar"],["A train station","wave",{"Emission":2,"Manipulation":1},"Iron,Steam,Signal,Rocket"]]],
  ["A stranger asks you for help. You…",[["Help, no questions asked","circle",{"Enhancement":2,"Emission":1},"Heart,Shield,Bridge,Hand"],["Ask what is in it for me","thread",{"Manipulation":2},"Coin,Debt,Bargain,Contract"],["Help, but keep watching them","diamond",{"Conjuration":2,"Manipulation":1},"Lens,Owl,Eye,Watchtower"],["Point them to someone who can help better","line",{"Emission":2,"Manipulation":1},"Signal,Whistle,Compass,Relay"],["Help in a way they will never notice","moon",{"Specialization":2,"Transmutation":1},"Secret,Veil,Shadow Step,Wish"],["Make it a game","zig",{"Transmutation":2,"Manipulation":1},"Dice,Laughter,Game,Riddle"]]],
  ["Pick a time of year to be born.",[["The first day of the year","sun",{"Enhancement":2},"Sun,Light,Clock,Calendar"],["The longest night","moon",{"Specialization":2,"Conjuration":1},"Moon,Shadow,Void,Lullaby"],["During a festival","star",{"Emission":2,"Transmutation":1},"Joy,Spark,Stage,Lantern"],["In a storm","burst",{"Emission":2,"Enhancement":1},"Storm,Lightning,Thunderclap,Burst"],["On a quiet Tuesday","dot",{"Conjuration":2,"Manipulation":1},"Clay,Tea,Ledger,Hourglass"],["Nobody knows exactly when","half",{"Transmutation":2},"Mist,Secret,Mask,Riddle"]]],
  ["Choose a superpower besides Nen.",[["Super strength","tri",{"Enhancement":2},"Muscle,Iron,Fist,Gauntlet"],["Shapeshifting","zig",{"Transmutation":2,"Conjuration":1},"Mercury,Clay,Second Skin,Mask"],["Making anything appear","square",{"Conjuration":2},"Crystal,Ink,Toolbox,Book"],["Seeing the future","moon",{"Specialization":2,"Manipulation":1},"Fortune,Time,Oracle,Prophecy"],["Mind control","thread",{"Manipulation":2},"Thread,Puppet,Command Word,Collar"],["Teleporting","line",{"Emission":2},"Void,Door,Shadow Step,Portal"],["Never getting tired","circle",{"Enhancement":2,"Conjuration":1},"Vigor,Heartbeat,Body,Breath"]]],
  ["What would you name a pet?",[["Something tough, like Tank","tri",{"Enhancement":2},"Iron,Bull,Armor,Fist"],["Something silly","zig",{"Transmutation":2,"Emission":1},"Bubble,Laughter,Gum,Fan"],["After a famous person","star",{"Manipulation":1,"Specialization":1,"Emission":1},"Gold,Name,Portrait,Throne"],["Nothing. It names itself","moon",{"Specialization":2,"Transmutation":1},"Name,Ghost,Familiar,Riddle"],["A number","grid",{"Conjuration":2,"Manipulation":1},"Clockwork,Tally,Ledger,Roll Call"],["Something long and fancy","wave",{"Conjuration":1,"Transmutation":2},"Silk,Ribbon,Music Box,Lace"]]],
  ["The last page of a book is missing. You…",[["Write your own ending","zig",{"Transmutation":2,"Conjuration":1},"Ink,Paper,Paint,Book"],["Find another copy","grid",{"Conjuration":2,"Manipulation":1},"Paper,Map,Book,Ledger"],["Like it better this way","moon",{"Specialization":2,"Transmutation":1},"Mist,Void,Riddle,Veil"],["Ask the author","line",{"Emission":2,"Manipulation":1},"Voice,Signal,Whistle,Relay"],["Throw the book across the room","burst",{"Enhancement":2,"Emission":1},"Rage,Fury,Throw,Fist"],["Make everyone you know read it too","thread",{"Manipulation":2,"Emission":1},"Rumor,Voice,Signal,Book"]]],
  ["Pick a place to sleep.",[["A hammock between two trees","tree",{"Transmutation":2,"Emission":1},"Wind,Vine,Hammock,Kite"],["A big bed in a big house","circle",{"Enhancement":2,"Conjuration":1},"Silk,Gold,Throne,Coffin"],["A tent far from anyone","line",{"Emission":2},"Wind,Star,Comet,Lantern"],["A room you locked yourself","key",{"Conjuration":1,"Specialization":2},"Key,Lock,Seal,Door"],["Wherever I fall asleep","dot",{"Enhancement":2,"Transmutation":1},"Stone,Sand,Body,Step"],["A boat, rocking","wave",{"Transmutation":2,"Manipulation":1},"Tide,Water,Ferry,Lullaby"],["A library after closing","grid",{"Conjuration":2},"Paper,Ink,Book,Memory"]]],
  ["Pick a game.",[["Chess","grid",{"Manipulation":2,"Conjuration":1},"Chess,Clockwork,Compass,Game"],["Arm wrestling","tri",{"Enhancement":2},"Muscle,Iron,Grip,Fist"],["Hide and seek","half",{"Transmutation":2},"Shadow,Mist,Veil,Shadow Step"],["Darts","line",{"Emission":2,"Conjuration":1},"Hawk,Flint,Dart,Arrow"],["Cards, for money","star",{"Manipulation":1,"Specialization":2},"Card,Dice,Deck,Lottery"],["Building blocks","square",{"Conjuration":2,"Enhancement":1},"Stone,Clay,Tower,Wall"],["A game I invented","zig",{"Transmutation":1,"Specialization":2},"Riddle,Paradox,Rulebook,Game"]]],
  ["What would you steal from a museum?",[["Nothing. I would just look","dot",{"Conjuration":2},"Glass,Lens,Eye,Portrait"],["The biggest gem","diamond",{"Conjuration":2,"Manipulation":1},"Diamond,Gemstone,Crystal,Crown"],["An old sword","tri",{"Enhancement":2,"Conjuration":1},"Steel,Bronze,Blade,Weapon"],["A cursed mask","half",{"Specialization":2,"Transmutation":1},"Ghost,Mask,Ritual,Veil"],["The guard's keys","key",{"Manipulation":2,"Transmutation":1},"Key,Lock,Iron,Collar"],["The whole museum, piece by piece","grid",{"Manipulation":1,"Conjuration":2},"Ledger,Map,Toolbox,Tally"],["I would set off every alarm, for fun","burst",{"Emission":2,"Transmutation":1},"Spark,Bell,Signal,Flare"]]],
  ["Pick a superstition you keep.",[["Knocking on wood","square",{"Enhancement":2,"Conjuration":1},"Oak,Root,Fist,Charm"],["Never saying a bad thing out loud","key",{"Specialization":2,"Manipulation":1},"Name,Hush,Oath,Seal"],["A lucky coin","star",{"Manipulation":2},"Coin,Luck,Fortune,Token"],["Throwing salt over my shoulder","burst",{"Emission":2,"Transmutation":1},"Salt,Spray,Throw,Exhale"],["I have none. I make my own luck","tri",{"Enhancement":2,"Emission":1},"Discipline,Pride,Fist,Step"],["I invent new ones every week","zig",{"Transmutation":2},"Dice,Mirage,Riddle,Ritual"]]],
  ["What are you like in the morning?",[["Up before everyone","sun",{"Enhancement":2,"Conjuration":1},"Sun,Light,Discipline,Step"],["Slow, and best left alone","moon",{"Specialization":2,"Transmutation":1},"Moon,Dream,Hush,Veil"],["Already planning the whole day","grid",{"Conjuration":1,"Manipulation":2},"Clockwork,Ledger,Compass,Calendar"],["Loud and full of energy","burst",{"Emission":2,"Enhancement":1},"Spark,Voice,Joy,Roar"],["Different every day","zig",{"Transmutation":2,"Emission":1},"Mercury,Wind,Moth,Mask"],["Up early to train","tri",{"Enhancement":2,"Emission":1},"Muscle,Sweat,Callus,Fist"]]],
  ["Someone cuts in line in front of you. You…",[["Tell them to move, loudly","burst",{"Emission":2,"Enhancement":1},"Voice,Roar,Shout,Fury"],["Move them yourself","tri",{"Enhancement":2},"Muscle,Grip,Grapple,Fist"],["Let it go. It is not worth it","circle",{"Conjuration":1,"Enhancement":1,"Specialization":1},"Discipline,Hush,Stance"],["Get everyone else in line to complain","thread",{"Manipulation":2,"Emission":1},"Rumor,Voice,Flock,Signal"],["Quietly take their wallet","half",{"Transmutation":2,"Manipulation":1},"Fox,Lie,Hook,Shadow Step"],["Remember their face forever","moon",{"Specialization":2,"Conjuration":1},"Grudge,Memory,Name,Portrait"]]],
  ["Which would you rather keep forever?",[["A photograph","square",{"Conjuration":2},"Paper,Memory,Portrait,Lens"],["A smell you love","wave",{"Transmutation":2,"Emission":1},"Smoke,Tea,Ether,Exhale"],["A secret","key",{"Specialization":2,"Manipulation":1},"Secret,Name,Seal,Whisper"],["A scar","tri",{"Enhancement":2,"Emission":1},"Blood,Bone,Callus,Brand"],["A debt someone owes you","thread",{"Manipulation":2},"Debt,Coin,Bargain,Ledger"],["A song stuck in your head","line",{"Emission":2,"Transmutation":1},"Song,Voice,Flute,Music Box"]]],
  ["Pick a view from a window.",[["Mountains","tri",{"Enhancement":2,"Conjuration":1},"Stone,Granite,Basalt,Tower"],["The sea","wave",{"Emission":2,"Transmutation":1},"Tide,Salt,Water,Wave"],["A busy street","grid",{"Manipulation":2,"Emission":1},"Neon,Coin,Signal,Ledger"],["A garden","tree",{"Conjuration":2,"Manipulation":1},"Root,Petal,Seed,Moss"],["A brick wall","square",{"Enhancement":2},"Stone,Discipline,Wall,Stance"],["Another window, with someone looking back","moon",{"Specialization":2,"Manipulation":1},"Mirror,Ghost,Gaze,Mirror Twin"],["A desert","line",{"Emission":1,"Transmutation":2},"Sand,Mirage,Sun,Dune"]]]
];
const nlIcon = k => {
  const s = {circle:'<circle cx="12" cy="12" r="7"/>', tri:'<path d="M12 4 L20 19 H4 Z"/>', diamond:'<path d="M12 3 L20 12 L12 21 L4 12 Z"/>', square:'<rect x="5" y="5" width="14" height="14"/>',
    line:'<path d="M4 18 L20 6"/>', dot:'<circle cx="12" cy="12" r="3"/>', half:'<path d="M12 4 A8 8 0 0 1 12 20 Z"/><circle cx="12" cy="12" r="8"/>', moon:'<path d="M15 4 A8 8 0 1 0 20 15 A6 6 0 1 1 15 4 Z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', wave:'<path d="M3 12 Q7 6 12 12 T21 12"/>', grid:'<path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>',
    star:'<path d="M12 3 L14.5 9.5 L21 10 L16 14.5 L17.5 21 L12 17.5 L6.5 21 L8 14.5 L3 10 L9.5 9.5 Z"/>', cross:'<path d="M12 3v18M3 12h18"/>', zig:'<path d="M3 16 L8 8 L13 16 L18 8 L21 12"/>',
    burst:'<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4"/>', key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>', thread:'<path d="M4 4 C10 10 14 2 20 8 M4 12 C10 18 14 10 20 16"/>',
    tree:'<path d="M12 3 L18 13 H6 Z M12 13 V21"/>'}[k] || '<circle cx="12" cy="12" r="6"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${s}</svg>`;
};
const nlDist = (a, b) => { const i = NL_TYPES.indexOf(a), j = NL_TYPES.indexOf(b); if(i < 0 || j < 0) return 3; const d = Math.abs(i - j); return Math.min(d, 6 - d); };
const nlPen = d => d === 0 ? 0 : d === 1 ? 20 : 40;
let NLAB = (() => { try { const s = JSON.parse(localStorage.getItem('hunter-nen-me') || 'null'); if(s && s.v === 1) return s; } catch(e){} return {v: 1, stage: 'intro'}; })();
const nlSave = () => { try { localStorage.setItem('hunter-nen-me', JSON.stringify(NLAB)); } catch(e){} };
const nlShuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const nlPrim = a => Object.entries(a[2]).sort((x, y) => y[1] - x[1])[0][0];
// 5–7 questions; each shows 3–5 of its answers, covering at least three different leanings
function nlDraw(q){
  const k = Math.min(q[1].length, 3 + Math.floor(Math.random() * 3)), all = q[1].map((a, i) => i);
  for(let t = 0; t < 40; t++){ const s = nlShuf(all).slice(0, k); if(new Set(s.map(i => nlPrim(q[1][i]))).size >= Math.min(3, k)) return s; }
  return nlShuf(all).slice(0, k);
}
function nlStartQuiz(){
  const idx = nlShuf(NL_Q.map((q, i) => i)).slice(0, 5 + Math.floor(Math.random() * 3));
  Object.assign(NLAB, {stage: 'quiz', qs: idx, opts: idx.map(i => nlDraw(NL_Q[i])), i: 0, score: Object.fromEntries(NL_TYPES.map(t => [t, 0])), picks: [], hints: [], type: null, hold: null, forge: null, done: null});
}
function nlResult(){
  const tot = Object.values(NLAB.score).reduce((a, b) => a + b, 0) || 1, pct = {};
  NL_TYPES.forEach(t => pct[t] = Math.round(NLAB.score[t] / tot * 100));
  // a tie is settled by the water, not by a fixed order
  const top = Math.max(...NL_TYPES.map(t => NLAB.score[t])), best = pickR(NL_TYPES.filter(t => NLAB.score[t] === top));
  return {type: best, pct};
}
function nlBars(pct, type){
  return `<div class="nl-bars">${NL_TYPES.map(t => `<div class="nl-bar${t === type ? ' on' : ''}" style="--c:${NL_C[t]}"><span>${t}</span><i><b style="width:${pct[t]}%"></b></i><em>${pct[t]}%</em></div>`).join('')}</div>`;
}
// ---- the forge: everything comes from the game's own Nen tables
const nlEls = (type, wide) => NEN_A.filter(a => wide || a[1].includes(type));
const nlForms = (type, wide) => NEN_B.filter(b => wide ? b[1] !== type : b[1] === type);
const nlEffOk = (c, el) => { const only = NEN_ONLY[c[0]], never = NEN_CLASH[c[0]]; if(el && only && !only.includes(el)) return false; if(el && never && never.includes(el)) return false; return true; };
// training is never chosen: it is read, quietly, from the answers, the glass and the forge
function nlTrain(){
  const T = NLAB.type, F = NLAB.forge || {}, hb = NLAB.hold || {dur: 0.5, ctl: 0.5}, pT = (NLAB.pct || {})[T] || 35;
  let h = 7; for(const ch of (NLAB.picks || []).join('|') + (F.el || '') + (F.form || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = k => ((h >>> (k * 3)) % 13) - 6;
  const potential = clamp(Math.round(42 + pT * 0.6 + hb.dur * 10 + n(0)), 20, 98);
  const mastery = clamp(Math.round(potential * 0.35 + 8 + hb.ctl * 8 + n(1) / 2), 3, 70);
  return {potential, mastery,
    capacity: clamp(Math.round(45 + hb.dur * 35 + ({Enhancement: 6, Conjuration: 5}[T] || 0) + n(2)), 10, 100),
    output: clamp(Math.round(45 + hb.dur * 22 + ({Enhancement: 10, Emission: 8, Transmutation: 5}[T] || 0) + n(3)), 10, 100),
    control: clamp(Math.round(40 + hb.ctl * 35 + ({Manipulation: 10, Specialization: 8, Conjuration: 6}[T] || 0) + n(4)), 10, 100),
    perception: clamp(Math.round(50 + hb.ctl * 15 + n(5)), 10, 100)};
}
function nlCompute(){
  const F = NLAB.forge, type = NLAB.type; if(!F) return null;
  const A = NEN_A.find(a => a[0] === F.el), B = NEN_B.find(b => b[0] === F.form), C = F.eff ? NEN_C.find(c => c[0] === F.eff) : null;
  if(!A || !B) return null;
  const vows = (F.vows || []).map(v => NEN_VOWS.find(x => x[0] === v)).filter(Boolean);
  const vb = vows.reduce((s, v) => s + v[1], 0);
  const penF = nlPen(nlDist(type, B[1])), penE = C ? nlPen(Math.min(...C[1].map(x => nlDist(type, x)))) : 0, pen = Math.max(penF, penE);
  const s = nlTrain(), hb = NLAB.hold || {dur: 0.5, ctl: 0.5};
  let h = 0; for(const ch of F.el + F.form + (F.eff || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const noise = (h % 7) - 3;
  const power = clamp(Math.round(25 + 0.35 * s.output + 0.3 * s.mastery + vb - pen + (hb.dur - 0.5) * 10 + noise), 5, 100);
  const accuracy = clamp(Math.round(30 + 0.4 * s.control + 0.2 * s.perception + 0.1 * s.mastery - pen / 2 + (hb.ctl - 0.5) * 10 - noise), 5, 100);
  const cs = (B[2].startsWith('Long') ? 2 : B[2].startsWith('Mid') ? 1 : 0) + (C ? 1 : 0) + (/Sustained|hour|day|Until/.test(B[4]) ? 1 : 0) - (vows.length ? 1 : 0);
  const cost = ['Low', 'Moderate', 'High', 'Very high'][clamp(cs, 0, 3)];
  const art = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w, a0 = A[0].toLowerCase(), b0 = B[0].toLowerCase(), fc = B[1];
  const verb = {Enhancement: `Reinforces the user's ${b0} with aura that behaves like ${a0}`, Transmutation: b0 === 'aura' ? `Changes the user's aura into ${a0}` : `Changes the user's aura into ${a0} and shapes it as ${art(b0)}`,
    Emission: `Launches ${a0}-charged aura away from the body as ${art(b0)}`, Conjuration: `Materializes ${art(b0)} made of ${a0}`, Manipulation: `Uses ${art(a0)} ${b0} as a medium to take hold of a target`, Specialization: `Turns ${art(a0)} ${b0} into a rule the target must obey`}[fc];
  const desc = `${verb}${C ? (fc === 'Manipulation' || fc === 'Specialization' ? '; it ' : ' that ') + C[2] : ''}. It is ${A[3]}.`;
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  return {A, B, C, vows, power, accuracy, cost, desc, pen, train: s, weakness: cap(A[2]) + '.',
    activation: B[3].split('|')[0], counter: [C ? C[3] : null, A[2], vows[0] ? 'exploiting the vow: ' + vows[0][0].toLowerCase() : null].filter(Boolean).map(cap).join('; ') + '.',
    name: `${A[0]} ${B[0]}${C ? ' ' + C[0] : ''}`, alias: F.alias || ''};
}
// the same panel the Hunters get in their profiles
function nlPanel(R){
  const T = NLAB.type, s = R.train, cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  const n = {category: T, ...s, status: s.mastery < 15 ? 'Partially Awakened' : s.mastery < 35 ? 'Awakened' : s.mastery < 55 ? 'Trained' : 'Advanced', efficiency: nenEfficiency(T),
    techniques: NEN_TECH.filter(t => s.mastery >= t[1]).map(t => t[0]),
    hatsu: {alias: R.alias, name: R.name, keywords: [R.A[0], R.B[0]].concat(R.C ? [R.C[0]] : []), primary: T, secondary: R.B[1] !== T ? R.B[1] : null, description: R.desc,
      activation: `Activated by ${R.activation}.`, range: R.B[2], duration: R.B[4], cost: R.cost,
      cooldown: R.cost === 'Very high' ? 'Needs a full night of rest before reuse' : R.cost === 'High' ? 'About 10 minutes of Zetsu to recover' : R.cost === 'Moderate' ? 'A minute of steady breathing' : 'Can be reused almost immediately',
      power: R.power, accuracy: R.accuracy, effect: R.C ? cap(R.C[2]) + '.' : `Raw ${R.A[0].toLowerCase()} force with no added effect.`, weakness: R.weakness,
      vows: R.vows.map(v => ({text: v[0], bonus: v[1]})), counterplay: R.counter}};
  return nenPanel({nen: n}).replace('Nen · unlocked after the exam', 'Your Nen · read from the glass');
}
const nlAlias = el => Math.random() < 0.5 ? `${pickR(NEN_ADJ)} ${pickR(NEN_NOUN)}` : `${pickR(NEN_NOUN)} of the ${pickR(NEN_ADJ).replace(/'s$/, '')} ${el || pickR(NEN_A)[0]}`;
// share link: the whole card in the URL hash
const nlEncode = () => { try { return btoa(unescape(encodeURIComponent(JSON.stringify({t: NLAB.type, p: NLAB.pct, f: NLAB.forge, h: NLAB.hold, k: NLAB.picks})))); } catch(e){ return ''; } };
function nlFromHash(){
  const m = location.hash.match(/#nen=([^&]+)/); if(!m) return false;
  try { const d = JSON.parse(decodeURIComponent(escape(atob(m[1])))); Object.assign(NLAB, {stage: 'card', type: d.t, pct: d.p, forge: d.f, hold: d.h, picks: d.k || [], shared: true}); return true; } catch(e){ return false; }
}
// the forge goes one slot at a time; what is chosen builds up in the strip at the top
// ---- the forge: five panels filled one at a time; picks lean on what you answered and how you held the glass
const NL_STEPS = [['el', 'Element'], ['form', 'Form'], ['eff', 'Effect'], ['vow', 'Vows'], ['name', 'Name']];
// each quiz answer leaves a trace: elements and forms it suggests
// each answer's hidden trace (elements and forms it suggests), looked up by label for older saves
const NL_HINT = {}; NL_Q.forEach(q => q[1].forEach(a => { if(!(a[0] in NL_HINT)) NL_HINT[a[0]] = a[3] || ''; }));
// element families, for the filter chips and the panel icons
const NL_FAM = {
  Beasts: 'Wolf,Serpent,Hawk,Spider,Moth,Bee,Coral,Tiger,Bear,Crow,Shark,Dragon,Bull,Rhino,Gorilla,Mammoth,Locust,Feather,Fang,Horn,Scale,Shell,Silk',
  Body: 'Blood,Bone,Pulse,Heart,Breath,Voice,Sinew,Marrow,Adrenaline,Hunger,Laughter,Song',
  Objects: 'Iron,Glass,Thread,Ink,Paper,Mirror,Rubber,Glue,Clock,Coin,Card,Dice,Key,Bell,Candle,Lantern,Puppet,Chalk,Rope,Tea,Ink Blot,Clockwork,Origami,Chess,Neon,Wax,Tattoo Ink,Bronze,Steel,Anvil,Gold',
  Mind: 'Memory,Time,Dream,Echo,Fortune,Void,Name,Oath,Grudge,Fear,Luck,Debt,Rage,Sorrow,Promise,Lie,Discipline,Echo of the Dead,Ghost,Sound'
};
const nlFam = el => Object.keys(NL_FAM).find(k => NL_FAM[k].split(',').includes(el)) || 'Nature';
const NL_FAMI = {Nature: 'tree', Beasts: 'tri', Body: 'circle', Objects: 'square', Mind: 'moon'};
const nlRange = r => /^(Contact|Self)/.test(r) ? 'Touch' : /^(Close|Short)/.test(r) ? 'Close' : /^Mid/.test(r) ? 'Mid' : 'Long';
const NL_SFX = {Enhancement: 'GLUG!', Transmutation: 'SHIMMER', Conjuration: 'TINK TINK', Specialization: '…!?', Manipulation: 'SWIRL', Emission: 'FWOOSH'};
function nlOptions(step){
  const T = NLAB.type, F = NLAB.forge, wide = F.wide, abc = (a, b) => a.v.localeCompare(b.v);
  if(step === 'el') return nlEls(T, false).map(a => ({v: a[0], sub: `Stronger ${a[3].replace(/^stronger /, '')}`, weak: a[2], grp: nlFam(a[0])})).sort(abc);
  if(step === 'form'){
    const mk = (b, pen) => ({v: b[0], sub: b[3].split('|')[0], range: b[2], dur: b[4], grp: nlRange(b[2]), cat: b[1], pen});
    const own = nlForms(T, false).map(b => mk(b, 0)).sort(abc);
    return wide ? own.concat(nlForms(T, true).map(b => mk(b, nlPen(nlDist(T, b[1])))).sort((a, b) => a.pen - b.pen || abc(a, b))) : own;
  }
  if(step === 'eff') return NEN_C.filter(c => (wide || c[1].includes(T)) && nlEffOk(c, F.el))
    .map(c => ({v: c[0], sub: c[2], counter: c[3], grp: c[1].includes(T) ? 'Yours' : 'Other', pen: c[1].includes(T) ? 0 : nlPen(Math.min(...c[1].map(x => nlDist(T, x))))})).sort((a, b) => a.pen - b.pen || abc(a, b));
  if(step === 'vow') return NEN_VOWS.map(v => ({v: v[0], bonus: v[1], grp: v[1] >= 20 ? 'Heavy' : v[1] >= 13 ? 'Medium' : 'Light'})).sort((a, b) => a.bonus - b.bonus);
  return [];
}
// up to four picks "made for you", each with the reason behind it
function nlSuggest(step, opts){
  const F = NLAB.forge, hb = NLAB.hold || {dur: .5, ctl: .5}, picks = NLAB.picks || [], out = new Map();
  const add = (v, why, w) => { if(!opts.some(o => o.v === v && !o.pen)) return; const o = out.get(v); if(!o || o.w < w) out.set(v, {v, why, w: (o ? o.w : 0) + w}); };
  if(step === 'el' || step === 'form') picks.forEach((p, i) => (((NLAB.hints || [])[i] ?? NL_HINT[p]) || '').split(',').forEach(n => add(n, '', 3)));
  if(step === 'form'){
    opts.forEach(o => { if(hb.dur > .6 && /Sustained|Until/.test(o.dur)) add(o.v, 'You held the glass a long time', 1.5); if(hb.dur < .3 && o.dur === 'Instant') add(o.v, 'You let go of the glass quickly', 1.5);
      if(hb.ctl > .7 && /Thread|String|Leash|Seal|Chain|Needle|Pin|Lock/.test(o.v)) add(o.v, 'Your hand stayed perfectly still', 2); });
  }
  if(step === 'eff'){
    opts.forEach(o => { if(NEN_ONLY[o.v] && NEN_ONLY[o.v].includes(F.el)) add(o.v, `Made for ${F.el}`, 3);
      if(hb.ctl > .7 && /Binding|Tracking|Marking|Sealing|Command|Control|Pinning|Taming|Linking/.test(o.v)) add(o.v, 'Your hand stayed perfectly still', 2);
      if(hb.dur > .6 && /Endur|Regenerat|Absorpt|Iron Will|Bracing|Steadying|Second Wind/.test(o.v)) add(o.v, 'You held the glass a long time', 1.5);
      if(hb.dur < .3 && /Acceler|Pierc|Explo|Shockwave|Amplif|Overdrive|Momentum/.test(o.v)) add(o.v, 'You let go of the glass quickly', 1.5); });
  }
  if(step === 'vow'){
    const fx = {Enhancement: /contact|touch|hand|fist/i, Transmutation: /game|laugh|joke|chance/i, Conjuration: /keepsake|object|carr/i, Specialization: /name|secret|promise|born/i, Manipulation: /target|face|name/i, Emission: /see|distance|shout|voice/i}[NLAB.type];
    opts.forEach(o => { if(fx && fx.test(o.v)) add(o.v, `Fits a ${NLAB.type} user`, 2); });
  }
  // fill up with a stable pick from your own type, so there is always something
  let h = 3; for(const ch of picks.join('') + step) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  const own = opts.filter(o => !o.pen);
  for(let i = 0; out.size < 4 && i < 12 && own.length; i++) add(own[(h + i * 7) % own.length].v, 'Your aura leans this way', .5);
  // the real reason stays hidden, so the test cannot be gamed; only a hint of how strong the pull is
  return [...out.values()].sort((a, b) => b.w - a.w).slice(0, 4).map(s => ({...s, why: s.w >= 3 ? 'Strong pull' : s.w >= 1.5 ? 'Your aura stirs' : 'Feels familiar'}));
}
let nlTimer = 0;
// page titles outside the exam share the Nen lab's voice, a little quieter
const pageHead = (chip, title, c, sub) => `<div class="pg-head" style="--c:${c}"><span>${chip}</span><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
const nlChap = (n, t, sub) => `<div class="nl-chap">${n ? `<span>${n}</span>` : ''}<h2>${t}</h2></div>${sub ? `<p class="nl-sub">${sub}</p>` : ''}`;
const nlRevealHtml = () => { const T = NLAB.type; return `<div class="nl-reveal" style="--c:${NL_C[T]}"><div class="nl-sheet"><small>Your type</small><b>${T}</b><p>${NL_INFO[T].d}</p><p class="muted" style="margin-top:8px">Keyword: ${NL_INFO[T].kw}</p></div></div>
  <div class="nl-revbtn"><button class="btn primary" data-nl="forge">Forge my Hatsu →</button> <button class="btn" data-nl="start">Start over</button></div>`; };
const nlComposed = F => { const m = F.nm || {}; return m.pat ? `${m.n} of the ${(m.a || '').replace(/'s$/, '')} ${F.el || ''}`.trim() : `${m.a} ${m.n}`; };
function nlCardHtml(step, o, why){
  const F = NLAB.forge, on = step === 'vow' ? (F.vows || []).includes(o.v) : (step === 'el' ? F.el : step === 'form' ? F.form : F.eff) === o.v;
  const attrs = `class="nl-pc nl-pc-${step}${on ? ' on' : ''}${o.pen ? ' pen' : ''}${why ? ' fy' : ''}" data-nlset="${step}" data-v="${esc(o.v)}" data-g="${esc(o.grp || '')}" data-q="${esc((o.v + ' ' + (step === 'el' ? '' : o.sub || '')).toLowerCase())}"`;
  const pen = o.pen ? `<em class="nl-pen">−${o.pen} power</em>` : '', w = why ? `<i class="nl-why">${esc(why)}</i>` : '';
  if(step === 'el') return `<button ${attrs}>${w}<span class="ic">${nlIcon(NL_FAMI[o.grp])}</span><b>${esc(o.v)}</b><small>${esc(o.sub)}</small><small class="wk">Weak: ${esc(o.weak)}</small></button>`;
  if(step === 'form') return `<button ${attrs}>${w}<b>${esc(o.v)}</b>${pen}<small>Activated by ${esc(o.sub)}</small><span class="tags"><span>${esc(o.range)}</span><span>${esc(o.dur)}</span>${o.pen ? `<span>${o.cat}</span>` : ''}</span></button>`;
  if(step === 'eff') return `<button ${attrs}>${w}<b>${esc(o.v)}</b>${pen}<small>${esc(o.sub.charAt(0).toUpperCase() + o.sub.slice(1))}.</small><small class="ctr">Counter: ${esc(o.counter)}</small></button>`;
  return `<button ${attrs}>${w}<span class="nl-seal">+${o.bonus}<small>power</small></span><b class="vt">${esc(o.v)}</b>${on ? '<span class="nl-signed">SIGNED</span>' : ''}</button>`;
}
function renderNenLab(){
  const el = $('pane-nen'); if(!el) return;
  if(!['intro', 'quiz', 'cup', 'forge', 'card'].includes(NLAB.stage)){ NLAB.stage = NLAB.type ? 'cup' : 'intro'; NLAB.reveal = NLAB.type ? 'shown' : null; }
  const T = NLAB.type;
  let h = '';
  if(NLAB.stage === 'intro'){
    h = nlChap('Prologue', 'Discover your Nen', 'A few questions, a glass of water with a leaf, and a forge. At the end you will have your own Hatsu, built from the same pieces the Hunters in this world use.')
      + `<div class="nl-steps">${[['1','The questions','No right answers.'],['2','The glass','The water decides your type.'],['3','The forge','Element, form, effect, vows.'],['4','Your Hatsu','Save it or share it.']].map(([n, a, b]) => `<div><b>${n}</b><span>${a}</span><small>${b}</small></div>`).join('')}</div>
      <div class="nl-intro-go"><button class="btn primary nl-cta" data-nl="start">Discover my Nen →</button>${NLAB.done ? `<button class="btn" data-nl="card">See my last card</button>` : ''}</div>`;
  } else if(NLAB.stage === 'quiz'){
    const q = NL_Q[NLAB.qs[NLAB.i]];
    const nq = NLAB.qs.length, show = (NLAB.opts || [])[NLAB.i] || q[1].map((a, j) => j);
    h = nlChap(`Chapter 1 · Question ${NLAB.i + 1} of ${nq}`, 'The questions') + `<div class="nl-prog">${NLAB.qs.map((x, i) => `<i class="${i < NLAB.i ? 'done' : i === NLAB.i ? 'now' : ''}"></i>`).join('')}</div>
      <div class="nl-balloon">${esc(q[0])}</div>
      <div class="nl-cards n${show.length}">${show.map(j => { const o = q[1][j]; return `<button class="nl-card" data-nlpick="${j}" aria-label="${esc(o[0])}">${nlIcon(o[1])}<span>${esc(o[0])}</span></button>`; }).join('')}</div>`;
  } else if(NLAB.stage === 'cup'){
    const r = NLAB.reveal;   // null: waiting · 'react': the water is reacting · 'shown': the type is revealed
    h = nlChap('Chapter 2', 'The glass', r ? '' : 'Your answers have shaped your aura. Press and hold the glass, breathe, and let go when you feel it. Keep as still as you can.')
      + `<div class="nl-cup${r ? ' rx rx-' + T.slice(0, 3).toLowerCase() : ''}" style="--c:${NL_C[T]}"><div class="nl-aura" id="nlAura"></div>
        ${r === 'react' ? `<span class="nl-bigsfx">${NL_SFX[T]}</span>` : ''}
        <svg viewBox="0 0 200 200" id="nlGlass" role="button" tabindex="0" aria-label="Hold the glass">
          <g class="drops">${[0,1,2,3,4,5].map(i => `<circle cx="${100 + Math.cos(i * 1.05) * 84}" cy="${100 + Math.sin(i * 1.05) * 84}" r="5"/>`).join('')}</g>
          <circle cx="100" cy="100" r="78" class="g1"/><circle cx="100" cy="100" r="64" class="g2"/>
          <g class="specks">${[[78,82],[118,76],[90,122],[126,112],[70,104],[108,96],[96,70],[132,92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>
          <g class="rays">${[0,1,2,3,4,5,6,7].map(i => `<path d="M100 100 L${100 + Math.cos(i * .785) * 62} ${100 + Math.sin(i * .785) * 62}"/>`).join('')}</g>
          <g id="nlLeaf"><path d="M100 70 C125 85 125 115 100 130 C75 115 75 85 100 70 Z" class="lf"/><path d="M100 72 L100 128" class="lv"/></g>
        </svg>
        <p id="nlCupMsg" class="nl-cupmsg">${r ? esc(NL_INFO[T].water) : 'Hold for at least 1.5 seconds.'}</p></div>
      ${r === 'shown' ? nlRevealHtml() : ''}`;
  } else if(NLAB.stage === 'forge'){
    const F = NLAB.forge, step = F.step || 'el', R = nlCompute(), si = NL_STEPS.findIndex(s => s[0] === step);
    const val = k => k === 'el' ? F.el : k === 'form' ? F.form : k === 'eff' ? (F.eff || (F.effSet ? 'No effect' : '')) : k === 'vow' ? ((F.vows || []).length ? F.vows.length + ' vow' + (F.vows.length > 1 ? 's' : '') : (F.vowSet ? 'No vows' : '')) : (F.alias || '');
    const pic = k => k === 'el' ? nlIcon(NL_FAMI[nlFam(F.el)]) : k === 'form' ? nlIcon('diamond') : k === 'eff' ? nlIcon('burst') : k === 'vow' ? nlIcon('key') : nlIcon('star');
    const strip = `<div class="nl-strip">${NL_STEPS.map(([k, l], i) => { const v = val(k), open = si >= i || v;
      return `${i ? '<i class="nl-plus" aria-hidden="true">+</i>' : ''}<button class="nl-pn nl-pn-${k}${k === step ? ' now' : ''}${v ? ' set' : ''}" data-nlstep="${k}" ${open ? '' : 'disabled'}><small>${i + 1} · ${l}</small><span class="ic">${v ? pic(k) : '?'}</span><b>${esc(v || (k === step ? 'Choose' : ''))}</b></button>`; }).join('')}</div>`;
    const cap = {el: ['Panel 1', 'Choose your element', 'What your aura is made of, or behaves like.'], form: ['Panel 2', 'Give it a form', 'The shape it takes, how far it reaches, how long it lasts.'], eff: ['Panel 3', 'Add an effect', 'Optional. What it does when it lands.'], vow: ['Panel 4', 'Sign a vow', 'A restriction you swear to. Up to two. The heavier the vow, the stronger the Hatsu.'], name: ['Panel 5', 'Name it', 'Spin the words, lock the ones you like, or write your own.']}[step];
    let body = `<div class="nl-cap"><span>${cap[0]}</span><b>${cap[1]}</b><small>${cap[2]}</small></div>`;
    if(step === 'name'){
      if(!F.nm){ F.nm = {a: pickR(NEN_ADJ), n: pickR(NEN_NOUN), pat: 0}; if(!F.alias) F.alias = nlComposed(F); }
      const m = F.nm;
      body += `<div class="nl-namer">
        <div class="nl-cover"><small>${esc(R ? R.name : '')}</small><b id="nlCover">${esc(F.alias || nlComposed(F))}</b></div>
        <div class="nl-reels">${[['a', 'Word 1', m.a, m.la], ['n', 'Word 2', m.n, m.ln]].map(([k, l, w, lk]) => `<div class="nl-reel${lk ? ' lk' : ''}"><small>${l}</small><b id="nlR${k}">${esc(w)}</b><button class="btn small" data-nl="lock${k}" aria-pressed="${!!lk}">${lk ? 'Locked' : 'Lock'}</button></div>`).join('')}
          <div class="nl-reelbtns"><button class="btn primary" data-nl="spin">Spin ↻</button>
          <div class="nl-pat"><small class="muted">Pattern</small><button class="${m.pat ? '' : 'on'}" data-nl="pat0" id="nlP0">${esc(nlComposed({...F, nm: {...m, pat: 0}}))}</button><button class="${m.pat ? 'on' : ''}" data-nl="pat1" id="nlP1">${esc(nlComposed({...F, nm: {...m, pat: 1}}))}</button></div></div></div>
        <label class="nl-own"><span class="nl-own-h">…or write it down yourself</span><small>Anything you type here replaces the spun name.</small><input type="text" id="nlAlias" maxlength="40" placeholder="Your Hatsu's name" value="${F.typed ? esc(F.alias) : ''}"></label>
        <p class="muted" style="margin:0;font-size:13px">Your training is read from your answers and the glass. The numbers appear on your card.</p>
        <div><button class="btn primary nl-go" data-nl="finish" ${R ? '' : 'disabled'}>Forge it! →</button></div></div>`;
    } else {
      const opts = nlOptions(step), sug = nlSuggest(step, opts), grps = [...new Set(opts.map(o => o.grp))];
      const nv = (F.vows || []).length, vb = (F.vows || []).reduce((s, v) => s + ((NEN_VOWS.find(x => x[0] === v) || [0, 0])[1]), 0);
      body += `${step === 'vow' ? `<div class="nl-vowbar"><div><b>${nv}/2 vows signed</b>${nv ? ` <span>+${vb} power</span>` : ''}</div><button class="btn primary" data-nl="vowdone">${nv ? 'Continue →' : 'No vows →'}</button></div>` : ''}${step === 'eff' ? `<button class="nl-pc nl-none${F.effSet && !F.eff ? ' on' : ''}" data-nlset="eff" data-v=""><b>No effect</b><small>Raw ${esc((F.el || '').toLowerCase())} force, nothing added. Lower aura cost.</small></button>` : ''}
        ${sug.length ? `<div class="nl-fy"><h5>Made for you</h5><div class="nl-grid">${sug.map(s => nlCardHtml(step, opts.find(o => o.v === s.v), s.why)).join('')}</div></div>` : ''}
        <div class="nl-tools"><div class="nl-filts">${grps.length > 1 ? ['All'].concat(grps).map(g => `<button class="${g === 'All' ? 'on' : ''}" data-nlfilt="${esc(g)}">${esc(g)}</button>`).join('') : ''}</div><input type="search" class="nl-search" id="nlSearch" placeholder="Search ${opts.length}…" aria-label="Search options"></div>
        <div class="nl-grid nl-all">${opts.map(o => nlCardHtml(step, o)).join('') || `<p class="muted">Nothing fits here. Turn on other categories below.</p>`}</div>
        <div class="nl-pfoot">${step === 'form' || step === 'eff' ? `<label class="nl-wtog"><input type="checkbox" data-nl="wide" ${F.wide ? 'checked' : ''}> Show other categories (costs power)</label>` : '<span></span>'}${step === 'vow' ? `<button class="btn primary" data-nl="vowdone">${(F.vows || []).length ? 'Continue →' : 'No vows →'}</button>` : ''}</div>`;
    }
    h = nlChap(`Chapter 3 · ${T}`, 'The forge') + strip + `<div class="nl-stage">${body}</div>`;
  } else if(NLAB.stage === 'card'){
    const R = nlCompute();
    if(!R){ NLAB.stage = 'intro'; return renderNenLab(); }
    h = `${NLAB.shared ? `<p class="muted" style="margin:0">Someone shared their Hatsu with you. <button class="btn small" data-nl="start">Make your own</button></p>` : ''}${nlChap(`Your Nen${NLAB.type ? ' · ' + esc(NLAB.type) : ''}`, 'Your Hatsu')}
      <div class="nl-final" id="nlCard" style="--c:${NL_C[T]}"><div class="nl-f-top"><small>${T} · ${NL_INFO[T].kw}</small></div>${nlPanel(R)}
      <div><div class="section-h">Your type test</div>${nlBars(NLAB.pct || {}, T)}</div></div>
      <div class="nl-acts"><button class="btn primary" data-nl="png">Save as image</button><button class="btn" data-nl="link">Copy link</button><button class="btn" data-nl="share">Challenge your friends</button>${NLAB.shared ? '' : `<button class="btn" data-nl="back">Back to the forge</button>`}<button class="btn" data-nl="start">Start over</button></div><p class="muted" id="nlMsg" style="margin:0;font-size:12.5px"></p>`;
  }
  el.innerHTML = `<div class="nl-wrap nl-st-${NLAB.stage}" style="--c:${T && NLAB.stage !== 'quiz' && (NLAB.stage !== 'cup' || NLAB.reveal) ? NL_C[T] : 'var(--gold)'}">${h}</div>`;
  if(NLAB.stage === 'cup' && !NLAB.reveal) nlCupWire();
  if(NLAB.stage === 'cup' && NLAB.reveal === 'react'){ clearTimeout(nlTimer); nlTimer = setTimeout(() => { const cup = document.querySelector('.nl-cup'); if(NLAB.stage === 'cup' && cup){ NLAB.reveal = 'shown'; cup.insertAdjacentHTML('afterend', nlRevealHtml()); nlSave(); } }, 2600); }
  nlSave();
}
function nlCupWire(){
  const g = $('nlGlass'), leaf = $('nlLeaf'), aura = $('nlAura'), msg = $('nlCupMsg'); if(!g) return;
  let t0 = 0, raf = 0, pts = [], down = false;
  const step = () => { const s = (performance.now() - t0) / 1000; leaf.style.transform = `rotate(${Math.min(5, s) * 40}deg)`; aura.style.transform = `scale(${1 + Math.min(5, s) * 0.12})`; aura.style.opacity = Math.min(0.9, 0.2 + s * 0.15); if(s >= 5) end(); else raf = requestAnimationFrame(step); };
  const start = e => { e.preventDefault(); down = true; t0 = performance.now(); pts = []; try { g.setPointerCapture(e.pointerId); } catch(_){} msg.textContent = 'Breathe…'; raf = requestAnimationFrame(step); };
  const move = e => { if(down && e.clientX !== undefined) pts.push([e.clientX, e.clientY]); };
  const end = () => {
    if(!down) return; down = false; cancelAnimationFrame(raf);
    const s = Math.min(5, (performance.now() - t0) / 1000);
    if(s < 1.5){ msg.textContent = 'Breathe more deeply, and hold a little longer.'; leaf.style.transform = ''; aura.style.transform = ''; aura.style.opacity = 0.2; return; }
    let spread = 0; if(pts.length > 1){ const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length; spread = Math.sqrt(pts.reduce((a, p) => a + (p[0] - mx) ** 2 + (p[1] - my) ** 2, 0) / pts.length); }
    NLAB.hold = {dur: +((s - 1.5) / 3.5).toFixed(2), ctl: +Math.max(0, 1 - spread / 25).toFixed(2)};
    NLAB.reveal = 'react'; renderNenLab();
  };
  g.addEventListener('pointerdown', start); g.addEventListener('pointermove', move); g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end); g.addEventListener('pointerleave', end);
  g.addEventListener('keydown', e => { if((e.key === ' ' || e.key === 'Enter') && !down) start(e); }); g.addEventListener('keyup', e => { if(e.key === ' ' || e.key === 'Enter') end(); });
}
// ---- PNG export: the card drawn on a canvas
function nlPng(){
  const R = nlCompute(); if(!R) return;
  const W = 1080, col = NL_HEX[NLAB.type];
  // drawn twice: once to measure how tall the card needs to be, once for real
  const draw = H => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  x.fillStyle = '#0f1315'; x.fillRect(0, 0, W, H);
  for(let i = -H; i < W; i += 14){ x.strokeStyle = 'rgba(255,255,255,0.025)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
  x.fillStyle = '#161b1e'; x.fillRect(60, 60, W - 120, H - 120); x.lineWidth = 6; x.strokeStyle = '#050607'; x.strokeRect(60, 60, W - 120, H - 120);
  x.fillStyle = col; x.fillRect(60, 60, 18, H - 120);
  const T = (s, px, y, size, c, w, font) => { x.fillStyle = c || '#e7e3d8'; x.font = `${w || 400} ${size}px ${font || 'Arial, sans-serif'}`; x.fillText(s, px, y); };
  const wrapT = (s, px, y, maxW, lh, size, c) => { x.font = `400 ${size}px Arial, sans-serif`; x.fillStyle = c || '#e7e3d8'; let line = ''; for(const w of s.split(' ')){ const t = line ? line + ' ' + w : w; if(x.measureText(t).width > maxW){ x.fillText(line, px, y); y += lh; line = w; } else line = t; } if(line){ x.fillText(line, px, y); y += lh; } return y; };
  T(`${NLAB.type.toUpperCase()} · ${NL_INFO[NLAB.type].kw.toUpperCase()}`, 120, 150, 26, col, 700);
  let y = wrapT(R.alias || R.name, 120, 230, 840, 76, 64, '#e7e3d8');
  T(R.name, 120, y + 6, 28, '#8e9894');
  y = wrapT(R.desc, 120, y + 80, 840, 40, 30);
  const st = [['POWER', R.power], ['ACCURACY', R.accuracy], ['AURA COST', R.cost]];
  st.forEach(([k, v], i) => { const bx = 120 + i * 285; x.strokeStyle = '#2a3337'; x.lineWidth = 3; x.strokeRect(bx, y + 20, 260, 120); T(k, bx + 20, y + 58, 20, '#8e9894', 700); T(String(v), bx + 20, y + 115, 46, col, 700); });
  y += 190;
  [['Element', R.A[0]], ['Form', `${R.B[0]} · ${R.B[2]} · ${R.B[4]}`], ['Effect', R.C ? R.C[0] : 'None'], ['Vows', R.vows.length ? R.vows.map(v => v[0]).join('; ') : 'None'], ['Weakness', R.weakness]].forEach(([k, v]) => { T(k.toUpperCase(), 120, y, 20, '#8e9894', 700); y = wrapT(v, 300, y, 660, 34, 26); y += 10; });
  y += 10;
  NL_TYPES.forEach((t, i) => { const p = (NLAB.pct || {})[t] || 0, by = y + i * 40; T(t, 120, by + 22, 22, t === NLAB.type ? '#e7e3d8' : '#8e9894', t === NLAB.type ? 700 : 400); x.fillStyle = '#1d2427'; x.fillRect(360, by + 4, 520, 22); x.fillStyle = NL_HEX[t]; x.fillRect(360, by + 4, 520 * p / 100, 22); T(p + '%', 900, by + 22, 22, '#8e9894'); });
  const end = y + 6 * 40 + 40;
  T('Make yours: Hunter Exam Simulator · Your Nen', 120, Math.max(end + 20, H - 100), 22, '#8e9894');
  return {cv, end}; };
  const m = draw(2400), cv = draw(Math.max(1350, m.end + 140)).cv;
  const a = document.createElement('a'); a.download = (R.alias || R.name).replace(/[^\w]+/g, '-') + '.png'; a.href = cv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
}
const nlLink = () => location.href.split('#')[0] + '#nen=' + nlEncode();
const nlMsg = t => { const m = $('nlMsg'); if(m) m.textContent = t; };
const nlNext = cur => { const i = NL_STEPS.findIndex(s => s[0] === cur); return NL_STEPS[Math.min(NL_STEPS.length - 1, i + 1)][0]; };
// little comic sound effects where you click
function nlSfx(x, y, word){
  if(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const s = document.createElement('span'); s.className = 'nl-sfx'; s.textContent = word || pickR(['TAK!', 'KRAK!', 'SHING!', 'BAM!', 'ZAK!']);
  s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.appendChild(s); setTimeout(() => s.remove(), 750);
}
let nlFilt = 'All';
function nlFilter(){
  const q = (($('nlSearch') || {}).value || '').trim().toLowerCase();
  document.querySelectorAll('.nl-all .nl-pc').forEach(o => o.hidden = (q && !o.dataset.q.includes(q)) || (nlFilt !== 'All' && o.dataset.g !== nlFilt));
}
function nlNameSync(){
  const F = NLAB.forge, m = F.nm || {}, pn = document.querySelector('.nl-pn-name b'), p0 = $('nlP0'), p1 = $('nlP1');
  if(pn) pn.textContent = F.alias || ''; if(p0) p0.textContent = nlComposed({...F, nm: {...m, pat: 0}}); if(p1) p1.textContent = nlComposed({...F, nm: {...m, pat: 1}});
}
function nlSpin(){
  const F = NLAB.forge, m = F.nm, ra = $('nlRa'), rn = $('nlRn'); if(!m) return;
  let n = 0; const iv = setInterval(() => {
    if(!m.la && ra) ra.textContent = pickR(NEN_ADJ); if(!m.ln && rn) rn.textContent = pickR(NEN_NOUN);
    if(++n >= 9){ clearInterval(iv); if(!m.la) m.a = ra.textContent; if(!m.ln) m.n = rn.textContent; F.typed = false; F.alias = nlComposed(F); nlNameSync(); const al = $('nlAlias'); if(al) al.value = ''; const cv = $('nlCover'); if(cv){ cv.textContent = F.alias; cv.classList.remove('pop'); void cv.offsetWidth; cv.classList.add('pop'); } nlSave(); }
  }, 55);
}
document.addEventListener('click', e => {
  const pk = e.target.closest('[data-nlpick]');
  if(pk){ const q = NL_Q[NLAB.qs[NLAB.i]], o = q[1][+pk.dataset.nlpick]; Object.entries(o[2]).forEach(([t, w]) => NLAB.score[t] += w); NLAB.picks.push(o[0]); (NLAB.hints = NLAB.hints || []).push(o[3] || ''); pk.classList.add('stamp'); nlSfx(e.clientX, e.clientY);
    setTimeout(() => { NLAB.i++; if(NLAB.i >= NLAB.qs.length){ const r = nlResult(); NLAB.type = r.type; NLAB.pct = r.pct; NLAB.stage = 'cup'; NLAB.reveal = null; NLAB.hold = null; } renderNenLab(); }, 300); return; }
  const fl = e.target.closest('[data-nlfilt]');
  if(fl){ nlFilt = fl.dataset.nlfilt; document.querySelectorAll('[data-nlfilt]').forEach(b => b.classList.toggle('on', b === fl)); nlFilter(); return; }
  const sp = e.target.closest('[data-nlstep]');
  if(sp){ NLAB.forge.step = sp.dataset.nlstep; nlFilt = 'All'; renderNenLab(); return; }
  const st = e.target.closest('[data-nlset]');
  if(st){ const F = NLAB.forge, k = st.dataset.nlset, v = st.dataset.v;
    nlSfx(e.clientX, e.clientY, k === 'vow' ? 'SIGN!' : undefined);
    if(k === 'vow'){ F.vows = F.vows || []; if(F.vows.includes(v)) F.vows = F.vows.filter(x => x !== v); else if(F.vows.length < 2) F.vows.push(v); F.vowSet = true; renderNenLab(); return; }
    F[k] = v || null; if(k === 'eff') F.effSet = true;
    if(k === 'el'){ if(F.eff){ const c = NEN_C.find(x => x[0] === F.eff); if(c && !nlEffOk(c, v)){ F.eff = null; F.effSet = false; } } if(F.nm && F.nm.pat && !F.typed) F.alias = nlComposed(F); }
    F.step = nlNext(k); if(F.step === 'eff' && F.effSet) F.step = F.vowSet ? 'name' : 'vow';
    nlFilt = 'All'; setTimeout(() => { renderNenLab(); const s = document.querySelector('.nl-strip'); if(s && s.getBoundingClientRect().top < 0) s.scrollIntoView({block: 'start'}); }, 180); return; }
  const b = e.target.closest('[data-nl]'); if(!b || b.tagName === 'INPUT') return;
  const k = b.dataset.nl, F = NLAB.forge;
  if(k === 'start'){ NLAB.shared = false; if(location.hash.startsWith('#nen=')) history.replaceState(null, '', location.pathname + location.search); nlStartQuiz(); }
  else if(k === 'forge' || k === 'back'){ NLAB.stage = 'forge'; }
  else if(k === 'card'){ NLAB.stage = 'card'; }
  else if(k === 'vowdone'){ F.vowSet = true; F.step = 'name'; }
  else if(k === 'spin'){ nlSpin(); return; }
  else if(k === 'locka' || k === 'lockn'){ F.nm[k === 'locka' ? 'la' : 'ln'] = !F.nm[k === 'locka' ? 'la' : 'ln']; }
  else if(k === 'pat0' || k === 'pat1'){ F.nm.pat = k === 'pat1' ? 1 : 0; F.typed = false; F.alias = nlComposed(F); }
  else if(k === 'finish'){ const a = $('nlAlias'); if(a && a.value.trim()){ F.alias = a.value.trim(); F.typed = true; } if(!F.alias) F.alias = nlComposed(F); NLAB.stage = 'card'; NLAB.done = true; }
  else if(k === 'png'){ nlPng(); return; }
  else if(k === 'link'){ const u = nlLink(); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => nlMsg('Link copied. Anyone who opens it sees this card.'), () => nlMsg(u)); return; }
  else if(k === 'share'){ const R = nlCompute(), u = nlLink(), text = `My Hatsu: ${R.alias || R.name} (${NLAB.type}). What's yours?`; if(navigator.share) navigator.share({title: 'My Nen', text, url: u}).catch(() => {}); else (navigator.clipboard ? navigator.clipboard.writeText(text + ' ' + u) : Promise.reject()).then(() => nlMsg('Copied. Paste it to your friends.'), () => nlMsg(text + ' ' + u)); return; }
  else return;
  if(NLAB.stage === 'forge' && !NLAB.forge) NLAB.forge = {step: 'el', el: null, form: null, eff: null, vows: [], alias: '', wide: false};
  const keep = /^(lock|pat)/.test(k);
  renderNenLab(); if(!keep) window.scrollTo(0, 0);
});
document.addEventListener('input', e => {
  if(e.target.id === 'nlSearch'){ nlFilter(); return; }
  if(e.target.id === 'nlAlias' && NLAB.forge){ const F = NLAB.forge, v = e.target.value.trim(); F.typed = !!v; F.alias = v || nlComposed(F); const cv = $('nlCover'); if(cv) cv.textContent = F.alias; nlNameSync(); nlSave(); }
});
document.addEventListener('change', e => { if(e.target.dataset && e.target.dataset.nl === 'wide' && NLAB.forge){ NLAB.forge.wide = e.target.checked; nlFilt = 'All'; renderNenLab(); } });

