# Starship Simulation — project instructions for Claude

## What this is

A modern reimplementation of *The Complete STAR SHIP: A Simulation Project* (Roger Garrett, ~1980). The book's stations, commands, and data are a **starting point, not a spec** — the game is expected to grow well beyond what's in the book. Don't treat the book as a constraint; treat it as inspiration and a source of period-appropriate flavor (station names, command syntax as a fallback, figure numbers referenced in code comments).

Repo: https://github.com/pcholt/starship-simulation (private). Bugs and follow-up work are tracked in GitHub Issues, not in this file or in memory.

## Layout

npm-workspaces monorepo:

- `packages/engine` — pure TypeScript domain/engine. No UI, no I/O, no framework. `createEngine()` returns `{ dispatch, getState, subscribe, tick, loadScenario, destroy }`. `Command`/`EngineEvent` are discriminated unions. State updates go through Immer (`produce`) and are frozen for runtime immutability.
- `packages/web` — SvelteKit frontend, one `*Station.svelte` component per bridge station (`Controller`, `Navigation`, `Sciences`, `Engineering`, `Helm`, `Medical`, `Communications`) under `packages/web/src/lib/components/<station>/`.
- `packages/server` — Node WebSocket host for multiplayer, wrapping the same engine package. One shared `Engine` instance per session; broadcasts full state after every dispatch/tick.
- `book/` — full Markdown transcription of the source book, kept for reference/proofreading only.

## Architecture rules

- `packages/engine` has zero framework/UI/transport dependencies. It must stay testable without a browser or network.
- The web app talks to the engine through `EngineClient` (`packages/web/src/lib/adapters/engine-client.ts`) — an interface with `Promise`-based `dispatch`/`loadScenario`, so the same station components work against either `local-engine-client.ts` (in-browser) or `ws-engine-client.ts` (networked), selected in `packages/web/src/lib/app-state.svelte.ts` based on `PUBLIC_MULTIPLAYER_URL`.
- Station commands are dispatched as typed `Command` objects. Each station also has a terse typed-command parser (`*-command-parser.ts`) mirroring the book's syntax, kept as a secondary/fallback input path — see "UI conventions" below.

## UI conventions (apply to every station)

- **Point-and-click is the primary interaction.** Sliders for scalar values, clickable target lists with action buttons for spatial/craft targeting, dropdowns for enums. The typed `CommandBox` + `CommandReference` stay underneath as a secondary, keyboard-accessible fallback — don't remove them, and don't make them the primary path for new features.
- **LCARS-inspired visual design.** `Panel.svelte` (capsule header + accent border) wraps every section; each station has its own `--chrome-<station>` accent CSS variable (`packages/web/src/app.css`). True-black background, no light theme — this is a deliberate single dark visual world, not an oversight.
- Reuse shared components before writing new ones: `Panel`, `Slider` (has an optional `testId` prop for pages with many sliders), `CommandBox`, `CommandReference`, `StatusChip`/`StationStatusBar`. `AstrogatorPlot` (in `components/navigation/`) is a generic world-space plot, not Navigation-specific — Sciences already reuses it; reach for it before building another spatial view from scratch.
- Command syntax has no spaces between the code and a concatenated-token style where the book used space-separated letters (e.g. `SPO` not `S P O`) — keep that simplification in any new parser.

## Testing (non-negotiable, per user's global TDD policy)

Red-Green-Refactor: write a failing test before writing the behavior it tests. No unit tests are allowed real I/O/network — dispatch through the engine or a fake `EngineClient`/`SessionSocket`, never a real WebSocket in a unit test.

- Engine: plain Vitest, `packages/engine/test/`.
- Server: plain Vitest, `packages/server/test/`, sockets faked as `{ send(data: string) }`.
- Web: two Vitest projects in the same run (`packages/web/vite.config.ts`) —
  - `client` project (real Chromium via `vitest-browser-svelte`/Playwright): any `*.svelte.test.ts`.
  - `server` project (Node): any other `*.test.ts` (pure logic modules like `*-math.ts`, `*-grid.ts`, command parsers).
- Run everything: `npm test` from repo root. Typecheck the web package: `npm run check --workspace @starship/web` (svelte-check).
- **Always prefix web test/typecheck commands with `EDITOR=true VISUAL=true`** — without it, a Vite error can trigger an "open in editor" prompt that hangs the shell with no TTY.

## Verifying UI changes

Don't consider a UI change done after tests pass alone — also check it live:

1. `cd packages/web && npm run dev -- --port 5183` (background it; `disown -a` if the shell loses track of it).
2. Use Playwright (already a devDependency at the repo root) via a throwaway `.mjs` script for screenshots or scripted interactions — see any recent commit for the pattern. Delete the script afterward; don't commit it.
3. Kill the dev server when done (`pkill -f "vite dev --port 5183"`).

## Git / GitHub

- `gh` is authenticated as `pcholt`. Use `gh issue create` / `gh issue list` / etc. directly — no MCP server is configured or needed for this project.
- Follow the user's standing git safety rules: new commits (not amends) unless told otherwise, no force-push, confirm before anything destructive.
- The repo has some untracked/stray files at the root (`typescript-utility-types.*`) left over from an unrelated task, and `book/raw/part-01.md` sometimes shows as locally modified from outside this project's work — don't stage or commit either without checking with the user first, they aren't part of this project's history.
