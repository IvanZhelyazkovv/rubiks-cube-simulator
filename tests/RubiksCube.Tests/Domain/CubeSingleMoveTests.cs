using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain;

/// <summary>
/// Golden tests for each single clockwise face turn applied to a solved cube.
/// The expected strips were derived by hand from the physical cube with the standard
/// scheme (green front, red right, white up) and are independent of the production
/// rotation algorithm. They hold for any cube size, so each case runs at 3×3 and 4×4.
/// </summary>
public sealed class CubeSingleMoveTests
{
    public static TheoryData<int> Sizes => [3, 4];

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Front_Clockwise_CyclesEdgeStripsAroundFrontFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Front, RotationDirection.Clockwise));

        // F carries: L right column → U bottom row → R left column → D top row → L right column.
        new ExpectedCubeState(size)
            .WithRow(Face.Up, size - 1, CubeColor.Orange)
            .WithColumn(Face.Right, 0, CubeColor.White)
            .WithRow(Face.Down, 0, CubeColor.Red)
            .WithColumn(Face.Left, size - 1, CubeColor.Yellow)
            .AssertMatches(cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Right_Clockwise_CyclesEdgeStripsAroundRightFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Right, RotationDirection.Clockwise));

        // R carries: F right column → U right column → B left column → D right column → F right column.
        new ExpectedCubeState(size)
            .WithColumn(Face.Up, size - 1, CubeColor.Green)
            .WithColumn(Face.Back, 0, CubeColor.White)
            .WithColumn(Face.Down, size - 1, CubeColor.Blue)
            .WithColumn(Face.Front, size - 1, CubeColor.Yellow)
            .AssertMatches(cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Up_Clockwise_CyclesEdgeStripsAroundUpFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Up, RotationDirection.Clockwise));

        // U carries: F top row → L top row → B top row → R top row → F top row.
        new ExpectedCubeState(size)
            .WithRow(Face.Left, 0, CubeColor.Green)
            .WithRow(Face.Back, 0, CubeColor.Orange)
            .WithRow(Face.Right, 0, CubeColor.Blue)
            .WithRow(Face.Front, 0, CubeColor.Red)
            .AssertMatches(cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Back_Clockwise_CyclesEdgeStripsAroundBackFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Back, RotationDirection.Clockwise));

        // B carries: U top row → L left column → D bottom row → R right column → U top row.
        new ExpectedCubeState(size)
            .WithColumn(Face.Left, 0, CubeColor.White)
            .WithRow(Face.Down, size - 1, CubeColor.Orange)
            .WithColumn(Face.Right, size - 1, CubeColor.Yellow)
            .WithRow(Face.Up, 0, CubeColor.Red)
            .AssertMatches(cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Left_Clockwise_CyclesEdgeStripsAroundLeftFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Left, RotationDirection.Clockwise));

        // L carries: U left column → F left column → D left column → B right column → U left column.
        new ExpectedCubeState(size)
            .WithColumn(Face.Front, 0, CubeColor.White)
            .WithColumn(Face.Down, 0, CubeColor.Green)
            .WithColumn(Face.Back, size - 1, CubeColor.Yellow)
            .WithColumn(Face.Up, 0, CubeColor.Blue)
            .AssertMatches(cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void Down_Clockwise_CyclesEdgeStripsAroundDownFace(int size)
    {
        var cube = Cube.CreateSolved(size).Apply(new Move(Face.Down, RotationDirection.Clockwise));

        // D carries: F bottom row → R bottom row → B bottom row → L bottom row → F bottom row.
        new ExpectedCubeState(size)
            .WithRow(Face.Right, size - 1, CubeColor.Green)
            .WithRow(Face.Back, size - 1, CubeColor.Red)
            .WithRow(Face.Left, size - 1, CubeColor.Blue)
            .WithRow(Face.Front, size - 1, CubeColor.Orange)
            .AssertMatches(cube);
    }

    [Fact]
    public void Front_CounterClockwise_CyclesStripsTheOppositeWay()
    {
        var cube = Cube.CreateSolved(3).Apply(new Move(Face.Front, RotationDirection.CounterClockwise));

        // F' carries: R left column → U bottom row → L right column → D top row → R left column.
        new ExpectedCubeState(3)
            .WithRow(Face.Up, 2, CubeColor.Red)
            .WithColumn(Face.Left, 2, CubeColor.White)
            .WithRow(Face.Down, 0, CubeColor.Orange)
            .WithColumn(Face.Right, 0, CubeColor.Yellow)
            .AssertMatches(cube);
    }

    [Fact]
    public void Front_HalfTurn_SwapsOppositeStrips()
    {
        var cube = Cube.CreateSolved(3).Apply(new Move(Face.Front, RotationDirection.HalfTurn));

        // F2 swaps U bottom row with D top row, and L right column with R left column.
        new ExpectedCubeState(3)
            .WithRow(Face.Up, 2, CubeColor.Yellow)
            .WithRow(Face.Down, 0, CubeColor.White)
            .WithColumn(Face.Left, 2, CubeColor.Red)
            .WithColumn(Face.Right, 0, CubeColor.Orange)
            .AssertMatches(cube);
    }
}
