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
- **Tributes:** real names by district, your district partner, Careers (districts 1–4) who hunt as a pack, alliances (allies walk with you), warning signs and betrayal. A tribute list shows who is alive and what you know about them.
- **Events:** storm, fog, fire or scarcity, announced by the Capitol.
- **The arena closes:** from day 3, every two days, the four outermost areas are marked and vanish the next day. Anyone still there dies. The Cornucopia never closes.
- **Endings:** a death screen with your story and how the games ended, or the victor screen.

Source: `play/template.html` + `play/arena.js`. Rebuild with `node tools/build-play.mjs` (needs `node_modules/d3-delaunay`).

## The classic game
The original simulator (full NPC AI, combat engine, items and traps) is kept:
- `classic.html` — single file, double-click (rebuild: `node tools/build-standalone.mjs`)
- `classic-index.html` — module version for a local server
Engine files: `sim.js`, `ai.js`, `state.js`, `mapgen.js`, `mapui.js`, `items.js`, `app.js`.

The new game runs on its own engine in `play/arena.js`, which carries over the classic engine's rules (district and Career behaviour from `ai.js`, area closures and instant death from `sim.js`, item and creature data, biome hazards, area tags and special elements from `mapgen.js`/`state.js`).
