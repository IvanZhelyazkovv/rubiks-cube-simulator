using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain;

/// <summary>
/// Algebraic properties every correct rotation implementation must satisfy,
/// verified across faces, directions and cube sizes.
/// </summary>
public sealed class CubeRotationPropertyTests
{
    private static readonly Face[] Faces = Enum.GetValues<Face>();

    public static TheoryData<int> Sizes => [2, 3, 4, 5];

    public static TheoryData<Face, int> FacesAndSizes()
    {
        var data = new TheoryData<Face, int>();
        foreach (var face in Faces)
        {
            foreach (var size in (int[])[2, 3, 4, 5])
            {
                data.Add(face, size);
            }
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(FacesAndSizes))]
    public void FourQuarterTurns_RestoreTheCube(Face face, int size)
    {
        var solved = Cube.CreateSolved(size);
        var move = new Move(face, RotationDirection.Clockwise);

        var cube = solved.Apply(move).Apply(move).Apply(move).Apply(move);

        Assert.Equal(solved, cube);
    }

    [Theory]
    [MemberData(nameof(FacesAndSizes))]
    public void TurnFollowedByItsInverse_RestoresTheCube(Face face, int size)
    {
        var solved = Cube.CreateSolved(size);

        foreach (var direction in Enum.GetValues<RotationDirection>())
        {
            var move = new Move(face, direction);
            Assert.Equal(solved, solved.Apply(move).Apply(move.Inverse));
        }
    }

    [Theory]
    [MemberData(nameof(FacesAndSizes))]
    public void HalfTurn_EqualsTwoQuarterTurns(Face face, int size)
    {
        var solved = Cube.CreateSolved(size);
        var quarter = new Move(face, RotationDirection.Clockwise);
        var half = new Move(face, RotationDirection.HalfTurn);

        Assert.Equal(solved.Apply(quarter).Apply(quarter), solved.Apply(half));
    }

    [Theory]
    [MemberData(nameof(FacesAndSizes))]
    public void SingleQuarterTurn_ChangesTheCube(Face face, int size)
    {
        var solved = Cube.CreateSolved(size);

        var turned = solved.Apply(new Move(face, RotationDirection.Clockwise));

        Assert.NotEqual(solved, turned);
        Assert.False(turned.IsSolved);
    }

    [Fact]
    public void SexyMoveRepeatedSixTimes_RestoresTheCube()
    {
        // (R U R' U') has order six on the 3×3 cube — a classic identity.
        var solved = Cube.CreateSolved(3);
        var sexyMove = MoveSequence.Parse("R U R' U'");

        var cube = solved;
        for (var i = 0; i < 6; i++)
        {
            cube = cube.Apply(sexyMove);
        }

        Assert.Equal(solved, cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void RandomSequenceFollowedByItsInverse_RestoresTheCube(int size)
    {
        var solved = Cube.CreateSolved(size);

        // Slice moves included: every layer of the cube takes part.
        var scramble = RandomSequence(seed: 20260611 + size, length: 60, maxLayer: size - 1);

        var cube = solved.Apply(scramble).Apply(scramble.Inverse());

        Assert.Equal(solved, cube);
    }

    [Theory]
    [MemberData(nameof(Sizes))]
    public void ColorCounts_AreInvariantUnderAnySequence(int size)
    {
        var cube = Cube.CreateSolved(size)
            .Apply(RandomSequence(seed: 99 + size, length: 80, maxLayer: size - 1));

        var counts = new Dictionary<CubeColor, int>();
        foreach (var face in Faces)
        {
            for (var row = 0; row < size; row++)
            {
                for (var column = 0; column < size; column++)
                {
                    var color = cube[face, row, column];
                    counts[color] = counts.GetValueOrDefault(color) + 1;
                }
            }
        }

        foreach (var color in Enum.GetValues<CubeColor>())
        {
            Assert.Equal(size * size, counts.GetValueOrDefault(color));
        }
    }

    [Theory]
    [InlineData(3)]
    [InlineData(5)]
    public void CenterStickers_NeverMoveOnOddCubes(int size)
    {
        // Face turns only: slice moves do carry centre stickers around.
        var cube = Cube.CreateSolved(size).Apply(RandomSequence(seed: 7 + size, length: 80));
        var center = size / 2;

        foreach (var face in Faces)
        {
            Assert.Equal(ColorScheme.Standard.ColorOf(face), cube[face, center, center]);
        }
    }

    [Fact]
    public void MovesOnOppositeFaces_Commute()
    {
        var solved = Cube.CreateSolved(3);
        var front = new Move(Face.Front, RotationDirection.Clockwise);
        var back = new Move(Face.Back, RotationDirection.Clockwise);

        Assert.Equal(solved.Apply(front).Apply(back), solved.Apply(back).Apply(front));
    }

    private static MoveSequence RandomSequence(int seed, int length, int maxLayer = 1)
    {
        var random = new Random(seed);
        var moves = new List<Move>(length);

        for (var i = 0; i < length; i++)
        {
            var face = Faces[random.Next(Faces.Length)];
            var direction = (RotationDirection)random.Next(3);
            var layer = random.Next(1, maxLayer + 1);
            moves.Add(new Move(face, direction, layer));
        }

        return MoveSequence.Of(moves);
    }
}
