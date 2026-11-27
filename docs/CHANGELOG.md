# Changelog (the site and its machinery)

The AI's changes to the games are logged separately in `data/changes.json` (the evolution page).

## 1.3.1 — 27 Nov 2026

- **Run 5 published** (Planet Guardian: its own cast, a living planet and a kidnap alarm). It passed every
  check, but its pull request couldn't merge because `main` moved on during the run (run 4's cost fix
  and 1.3.0 were pushed meanwhile, and both touched the log and `version.json`). Moved onto the latest
  `main` and re-tested with the full rig.
- **Publish step fixed for good:** if `main` has moved on by the time a run finishes, the workflow
  rebuilds the run on top of it (`tools/evolve/onto-main.mjs`): the run's files are kept, the log gets
  this run's entry added to main's, and `version.json` keeps main's version with the run's number.
- **No game is ever retired** (Stuart). The brief says so and the rule check rejects a run that
  removes a game; `retired_games` must be empty.

## 1.3.0 — 27 Nov 2026

- **A new game every month.** The scheduled run on the first Sunday of each month is told to create a
  new game; other Sundays the AI decides. By hand: focus `new-game`, as before.
- **More room for a new game:** new-game runs get 250 steps and $15 unless you type other numbers
  (blank budget/steps now mean "the default", 150 and $10 otherwise).
- **The pitch:** a new-game run starts with 2–3 one-line ideas and picks one; the log shows them
  ("The ideas it considered"). The rule check rejects a new-game run with no new game or no ideas.
- **Home page ready for many more games** (nothing retired): tiles keep filling one screen while they
  can, then scroll inside the page with as many columns as fit (7 on Stuart's 1908 window, 2 on a
  phone). The carousel swaps its dots for a "3 / 24" counter past 16 games. ⓘ panel says when the next
  run is a new game.
- Rig: "home with 51 games" checks on every device (40 pretend games).

## 1.2.3 — 27 Nov 2026

- **Run workflow → "game" box takes the game's name** ("Planet Guardian", any case, or a clear part such
  as "pinball") as well as its id. Two manual runs had stopped in seconds because "planet guardian"
  isn't the id (`guardian`). If nothing or more than one game matches, the run stops with a plain
  message listing the choices. The log entry records the id.

## 1.2.2 — 27 Nov 2026

- Rig fixes (test timing only; no change to what the games must do). Run 4 was held back by two false
  failures, neither in `enhanced/`:
  - **Original Invaders at 4K "didn't start from a key press".** The intro ignores a fire key that is
    already down on its first frame; on the slow CI machine the rig pressed before that frame. The rig
    now waits for the attract screen to draw, then allows up to 2 s for the game to act on the press.
  - **Home page "request failed: …/hopper.mp4".** Chrome cancels preview-video downloads part-way
    (`net::ERR_ABORTED`) when a video is paused or swapped. That is no longer counted as an error;
    any other failed request still is.
- **AI run 4 published by hand (Stuart's go-ahead, 27 Nov).** Its work (music for every game, an options
  panel with a left-handed controller) was untouched: rule check and full rig (1,725/1,725) re-run on it
  with the fixed rig, then `tools/evolve/finalise.mjs` did the usual log, archive, pictures and clips.
  Cost/steps/minutes in the log come from the run's own summary line ($1.53, 43 steps, 17 min).

## 1.2.1 — 16 Nov 2026

- Search no longer matches the names of commercial classics (Stuart: "a little too obvious"); names and
  descriptions only. The alias list and the AI's `inspired_by` field are gone, and the AI's brief now
  says not to mention commercial titles anywhere on the site.
- Wide games (Planet Guardian, 800×450) show whole at the top of their tile, card and log picture
  instead of a blown-up middle third.
- Rig: wide pictures are shown whole; search checks use our own game names only.

## 1.2.0 — 16 Nov 2026

- **Moving previews:** every game has a 6-second silent looping clip of it being played
  (`tools/clips.js`, an autopilot, about 15–85 KB each, `media/clips/<side>/<id>.mp4`, listed in
  `data/clips.json`).
  - **Tiles:** play while on screen.
  - **Carousel:** the front card plays.
  - **Reduced-motion setting:** gets stills.
  - **Evolution log:** shows the original playing next to each change's before and after pictures.
  - **Weekly run:** the workflow re-records clips of the games the AI changed (installs ffmpeg if missing).
- **Search in the title bar** (🔍 on phones):
  - matches names and descriptions
  - picking a result highlights the tile (the rest dim) or turns the carousel to it
- AI contract: the AI is told not to run `tools/clips.js`.
- Wording: "Retro arcade games" instead of "Eleven…", because more will come.

## 1.1.0 — 16 Nov 2026

- The home page is now a one-screen app (Stuart's request):
  - a slim top bar: logo, ⓘ (description, stats, byline), a two-icon **Tiles / Carousel** switch
    (remembered) and a ⋮ menu
  - **Evolution log** and **How it works** open as in-app windows from the ⋮ menu. They have their
    own addresses (`#log`, `#log/game=maze`, `#log/run-3`, `#how`); Back and Escape close them.
- **Tiles:**
  - sized to fill the whole screen on laptops, monitors, the open Fold and tablets, with no scrolling
  - each tile shows the game's latest picture
  - phones and sideways phones scroll in 2–3 columns with short button labels
- **Carousel:** a 3D ring of cards in CSS (no libraries), turned by drag, swipe, arrows, dots or keys.
- `evolution.html` now redirects to the log window; old `#game=` / `#run-` links still work.
- Rig: checks both views:
  - the page never scrolls
  - every tile fits on screen (bigger than a phone)
  - buttons aren't clipped
  - the carousel turns by button and drag
  - the windows open and close
- Fix (1.0.1, same day): the evolve workflow's publish step failed on `git add` of ignored folders
  (first AI run lost); it now also keeps the AI's work as a download if publishing fails.

## 1.0.0 — 16 Nov 2026

- First release:
  - eleven original games copied from the ApolloMaths arcade (Classic look, no avatars)
  - a standalone player shell
  - the AI-enhanced copy
  - home page, evolution log, test rig, weekly evolve workflow and kill switch
- Run 0, the starting line: pictures of every game in `media/runs/000/`.
