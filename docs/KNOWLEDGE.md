# Retro Arcade — knowledge base

## 1. What it is

A static site (GitHub Pages, `main`, repo root) with eleven original arcade games in two versions:

- **Original** (`original/`): frozen. The games as copied out of the ApolloMaths secret arcade on
  16 Nov 2026, with the Classic look:
  - the child's avatar head removed (`AVH()` is a stub)
  - no time limits, family rules or maths-app links
  - the football touches and Invaders' mental-maths bonus round kept (Stuart's choice)
- **AI-enhanced** (`enhanced/`): started identical. Changed only by the weekly AI run, which has free
  rein: it can polish, rework, modernise, rename, retire or invent games.

The point is the record. Each run is logged, explained, photographed and archived, so anyone can see
what the AI did, when, and why, and play any past week's version.

## 2. Files

| Path | What |
|---|---|
| `index.html` + `assets/home.js` | Home: stats strip, one tile per game (▶ Original / ✨ AI version, "last changed…") |
| `evolution.html` + `assets/evolution.js` | The log: runs newest first, chips to filter by game, before → after pictures, links to the past version, PR and run log |
| `assets/common.js`, `assets/site.css` | Shared loader (games lists, log, version), next-run date, styles |
| `original/` | `play.html` (one page plays any game: `?game=id`), `js/host.js` (shell), `js/retro.js` (pixel toolkit), `js/games.js` (all 11 games), `css/play.css`, `games.json` |
| `enhanced/` | The AI's copy: same layout to begin with; the AI may restructure it |
| `archive/run-NNN/` | Playable snapshot of `enhanced/` after each run |
| `media/runs/NNN/<game>.jpg` | Pictures taken after each run (run 000 = the start) |
| `data/changes.json` | The log (one entry per run). Written by the workflow, never by hand |
| `ai/BRIEF.md` | The AI's standing brief (humans only) |
| `ai/JOURNAL.md` | The AI's notebook between runs |
| `ai/RUN-REPORT.json` | The latest run's report (AI writes it; the workflow copies it into the log) |
| `tools/evolve/` | `prepare.mjs` (run number + prompt), `guard.mjs` (rule check), `finalise.mjs` (log, archive, pictures, PR text), `narrate.mjs` (readable Actions log) |
| `tools/shots.js` | Pictures of games a couple of seconds into play |
| `tests/check.js`, `tests/serve.js` | The test rig and a tiny static server |
| `.github/workflows/evolve.yml` | The weekly run · `tests.yml`: rig on every push to `main` |
| `automation.json` | Kill switch |
| `version.json` | Site version + latest AI run (shown in footers) |

## 3. The player shell (`host.js`)

- One page plays any game (`play.html?game=id`). It sets up the canvas and the controls:
  - keys: arrows/WASD, Space/Enter fire, B/X/Shift extra, P/Esc pause
  - on-screen pads on touch screens: below the game when upright, either side when sideways
  - swipe/drag where a game supports it
- Also handles sound (beep, noise, engine tone), pause, full screen, the game-over card and a top-5
  table per game. The table is in `localStorage`, under `retro:<side>:<id>:scores`.
- Contract (also in `ai/BRIEF.md`):
  - `window.ARCADE={ready,side,game,state()}`
  - starts on Space/Enter or a tap
  - never wider than the screen
- `HOME` (the back link) is worked out from the URL, so copies in `archive/` link back to the home page.
- Games are `GAMES[id](env)`, returning an object with:
  - `{W,H,score,lives,level,levelName,over,update(dt,inp),render(ctx)}`
  - optional `tap`, `swipe`, `pointer`, `onPointer`, `onKey`, `onPause`
  - `env` gives `beep`, `noise`, `engine`, `hi()`, `store`, `touch`

## 4. Game lists (`games.json`)

`{side,label,run?,games:[{id,name,icon,desc,play,origin:"classic"|"ai",born?}]}`. The home page and
the rig read these. Ids are permanent: the history is keyed on them.

## 5. The weekly run (`evolve.yml`)

- **When:**
  - Sundays at 05:17 UTC
  - or by hand from the Actions tab, with inputs: focus (`ai-decides` / `one-game` / `all-games` /
    `new-game`), game, a note to the AI, budget (USD, default 10) and max steps (default 150)
- **Steps:**
  1. **switch**: the kill switch.
  2. **prepare**: run number, and a prompt made of `ai/BRIEF.md` plus this run's task. If 4+ runs
     have passed since the last new game, the AI is nudged to consider one.
  3. **AI**: Claude Code, headless: `claude -p … --max-turns --max-budget-usd
     --dangerously-skip-permissions`, with model `vars.EVOLVE_MODEL` if set. The checkout has no git
     credentials, so the AI can't push. Its transcript is kept as a run artifact for 90 days.
  4. **guard**: only allowed paths changed; the report is valid and matches the games; nothing links
     outside `enhanced/`; under 20 MB.
  5. **tests**: the full rig.
  6. **finalise**:
     - stamps `enhanced/games.json` with the run number and `?v=rN` on assets
     - copies to `archive/run-NNN/` and takes pictures of the changed games
     - adds the log entry (with cost, steps, minutes and links) and updates `version.json`
  7. **publish**:
     - one squashed commit on `ai/run-NNN`, then a PR labelled 🤖 AI-maintained
     - adds the PR link to the entry, then auto-merges, then requests a Pages build
     - if PRs from Actions aren't allowed, it pushes straight to `main`
- **If the guard or tests fail:** the branch is pushed and a "⚠️ failed checks" PR is opened for
  Stuart. Nothing goes live and the log is not changed.
- **Cost:** API use only, capped by `--max-budget-usd` (default $10 a run).
- **Needs:**
  - the `ANTHROPIC_API_KEY` secret
  - Actions permissions: read and write, plus "Allow GitHub Actions to create and approve pull
    requests" (preferred; otherwise it falls back to pushing to `main`)
  - Pages: deploy from `main` / root

## 6. Test rig (`tests/check.js`)

- **Devices:** laptop 1440×900, phone 390×844, Fold folded 344×882, open 884×1104, sideways 882×344,
  iPad 820×1180, Stuart's 1908×950, QHD and 4K.
- **Pages:** home and log on every device: one tile per game, links work, not too wide, no errors.
- **Games:**
  - every game on laptop, phone and folded Fold
  - on the other devices, all enhanced games and a rotating quarter of the originals
- **Checks for each game:**
  - opens; `ARCADE.ready`; the game area is on screen and at least 15% of it
  - starts from a tap (with a wobble) or a key
  - played with keys and pads for ~2 s: the picture moves, isn't blank, no overflow, no errors
- **Results:** in `tests/out/last-run.txt`.

## 7. History

See `docs/CHANGELOG.md` (site) and `data/changes.json` / the evolution page (AI runs).
