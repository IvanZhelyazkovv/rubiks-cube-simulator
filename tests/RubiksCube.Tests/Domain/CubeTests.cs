using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain;

public sealed class CubeTests
{
    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(5)]
    public void CreateSolved_EveryFaceShowsItsSchemeColor(int size)
    {
        var cube = Cube.CreateSolved(size);

        Assert.Equal(size, cube.Size);
        Assert.True(cube.IsSolved);
        new ExpectedCubeState(size).AssertMatches(cube);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(0)]
    [InlineData(-3)]
    public void CreateSolved_RejectsSizesBelowMinimum(int size)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Cube.CreateSolved(size));
    }

    [Fact]
    public void CreateSolved_UsesCustomSchemeWhenProvided()
    {
        var scheme = ColorScheme.Create(
            up: CubeColor.Blue,
            down: CubeColor.Green,
            front: CubeColor.White,
            back: CubeColor.Yellow,
            left: CubeColor.Red,
            right: CubeColor.Orange);

        var cube = Cube.CreateSolved(3, scheme);

        new ExpectedCubeState(3, scheme).AssertMatches(cube);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(0, -1)]
    [InlineData(3, 0)]
    [InlineData(0, 3)]
    public void Indexer_RejectsOutOfRangeCoordinates(int row, int column)
    {
        var cube = Cube.CreateSolved(3);

        Assert.Throws<ArgumentOutOfRangeException>(() => cube[Face.Front, row, column]);
    }

    [Fact]
    public void GetFaceColors_ReturnsAnIndependentCopy()
    {
        var cube = Cube.CreateSolved(3);

        var grid = cube.GetFaceColors(Face.Front);
        grid[0, 0] = CubeColor.Red;

        Assert.Equal(CubeColor.Green, cube[Face.Front, 0, 0]);
    }

    [Fact]
    public void Equals_TreatsSameStickerLayoutAsEqual()
    {
        var first = Cube.CreateSolved(3);
        var second = Cube.CreateSolved(3);

        Assert.Equal(first, second);
        Assert.Equal(first.GetHashCode(), second.GetHashCode());
    }

    [Fact]
    public void Equals_DistinguishesDifferentLayoutsAndSizes()
    {
        var solved = Cube.CreateSolved(3);

        Assert.NotEqual(solved, solved.Apply(new Move(Face.Up, RotationDirection.Clockwise)));
        Assert.NotEqual(solved, Cube.CreateSolved(4));
        Assert.False(solved.Equals(null));
    }

    [Fact]
    public void Apply_DoesNotMutateTheOriginalCube()
    {
        var solved = Cube.CreateSolved(3);

        _ = solved.Apply(new Move(Face.Front, RotationDirection.Clockwise));

        Assert.True(solved.IsSolved);
        new ExpectedCubeState(3).AssertMatches(solved);
    }

    [Fact]
    public void Apply_RejectsNullMoveCollection()
    {
        var cube = Cube.CreateSolved(3);

        Assert.Throws<ArgumentNullException>(() => cube.Apply((IEnumerable<Move>)null!));
    }
}
