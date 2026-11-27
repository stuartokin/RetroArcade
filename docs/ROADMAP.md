# Roadmap

## Decisions (with dates)

- **16 Nov 2026**: built as its own repo; ApolloMaths is never changed from here. Original = the
  ApolloMaths Classic look without avatars; football touches and Invaders' maths bonus round kept.
- **16 Nov 2026**: weekly run on Sundays at 05:17 UTC; changes go live automatically when the rule
  check and full rig pass, otherwise they wait in a PR. Budget $10 a run, 150 steps. Nudge towards a
  new game after 4 runs without one; the AI decides.
- **16 Nov 2026**: the AI's conditions are `ai/BRIEF.md` + `tools/evolve/guard.mjs` + `tests/check.js`.
  Any change to them is logged here with a date, because it changes the experiment.

- **16 Nov 2026**: home page as a one-screen app with Tiles/Carousel switch; log and help in ⋮ windows.
- **16 Nov 2026**: run 1 (AI: Super Snake → garden game) went live; cost $1.04, 31 steps, 10 min.
  It published straight to `main` because Actions may not open pull requests yet (see below).

- **16 Nov 2026**: search matches names and descriptions only: no commercial game names anywhere
  (Stuart). AI brief: don't mention commercial titles on the site. (An `inspired_by` field was added and
  removed the same day.)
- **16 Nov 2026**: moving previews (recorded clips) instead of stills; the AI version plays on the
  home page, the original plays in the log.
- **27 Nov 2026**: `tests/check.js` timing fixes (wait for the intro to draw and up to 2 s for a start;
  ignore aborted video downloads). This changes the AI's conditions only by removing two false failures
  that held back run 4; every check asks the same of the games as before.
- **27 Nov 2026** (Stuart): a new game every month (first Sunday's scheduled run), also available by hand.
  New-game runs: 250 steps and $15, a 2–3 idea pitch shown in the log, and they must deliver a game.
  **No game is ever retired** to make room; the home page scrolls instead. This changes the AI's
  conditions (`ai/BRIEF.md`, `guard.mjs`, `tests/check.js`).
- **27 Nov 2026** (Stuart): **no retiring, ever.** Brief and rule check changed (AI conditions).
- **27 Nov 2026**: run 5 published by hand after its merge was blocked by pushes to `main` during the run;
  the publish step now rebuilds a run onto the latest `main` itself.
- **27 Nov 2026**: run 4 published by hand after the fix (Stuart chose "publish"); PR #3 closed by the
  push. If a run is held back by a rig fault again, the same recipe works: KNOWLEDGE → evolve.

## Open / waiting on Stuart

- [x] `ANTHROPIC_API_KEY` secret (done 16 Nov).
- [x] Settings → Actions: "Allow GitHub Actions to create and approve pull requests" (Stuart, 16 Nov; first
      confirmed by the next AI run having a pull request).
- [x] Pages on (done 16 Nov).
- [ ] Optional: repository variable `EVOLVE_MODEL` to pin the model (unset = Claude Code's default).

## Next

- [ ] Stuart to try: run 4 (music, options panel, left-handed controller on the Fold) and run 5 (Planet
      Guardian); the log entries for both.
- [x] Watch the Sunday runs: pull requests open and merge, clips re-record, costs well inside the cap
      ($1.04–2.50 a run so far). Two runs were held back on 27 Nov, both by our side (rig flakes, then a
      push during the run); both fixed and published.
- [ ] Watch the first monthly new-game run (Sun 6 Dec 2026): does it pitch, finish a game inside 250
      steps / $15, and do the new tile, preview and log entry look right?
- [ ] Don't push to `main` while an evolve run is going (the publish step copes now, but it's cleaner).
- [ ] Review cost and log quality after run 8 or so; adjust budgets.
- [ ] An old commit message (1.2.0) mentions a commercial game name. Left as it is (only in the history);
      rewriting `main` would need Stuart's say-so.
- [x] Card on HorizonQ Observatories ("Just for fun"), with a trailer (16 Nov 2026).

## Parked ideas

- A monthly "digest" entry that the AI writes looking back over its own changes.
- A side-by-side player (original and enhanced in one screen).
