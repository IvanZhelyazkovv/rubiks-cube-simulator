using RubiksCube.Domain;
using RubiksCube.Domain.Moves;

namespace RubiksCube.Tests.Domain.Moves;

public sealed class MoveTests
{
    [Theory]
    [InlineData(Face.Front, RotationDirection.Clockwise, "F")]
    [InlineData(Face.Front, RotationDirection.CounterClockwise, "F'")]
    [InlineData(Face.Front, RotationDirection.HalfTurn, "F2")]
    [InlineData(Face.Up, RotationDirection.Clockwise, "U")]
    [InlineData(Face.Down, RotationDirection.CounterClockwise, "D'")]
    [InlineData(Face.Left, RotationDirection.HalfTurn, "L2")]
    [InlineData(Face.Right, RotationDirection.Clockwise, "R")]
    [InlineData(Face.Back, RotationDirection.CounterClockwise, "B'")]
    public void ToString_ProducesSingmasterNotation(Face face, RotationDirection direction, string expected)
    {
        Assert.Equal(expected, new Move(face, direction).ToString());
    }

    [Theory]
    [InlineData(RotationDirection.Clockwise, RotationDirection.CounterClockwise)]
    [InlineData(RotationDirection.CounterClockwise, RotationDirection.Clockwise)]
    [InlineData(RotationDirection.HalfTurn, RotationDirection.HalfTurn)]
    public void Inverse_FlipsTheDirection(RotationDirection direction, RotationDirection expected)
    {
        var move = new Move(Face.Right, direction);

        Assert.Equal(new Move(Face.Right, expected), move.Inverse);
    }
}
