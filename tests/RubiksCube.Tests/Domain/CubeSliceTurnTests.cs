using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain;

/// <summary>
/// Inner-slice turns (layer-prefixed moves such as <c>2L</c>, the M slice of a
/// 3×3), verified through the classic whole-cube rotation identities: a slice
/// together with its two neighbouring face turns rotates the entire cube, so a
/// solved cube must stay solved with its colours moved to the rotated faces.
/// </summary>
public sealed class CubeSliceTurnTests
{
    [Fact]
    public void RWith2LPrimeAndLPrime_RotatesTheWholeCubeAroundX()
    {
        // x = R · M' · L' with M written as 2L.
        var cube = Cube.CreateSolved().Apply(MoveSequence.Parse("R 2L' L'"));

        Assert.True(cube.IsSolved);

        // x carries the front face up: F→U, U→B, B→D, D→F; L and R stay put.
        Assert.Equal(CubeColor.Green, cube[Face.Up, 0, 0]);
        Assert.Equal(CubeColor.Yellow, cube[Face.Front, 0, 0]);
        Assert.Equal(CubeColor.Blue, cube[Face.Down, 0, 0]);
        Assert.Equal(CubeColor.White, cube[Face.Back, 0, 0]);
        Assert.Equal(CubeColor.Orange, cube[Face.Left, 0, 0]);
        Assert.Equal(CubeColor.Red, cube[Face.Right, 0, 0]);
    }

    [Fact]
    public void UWith2DPrimeAndDPrime_RotatesTheWholeCubeAroundY()
    {
        // y = U · E' · D' with E written as 2D.
        var cube = Cube.CreateSolved().Apply(MoveSequence.Parse("U 2D' D'"));

        Assert.True(cube.IsSolved);

        // y carries the right face to the front: R→F, B→R, L→B, F→L.
        Assert.Equal(CubeColor.Red, cube[Face.Front, 0, 0]);
        Assert.Equal(CubeColor.Blue, cube[Face.Right, 0, 0]);
        Assert.Equal(CubeColor.Orange, cube[Face.Back, 0, 0]);
        Assert.Equal(CubeColor.Green, cube[Face.Left, 0, 0]);
        Assert.Equal(CubeColor.White, cube[Face.Up, 0, 0]);
        Assert.Equal(CubeColor.Yellow, cube[Face.Down, 0, 0]);
    }

    [Fact]
    public void FWith2FAndBPrime_RotatesTheWholeCubeAroundZ()
    {
        // z = F · S · B' with S written as 2F.
        var cube = Cube.CreateSolved().Apply(MoveSequence.Parse("F 2F B'"));

        Assert.True(cube.IsSolved);

        // z carries the up face to the right: U→R, R→D, D→L, L→U.
        Assert.Equal(CubeColor.White, cube[Face.Right, 0, 0]);
        Assert.Equal(CubeColor.Yellow, cube[Face.Left, 0, 0]);
        Assert.Equal(CubeColor.Orange, cube[Face.Up, 0, 0]);
        Assert.Equal(CubeColor.Red, cube[Face.Down, 0, 0]);
        Assert.Equal(CubeColor.Green, cube[Face.Front, 0, 0]);
        Assert.Equal(CubeColor.Blue, cube[Face.Back, 0, 0]);
    }

    [Fact]
    public void InnerSliceOnA4x4_MovesExactlyItsOwnColumns()
    {
        // 2R turns the second layer from the right: grid column 2 of a 4×4.
        var cube = Cube.CreateSolved(4).Apply(MoveSequence.Parse("2R"));

        for (var row = 0; row < 4; row++)
        {
            for (var column = 0; column < 4; column++)
            {
                // R carries F→U→B→D→F; the back face's columns are mirrored.
                var expectedUp = column == 2 ? CubeColor.Green : CubeColor.White;
                var expectedBack = column == 1 ? CubeColor.White : CubeColor.Blue;
                var expectedDown = column == 2 ? CubeColor.Blue : CubeColor.Yellow;
                var expectedFront = column == 2 ? CubeColor.Yellow : CubeColor.Green;

                Assert.Equal(expectedUp, cube[Face.Up, row, column]);
                Assert.Equal(expectedBack, cube[Face.Back, row, column]);
                Assert.Equal(expectedDown, cube[Face.Down, row, column]);
                Assert.Equal(expectedFront, cube[Face.Front, row, column]);

                // The slice touches no sticker of the left and right faces.
                Assert.Equal(CubeColor.Orange, cube[Face.Left, row, column]);
                Assert.Equal(CubeColor.Red, cube[Face.Right, row, column]);
            }
        }
    }

    [Theory]
    [InlineData("2L")]
    [InlineData("3R'")]
    [InlineData("2U2")]
    public void FourQuarterTurnsOfASlice_RestoreTheCube(string notation)
    {
        var move = MoveSequence.Parse(notation)[0];
        var quarterTurns = move.Direction == RotationDirection.HalfTurn ? 2 : 4;

        var cube = Cube.CreateSolved(4);
        var turned = cube;
        for (var i = 0; i < quarterTurns; i++)
        {
            turned = turned.Apply(move);
        }

        Assert.Equal(cube, turned);
        Assert.NotEqual(cube, cube.Apply(move));
    }

    [Fact]
    public void ASliceFollowedByItsInverse_RestoresTheCube()
    {
        var cube = Cube.CreateSolved(5);
        var move = MoveSequence.Parse("3F'")[0];

        Assert.Equal(cube, cube.Apply(move).Apply(move.Inverse));
    }

    [Theory]
    [InlineData("3R", 3)] // a 3×3 has layers 1 and 2 from each face
    [InlineData("2R", 2)] // a 2×2 has no inner slices at all
    public void ALayerBeyondTheCube_IsRejected(string notation, int size)
    {
        var move = MoveSequence.Parse(notation)[0];

        var exception = Assert.Throws<InvalidLayerException>(
            () => Cube.CreateSolved(size).Apply(move));

        Assert.Equal(move.Layer, exception.Layer);
        Assert.Equal(size, exception.Size);
    }
}
