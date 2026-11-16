# CLAUDE.md — read this first

This repo is **Retro Arcade** (`stuartokin/RetroArcade`, live at https://stuartokin.github.io/RetroArcade/):
eleven original retro arcade games, each with two versions. **Original** is frozen; **AI-enhanced** is
changed every week by an AI agent with free rein, and every change is logged, photographed and archived.
It is an experiment to see what an AI does to the games over time. Static GitHub Pages site, no build step.

> **If you are the weekly evolve agent** (started by `.github/workflows/evolve.yml`): your brief is
> `ai/BRIEF.md` and this run's details are in your prompt. Follow those, not the human working routine
> below. Never commit or push.

Start every human-led session by reading, in order:

1. this file
2. [`docs/KNOWLEDGE.md`](docs/KNOWLEDGE.md): how everything works, file by file
3. [`docs/LESSONS.md`](docs/LESSONS.md): what went wrong before and why
4. [`docs/ROADMAP.md`](docs/ROADMAP.md): what is open, decided or parked
5. the latest entry in [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## Golden rules

1. **Humans don't edit `enhanced/`.** It belongs to the AI; changing it by hand spoils the experiment.
   Fix site, shell or test problems in `original/` (the frozen copy) only if they are real bugs, and
   say so in the CHANGELOG. Never edit `archive/`, `media/runs/` or past entries in `data/changes.json`.
2. **The AI's contract** lives in `ai/BRIEF.md`, `tools/evolve/guard.mjs` and `tests/check.js`.
   Change them together and record the date in ROADMAP, because they change the experiment's conditions.
3. **Run the test rig before every push**: `node tests/check.js` (all must pass; `--quick` while working).
4. **Look at the result**: `node tools/shots.js --dir=enhanced --out=tests/out/look` and view the pictures.
5. **The page must never be wider than the screen**; touch must work (see LESSONS).
6. Self-hosted: no CDNs. Google Fonts (Press Start 2P) is the only external stylesheet, home and log pages only.
7. **ApolloMaths is never changed from here.** The games were copied out of it once (16 Nov 2026).

## Quick recipes

| Task | Do this |
|---|---|
| Look at it locally | `npm run serve` → http://localhost:8820/ |
| Test everything | `node tests/check.js` (≈ 8 min) · `--quick` · `--side=enhanced` · `--games=maze` · `--url=https://stuartokin.github.io/RetroArcade/` |
| Start an AI run by hand | GitHub → Actions → *Evolve the games* → Run workflow (choose focus, game, note, budget) |
| Pause the weekly run | `automation.json` → `"paused": true` (or the master in stuartokin.github.io) |
| Choose the AI model | Repository variable `EVOLVE_MODEL` (Settings → Secrets and variables → Actions → Variables). Unset = Claude Code's default |
| Change the home page / log | `index.html`, `evolution.html`, `assets/` (bump `?v=` and `version.json`) |

## Setting up (any machine)

```bash
npm install                     # Playwright 1.63.0
npx playwright install chromium # skip in a Claude cloud sandbox: Chromium is pre-installed
node tests/check.js --quick
```

## Working standard (all of Stuart's repos)

**Stuart** owns this. British English; short, plain replies. He does not read or edit code:
you make every change, test it, push it, and tell him what to check. Plan first for big
things; when he says "go ahead", build without further proofs.

**Personal capacity.** Never name his employer or job title anywhere: pages, docs, commit
messages, articles. Byline: *Stuart Okin*. Where a disclaimer is needed: *"Written in a
personal capacity and do not represent the position of any organisation I am engaged with."*
Citing an organisation as a source is fine.

**Delivering changes.** Commit and push straight to `main` yourself. Don't send zips or ask
him to upload; older instructions in this repo that say so are superseded. Before anything
major (deleting or restructuring, rewriting a core file, changing workflows or agents,
migrating data) push a backup tag first:
`git tag backup/YYYY-MM-DD-<what> origin/main && git push origin backup/YYYY-MM-DD-<what>`.
To undo, reset `main` to that tag; say in your reply that a backup exists. Never commit
secrets: keys live only in GitHub secrets.

**Tests.** Run the repo's tests before every push; all must pass. Fix a bug, add a check so
it stays fixed. If the repo has no tests yet, add at least a smoke test the next time you
change it.

**Automation.** Any workflow that runs on its own (schedule, issues, comments, other
workflows) must start with the kill-switch `switch` job, reading `automation.json` here and
the master in stuartokin.github.io (see its docs/KNOWLEDGE-BASE.md §15). Don't add an AI
agent without saying what it costs, what it can change and how to switch it off.

**"Wrap up".** When Stuart says "wrap up", and before you finish any session that changed
something:
1. Run the tests; fix or report any failure.
2. Update the docs: how the app works (knowledge base or handover), `LESSONS` (what went
   wrong or surprised you), `ROADMAP` (done, next, open questions for Stuart, decisions with
   dates) and `CHANGELOG` (bump the version if the app changed). Create them if missing.
3. If a lesson would help the other repos, add it to `docs/SHARED-LESSONS.md` in
   stuartokin.github.io.
4. Commit and push to `main` (backup tag first if major). Check the deploy or workflow run.
5. Reply with what changed, the version, what was and wasn't tested, a short numbered list of
   things for Stuart to try, and anything waiting on him.

A new session must be able to carry on from the repo alone. If it couldn't, the wrap-up
isn't done.
