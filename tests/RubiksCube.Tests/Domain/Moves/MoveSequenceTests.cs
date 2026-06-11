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
    public void Parse_ReportsThePositionOfInvalidNotation(string notation, int expectedPosition)
    {
        var exception = Assert.Throws<InvalidMoveNotationException>(() => MoveSequence.Parse(notation));

        Assert.Equal(expectedPosition, exception.Position);
        Assert.Equal(notation, exception.Notation);
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

        Assert.True(valid);
        Assert.Equal(2, sequence.Count);
        Assert.False(invalid);
        Assert.Empty(empty);
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
