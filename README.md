# Rubik's Cube Simulator

A programmatic Rubik's cube that can correctly rotate any face — modelled with Clean Architecture on .NET 10. The cube starts solved and oriented as on [rubiks-cube-solver.com](https://rubiks-cube-solver.com/): green at the front, red on the right, white on top.

## Quick start

Requires only the free [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) (Windows, Linux or macOS).

```bash
dotnet run --project src/RubiksCube.Cli
```

This prints the solved cube, applies the verification sequence **F R' U B' L D'** (front cw, right ccw, up cw, back ccw, left cw, down ccw) and prints the resulting exploded view:

```
       R O G
       B W W
       B B B
G Y Y  O R R  Y B O  Y B W
O O G  O G W  R R W  O B Y
B G O  W W W  O Y R  Y Y W
       G G B
       R Y R
       R G G
```

Any custom sequence and cube size also work:

```bash
dotnet run --project src/RubiksCube.Cli -- "R U R' U'" --size 4
```

## Tests

```bash
dotnet test
```

The suite covers every face rotation with hand-derived expected states, algebraic
properties (four quarter turns restore the cube, a move followed by its inverse
restores the cube, scramble-and-undo round trips) across cube sizes 2–5, the
notation parser, and the task's verification sequence sticker by sticker.

## Solution layout

```
src/
  RubiksCube.Domain/        Pure cube model — no external dependencies
  RubiksCube.Application/   Use cases and rendering
  RubiksCube.Api/           ASP.NET Core API (serves the web UI)
  RubiksCube.Cli/           Console runner — prints the exploded view
tests/
  RubiksCube.Tests/         xUnit test suite
```

> A richer README with architecture notes and the interactive web UI is on its way.
