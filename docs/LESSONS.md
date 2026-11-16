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
