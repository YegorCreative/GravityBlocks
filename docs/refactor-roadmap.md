# GravityBlocks Modular Refactor Roadmap

This roadmap keeps the current game playable while splitting monolithic logic into focused modules.

## Goals
- Keep behavior identical during refactor.
- Reduce single-file complexity in `js/game.js`.
- Make mobile tuning and feature work easier.

## Proposed Structure

```text
js/
  game.js                 # Entry/bootstrap only
  core/
    state.js              # State creation and reset
    loop.js               # Game loop timing
    collisions.js         # Collision checks and movement constraints
    pieces.js             # Piece generation, hold, spawn
    scoring.js            # Score/line/level/power math
  render/
    board.js              # Main canvas rendering + cached background layer
    overlays.js           # Pause/game-over/line-flash overlays
    previews.js           # Hold/next queue rendering
  ui/
    hud.js                # HUD updates and value bump effects
    controls.js           # Keyboard and mobile controls
    settings.js           # Toggles and persisted settings
  platform/
    storage.js            # localStorage wrappers and migration keys
    audio.js              # SFX and haptics
    viewport.js           # fitStage and viewport event scheduling
```

## Migration Steps
1. [x] Extract `platform/storage.js` and route all storage reads/writes through it.
2. [x] Extract `platform/viewport.js` and keep `fitStage` behavior stable.
3. [x] Extract `platform/audio.js` with current SFX/haptic API.
4. [x] Extract `render/board.js` and `render/previews.js` (no behavior changes).
5. [x] Extract `core/scoring.js` and `core/pieces.js`.
6. [x] Move controls/HUD/settings into `ui/*` modules.
7. [ ] Keep `js/game.js` as an orchestrator only.

Status: Steps 1-6 are complete on `main`; Step 7 is the remaining cleanup/orchestration pass.

## Safety Rules
- Refactor one module at a time.
- After each extraction, run manual smoke checks:
  - intro -> play transition
  - keyboard controls
  - mobile controls
  - hold/next rendering
  - line clear scoring and level progression
  - pause/settings toggles
  - game over + restart

## Definition of Done
- `js/game.js` only wires modules.
- No duplicated storage or viewport helpers.
- Rendering logic isolated from input and scoring logic.
- Existing gameplay behavior remains unchanged.
