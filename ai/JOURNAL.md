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
