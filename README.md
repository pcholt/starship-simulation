# Starship Simulation

A modern reimplementation of *The Complete STAR SHIP: A Simulation Project* (Roger Garrett, ~1980) — a book that taught structured programming by building a multi-station, Star-Trek-style bridge simulator. This project uses the book's stations and rules as a *starting point*, not a spec, and is expanding well beyond it.

Seven stations, each with a point-and-click LCARS-style interface (plus the book's original typed command syntax as a fallback): **Simulation Controller**, **Navigation**, **Sciences**, **Engineering**, **Helm**, **Medical**, and **Communications**. State can run entirely in-browser for single-player, or be hosted by a small WebSocket server so multiple clients share one live simulation.
<img width="800" alt="image" src="https://github.com/user-attachments/assets/9fe10865-ea6d-4f95-8cde-71e2e7a58ae9" />

## Packages

This is an npm-workspaces monorepo:

| Package | What it is |
|---|---|
| [`packages/engine`](packages/engine) | Pure TypeScript domain/engine — no UI, no I/O. Command dispatch, world state, scenario scripting. |
| [`packages/web`](packages/web) | SvelteKit frontend — the bridge stations. |
| [`packages/server`](packages/server) | Node WebSocket host for multiplayer, wrapping the same engine. |

## Getting started

```bash
npm install
npm run dev      # starts the web app (single-player, in-browser engine)
```

Then open the printed local URL and pick a station from the sidebar.

### Multiplayer

```bash
npm run dev --workspace @starship/server   # starts the WebSocket host on :8080
```

Set `PUBLIC_MULTIPLAYER_URL` (e.g. in `packages/web/.env`) to point the web app at the server instead of its local in-browser engine.

### Tests and typechecking

```bash
npm test                                    # engine + server + web, all workspaces
npm run check --workspace @starship/web     # svelte-check
```

## Docker

```bash
docker compose up
```

Builds and runs both the web app (`:3000`) and the multiplayer server (`:8080`).

## Development approach

- Test-driven: engine and UI behavior are covered by unit/integration tests (Vitest, plus `vitest-browser-svelte` with a real Chromium instance for component tests).
- Clean-ish architecture: `packages/engine` has no framework or transport dependency; the web app talks to it through a transport-agnostic `EngineClient` interface, swappable between an in-process client and a WebSocket client.
- `book/` contains a full Markdown transcription of the original book, used as reference material during development.

## Bug tracking

Bugs and follow-up work are tracked in [Issues](../../issues).
