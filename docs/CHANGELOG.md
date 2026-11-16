# Changelog (the site and its machinery)

The AI's changes to the games are logged separately in `data/changes.json` (the evolution page).

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
