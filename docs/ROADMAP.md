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

## Open / waiting on Stuart

- [x] `ANTHROPIC_API_KEY` secret (done 16 Nov).
- [ ] Settings → Actions → General: tick "Allow GitHub Actions to create and approve pull requests"
      (run 1 had to publish straight to `main`, so it has no pull request to show the code changes).
- [x] Pages on (done 16 Nov).
- [ ] Optional: repository variable `EVOLVE_MODEL` to pin the model (unset = Claude Code's default).

## Next

- [ ] A card on HorizonQ Observatories (stuartokin.github.io) once a few runs have happened, with a
      demo video (the "before → after" story).
- [ ] After ~4 runs: review cost per run and the quality of the log; adjust the budget.

## Parked ideas

- A monthly "digest" entry that the AI writes looking back over its own changes.
- A side-by-side player (original and enhanced in one screen).
