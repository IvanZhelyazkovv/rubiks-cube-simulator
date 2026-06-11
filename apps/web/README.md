# Web UI

The interactive front end of the cube simulator: an animated 3D cube
(react-three-fiber) next to the task's exploded view, with a move pad, keyboard
control (U D F B L R, Shift for counter-clockwise), free-text sequences, undo,
rewind, scramble and cube sizes from 2×2 to 5×5.

The server is the single source of truth — this app holds no cube rules. Every
mutation round-trips through the REST API; the client only animates the
transition and then reveals the server's answer.

## Commands

| Command                                 | Purpose                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                           | Dev server with hot reload (proxies `/api` to the API on port 5180)      |
| `npm run build`                         | Production bundle, emitted into the API's `wwwroot`                      |
| `npm run test`                          | Vitest suite                                                             |
| `npm run lint` / `npm run format:check` | ESLint / Prettier gates                                                  |
| `npm run generate:api`                  | Regenerate `src/api/schema.d.ts` from the running API's OpenAPI document |
| `npm run check`                         | Everything CI runs: lint, format, tests, build                           |

## API client

`src/api/schema.d.ts` is generated from the server's OpenAPI document and is
never edited by hand — regenerate it with `npm run generate:api` (the API must
be running). The typed client (`openapi-fetch`) checks every path, parameter,
body and response against that contract at compile time, and CI fails if the
checked-in schema drifts from the API.
