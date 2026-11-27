# Lessons

What went wrong or surprised us, so it doesn't happen twice. Newest at the bottom.
See also `docs/SHARED-LESSONS.md` in stuartokin.github.io.

1. **Shell heredocs can trip the sandbox's safety check.** Writing several files with `cat <<EOF`
   in one command was refused as "could not be checked". Write files with the file tool instead.
   (16 Nov 2026)
2. **Emoji and `::first-letter` don't mix.** Hiding a button's text with `font-size:0` and showing
   only the first letter left the pause button blank on phones. Use a separate `<span class="lbl">`
   and hide that. (16 Nov 2026)
3. **The AI must not hold git credentials.** The checkout uses `persist-credentials: false`, and the
   workflow commits after the rule check. Whatever the AI did with git, the workflow does a soft
   reset to the starting commit before committing. (design, 16 Nov 2026)
4. **`git add -A -- . ':!ignored-dir'` fails if the excluded folder is git-ignored.** Git treats
   naming an ignored path as an error, so the first AI run (16 Nov 2026) passed every check and was
   then lost at the commit step. Use plain `git add -A` and let `.gitignore` do the work. The
   workflow now also uploads the AI's work as a download if publishing fails. Test the publish step
   locally, not just the AI and check steps. (16 Nov 2026)
5. **Recorded clips need a per-game autopilot.** One generic key pattern made Snake circle on the spot,
   and Block Drop lost at once because Space hard-drops. `tools/clips.js` keeps per-game key plans, hold
   times and a no-fire list, and retakes when a game ends mid-clip. (16 Nov 2026)
6. **"pac" matched "space".** Substring search needs word-start matching first. Commercial game names
   were later removed from search altogether (Stuart). (16 Nov 2026)
7. **Wide games looked squashed in tall tiles.** Planet Guardian and Meteor Storm are landscape; `cover`
   cropped them to a blown-up middle third. They get `.wide` (`contain`), and the rig checks it.
   `.pic.wide` first lost to the more specific `.tile img.pic`. (16 Nov 2026)
8. **A huge carousel card needs a swipe rule.** On QHD and 4K a normal drag snapped back to the same
   card. Any clear swipe (40 px or more) now moves at least one card. (16 Nov 2026)
9. **Timing flakes on the CI runner hold back a whole AI run.** Run 4 (27 Nov) passed 1,723 checks and
   was held back by two false failures: a key pressed before a 4K game's first frame (swallowed by the
   intro's "key already held" guard), and Chrome aborting a preview-video download. Wait for a state
   change instead of a fixed pause, and only ignore the exact harmless error (`ERR_ABORTED` on video),
   not all failed requests. (27 Nov 2026)
10. **Inputs typed into "Run workflow" must accept what a person would type.** The game box wanted the
    id (`guardian`); Stuart typed the name twice and both runs failed with a developer error. Match
    names case-insensitively and fail with a plain list of choices. (27 Nov 2026)
11. **Pushing to `main` while an AI run is going blocks its merge.** Run 5 passed everything, then its pull
    request was "not mergeable" because two human pushes meanwhile had also changed `data/changes.json`
    and `version.json`. The publish step now rebuilds the run onto the latest `main`
    (`tools/evolve/onto-main.mjs`). Still best to avoid pushing during a run (Actions tab shows it). (27 Nov 2026)
