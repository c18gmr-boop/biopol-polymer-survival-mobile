# Biopol Chain Reaction Mobile

Biopol Chain Reaction Mobile is the standalone touch-first build of the polymer survival game, packaged as an independent GitHub Pages site for phones and tablets.

## What This Build Includes

- A mobile-first layout sized for iPhone and iPad browsers
- Touch steering for the primary player
- Large `Turn left` and `Turn right` pads for one-handed play
- Swipe steering directly on the arena
- Configurable manual and CPU chain slots
- Extra CPU chains for more crowded matches
- Compact in-round layout that hides setup panels while a round is active
- Pause behavior that lets you scroll the page again on mobile
- Multiple arena layouts and score targets

## How To Run It

Open [index.html](./index.html) directly in a browser.

If you prefer serving it locally:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173`.

## Mobile Controls

### Touch Controls

- Swipe on the arena to steer `Chain 1`
- Tap `Turn left` to rotate left once
- Tap `Turn right` to rotate right once
- A single tap only turns once
- If you want two quick turns, tap twice

### Match Buttons

- `Start` begins a new match and resets scores for the selected target
- `Pause` pauses or resumes the current round
- `Restart` starts a fresh match immediately

### Paused Mobile Behavior

- During active play, arena touches are captured so the page does not scroll by accident
- When the round is paused, page scrolling is re-enabled
- This is meant to make portrait-to-landscape switching usable on phones
- You can pause, rotate the device, scroll to the arena and turn pads, then resume

## Chain Setup

### Default Mobile Setup

On touch devices, the default setup is:

- `Chain 1`: manual
- `Chain 2`: CPU
- `Chain 3`: CPU
- `Chain 4`: CPU
- `Chain 5-6`: off
- `Chain 7-12`: off unless enabled in `Extra Auto Chains`

This keeps the screen readable while still giving the player immediate opposition.

### Slot Modes

- Primary slots `Chain 1-6` can be set to `Manual`, `Auto`, or `Off`
- Extra slots `Chain 7-12` are CPU-only and can be set to `Auto` or `Off`
- On phones, `Chain 1` is the intended touch-controlled player

## Current Control Map

The mobile build is touch-first, but keyboard controls still work in desktop or hardware-keyboard browsers.

- `Chain 1`: swipe / turn pads, plus `W A S D`
- `Chain 2`: arrow keys
- `Chain 3`: `I J K L`
- `Chain 4`: `T F G H`
- `Chain 5`: `8 4 2 6`
- `Chain 6`: numpad `8 4 2 6`
- `Space`: start or pause/resume
- `R`: restart the match

## Spawn And Pathing Rules

### Opening Positions

The round starts from the outer playable lane, one grid cell inside the wall border.

- `Chain 1` starts in the top-left corner lane
- `Chain 2` starts in the bottom-right corner lane
- `Chain 3` starts in the top-right corner lane
- `Chain 4` starts in the bottom-left corner lane

These are opposite-corner pairings:

- `Chain 1` and `Chain 2`
- `Chain 3` and `Chain 4`

### Extra Chains

Additional chains fill edge-center positions after the first four corner starts.

- The next chains appear on the middle of the top, bottom, left, and right lanes
- Higher slots continue to fill additional edge-biased spawn points

### CPU Edge Preference

CPU chains are tuned to use the perimeter more aggressively when it is safe.

- They prefer moving toward the edge when space is available
- They try to stay on outer lanes longer instead of drifting inward immediately
- They still abandon the edge when a collision path becomes unsafe

## Layout Behavior

### Compact Play Mode

Once a round starts, the mobile layout hides nonessential setup panels so the arena and controls get more space.

- The hero panel is hidden
- The setup drawer is hidden
- The footer help panel is hidden
- The scoreboard remains visible
- The arena and touch controls remain visible

### Portrait Behavior

- Portrait play keeps the arena frame tight to the actual canvas
- The empty dead space below the arena has been removed
- Turn pads stack vertically on very narrow screens

### Landscape Behavior

- Landscape is supported during play
- If the page needs repositioning after rotation, pause first and scroll into place

## Arenas And Scoring

### Arenas

- `Open Reactor`
- `Catalyst Lattice`
- `Crosslink Grid`
- `Flow Reactor`

### Score Targets

- `3 points`
- `5 points`

The match ends when a chain reaches the selected score target.

## Notes

- The arena has a solid one-cell wall border
- Chains travel cell by cell and die on wall or trail collision
- The touch controls are intended for `Chain 1`
- If no chains are enabled, the match will not start
