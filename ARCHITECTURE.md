# Architecture

This document explains how the solution is structured, how cube rotations are
modelled, and the reasoning behind the less obvious design decisions.

## Layering

The solution follows Clean Architecture with dependencies pointing strictly inwards:

```
┌─────────────────────────────────────────────────────────┐
│  Presentation     RubiksCube.Cli      RubiksCube.Api     │
│                   (console runner)    (REST + web host)  │
│                            │             │     apps/web  │
│                            ▼             ▼     (React)   │
│  Application      use cases · ports · DTOs · rendering   │
│                            │                             │
│                            ▼                             │
│  Domain           Cube · Move · notation · geometry      │
│                   (no external dependencies)             │
└─────────────────────────────────────────────────────────┘
```

- **RubiksCube.Domain** — the cube itself: immutable state, face rotations, move
  algebra, Singmaster notation. Pure C# with no package references; everything
  here is deterministic and unit-testable in isolation.
- **RubiksCube.Application** — what you can *do* with a cube: sessions with move
  history, use cases (create, move, undo, reset, scramble), the session store
  port, DTO mapping and the exploded-view text renderer shared by consumers.
- **RubiksCube.Api** — the HTTP boundary: controllers, problem-details error
  mapping, DI composition, Swagger, and static hosting for the built web UI.
  It also hosts the in-memory adapter of the session store port (see below).
- **RubiksCube.Cli** — the console deliverable: prints the exploded view before
  and after a move sequence, with the task's verification sequence as default.
- **apps/web** — a React client of the API. It deliberately contains no cube
  rules: the server is the single source of truth, and the client only animates
  transitions between server states.

## How rotations work

The classic way to implement a Rubik's cube is a hand-written permutation table:
for each face, list which sticker indices move where, including the four edge
strips of the neighbouring faces. Those tables are notoriously easy to get subtly
wrong (a reversed strip survives a quick visual check), and they have to be
rewritten for every cube size.

This implementation derives rotations from geometry instead:

1. Each face has an orientation — its outward **normal** plus the directions in
   which its grid **rows** and **columns** grow (`FaceOrientation`). This 6-row
   table is the *only* place where the spatial convention lives, and it can be
   verified directly against the standard exploded view.
2. Every sticker's grid position maps to an exact integer point in cube space
   (doubled coordinates keep everything integral), together with its face normal.
3. Turning a face selects the stickers of its outer layer — those whose position
   component along the face normal is `N` (the face itself) or `N − 1` (the
   adjacent ring) — and rotates their positions and normals by 90° around the
   face axis using integer vector arithmetic.
4. Rotated positions map back to grid coordinates through the same orientation
   table.

Correctness therefore reduces to three small, independently testable facts: the
orientation table matches the net, 90° integer rotation is exact, and the
position mapping is a bijection. Nothing is special-cased per face or per size —
NxN support falls out of the same code path.

## Testing strategy

The test suite (xUnit for .NET, Vitest for the web app) is layered to make a
rotation bug practically unable to hide:

| Layer | What is pinned down |
|---|---|
| Geometry | 90° rotations of basis vectors around every axis, hand-derived |
| Single moves | The full expected state after each face turn on a solved cube — derived by hand from a physical cube, at sizes 3 and 4 |
| Algebra | `X⁴ = identity`, `X·X′ = identity`, `X2 = X·X`, the sexy-move identity `(R U R′ U′)⁶ = identity`, scramble-and-undo round trips — across sizes 2–5 |
| Invariants | Colour counts never change; centre stickers never move on odd cubes |
| Acceptance | The task's sequence `F R' U B' L D'` verified sticker by sticker against the expected result transcribed from the task sheet |
| API | Full HTTP round trips through `WebApplicationFactory`, including error mapping and a 64-writer lost-update test on the session store |
| Web | Pure logic (notation, cubelet geometry) unit-tested; components tested with Testing Library against a mocked API client |

The acceptance expectation comes from outside the code base, so the engine and
its tests cannot share a common mistake.

## Decisions worth explaining

- **No mediator library.** The use cases are small classes with one `Execute`
  method, registered directly in DI. At this scale a mediator adds indirection
  without buying decoupling; introducing one later would be mechanical. (MediatR
  also moved to a commercial licence, which the task's "no paid software"
  requirement makes worth avoiding outright.)
- **No separate Infrastructure project.** The only infrastructure is one
  thread-safe in-memory dictionary. It lives in the API project next to the
  composition root, implementing the Application-owned port. A dedicated project
  earns its place the moment real persistence appears — not before.
- **The session port is synchronous.** Its single adapter is in-memory; a
  `Task`-returning surface would be pretend-async. The port is the seam where
  asynchrony would be introduced if a persistent store ever replaced it.
- **Immutable domain.** `Cube` and `CubeSession` return new instances instead of
  mutating. This makes the store's concurrency a compare-and-swap loop, undo a
  matter of applying a move's inverse, and tests free of setup/teardown coupling.
- **The web client holds no cube logic.** Every mutation round-trips through the
  API. The client's geometry module only converts server state into 3D cubelets
  and decides which layer to animate — using the same face-orientation
  conventions as the server, so both views are projections of one state.
- **The web client is generated from the contract.** The API publishes a strict
  OpenAPI document (non-nullable means required, enforced by a schema filter);
  the client's TypeScript types are generated from it and the typed client
  checks every path, parameter, body and response at compile time. CI
  regenerates the schema against the running API and fails on drift, so the
  front end cannot silently disagree with the server.

  The heavier alternative — a full client generator such as OpenAPI Generator's
  `typescript-fetch`, which emits per-controller API classes, model files and a
  runtime — earns its place when many controllers feed many consuming apps. With
  one controller and seven endpoints it would add a Java-based toolchain and
  dozens of generated files for the same drift protection, so the types-only
  generation was the deliberate choice. The seam is thin: swapping generators
  later only touches `src/api/client.ts`.
- **Cube size is a policy, not a model limit.** The domain supports any size ≥ 2;
  the application's create-cube policy caps it at 10 to keep payloads and
  rendering sensible, and both entry points — API and console — share that one
  rule.
- **Sessions are bounded and anonymous by design.** Every input has a policy
  cap — cube size, scramble length and moves per request — and the in-memory
  store evicts the least-recently-touched session beyond a fixed capacity. The
  web UI deletes its session on a best-effort basis (when switching sizes and
  on `pagehide` via a keepalive request); eviction covers whatever that misses,
  so the process cannot grow without limit either way. There is no
  authentication: a session id is an unguessable GUID acting as a capability,
  which is proportionate for an in-memory toy domain — any real deployment
  would put per-user auth and quotas in front of it.
- **Undo and rewind fall out of the move algebra.** Every move knows its
  inverse, so undo applies the inverse of the last move and rewind replays the
  inverse of the whole history — no snapshots, no extra state, and the cube
  provably returns to where it was.

## Running everything

See the [README](README.md) for build and run instructions.
