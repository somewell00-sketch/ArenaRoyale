# Arena Royale

A Hunger Games–style survival simulator that runs in the browser. You are one tribute in the arena; everything is told through the map, your body and short lines of story — no numbers.

Open `index.html` (or `arena.html`) with a double-click. No server needed; keep the `bg/` folder next to it.

## The new game (`index.html`)
- **Setup:** pick your district (each district sets starting Strength, Dexterity and Perception; you can still adjust them), arena size and number of tributes.
- **Arenas:** 70% are themed (Himani, Sahari, Mayu…) with one dominant biome; the rest are Survival Arenas. Every area has a personality (exposed, sheltered, scavenged, quiet), biome risks (heat, cold, flooded, fumes, loose ground), structures (Safe Cave, Oasis, Fruit Tree, Abandoned Shelter) and Gamemaker mutts.
- **Day rhythm:** morning, afternoon, evening — each action spends one — then night: cannons and faces in the sky.
- **Body-driven guidance:** one line tells you what matters now; hovering an action shows what it will cost.
- **The Cornucopia:** loot in three rings (at your feet / on the way in / at the horn) with rising risk; sealed packs; leftovers for later days. Items come from the real catalogue (swords, bows, shield, camouflage, nets, unlabelled flasks…).
- **A living arena:** every tribute is on the map. They move each part of the day, scavenge, flee closing ground and fire, and fight each other using the classic engine's rules (district bias, Careers' soft alliance, aggression by district, weapons). Cannons come from real deaths; what you sense (footsteps, voices) is who is really there.
- **Tributes:** real names by district, your district partner, Careers (districts 1–4) who hunt as a pack, alliances (allies walk with you and share the danger), warning signs and betrayal — both ways: tap an ally to part ways or turn on them, or slip away / strike at night. A tribute list shows who is alive and what you know about them.
- **Sponsors:** the audience rewards surviving and boldness (kills, betrayals); a silver parachute brings what you need most.
- **Items:** RPG-style icons; the slot colour tells the type at a glance (weapons red, food and water green, medicine blue, gear amber, packs brown).
- **Mutts with personalities:** hunters follow your scent and blood, stalkers stay hidden until a good eye spots them, ambushers wait in place, brutes hold their ground, skittish ones raid your food at night. Hunters warn you before they come; any of them may find you at night unless you sleep under cover.
- **Nerve pays, hiding costs:** hiding tires you and wears out a spot; running can cost you food or gear; catching someone unaware gives you the first strike; beating a tribute means taking their weapon or pack. Hide too long and the Gamemakers send something your way. Once, a feast at the Cornucopia draws everyone in. Sponsors reward boldness. With four or fewer left, the arena closes every night.
- **Low health:** the screen's edge throbs with your pulse.
- **Events:** storm, fog, fire or scarcity, announced by the Capitol.
- **The arena closes:** from day 3, every two days, the outermost areas are marked (four, or more on big maps) and vanish the next day. Anyone still there dies. The Cornucopia never closes.
- **Endings:** a death screen with your story and how the games ended, or the victor screen, plus a recap of how every tribute fell.

Source: `play/template.html` + `play/arena.js`. Rebuild with `node tools/build-play.mjs` (needs `node_modules/d3-delaunay`).

## The classic game
The original simulator (full NPC AI, combat engine, items and traps) is kept:
- `classic.html` — single file, double-click (rebuild: `node tools/build-standalone.mjs`)
- `classic-index.html` — module version for a local server
Engine files: `sim.js`, `ai.js`, `state.js`, `mapgen.js`, `mapui.js`, `items.js`, `app.js`.

The new game runs on its own engine in `play/arena.js`, which carries over the classic engine's rules (district and Career behaviour from `ai.js`, area closures and instant death from `sim.js`, item and creature data, biome hazards, area tags and special elements from `mapgen.js`/`state.js`).
