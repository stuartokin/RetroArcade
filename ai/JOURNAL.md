# AI journal

The AI's own notebook between weekly runs: what it considered, what it chose and why, ideas for later.
Newest at the bottom. Humans read this but don't edit it.

## Run 0 — 2026-11-16 (set-up notes, written when the arcade was created; not a weekly run)

The arcade starts here. `enhanced/` is an exact copy of `original/`:
- eleven games in one file, `enhanced/js/games.js`
- a shared pixel toolkit, `enhanced/js/retro.js`
- the player shell: `enhanced/js/host.js`, `enhanced/play.html` and `enhanced/css/play.css`

The games were written for a children's maths app and taken out with their classic look. Some
still have football touches: Invaders' penalty bonus round, Snake eats footballs, Pinball spells
GOAL. Invaders' bonus rounds include quick mental-maths questions.

Things a first run might notice:
- everything is drawn on a canvas, with a 5×7 pixel font
- sound is simple oscillator beeps, and there's no music
- scores are kept per device
- touch controls are on-screen buttons
- there's no two-player mode in this arcade, although Snake, Bricks and Block Drop have code for one

## Run 1 — 2026-11-16

**Plan (written before building).** I looked at all eleven games. Super Snake is the plainest: a
checkerboard, square blocks and an emoji football, and its football theme is a leftover from the
maths app. It is also the game where controls matter most, and quick double turns (e.g. up then
left within one step) are currently lost because only the last key is kept. So this run is one
game, done properly: Super Snake becomes a garden game.
- a turn queue so fast double turns always register
- fruit (drawn in code, several kinds worth different points) instead of footballs
- a ladybird bonus that crawls around and has to be chased, instead of a static star
- a smooth, tapered snake with a face, a garden lawn, and hedges for walls
- a fruit counter towards the next level

**What I did.** Built everything in the plan, all inside `makeSnake` in `enhanced/js/games.js`
(plus the description in `games.json`, the `GAME_LIST` entry and a `?v=2` cache bump in `play.html`). The lawn, wall and hedges are
painted once into an off-screen canvas and redrawn when the level layout changes. The snake is drawn
as tapered line segments through the interpolated cell centres, so it glides rather than jumps.
Direction input is now edge-triggered (a new key press queues a turn; reversing and repeats are
ignored), which also means holding a key no longer keeps re-asking for the same turn. I added a
`G._peek()` hook for test drives, alongside the existing `_clear`.

**Tested.** Quick and full rig (1,005 passed). Real key presses for the double turn; a greedy
autopilot driven through `GAMES.snake(env)` in the page reached level 9 in four minutes of game
time with no errors. Looked at the title, gameplay, phone layout, ladybird and hedge levels.

**Noticed.**
- The snake still resets to three segments every level (original behaviour), so it never gets
  long. A future run could keep the length, or make the level-up a "garden gate" you steer into.
- Scores are very big by design (an autopilot made over a million in four minutes).
- The ladybird is drawn a little larger than a cell, so on the edge column it overlaps the wall.
- Header title gets cut off ("Super ...") on a mid-width desktop window; that's the shell, not snake.
- Other football leftovers remain: Invaders' penalty bonus round and Pinball's G-O-A-L.

**Next.** Road Hopper or Brick Blaster for a similar polish, or shared background music.

## Run 2 — 2026-11-17

**Plan (written before building; Stuart asked for "control placement for fold").** I took full-page
pictures of the play page on the folded Fold (344×882), the open Fold (884×1104), the Fold on its
side (882×344), phones and an iPad. The touch buttons were the weakest part of the arcade:
- folded: the buttons were squeezed into the bottom corners and wrapped untidily (Planet Guardian
  had ◀ ▶ sitting above Bomb, with Fire on a line of its own), while a big empty gap sat above them;
- sideways: ◀ and ▶ were stacked on top of each other in the top-left corner, far from the thumb;
- open Fold / iPad: small buttons pushed into the bottom corners;
- movement was split oddly (Maze had ◀ ▶ on the left and ▲ ▼ on the right).
So this run rebuilds the touch controller in the shell, for every game:
- a real D-pad for movement that you can slide your thumb around (no lifting to change direction),
  with diagonals for Planet Guardian only;
- round action buttons in a thumb cluster, the main one larger and coloured;
- the shell works out, for each screen and game, whether the buttons go below the game or either
  side of it (whichever leaves the bigger game, leaning to "either side" when the screen is
  sideways) and sizes the buttons to the room that is left;
- a short "AI" badge on narrow screens so the game's name isn't cut off; a slimmer bar on short screens;
- a tiny buzz on each press on phones that support it.

**What I did.** Built everything in the plan, in the shell only (`enhanced/js/host.js`,
`enhanced/css/play.css`, `?v=r2` in `play.html`), plus a small Block Drop change in `games.js`.
- `CTRL` in `host.js` now says, per game, what goes on the D-pad (`'lrud'`, `'lrd'` or `'lr'`) and
  which action buttons go in the right-hand cluster (first one is the main button). The old `PADS`
  table in `games.js` is no longer used by the shell (left in place, harmless).
- The D-pad is one element: the direction is whichever button is nearest the thumb, so sliding
  works; the middle of a cross is a dead zone that keeps the last direction. Guardian has `diag`.
- `layout()` (called from `fit()`) measures the space, works out the game's size with the buttons
  below and with them either side, picks the bigger (sideways screens lean to "either side"), and
  sets `--b` (button size), `--colL`, `--sideW` and `--padH`. Body classes: `touch`, `at-bottom` /
  `at-sides`, `solo` (no action buttons: maze, snake, hopper).
- Block Drop: drifting, twinkling dust behind the well and a pulsing landing guide.

**Gotcha.** I first called the layout classes `side` and `bottom`. The page already has a `.side`
style (the "AI-enhanced" badge), so the whole page turned into a giant rounded badge with capital
letters. Renamed to `at-sides` / `at-bottom`. Check class names against `play.css` before using them.

**Noticed.**
- The rig's "picture is moving" check could catch Block Drop standing still between steps at
  level 1 (a piece falls every 0.8 s; the pictures are 350 ms apart). It used to pass partly by
  luck of button order. The new background motion fixes the real problem: the screen looked frozen.
- The full rig failed "Invaders @4k starts from a key press" twice (the untouched copy passed).
  Cause: `Retro.intro` only starts on a fresh press seen across two frames (`held` starts true), and
  on a 4K screen Space and Enter could both arrive before the first slow frame. Fixed in the shell:
  Space/Enter on a start screen calls `game.tap()` at once. Full rig then 1,255/1,255.
- On the folded Fold upright, wide games (Guardian, Meteor) still leave empty bands above and below
  the game: the screen is simply much taller than the game. The buttons are width-limited there.

**Next.** A left-handed swap (D-pad on the right) remembered per device, perhaps a choice of button
size. Then back to a game: Road Hopper or Brick Blaster polish, or shared background music.

## Run 3 — 2026-11-26

**Plan (written before building; no focus asked for).** Road Hopper has been on my "next" list twice
and, looking at it again, it is the plainest game left: flat rectangles for cars, brown bars for logs,
green circles for turtles, black boxes for homes and an emoji frog that jumps a whole square at once.
This run is one game, done properly, like Super Snake in run 1:
- a frog drawn in code that faces the way it hops and glides through a short hop with a stretch,
  instead of teleporting; a key pressed mid-hop is remembered, so quick taps are never lost;
- a proper scene: rippling river, grassy banks with flowers, lily-pad homes in a hedge, a road with
  kerbs; logs with bark and end rings, turtles with shells, heads and flippers that visibly dive;
  cars and lorries seen from above with windscreens and headlights;
- better deaths: a splash in the water, a flattened frog on the road;
- a "lady frog" who sometimes rides a log; carry her home for a bonus (instead of nothing new);
- the level's traffic shuffled a little each level so it isn't the same every time.

**What I did.** Built everything in the plan, all inside `makeHopper` in `enhanced/js/games.js`
(plus the description in `games.json` and `GAME_LIST`, and `?v=r3` in `play.html`).
- The frog is `frogShape()` (drawn facing up, rotated by `ANG[dir]`). `frog.x`/`frog.r` jump to the
  target at once and `frog.hop={fx,fr,p}` animates over `HOP` = 0.12 s. While in the air nothing can
  hit it; collisions run on landing. If the target row is river, both ends of the hop drift with it.
  A press during a hop goes into `frog.queued`.
- The still scene (hedge, banks, road, paving) is painted once into `bg`; ripples are drawn live.
- Lady frog: `lady={lane,item,o,walk,life}` rides a log for ~11 s; landing within ¾ of a cell picks
  her up (`frog.carry`); getting home with her is 3,000 × level; dying loses her.
- `build()` flips all lane directions together (50 %) and wobbles speeds ±10 % from level 2.
- `G._peek()` returns frog, lady and lane info for test drives.

**Noticed.**
- The first draw of logs had bark marks running past the cut end and the cars had a grey
  "headlight beam" that just looked like a smudge; both fixed after looking at the pictures.
- The lady frog can appear near the right end of a log and drift off screen before you reach her;
  that is fine (she comes back), but a future tweak could pick a log just coming on screen.
- Difficulty is unchanged at level 1; the shuffle only starts at level 2.

**Tested.** Quick rig 502/502; full rig 1,255/1,255 on a second run. The first full run had one
failure, a home-page preview video (`media/clips/original/racer.mp4`) that didn't load at 4K, while I
was running another browser at the same time; it is not part of `enhanced/`.

**Next.** Left-handed controller swap; then Brick Blaster polish or shared background music.
Remaining football leftovers: Invaders' "defend the pitch" bonus round and Pinball's G-O-A-L.

## Run 4 — 2026-11-27

**Plan (written before building; Stuart asked for something across all the games).** The arcade is
silent apart from beeps, and "shared background music" has been on my next list since run 1. The
left-handed controller swap has been on it since run 2. Both lift every game at once, so this run:
- **music for every game**: a small chiptune player in the shell (lead, bass and drums, scheduled on
  the Web Audio clock), and each of the eleven games gets its own original theme with its own tempo,
  key, mood and instruments. Music plays only while you are playing (not on the title screen, when
  paused or after game over) and speeds up a little as the levels go up;
- **an options panel** (⚙ in the bar, replacing the single 🔊 button so the bar doesn't get more
  crowded on a folded phone): sound effects on/off, music on/off, and on touch screens a
  left-handed controller (D-pad on the right) and a choice of button size. Choices are remembered on
  the device. Opening it pauses the game;
- the old mute setting is saved under a `retro:enhanced:` key, as the brief asks;
- the last football leftovers go: Invaders loses its penalty shoot-out bonus round and the
  "defend the pitch" description; Pinball's G-O-A-L lanes become S-T-A-R and the game becomes
  "Star Pinball".

**What I did.** Built everything in the plan.
- `enhanced/js/music.js` (new, loaded before `host.js`): `Music.SONGS` holds a recipe per game
  (bpm, root note, scale, chords for sections A and B, bass style, drum pattern, lead wave, arpeggio,
  seed). `compose(id)` turns it into 16 bars (A A B A'): three one-bar motifs from a seeded random
  generator, written as scale steps *relative to the chord*, so they follow the harmony; strong beats
  land on chord tones; bar 4 of each section is a cadence. Chords on degrees 4–6 are dropped an
  octave so the lead stays in roughly a two-octave range. `tick(ac,dest,id,playing,level)` is called
  every frame by the shell and schedules ~0.18 s ahead on the audio clock; tempo rises 2 % per level
  (up to 16 %). `jingle()` is the game-over tune. Music bus gain .55; measured RMS ≈ 0.017 against
  0.04 for a typical beep.
- `host.js`: options panel (`#opts` in `play.html`, styled in `play.css`), settings in
  `retro:enhanced:opt:*` (`sfxOff`, `music`, `lefty`, `bsize`), `getAC()` creates/resumes the audio
  context on any key or pointer press, M and N keys. Left-handed = `body.lefty` (CSS swaps the grid
  areas) and the action cluster is mirrored in `clusterHTML`; `handed()` excludes pinball. Button
  size multiplies `--b` (S .84, M 1, L 1.16), capped so it still fits.
- Invaders: `'penalty'` taken out of `KINDS` (its code is still there, unused). Pinball: GOAL → STAR,
  renamed Star Pinball in `games.json` and `GAME_LIST`.

**Noticed.**
- I can't hear the music, only measure it. I checked note ranges and loudness numerically and by
  counting oscillators in a real page; whether the tunes are *catchy* is for people to judge. If a
  theme grates, change its `seed` (a new melody) or its recipe; nothing else depends on them.
- Snake doesn't move until you choose a direction, so my "wait for game over" drive never ended.
- The options card on the Fold sideways (344 px high) only just fits; the note line is hidden there.

**Next.** Music that reacts (bonus rounds, last life, level clear jingle); then Brick Blaster.

**Tested.** Quick rig 502/502. The first full rig had one failure, a home-page preview video
(`media/clips/original/hopper.mp4`) that didn't load while I was running other browsers alongside,
the same thing as in run 3 and not part of `enhanced/`; the full rig run on its own passed
1,255/1,255.

## Run 5 — 2026-11-27

**Plan (written before building; Stuart asked for Planet Guardian only).** I took pictures of it and
read its code. It's the most bare-looking game left: a thin orange line for the ground, little
blocky sprites, a rainbow dash for the laser and a black sky. More important, its enemy line-up and
wording (lander, mutant, baiter, bomber, pod, swarmer, "humanoids", "attack wave completed", smart
bomb) follow one well-known commercial game almost word for word. The brief asks for original names,
so the game needs its own identity. Two bugs too: landers dive through the ground while they line up
on a person, and the stars jump when the camera wraps round the planet. Plan:
- **its own cast**: colonists who live in glowing domes; Grabbers (saucers with a tractor beam),
  Frenzies (what a Grabber becomes if it escapes with a colonist), Hunters (come if you dawdle),
  Seeders (sow spore mines), Hives (burst into Stingers); a Nova bomb;
- **everything drawn in code**: night-sky gradient, a ringed moon, far hills on a parallax layer,
  filled green hills with a bright ridge, crystals, colonists' domes (a dome goes dark when its
  colonist is lost), a sleek ship that tilts, flips and leaves an engine trail, a glowing laser,
  shock rings on explosions;
- **help for the player**: a siren and a flashing arrow at the edge of the screen when a colonist is
  being carried off out of sight, and blinking marks on the scanner;
- a slightly kinder start (longer safe time, slower enemy shots in the first waves); a new HUD and
  wave-clear screen; the bug fixes above.

**What I did.** Built everything in the plan, all inside `makeGuardian` in `enhanced/js/games.js`
(plus the description in `games.json` and `GAME_LIST`, and `?v=r5` in `play.html`). The game rules,
scoring, wave sizes and the internal type letters (`L M B O P S`) are unchanged; only the names on
screen changed (`NAME` table). Notes for later:
- Drawing is all paths now: `drawShip`, `drawGrabber`, `drawFrenzy`, `drawHunter`, `drawSeeder`,
  `drawHive`, `drawStinger` (through `drawEnemy`), `drawColonist`, `drawDome`, `scene()`. Glows use
  `glow()`, a cached radial-gradient sprite drawn with `'lighter'`; it keeps the caller's alpha (I
  first reset alpha to 1 inside it, which undid the ship's half-see-through flicker).
- Each colonist belongs to a dome (`homes[i]`, `p.home`) and wanders within 60 px of it.
- Parallax layers repeat at whole fractions of the planet's width (stars WW/4 at 0.25, far hills and
  big stars WW/2 at 0.5) so nothing jumps when the camera wraps. The moon drifts with `sin(camX)`.
- `e.wait` (5–10 s in waves 1–2, 1–4 s later) delays a Grabber's first grab. Grabbers, Seeders and
  Hives are kept 12 px above the ground. Hunters are capped at three.
- Respawn moves Frenzies, Hunters and Stingers within 420 px elsewhere: an autopilot that sat still
  showed Frenzies waiting at the respawn point and taking a ship every four seconds.
- `G._peek()` returns ship, enemies, colonists, `planetGone`, bombs and tally for test drives. You
  can drive the game off-screen with `GAMES.guardian(env)` in the page and set `G.lives=99`.

**Noticed.**
- The shield blink used to hide the ship completely half the time, so the log's picture (taken two
  seconds in) could show no ship at all. It now flickers half-see-through instead.
- A ship that doesn't move is still shot within about eight seconds. That's fair, so I left it.
- On the folded Fold upright, the game is small and there's a lot of empty space above it. Planet
  Guardian could show more sky on tall screens (a taller `H` chosen at start), but the HUD and
  banners assume 450, so that is a job for another run.

**Tested.** Quick rig 502/502, full rig 1,255/1,255, then Planet Guardian alone again after the last
drawing tweaks (455/455). Real key presses at 1000×700, the folded Fold and the Fold on its side; an
autopilot with extra lives through six waves without errors; looked at the title, play, off-screen
alarm, wave-clear and lost-colony screens.

**Next.** A taller view for Planet Guardian on upright phones; then Brick Blaster polish, or music
that reacts (last life, wave clear).
