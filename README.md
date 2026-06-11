# Rubik's Cube Simulator

A programmatic Rubik's cube that can correctly rotate any face, built with Clean Architecture on .NET 10, with an interactive web UI.

> Full build and run instructions will land here together with the first runnable milestone.

## Solution layout

```
src/
  RubiksCube.Domain/        Pure cube model — no external dependencies
  RubiksCube.Application/   Use cases and ports
  RubiksCube.Api/           ASP.NET Core API (also serves the web UI)
  RubiksCube.Cli/           Console runner — prints the cube as an exploded view
tests/
  RubiksCube.Tests/         xUnit test suite
```

## Requirements

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) — free
- Windows, Linux or macOS

## Build

```bash
dotnet build
```
