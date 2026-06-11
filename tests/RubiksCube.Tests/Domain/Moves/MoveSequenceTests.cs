using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain.Moves;

public sealed class MoveSequenceTests
{
    [Fact]
    public void Parse_ReadsTheTaskSequence()
    {
        var sequence = MoveSequence.Parse("F R' U B' L D'");

        Assert.Equal(
            new[]
            {
                new Move(Face.Front, RotationDirection.Clockwise),
                new Move(Face.Right, RotationDirection.CounterClockwise),
                new Move(Face.Up, RotationDirection.Clockwise),
                new Move(Face.Back, RotationDirection.CounterClockwise),
                new Move(Face.Left, RotationDirection.Clockwise),
                new Move(Face.Down, RotationDirection.CounterClockwise),
            },
            sequence);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Parse_TreatsBlankInputAsEmptySequence(string notation)
    {
        Assert.Empty(MoveSequence.Parse(notation));
    }

    [Fact]
    public void Parse_AcceptsCompactNotationWithoutSpaces()
    {
        var sequence = MoveSequence.Parse("FR'U2");

        Assert.Equal("F R' U2", sequence.ToString());
    }

    [Fact]
    public void Parse_AcceptsArbitraryWhitespaceBetweenMoves()
    {
        var sequence = MoveSequence.Parse("  F\tR'\n U2  ");

        Assert.Equal("F R' U2", sequence.ToString());
    }

    [Theory]
    [InlineData("X", 0)]
    [InlineData("f", 0)]
    [InlineData("F3", 1)]
    [InlineData("F''", 2)]
    [InlineData("F2'", 2)]
    [InlineData("F R+ U", 3)]
    [InlineData("1R", 0)] // layer 1 is the face itself, written without a prefix
    [InlineData("0R", 0)]
    [InlineData("02L", 0)] // leading zeroes are not a spelling anyone intends
    [InlineData("123R", 0)] // more digits than any supported size needs
    [InlineData("2", 0)] // a layer prefix with no face letter
    [InlineData("2 L", 1)]
    public void Parse_ReportsThePositionOfInvalidNotation(string notation, int expectedPosition)
    {
        var exception = Assert.Throws<InvalidMoveNotationException>(() => MoveSequence.Parse(notation));

        Assert.Equal(expectedPosition, exception.Position);
        Assert.Equal(notation, exception.Notation);
    }

    [Fact]
    public void Parse_ReadsLayerPrefixedSliceMoves()
    {
        var sequence = MoveSequence.Parse("2L 3R' 2F2");

        Assert.Equal(
            new[]
            {
                new Move(Face.Left, RotationDirection.Clockwise, Layer: 2),
                new Move(Face.Right, RotationDirection.CounterClockwise, Layer: 3),
                new Move(Face.Front, RotationDirection.HalfTurn, Layer: 2),
            },
            sequence);
        Assert.Equal("2L 3R' 2F2", sequence.ToString());
    }

    [Fact]
    public void Parse_InCompactFormADigitAfterAFaceBindsAsAHalfTurn()
    {
        // "2L2R" is 2L2 followed by R, not 2L followed by 2R.
        var sequence = MoveSequence.Parse("2L2R");

        Assert.Equal("2L2 R", sequence.ToString());
    }

    [Fact]
    public void Inverse_PreservesTheLayerOfSliceMoves()
    {
        var sequence = MoveSequence.Parse("2L 3R");

        Assert.Equal("3R' 2L'", sequence.Inverse().ToString());
    }

    [Fact]
    public void Parse_RejectsNullInput()
    {
        Assert.Throws<ArgumentNullException>(() => MoveSequence.Parse(null!));
    }

    [Fact]
    public void TryParse_ReturnsFalseInsteadOfThrowing()
    {
        var valid = MoveSequence.TryParse("F R'", out var sequence);
        var invalid = MoveSequence.TryParse("F X", out var empty);
        var nullInput = MoveSequence.TryParse(null, out var emptyFromNull);

        Assert.True(valid);
        Assert.Equal(2, sequence.Count);
        Assert.False(invalid);
        Assert.Empty(empty);
        Assert.False(nullInput);
        Assert.Empty(emptyFromNull);
    }

    [Fact]
    public void ToString_RoundTripsThroughParse()
    {
        var allMoves =
            from face in Enum.GetValues<Face>()
            from direction in Enum.GetValues<RotationDirection>()
            select new Move(face, direction);

        var sequence = MoveSequence.Of(allMoves);

        Assert.Equal(sequence.ToString(), MoveSequence.Parse(sequence.ToString()).ToString());
    }

    [Fact]
    public void Inverse_ReversesOrderAndInvertsEachMove()
    {
        var sequence = MoveSequence.Parse("F R' U2");

        Assert.Equal("U2 R F'", sequence.Inverse().ToString());
    }

    [Fact]
    public void Empty_HasNoMoves()
    {
        Assert.Empty(MoveSequence.Empty);
        Assert.Equal(string.Empty, MoveSequence.Empty.ToString());
    }
}
