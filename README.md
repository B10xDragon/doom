# VOID STATION

An original retro space-station FPS for PC and iPad. Recover access cards, disable hostile machines, restore two relays per sector, and reach the evacuation airlock.

## Play on GitHub Pages

1. In this repository, open **Settings → Pages**.
2. Set the source to **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
3. Once publishing completes, open **https://b10xdragon.github.io/doom/**.

There is no installation, account, build, CDN, or runtime dependency. All URLs are relative, so the game works under the `/doom/` project path. The files must be served over HTTP(S); opening the HTML directly with `file://` will not load its JavaScript modules reliably.

## Controls

| Action | PC | iPad / touch |
| --- | --- | --- |
| Move | W/A/S/D | Left thumbstick |
| Turn / aim | Mouse; left/right arrows | Drag the right side |
| Fire | Hold left mouse button or Space | Hold FIRE |
| Use door / relay / exit | E | USE |
| Change weapon | 1 / 2 / 3 or Q | SWAP |
| Sprint | Shift | — |
| Automap | Tab or M; MAP button | MAP button |
| Pause | Escape; PAUSE button | PAUSE button |

Click **ENTER STATION** to start and enable sound. On PC the game requests mouse capture; Escape releases it. If capture is unavailable, drag the scene to aim, use the arrow keys, and use Space to fire. Audio and fullscreen are optional and fail safely when unsupported.

### iPad

- Landscape gives the widest useful view, but portrait remains playable.
- Movement, aiming, firing, and the USE/SWAP buttons accept independent simultaneous touch pointers.
- Game controls use pointer capture and `touch-action: none`, avoiding accidental scrolling and double-tap zoom while playing. Menus retain normal browser zoom accessibility.
- No App Store download is needed. Touch controls turn on automatically and can also be enabled in settings.
- Choose **Classic** resolution if an older device struggles. Balanced and Sharp are available for faster devices.
- Losing focus, switching tabs, or leaving mouse capture pauses the game. Pointer cancellation clears held actions.

## Campaign

Ten authored sectors share a consistent station access scheme, with different orientations, interior cover, enemy populations, and a final Core Titan encounter:

1. **Docking Array:** acquire the blue access card in storage, enter security, recover red access, restore both relays, and reach the airlock.
2. **Research Deck:** navigate altered corridors and additional security units with your recovered equipment.
3. **Reactor Heart:** restore power and disable the Warden before evacuation.
4. **Cryo Vaults:** navigate frozen storage and restart navigation.
5. **Orbital Forge:** cross the manufacturing ring under heavier pressure.
6. **Signal Cathedral:** follow the strange transmission through the antenna maze.
7. **Helios Array:** reroute power across the defense lattice.
8. **Null Archive:** recover the station memory.
9. **Ascension Ring:** cross the final security perimeter.
10. **Command Core:** survive the Core Titan's three phases, burst attacks, and reinforcements, then evacuate.

There is a secret supply room in each sector. Investigate loose wall panels with USE. The automap only reveals explored areas and marks discovered keys, relays, and the exit.

**Pulse Driver:** unlimited energy, moderate damage. **Arc Scatter:** short-range multi-shot burst consuming arc charges. **Plasma Lance:** rapid energy projectiles consuming cells. Empty weapons fall back to the pulse driver. Supplies and recovered weapons carry to the next sector, with a minimum suit/shield refill.

Difficulty changes incoming damage. Explorer is more forgiving; Marine is the default; Veteran is more punishing. Aim sensitivity, resolution, audio, reduced motion, and touch controls are configurable. Reduced motion disables weapon bob, recoil motion, and pickup bobbing.

## Saving

The game stores an entrance checkpoint for the current sector in this browser's local storage, plus settings. **Continue Campaign** restarts at that entrance; it is not a mid-fight save. Retry restores the exact entrance loadout. Sector transitions replenish supplies once. Storage failures never prevent play; in private/restricted contexts progress may not persist.

## Structure

| Location | Responsibility |
| --- | --- |
| `index.html` | Shell, menus, HUD, accessible controls |
| `styles/game.css` | Responsive landscape/portrait layouts and touch surfaces |
| `src/main.js` | Application lifecycle, settings, HUD and sector transitions |
| `src/world.js` | Movement, collision, combat, pickups, AI and progression |
| `src/levels.js` | Sector geometry, access gates and object placement |
| `src/renderer.js` | Pixel-buffer raycasting, floor/ceiling perspective, sprites, weapons and map |
| `src/art.js` | Original procedural wall textures, robotic sprites and weapon assets |
| `src/input.js` | Keyboard, pointer lock, touch controls and cancellation |
| `src/audio.js` | Original synthesized SFX and ambient sequence |
| `src/save.js` | Checkpoint schema validation and exact entrance restoration |
| `assets/` | Site icon |
| `tests/` | Dependency-free Node tests for progression, combat, input, saving and application lifecycle |

## Development and validation

Serve the repository with any static HTTP server. For example, with Python installed, run `python3 -m http.server 8000` here, then visit `http://localhost:8000` on that computer. No package installation is required.

With Node installed, run:

```sh
node --test tests/*.test.mjs
```

Tests verify sector reachability in keycard order, placement, door access, collision and visibility, weapon damage and ammunition, shield handling, exit conditions, sector carryover, checkpoint validation, simultaneous touch input, asset paths, and the app lifecycle when optional browser services fail. Rendering has also been inspected using a CPU canvas implementation in desktop and portrait sizes. Physical iPad Safari, real mouse capture, fullscreen and audio-device behavior still need device verification.

## Scope

This is an original Doom-era-inspired shooter, not a port of Doom or a recreation of its engine. It uses grid-based raycasting with a fixed camera height, not Doom's sector/BSP renderer: there are no stairs, elevators, variable-height sectors, jumping or vertical aiming. All maps, code, pixel assets, SFX and music here are original. No Doom WADs, sprites, maps or soundtracks are included. Combat uses robots and energy effects, without gore.
